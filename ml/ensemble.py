"""Combine XGBoost and LightGBM predictions."""

from __future__ import annotations

import numpy as np


def ensemble_mean(pred_xgb: np.ndarray, pred_lgb: np.ndarray) -> np.ndarray:
    return (np.asarray(pred_xgb, dtype=np.float64) + np.asarray(pred_lgb, dtype=np.float64)) / 2.0


def ensemble_weighted(
    pred_xgb: np.ndarray,
    pred_lgb: np.ndarray,
    weight_xgb: float = 0.5,
) -> np.ndarray:
    w_x = float(weight_xgb)
    w_l = 1.0 - w_x
    return w_x * np.asarray(pred_xgb, dtype=np.float64) + w_l * np.asarray(pred_lgb, dtype=np.float64)
