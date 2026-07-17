"""static per-location features (ndvi, night-lights) from a precomputed african grid.

built once by pipeline/build_static_grid.py (google earth engine) into
ml/data/static_grid.csv, then looked up by nearest grid cell — identical at
training and inference, no per-request satellite call. captures why a location's
baseline pm2.5 differs (vegetation cover, urbanisation).

until the grid is built these features are simply absent (is_available() -> False),
so nothing breaks — the model just doesn't use them yet.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any, Dict, Tuple

import numpy as np
import pandas as pd

from ml.paths import repository_root

STATIC_COLUMNS = ["ndvi", "night_lights"]
_GRID_STEP = 0.2
_GRID_FILE = repository_root() / "ml" / "data" / "static_grid.csv"


def _snap(value: float) -> float:
    return round(round(value / _GRID_STEP) * _GRID_STEP, 2)


@lru_cache(maxsize=1)
def _grid() -> Dict[Tuple[float, float], Dict[str, float]]:
    if not _GRID_FILE.is_file():
        return {}
    df = pd.read_csv(_GRID_FILE)
    out: Dict[Tuple[float, float], Dict[str, float]] = {}
    for r in df.to_dict("records"):
        out[(_snap(r["lat"]), _snap(r["lon"]))] = {
            c: r[c] for c in STATIC_COLUMNS if c in r and pd.notna(r[c])
        }
    return out


def is_available() -> bool:
    return bool(_grid())


def for_point(lat: float, lon: float) -> Dict[str, Any]:
    cell = _grid().get((_snap(float(lat)), _snap(float(lon))), {})
    return {c: cell.get(c) for c in STATIC_COLUMNS}


def add_to_frame(df: pd.DataFrame) -> pd.DataFrame:
    grid = _grid()
    lat = pd.to_numeric(df["lat"], errors="coerce")
    lon = pd.to_numeric(df["lon"], errors="coerce")
    keys = [( _snap(a), _snap(b) ) for a, b in zip(lat, lon)]
    for c in STATIC_COLUMNS:
        df[c] = [grid.get(k, {}).get(c, np.nan) for k in keys] if grid else np.nan
    return df
