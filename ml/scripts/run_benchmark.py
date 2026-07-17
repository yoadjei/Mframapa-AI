"""benchmark mframapa vs open-meteo/cams on held-out stations — the pitch table.

backfills the cams baseline (open-meteo pm2_5) per location when the dataset lacks
it, predicts with the trained continental model on held-out stations, and prints
MAE / RMSE / R2 side by side, overall and per region.

    python -m ml.scripts.run_benchmark
"""

from __future__ import annotations

import logging

import numpy as np
import pandas as pd
from sklearn.model_selection import GroupShuffleSplit

from ml.derived_features import add_to_frame
from ml.static_features import add_to_frame as _static_add
from ml.ensemble import ensemble_mean
from ml.features import TARGET_COLUMN
from ml.paths import repository_root
from ml.scripts.benchmark import benchmark

logger = logging.getLogger(__name__)

_ROOT = repository_root()
_DATASET = _ROOT / "pipeline" / "output" / "training_dataset.csv"
_CAMS_CACHE = _ROOT / "pipeline" / "data" / "cams_baseline.csv"


def _loc_key(df: pd.DataFrame) -> pd.Series:
    return df["lat"].round(2).astype(str) + "," + df["lon"].round(2).astype(str)


def _backfill_cams(df: pd.DataFrame) -> pd.DataFrame:
    """one open-meteo air-quality call per unique location -> daily pm2_5 baseline."""
    from pipeline.enrich_satellite import _air_quality_daily

    if _CAMS_CACHE.exists():
        cache = pd.read_csv(_CAMS_CACHE)
    else:
        work = df.copy()
        work["loc"] = _loc_key(work)
        groups = list(work.groupby("loc"))
        rows: list[dict] = []
        for index, (loc, g) in enumerate(groups, start=1):
            lat, lon = float(g["lat"].iloc[0]), float(g["lon"].iloc[0])
            daily = _air_quality_daily(lat, lon, g["date"].min(), g["date"].max())
            for date, feats in daily.items():
                value = feats.get("openmeteo_pm25")
                if value is not None:
                    rows.append({"loc": loc, "date": date, "openmeteo_pm25": value})
            logger.info("[cams] %d/%d %s", index, len(groups), loc)
        cache = pd.DataFrame(rows, columns=["loc", "date", "openmeteo_pm25"])
        cache.to_csv(_CAMS_CACHE, index=False)

    df["loc"] = _loc_key(df)
    return df.merge(cache, on=["loc", "date"], how="left")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    if not _DATASET.is_file():
        raise SystemExit(f"dataset not found: {_DATASET} (run the pipeline first)")

    df = pd.read_csv(_DATASET)
    df = add_to_frame(df)    # derived: season + dust
    df = _static_add(df)     # static grid: ndvi + night-lights (model may use them)
    df[TARGET_COLUMN] = pd.to_numeric(df[TARGET_COLUMN], errors="coerce")
    df = df.dropna(subset=[TARGET_COLUMN]).reset_index(drop=True)

    if "openmeteo_pm25" not in df.columns or df["openmeteo_pm25"].isna().all():
        logger.info("cams baseline missing — backfilling from open-meteo (cached to %s)", _CAMS_CACHE.name)
        df = _backfill_cams(df)
    df["openmeteo_pm25"] = pd.to_numeric(df["openmeteo_pm25"], errors="coerce")

    from backend.ml.inference import load_bundles
    bundle = load_bundles(_ROOT / "ml" / "exports").get(("continental", "all"))
    if bundle is None:
        raise SystemExit("no continental model — run `python -m ml.train_from_dataset` first")

    cols = bundle.feature_columns
    for c in cols:
        df[c] = pd.to_numeric(df[c], errors="coerce")

    # held-out stations (same split as training eval).
    tr, te = next(GroupShuffleSplit(1, test_size=0.2, random_state=42).split(df, groups=df["station_id"].to_numpy()))
    test = df.iloc[te].copy()

    X = test[cols].to_numpy(dtype=np.float64)
    inv = np.expm1 if bundle.target_transform == "log1p" else (lambda z: z)
    test["mframapa_pred"] = ensemble_mean(
        np.clip(inv(bundle.xgb_model.predict(X)), 0.0, None),
        np.clip(inv(bundle.lgb_model.predict(X)), 0.0, None),
    )

    table = benchmark(test, TARGET_COLUMN, ["mframapa_pred", "openmeteo_pm25"], "region_id")
    print("\nMframapa vs Open-Meteo/CAMS — held-out stations:")
    with pd.option_context("display.float_format", lambda v: f"{v:.3f}"):
        print(table.to_string(index=False))
    out = _ROOT / "pipeline" / "output" / "benchmark.csv"
    table.to_csv(out, index=False)
    print(f"\nsaved -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
