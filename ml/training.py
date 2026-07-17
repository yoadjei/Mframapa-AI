"""
train regional xgboost + lightgbm models and export artifacts for production.

training data is a pandas dataframe with ``FEATURE_COLUMNS`` and ``TARGET_COLUMN``.
optional ``station_id`` / ``date`` columns enable station-level and temporal
holdout splits (the only honest validation for spatial models). for ci/dry runs
use ``synthetic_training_frame``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional, Sequence, Tuple

import numpy as np
import pandas as pd
from sklearn.metrics import r2_score
from sklearn.model_selection import GroupShuffleSplit, train_test_split

from ml.features import FEATURE_COLUMNS, TARGET_COLUMN
from ml.ensemble import ensemble_mean
from ml.uncertainty import conformal_abs_quantile, prediction_interval
from ml.model_registry import RegionalModelEntry, upsert_entry
from ml.paths import repository_root

_REPO_ROOT = repository_root()

try:
    import xgboost as xgb
except Exception:  # pragma: no cover — package or native lib (libomp) missing
    xgb = None  # type: ignore

try:
    import lightgbm as lgb
except Exception:  # pragma: no cover
    lgb = None  # type: ignore


@dataclass
class TrainingResult:
    r2_val_xgb: float
    r2_val_lgb: float
    r2_val_ensemble: float
    conformal_half_width: float
    export_dir: Path
    n_train: int
    n_val: int
    n_cal: int
    split_method: str


def synthetic_training_frame(
    n_rows: int = 800,
    *,
    seed: int = 42,
    noise: float = 4.0,
    with_metadata: bool = False,
) -> pd.DataFrame:
    """correlated synthetic features + pm2.5 for smoke tests / ci.

    ``with_metadata`` adds ``station_id`` and ``date`` columns so split logic
    can be exercised. not for production accuracy.
    """
    rng = np.random.default_rng(seed)
    n = int(n_rows)
    d = len(FEATURE_COLUMNS)
    X = rng.normal(0.0, 1.0, size=(n, d))
    w = rng.uniform(0.5, 3.0, size=d)
    base = X @ w + 0.5 * (X[:, 2] ** 2)
    y = np.clip(12.0 + base * 3.0 + rng.normal(0.0, noise, size=n), 1.0, 250.0)

    df = pd.DataFrame(X, columns=FEATURE_COLUMNS)
    df[TARGET_COLUMN] = y
    if with_metadata:
        n_stations = max(8, n // 25)
        df["station_id"] = rng.integers(0, n_stations, size=n)
        start = np.datetime64("2020-01-01")
        df["date"] = start + rng.integers(0, 2192, size=n).astype("timedelta64[D]")
    return df


def _split_pool(
    positions: np.ndarray,
    groups: Optional[np.ndarray],
    *,
    test_frac: float,
    seed: int,
) -> Tuple[np.ndarray, np.ndarray]:
    """split positions into (a, b); ``b`` is ``test_frac`` of the pool.

    stations stay disjoint between a and b when ``groups`` is given.
    """
    if groups is None:
        a, b = train_test_split(positions, test_size=test_frac, random_state=seed)
        return np.asarray(a), np.asarray(b)
    gss = GroupShuffleSplit(n_splits=1, test_size=test_frac, random_state=seed)
    a_rel, b_rel = next(gss.split(positions, groups=groups[positions]))
    return positions[a_rel], positions[b_rel]


def _resolve_splits(
    n: int,
    groups: Optional[np.ndarray],
    times: Optional[np.ndarray],
    holdout_start: Optional[str],
    *,
    test_size: float,
    calibration_fraction: float,
    seed: int,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, str]:
    """return (train, val, cal, method) positional index arrays.

    temporal holdout (rows on/after ``holdout_start``) becomes the validation
    set when a cutoff is given; otherwise validation is a random/grouped slice.
    """
    pos = np.arange(n)
    if times is not None and holdout_start is not None:
        t = pd.to_datetime(pd.Series(times), errors="coerce").to_numpy()
        is_val = t >= np.datetime64(pd.Timestamp(holdout_start))
        val = pos[is_val]
        pool = pos[~is_val]
        cal_frac = min(0.5, calibration_fraction / max(1e-6, 1.0 - test_size))
        train, cal = _split_pool(pool, groups, test_frac=cal_frac, seed=seed)
        method = "station_temporal" if groups is not None else "temporal"
        return train, val, cal, method

    train, temp = _split_pool(pos, groups, test_frac=test_size + calibration_fraction, seed=seed)
    rel_cal = calibration_fraction / (test_size + calibration_fraction)
    val, cal = _split_pool(temp, groups, test_frac=rel_cal, seed=seed + 1)
    method = "station" if groups is not None else "random"
    return train, val, cal, method


def train_regional_bundle(
    df: pd.DataFrame,
    region_id: str,
    segment: str,
    export_dir: Path,
    *,
    feature_columns: Optional[Sequence[str]] = None,
    group_col: Optional[str] = "station_id",
    time_col: Optional[str] = "date",
    holdout_start: Optional[str] = None,
    test_size: float = 0.2,
    calibration_fraction: float = 0.15,
    seed: int = 42,
    target_transform: Optional[str] = None,
    update_registry: bool = True,
) -> TrainingResult:
    """fit xgboost + lightgbm, calibrate conformal width, export models + manifest.

    splits by ``group_col`` (station) and/or ``time_col`` + ``holdout_start`` when
    those columns exist; otherwise falls back to a random split. feature nans are
    preserved — trees handle them, and inference faces the same gaps.
    """
    if xgb is None or lgb is None:
        raise ImportError(
            "xgboost and lightgbm must be installed and loadable (see requirements.txt). "
            "on macos run `brew install libomp` if xgboost errors mention openmp."
        )

    feature_columns = list(feature_columns or FEATURE_COLUMNS)
    export_dir = Path(export_dir)
    export_dir.mkdir(parents=True, exist_ok=True)

    missing = [c for c in feature_columns + [TARGET_COLUMN] if c not in df.columns]
    if missing:
        raise ValueError(f"DataFrame missing columns: {missing}")

    # only the target must be present; keep rows with missing satellite features.
    data = df.dropna(subset=[TARGET_COLUMN]).reset_index(drop=True)
    if len(data) < 40:
        raise ValueError(f"Need at least 40 labelled rows; got {len(data)}")

    X = data[feature_columns].to_numpy(dtype=np.float64)
    y = data[TARGET_COLUMN].to_numpy(dtype=np.float64)
    groups = data[group_col].to_numpy() if group_col and group_col in data.columns else None
    times = data[time_col].to_numpy() if time_col and time_col in data.columns else None

    tr, va, ca, split_method = _resolve_splits(
        len(data), groups, times, holdout_start,
        test_size=test_size, calibration_fraction=calibration_fraction, seed=seed,
    )
    if min(tr.size, va.size, ca.size) == 0:
        raise ValueError(
            f"Empty split (train={tr.size}, val={va.size}, cal={ca.size}); "
            "check station/date coverage or holdout_start."
        )
    X_train, y_train = X[tr], y[tr]
    X_val, y_val = X[va], y[va]
    X_cal, y_cal = X[ca], y[ca]

    # train in transformed space (log1p tames the skewed pm2.5 target); metrics and the
    # conformal interval are computed back on the original ug/m3 scale.
    def _fwd(v: np.ndarray) -> np.ndarray:
        return np.log1p(v) if target_transform == "log1p" else v

    def _inv(v: np.ndarray) -> np.ndarray:
        return np.clip(np.expm1(v), 0.0, None) if target_transform == "log1p" else v

    xgb_model = xgb.XGBRegressor(
        n_estimators=500, max_depth=7, learning_rate=0.04,
        subsample=0.85, colsample_bytree=0.8, reg_lambda=1.0,
        random_state=seed, n_jobs=0,
    )
    xgb_model.fit(X_train, _fwd(y_train))

    lgb_train = lgb.Dataset(X_train, _fwd(y_train))
    lgb_val = lgb.Dataset(X_val, _fwd(y_val), reference=lgb_train)
    lgb_params: Dict[str, Any] = {
        "objective": "regression", "metric": "rmse", "verbosity": -1,
        "seed": seed, "learning_rate": 0.04, "num_leaves": 64,
        "feature_fraction": 0.8, "bagging_fraction": 0.85, "bagging_freq": 1,
    }
    lgb_model = lgb.train(
        lgb_params, lgb_train, num_boost_round=800,
        valid_sets=[lgb_val], callbacks=[lgb.early_stopping(40, verbose=False)],
    )

    def _predict(matrix: np.ndarray) -> np.ndarray:
        return ensemble_mean(
            _inv(xgb_model.predict(matrix)),
            _inv(lgb_model.predict(matrix, num_iteration=lgb_model.best_iteration)),
        )

    pred_v_x = _inv(xgb_model.predict(X_val))
    pred_v_l = _inv(lgb_model.predict(X_val, num_iteration=lgb_model.best_iteration))
    pred_v_e = ensemble_mean(pred_v_x, pred_v_l)
    half_w = conformal_abs_quantile(y_cal, _predict(X_cal), coverage=0.9)

    r2_x = float(r2_score(y_val, pred_v_x))
    r2_l = float(r2_score(y_val, pred_v_l))
    r2_e = float(r2_score(y_val, pred_v_e))

    xgb_path = export_dir / "xgboost.json"
    lgb_path = export_dir / "lightgbm.txt"
    xgb_model.save_model(str(xgb_path))
    lgb_model.save_model(str(lgb_path), num_iteration=lgb_model.best_iteration)

    lo, hi = prediction_interval(pred_v_e, half_w)
    manifest = {
        "model_version": "2.0.0",
        "region_id": region_id,
        "segment": segment,
        "feature_columns": feature_columns,
        "target_column": TARGET_COLUMN,
        "target_transform": target_transform,
        "metrics": {
            "r2_val_xgboost": r2_x,
            "r2_val_lightgbm": r2_l,
            "r2_val_ensemble_mean": r2_e,
        },
        "split": {
            "method": split_method,
            "holdout_start": holdout_start,
            "n_train": int(tr.size),
            "n_val": int(va.size),
            "n_cal": int(ca.size),
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
        r2_val_xgb=r2_x, r2_val_lgb=r2_l, r2_val_ensemble=r2_e,
        conformal_half_width=half_w, export_dir=export_dir,
        n_train=int(tr.size), n_val=int(va.size), n_cal=int(ca.size),
        split_method=split_method,
    )


def train_pm10_variants(
    df: pd.DataFrame,
    region_id: str,
    segment: str,
    export_root: Path,
    **kwargs: Any,
) -> Dict[str, TrainingResult]:
    """train ``with_pm10`` and ``without_pm10`` bundles for comparison.

    pm10 from openmeteo is cams output and risks the model learning to copy cams;
    ship the without-variant if it holds on held-out stations (scope §4.3).
    """
    root = Path(export_root)
    without_cols = [c for c in FEATURE_COLUMNS if c != "pm10_surface"]
    kwargs.setdefault("update_registry", False)
    return {
        "with_pm10": train_regional_bundle(
            df, region_id, segment, root / "with_pm10",
            feature_columns=list(FEATURE_COLUMNS), **kwargs,
        ),
        "without_pm10": train_regional_bundle(
            df, region_id, segment, root / "without_pm10",
            feature_columns=without_cols, **kwargs,
        ),
    }


def filter_frame_by_cities_manifest(df: pd.DataFrame, manifest_path: Path) -> pd.DataFrame:
    # restrict rows to city names listed in a split manifest json (optional).
    with Path(manifest_path).open(encoding="utf-8") as f:
        man = json.load(f)
    names = {c["name"] for c in man.get("cities", [])}
    if "name" not in df.columns or not names:
        return df
    return df[df["name"].isin(names)].copy()
