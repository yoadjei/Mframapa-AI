"""how often does the model get the AQI *category* right?

r2 on ug/m3 answers "how close is the number", which is not the question the
product asks. nobody changes their day over 17 vs 22 ug/m3 — they act on the
category: is today fine, or should the child with asthma stay in. this measures
that directly, on the same station-disjoint split the bundle was trained with,
so the stations here were never seen during training.

    python -m ml.scripts.measure_category_accuracy
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

from backend.api.aqi import aqi_category_from_pm25
from ml.derived_features import for_point as derived_for_point
from ml.features import TARGET_COLUMN
from ml.static_features import for_point as static_for_point
from ml.model_selection import regional_export_dir
from ml.paths import repository_root
from ml.training import _resolve_splits

REPO = repository_root()
DEFAULT_DATA = REPO / "pipeline" / "output" / "training_dataset.csv"

# ordered worst-to-best so "off by one band" is measurable
_ORDER = [
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous",
]
_RANK = {c.lower(): i for i, c in enumerate(_ORDER)}


def _rank(pm25: float) -> int:
    return _RANK.get(aqi_category_from_pm25(float(pm25)).lower(), -1)


def _load_models(region_id: str, segment: str):
    export = regional_export_dir(region_id, segment)
    xgb_model = lgb_model = None
    try:
        import xgboost as xgb
        m = xgb.Booster()
        m.load_model(str(export / "xgboost.json"))
        xgb_model = m
    except Exception as e:
        print(f"  xgboost unavailable: {e}")
    try:
        import lightgbm as lgb
        lgb_model = lgb.Booster(model_file=str(export / "lightgbm.txt"))
    except Exception as e:
        print(f"  lightgbm unavailable: {e}")
    return xgb_model, lgb_model, json.loads((export / "manifest.json").read_text())


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=DEFAULT_DATA)
    ap.add_argument("--region", default="continental")
    ap.add_argument("--segment", default="all")
    args = ap.parse_args()

    df = pd.read_csv(args.data)
    df = df.dropna(subset=[TARGET_COLUMN]).reset_index(drop=True)

    xgb_model, lgb_model, manifest = _load_models(args.region, args.segment)
    # the manifest is the truth for this bundle: ml.features.FEATURE_COLUMNS has
    # drifted and no longer matches what the shipped model was trained on.
    features = list(manifest["feature_columns"])
    if xgb_model is None and lgb_model is None:
        raise SystemExit("no model artifacts found")

    # rebuild the columns the raw csv does not carry, the same way serving does
    need = [c for c in features if c not in df.columns]
    if need:
        print(f"computing {len(need)} derived features: {', '.join(need)}")
        derived = [
            {**derived_for_point(float(r.lat), float(r.lon), str(r.date)),
             **static_for_point(float(r.lat), float(r.lon)),
             "lat": float(r.lat), "lon": float(r.lon)}
            for r in df.itertuples(index=False)
        ]
        extra = pd.DataFrame(derived, index=df.index)
        for c in need:
            df[c] = extra[c] if c in extra.columns else np.nan

    X = df[features].to_numpy(dtype=np.float64)
    y = df[TARGET_COLUMN].to_numpy(dtype=np.float64)
    groups = df["station_id"].to_numpy() if "station_id" in df.columns else None
    times = df["date"].to_numpy() if "date" in df.columns else None

    # identical split settings to train_regional_bundle's defaults
    _, va, _, method = _resolve_splits(
        len(df), groups, times, None,
        test_size=0.2, calibration_fraction=0.15, seed=42,
    )
    Xv, yv = X[va], y[va]
    print(f"split={method}  held-out rows={len(va):,}  "
          f"stations={len(set(groups[va])) if groups is not None else 'n/a'}")

    preds = []
    if xgb_model is not None:
        import xgboost as xgb
        preds.append(xgb_model.predict(xgb.DMatrix(Xv, feature_names=features)))
    if lgb_model is not None:
        preds.append(lgb_model.predict(Xv))
    pred = np.mean(preds, axis=0)

    if manifest.get("target_transform") == "log1p":
        pred = np.expm1(pred)
    pred = np.clip(pred, 0.0, 500.0)

    true_rank = np.array([_rank(v) for v in yv])
    pred_rank = np.array([_rank(v) for v in pred])
    ok = true_rank >= 0

    exact = float((true_rank[ok] == pred_rank[ok]).mean())
    within1 = float((np.abs(true_rank[ok] - pred_rank[ok]) <= 1).mean())

    # the safety-critical error: we said it was fine, it was not
    unhealthy = _RANK["unhealthy for sensitive groups"]
    truly_bad = true_rank[ok] >= unhealthy
    called_bad = pred_rank[ok] >= unhealthy
    recall = float(called_bad[truly_bad].mean()) if truly_bad.any() else float("nan")
    precision = float(truly_bad[called_bad].mean()) if called_bad.any() else float("nan")

    print()
    print(f"exact category accuracy      {exact:6.1%}")
    print(f"within one category          {within1:6.1%}")
    print(f"recall on unhealthy-or-worse {recall:6.1%}   (caught {int(called_bad[truly_bad].sum()):,} of {int(truly_bad.sum()):,})")
    print(f"precision on unhealthy calls {precision:6.1%}")
    print()
    print("confusion (rows = truth, cols = predicted):")
    labels = [c for c in _ORDER]
    cm = pd.crosstab(
        pd.Series([labels[r] for r in true_rank[ok]], name="true"),
        pd.Series([labels[r] for r in pred_rank[ok]], name="pred"),
    )
    print(cm.to_string())


if __name__ == "__main__":
    main()
