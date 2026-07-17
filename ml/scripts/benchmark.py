"""
benchmark harness — held-out-station error for mframapa vs baselines.

the output table (mae/rmse/r2, overall and per region) is the pitch slide and the
public-benchmark paper (scope §4.7, §9.1). run against a held-out test csv that
carries the truth column, the mframapa prediction, and baseline columns.

    python -m ml.scripts.benchmark test.csv --truth pm25_surface \\
        --models mframapa_pred openmeteo_pm25 cams_pm25 --group region_id
"""

from __future__ import annotations

import argparse
from typing import Dict, List, Optional, Sequence

import numpy as np
import pandas as pd


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
    # mae, rmse, r2 over rows where both values are present.
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    mask = ~(np.isnan(y_true) | np.isnan(y_pred))
    n = int(mask.sum())
    if n == 0:
        return {"n": 0, "mae": float("nan"), "rmse": float("nan"), "r2": float("nan")}
    yt, yp = y_true[mask], y_pred[mask]
    err = yp - yt
    ss_res = float(np.sum(err ** 2))
    ss_tot = float(np.sum((yt - yt.mean()) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else float("nan")
    return {
        "n": n,
        "mae": float(np.mean(np.abs(err))),
        "rmse": float(np.sqrt(np.mean(err ** 2))),
        "r2": r2,
    }


def benchmark(
    df: pd.DataFrame,
    truth_col: str,
    model_cols: Sequence[str],
    group_col: Optional[str] = None,
) -> pd.DataFrame:
    # metrics for each model column, overall and optionally per group.
    rows: List[Dict[str, object]] = []

    def _add(group: str, frame: pd.DataFrame) -> None:
        for model in model_cols:
            m = regression_metrics(frame[truth_col].to_numpy(), frame[model].to_numpy())
            rows.append({"group": group, "model": model, **m})

    _add("overall", df)
    if group_col and group_col in df.columns:
        for name, frame in df.groupby(group_col):
            _add(str(name), frame)

    return pd.DataFrame(rows, columns=["group", "model", "n", "mae", "rmse", "r2"])


def main() -> None:
    p = argparse.ArgumentParser(description="mframapa held-out benchmark")
    p.add_argument("csv", help="held-out test csv")
    p.add_argument("--truth", default="pm25_surface")
    p.add_argument("--models", nargs="+", required=True, help="prediction columns to score")
    p.add_argument("--group", default="region_id", help="grouping column (or '' for overall only)")
    args = p.parse_args()

    df = pd.read_csv(args.csv)
    table = benchmark(df, args.truth, args.models, args.group or None)
    with pd.option_context("display.float_format", lambda v: f"{v:.3f}"):
        print(table.to_string(index=False))


if __name__ == "__main__":
    main()
