"""Split conformal intervals from calibration residuals."""

from __future__ import annotations

from typing import Tuple

import numpy as np


def conformal_abs_quantile(
    y_cal: np.ndarray,
    pred_cal: np.ndarray,
    coverage: float = 0.9,
) -> float:
    y_cal = np.asarray(y_cal, dtype=np.float64).ravel()
    pred_cal = np.asarray(pred_cal, dtype=np.float64).ravel()
    residuals = np.abs(y_cal - pred_cal)
    n = residuals.size
    if n == 0:
        return 0.0
    q_level = min(1.0, (np.ceil((n + 1) * coverage) / n))
    return float(np.quantile(residuals, q_level, method="higher"))


def prediction_interval(
    pred: np.ndarray,
    half_width: float,
) -> Tuple[np.ndarray, np.ndarray]:
    p = np.asarray(pred, dtype=np.float64)
    w = float(half_width)
    return p - w, p + w
