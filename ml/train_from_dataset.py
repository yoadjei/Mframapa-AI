"""train the continental pm2.5 model from the pipeline's training_dataset.csv.

station-level + temporal holdout split (train pre-2025, test 2025+), xgboost +
lightgbm ensemble, split-conformal interval. trains pm10 with/without variants,
reports held-out mae/rmse/r2 for each, ships the honest one to ml/exports.

    python -m ml.train_from_dataset
    python -m ml.train_from_dataset --dataset pipeline/output/training_dataset.csv --holdout-start 2025-01-01
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Sequence

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.derived_features import DERIVED_COLUMNS, add_to_frame
from ml.ensemble import ensemble_mean
from ml.features import FEATURE_COLUMNS, TARGET_COLUMN
from ml.model_selection import regional_export_dir
from ml.static_features import STATIC_COLUMNS
from ml.static_features import add_to_frame as _static_add
from ml.static_features import is_available as _static_available
from ml.training import _resolve_splits, train_regional_bundle

logger = logging.getLogger(__name__)

_XGB_PARAMS = dict(
    n_estimators=500, max_depth=7, learning_rate=0.04,
    subsample=0.85, colsample_bytree=0.8, reg_lambda=1.0, n_jobs=0,
)
_LGB_PARAMS = {
    "objective": "regression", "metric": "rmse", "verbosity": -1,
    "learning_rate": 0.04, "num_leaves": 64,
    "feature_fraction": 0.8, "bagging_fraction": 0.85, "bagging_freq": 1,
}
_SPATIAL = ["lat", "lon"]        # spatial-baseline context (available at inference)
_TARGET_TRANSFORM = "log1p"      # pm2.5 is heavily right-skewed


def _load(dataset: str) -> pd.DataFrame:
    if not Path(dataset).is_file():
        raise SystemExit(f"dataset not found: {dataset} (run `python -m pipeline.run_pipeline` first)")
    df = pd.read_csv(dataset)
    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise SystemExit(f"dataset missing required columns: {missing}")
    for col in FEATURE_COLUMNS + [TARGET_COLUMN]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=[TARGET_COLUMN]).reset_index(drop=True)  # keep feature NaNs
    df = add_to_frame(df)   # season + dust-proximity features from date/lat/lon
    df = _static_add(df)    # ndvi + night-lights from the precomputed grid (nan until built)
    if len(df) < 200:
        logger.warning("only %d labelled rows — continental model will be weak", len(df))
    return df


def _evaluate(df: pd.DataFrame, feature_columns: Sequence[str], holdout_start: Optional[str], seed: int) -> Dict[str, Any]:
    """fit on the train split, score on the held-out split. no export."""
    import lightgbm as lgb
    import xgboost as xgb

    X = df[list(feature_columns)].to_numpy(dtype=np.float64)
    y = df[TARGET_COLUMN].to_numpy(dtype=np.float64)
    groups = df["station_id"].to_numpy() if "station_id" in df.columns else None
    times = df["date"].to_numpy() if "date" in df.columns else None
    tr, va, ca, method = _resolve_splits(
        len(df), groups, times, holdout_start,
        test_size=0.2, calibration_fraction=0.15, seed=seed,
    )
    if min(tr.size, va.size) == 0:
        raise SystemExit(f"empty split (train={tr.size}, test={va.size}); check station/date coverage")

    yt = np.log1p(y)  # train in log space; score back on the original scale
    xgb_model = xgb.XGBRegressor(random_state=seed, **_XGB_PARAMS)
    xgb_model.fit(X[tr], yt[tr])
    lgb_train = lgb.Dataset(X[tr], yt[tr])
    lgb_valid = lgb.Dataset(X[va], yt[va], reference=lgb_train)
    lgb_model = lgb.train(
        {**_LGB_PARAMS, "seed": seed}, lgb_train, num_boost_round=800,
        valid_sets=[lgb_valid], callbacks=[lgb.early_stopping(40, verbose=False)],
    )
    pred = ensemble_mean(
        np.clip(np.expm1(xgb_model.predict(X[va])), 0.0, None),
        np.clip(np.expm1(lgb_model.predict(X[va], num_iteration=lgb_model.best_iteration)), 0.0, None),
    )
    return {
        "n_train": int(tr.size), "n_test": int(va.size), "split": method,
        "mae": float(mean_absolute_error(y[va], pred)),
        "rmse": float(mean_squared_error(y[va], pred) ** 0.5),
        "r2": float(r2_score(y[va], pred)),
    }


_MIN_REGIONAL_ROWS = 2000


def _fit_log_ensemble(X_tr, y_tr, X_eval, seed: int):
    """fit xgb+lgb on log1p(target), return predictions on X_eval in the original scale."""
    import lightgbm as lgb
    import xgboost as xgb
    yt = np.log1p(y_tr)
    xgb_model = xgb.XGBRegressor(random_state=seed, **_XGB_PARAMS)
    xgb_model.fit(X_tr, yt)
    lgb_model = lgb.train({**_LGB_PARAMS, "seed": seed}, lgb.Dataset(X_tr, yt), num_boost_round=800)
    return ensemble_mean(
        np.clip(np.expm1(xgb_model.predict(X_eval)), 0.0, None),
        np.clip(np.expm1(lgb_model.predict(X_eval)), 0.0, None),
    )


def _train_regional(df: pd.DataFrame, chosen_cols: Sequence[str], seed: int) -> None:
    """keep a per-region bundle only if it beats continental on the SAME region holdout (SCOPE §4.6)."""
    from sklearn.model_selection import GroupShuffleSplit

    from backend.ml.inference import load_bundles
    from ml.paths import repository_root

    if "region_id" not in df.columns:
        return
    cont = load_bundles(repository_root() / "ml" / "exports").get(("continental", "all"))
    if cont is None:
        return
    print("\nregional models (kept only if they beat continental on the same region holdout):")
    for region, rdf in df.groupby("region_id"):
        region = str(region)
        rdf = rdf.reset_index(drop=True)
        if len(rdf) < _MIN_REGIONAL_ROWS:
            print(f"  {region:<16} skip ({len(rdf)} rows)")
            continue
        X = rdf[list(chosen_cols)].to_numpy(dtype=np.float64)
        y = rdf[TARGET_COLUMN].to_numpy(dtype=np.float64)
        try:
            tr, te = next(GroupShuffleSplit(1, test_size=0.2, random_state=seed).split(X, groups=rdf["station_id"].to_numpy()))
        except ValueError:
            print(f"  {region:<16} skip (too few stations)")
            continue
        reg_pred = _fit_log_ensemble(X[tr], y[tr], X[te], seed)
        cont_pred = ensemble_mean(
            np.clip(np.expm1(cont.xgb_model.predict(X[te])), 0.0, None),
            np.clip(np.expm1(cont.lgb_model.predict(X[te])), 0.0, None),
        )
        r2_r, r2_c = r2_score(y[te], reg_pred), r2_score(y[te], cont_pred)
        keep = r2_r > r2_c
        print(f"  {region:<16} regional R2={r2_r:.3f} vs continental R2={r2_c:.3f} -> {'KEEP' if keep else 'drop'}")
        if keep:
            train_regional_bundle(
                rdf, region, "all", regional_export_dir(region, "all"),
                feature_columns=list(chosen_cols), holdout_start=None,
                seed=seed, target_transform=_TARGET_TRANSFORM, update_registry=True,
            )


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="train continental pm2.5 model")
    parser.add_argument("--dataset", default="pipeline/output/training_dataset.csv")
    parser.add_argument("--holdout-start", default="2025-01-01", help="temporal test cutoff (rows on/after -> test)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    df = _load(args.dataset)
    for col in _SPATIAL:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    static_cols = STATIC_COLUMNS if _static_available() else []
    if static_cols:
        logger.info("using static grid features: %s", static_cols)
    with_cols = list(FEATURE_COLUMNS) + _SPATIAL + DERIVED_COLUMNS + static_cols
    without_cols = [c for c in FEATURE_COLUMNS if c != "pm10_surface"] + _SPATIAL + DERIVED_COLUMNS + static_cols

    def _fmt(tag: str, m: Dict[str, Any]) -> str:
        return f"  {tag:<12} n_test={m['n_test']:>6}  MAE={m['mae']:.2f}  RMSE={m['rmse']:.2f}  R2={m['r2']:.3f}  ({m['split']})"

    # primary metric: held-out STATIONS, all eras — generalisation to new locations.
    logger.info("evaluating station-held-out performance (rows=%d)...", len(df))
    with_metrics = _evaluate(df, with_cols, None, args.seed)
    without_metrics = _evaluate(df, without_cols, None, args.seed)
    print("\nheld-out-station performance (spatial generalisation):")
    print(_fmt("with_pm10", with_metrics))
    print(_fmt("without_pm10", without_metrics))

    # ship without-pm10 if it holds within 5% MAE — pm10 from cams risks copying cams (SCOPE §4.3).
    ship_without = without_metrics["mae"] <= with_metrics["mae"] * 1.05
    chosen_cols = without_cols if ship_without else with_cols
    print(f"\nshipping: {'without_pm10' if ship_without else 'with_pm10'}")

    # secondary: temporal holdout (regime-shift check) when the dataset spans the cutoff.
    latest = pd.to_datetime(df["date"], errors="coerce").max() if "date" in df.columns else None
    if latest is not None and not pd.isna(latest) and latest >= pd.Timestamp(args.holdout_start):
        temporal = _evaluate(df, chosen_cols, args.holdout_start, args.seed)
        print(f"\ntemporal holdout ({args.holdout_start}+, regime-shift check):")
        print(_fmt("chosen", temporal))

    # production model: all eras, station split for conformal calibration.
    export_dir = regional_export_dir("continental", "all")
    result = train_regional_bundle(
        df, "continental", "all", export_dir,
        feature_columns=chosen_cols, holdout_start=None,
        seed=args.seed, target_transform=_TARGET_TRANSFORM, update_registry=True,
    )
    print(f"\nexported -> {export_dir}")
    print(f"  station R2={result.r2_val_ensemble:.3f}  conformal_half_width={result.conformal_half_width:.2f}"
          f"  (train={result.n_train}, cal={result.n_cal}, test={result.n_val})")

    _train_regional(df, chosen_cols, args.seed)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
