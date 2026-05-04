"""
Validate all exported regional models against a labelled holdout CSV.

Usage::

    python -m ml.scripts.validate_models --data path/to/holdout.csv
    python -m ml.scripts.validate_models --data path/to/holdout.csv --output ml/data/validation_results.json
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

from ml.features import FEATURE_COLUMNS, TARGET_COLUMN
from ml.model_registry import load_registry, default_registry_path
from ml.ensemble import ensemble_mean
from ml.paths import repository_root


def _load_models(xgboost_path: str, lightgbm_path: str, repo_root: Path):
    """Load XGBRegressor and LightGBM Booster from disk."""
    try:
        import xgboost as xgb
    except ImportError as exc:
        raise ImportError("xgboost is required for validation") from exc

    try:
        import lightgbm as lgb
    except ImportError as exc:
        raise ImportError("lightgbm is required for validation") from exc

    xgb_abs = repo_root / xgboost_path
    lgb_abs = repo_root / lightgbm_path

    xgb_model = xgb.XGBRegressor()
    xgb_model.load_model(str(xgb_abs))

    lgb_model = lgb.Booster(model_file=str(lgb_abs))

    return xgb_model, lgb_model


def _compute_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    n = len(y_true)
    residuals = y_true - y_pred
    ss_res = float(np.sum(residuals ** 2))
    ss_tot = float(np.sum((y_true - y_true.mean()) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0.0 else float("nan")
    rmse = float(math.sqrt(ss_res / n)) if n > 0 else float("nan")
    mae = float(np.mean(np.abs(residuals))) if n > 0 else float("nan")
    return {"r2": r2, "rmse": rmse, "mae": mae, "n_rows": n}


def _filter_rows(
    df: pd.DataFrame,
    region_id: str,
    segment: str,
) -> pd.DataFrame:
    """Return rows matching the given region and segment."""
    has_region_col = "region_id" in df.columns
    has_segment_col = "segment" in df.columns

    if not has_region_col and not has_segment_col:
        return df

    mask = pd.Series([True] * len(df), index=df.index)
    if has_region_col:
        mask = mask & (df["region_id"] == region_id)
    if has_segment_col:
        mask = mask & (df["segment"] == segment)
    return df[mask]


def _assign_region_segment(df: pd.DataFrame) -> pd.DataFrame:
    """Auto-assign region_id and segment columns from lat/lon/population_density."""
    from ml.regions import assign_region
    from ml.urban_rural import classify_from_population_density

    df = df.copy()

    if "lat" in df.columns and "lon" in df.columns and "region_id" not in df.columns:
        df["region_id"] = df.apply(
            lambda row: assign_region(row["lat"], row["lon"]), axis=1
        )

    if "segment" not in df.columns:
        pop_col = "population_density" if "population_density" in df.columns else None
        if pop_col:
            df["segment"] = df[pop_col].apply(classify_from_population_density)
        else:
            df["segment"] = "rural"

    return df


def _print_table(results: List[Dict[str, Any]]) -> None:
    header = f"{'Region':<24}  {'Segment':<8}  {'R²':>7}  {'RMSE':>8}  {'MAE':>8}  {'N':>6}"
    sep = "-" * len(header)
    print(sep)
    print(header)
    print(sep)
    for row in results:
        r2 = row.get("r2")
        rmse = row.get("rmse")
        mae = row.get("mae")
        n = row.get("n_rows", 0)
        r2_s = f"{r2:.4f}" if r2 is not None and not math.isnan(r2) else "  n/a "
        rmse_s = f"{rmse:.3f}" if rmse is not None and not math.isnan(rmse) else "    n/a"
        mae_s = f"{mae:.3f}" if mae is not None and not math.isnan(mae) else "    n/a"
        print(
            f"{row['region_id']:<24}  {row['segment']:<8}  {r2_s:>7}  {rmse_s:>8}  {mae_s:>8}  {n:>6}"
        )
    print(sep)


def validate(
    data_path: Path,
    registry_path: Optional[Path] = None,
    output_path: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    repo_root = repository_root()
    reg_path = registry_path or default_registry_path(repo_root / "ml")
    registry = load_registry(reg_path)
    models = registry.get("models", [])

    if not models:
        print("No trained models found in registry. Train models first with ml.training.")
        return []

    # Load holdout CSV
    df = pd.read_csv(data_path)

    # Check required feature+target columns
    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        print(f"ERROR: holdout CSV is missing required columns: {missing}", file=sys.stderr)
        sys.exit(1)

    # Auto-assign region/segment if lat/lon present but region_id column absent
    if "region_id" not in df.columns or "segment" not in df.columns:
        df = _assign_region_segment(df)

    results: List[Dict[str, Any]] = []

    for entry in models:
        region_id: str = entry.get("region_id", "")
        segment: str = entry.get("segment", "")
        xgb_rel: Optional[str] = entry.get("xgboost_path")
        lgb_rel: Optional[str] = entry.get("lightgbm_path")

        if not xgb_rel or not lgb_rel:
            print(f"  [{region_id}/{segment}] Skipping — missing model paths in registry.")
            continue

        xgb_abs = repo_root / xgb_rel
        lgb_abs = repo_root / lgb_rel

        if not xgb_abs.is_file() or not lgb_abs.is_file():
            print(
                f"  [{region_id}/{segment}] Skipping — exported model files not found "
                f"({xgb_abs.name}, {lgb_abs.name})."
            )
            continue

        subset = _filter_rows(df, region_id, segment)
        subset = subset.dropna(subset=FEATURE_COLUMNS + [TARGET_COLUMN])

        if len(subset) == 0:
            print(f"  [{region_id}/{segment}] Skipping — no matching rows in holdout CSV.")
            continue

        try:
            xgb_model, lgb_model = _load_models(xgb_rel, lgb_rel, repo_root)
        except Exception as exc:
            print(f"  [{region_id}/{segment}] ERROR loading models: {exc}", file=sys.stderr)
            continue

        X = subset[FEATURE_COLUMNS].to_numpy(dtype=np.float64)
        y_true = subset[TARGET_COLUMN].to_numpy(dtype=np.float64)

        pred_xgb = xgb_model.predict(X)
        pred_lgb = lgb_model.predict(X)
        y_pred = ensemble_mean(pred_xgb, pred_lgb)

        metrics = _compute_metrics(y_true, y_pred)
        result: Dict[str, Any] = {
            "region_id": region_id,
            "segment": segment,
            **metrics,
        }
        results.append(result)

    if not results:
        print("No models could be validated (no matching data or no exported files).")
        return results

    _print_table(results)

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"validation_results": results}
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
        print(f"\nResults saved to {output_path}")

    return results


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Validate exported regional PM2.5 models against a labelled holdout CSV."
    )
    ap.add_argument(
        "--data",
        type=Path,
        required=True,
        metavar="CSV",
        help="Path to holdout CSV with FEATURE_COLUMNS + TARGET_COLUMN.",
    )
    ap.add_argument(
        "--output",
        type=Path,
        default=None,
        metavar="JSON",
        help="Optional path to save validation results as JSON (e.g. ml/data/validation_results.json).",
    )
    ap.add_argument(
        "--registry",
        type=Path,
        default=None,
        metavar="JSON",
        help="Path to model_registry.json (defaults to ml/data/model_registry.json).",
    )
    args = ap.parse_args()

    if not args.data.is_file():
        print(f"ERROR: holdout CSV not found: {args.data}", file=sys.stderr)
        sys.exit(1)

    validate(args.data, registry_path=args.registry, output_path=args.output)


if __name__ == "__main__":
    main()
