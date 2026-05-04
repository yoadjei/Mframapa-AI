"""
Train regional XGBoost + LightGBM models and export artifacts for production.

Training data is expected as a pandas DataFrame with ``FEATURE_COLUMNS`` and
``TARGET_COLUMN``. For CI and dry runs, use ``synthetic_training_frame``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split

from ml.features import FEATURE_COLUMNS, TARGET_COLUMN
from ml.ensemble import ensemble_mean
from ml.uncertainty import conformal_abs_quantile, prediction_interval
from ml.model_registry import RegionalModelEntry, upsert_entry
from ml.paths import repository_root

_REPO_ROOT = repository_root()

try:
    import xgboost as xgb
except ImportError:  # pragma: no cover
    xgb = None  # type: ignore
except Exception:  # pragma: no cover — native lib missing (e.g. libomp on macOS)
    xgb = None  # type: ignore

try:
    import lightgbm as lgb
except ImportError:  # pragma: no cover
    lgb = None  # type: ignore
except Exception:  # pragma: no cover
    lgb = None  # type: ignore


@dataclass
class TrainingResult:
    r2_val_xgb: float
    r2_val_lgb: float
    r2_val_ensemble: float
    conformal_half_width: float
    export_dir: Path


def synthetic_training_frame(
    n_rows: int = 800,
    *,
    seed: int = 42,
    noise: float = 4.0,
) -> pd.DataFrame:
    """
    Correlated synthetic features and PM2.5 for notebook smoke tests / CI.

    Not for production accuracy — replace with real labelled data.
    """
    rng = np.random.default_rng(seed)
    n = int(n_rows)
    d = len(FEATURE_COLUMNS)
    X = rng.normal(0.0, 1.0, size=(n, d))
    # Ground truth-ish: positive combination + non-linear term
    w = rng.uniform(0.5, 3.0, size=d)
    base = X @ w + 0.5 * (X[:, 2] ** 2)
    y = 12.0 + base * 3.0 + rng.normal(0.0, noise, size=n)
    y = np.clip(y, 1.0, 250.0)

    df = pd.DataFrame(X, columns=FEATURE_COLUMNS)
    df[TARGET_COLUMN] = y
    return df


def train_regional_bundle(
    df: pd.DataFrame,
    region_id: str,
    segment: str,
    export_dir: Path,
    *,
    test_size: float = 0.2,
    calibration_fraction: float = 0.15,
    seed: int = 42,
    update_registry: bool = True,
) -> TrainingResult:
    """
    Fit XGBoost + LightGBM, calibrate conformal width, export models + manifest.
    """
    if xgb is None or lgb is None:
        raise ImportError(
            "xgboost and lightgbm must be installed and loadable (see requirements.txt). "
            "On macOS, if XGBoost errors mention libomp or OpenMP: run `brew install libomp`, "
            "then restart the kernel."
        )

    export_dir = Path(export_dir)
    export_dir.mkdir(parents=True, exist_ok=True)

    missing = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"DataFrame missing columns: {missing}")

    data = df[FEATURE_COLUMNS + [TARGET_COLUMN]].dropna()
    if len(data) < 40:
        raise ValueError(f"Need at least 40 complete rows; got {len(data)}")

    X = data[FEATURE_COLUMNS].to_numpy(dtype=np.float64)
    y = data[TARGET_COLUMN].to_numpy(dtype=np.float64)

    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=test_size + calibration_fraction, random_state=seed
    )
    rel_cal = calibration_fraction / (test_size + calibration_fraction)
    X_val, X_cal, y_val, y_cal = train_test_split(
        X_temp, y_temp, test_size=rel_cal, random_state=seed + 1
    )

    xgb_model = xgb.XGBRegressor(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_lambda=1.0,
        random_state=seed,
        n_jobs=0,
    )
    xgb_model.fit(X_train, y_train)

    lgb_train = lgb.Dataset(X_train, y_train)
    lgb_val = lgb.Dataset(X_val, y_val, reference=lgb_train)
    lgb_params: Dict[str, Any] = {
        "objective": "regression",
        "metric": "rmse",
        "verbosity": -1,
        "seed": seed,
        "learning_rate": 0.06,
        "num_leaves": 48,
        "feature_fraction": 0.85,
        "bagging_fraction": 0.85,
        "bagging_freq": 1,
    }
    lgb_model = lgb.train(
        lgb_params,
        lgb_train,
        num_boost_round=300,
        valid_sets=[lgb_val],
        callbacks=[lgb.early_stopping(30, verbose=False)],
    )

    pred_v_x = xgb_model.predict(X_val)
    pred_v_l = lgb_model.predict(X_val, num_iteration=lgb_model.best_iteration)
    pred_v_e = ensemble_mean(pred_v_x, pred_v_l)

    pred_c_x = xgb_model.predict(X_cal)
    pred_c_l = lgb_model.predict(X_cal, num_iteration=lgb_model.best_iteration)
    pred_c_e = ensemble_mean(pred_c_x, pred_c_l)
    half_w = conformal_abs_quantile(y_cal, pred_c_e, coverage=0.9)

    r2_x = float(r2_score(y_val, pred_v_x))
    r2_l = float(r2_score(y_val, pred_v_l))
    r2_e = float(r2_score(y_val, pred_v_e))

    xgb_path = export_dir / "xgboost.json"
    lgb_path = export_dir / "lightgbm.txt"
    xgb_model.save_model(str(xgb_path))
    lgb_model.save_model(str(lgb_path), num_iteration=lgb_model.best_iteration)

    lo, hi = prediction_interval(pred_c_e, half_w)
    manifest = {
        "model_version": "2.0.0",
        "region_id": region_id,
        "segment": segment,
        "feature_columns": list(FEATURE_COLUMNS),
        "target_column": TARGET_COLUMN,
        "metrics": {
            "r2_val_xgboost": r2_x,
            "r2_val_lightgbm": r2_l,
            "r2_val_ensemble_mean": r2_e,
        },
        "uncertainty": {
            "method": "split_conformal_absolute_residual",
            "coverage": 0.9,
            "conformal_half_width": half_w,
            "calibration_n": int(y_cal.size),
        },
        "calibration_interval_example": {
            "lower": float(lo[0]) if lo.size else None,
            "upper": float(hi[0]) if hi.size else None,
        },
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
    }
    manifest_path = export_dir / "manifest.json"
    with manifest_path.open("w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    if update_registry:
        upsert_entry(
            RegionalModelEntry(
                region_id=region_id,
                segment=segment,
                xgboost_path=str(xgb_path.relative_to(_REPO_ROOT)),
                lightgbm_path=str(lgb_path.relative_to(_REPO_ROOT)),
                manifest_path=str(manifest_path.relative_to(_REPO_ROOT)),
                r2_val=r2_e,
                conformal_half_width=half_w,
                trained_at_utc=manifest["trained_at_utc"],
            ),
        )

    return TrainingResult(
        r2_val_xgb=r2_x,
        r2_val_lgb=r2_l,
        r2_val_ensemble=r2_e,
        conformal_half_width=half_w,
        export_dir=export_dir,
    )


def filter_frame_by_cities_manifest(
    df: pd.DataFrame,
    manifest_path: Path,
) -> pd.DataFrame:
    """Restrict rows to city names listed in a split manifest JSON (optional)."""
    with Path(manifest_path).open(encoding="utf-8") as f:
        man = json.load(f)
    names = {c["name"] for c in man.get("cities", [])}
    if "name" not in df.columns or not names:
        return df
    return df[df["name"].isin(names)].copy()
