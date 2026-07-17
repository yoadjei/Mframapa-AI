"""derived features computed from date + lat/lon — no api calls, so they are
available identically at training time and at inference time.

captures the dominant african pm2.5 drivers the raw features miss:
- seasonality (harmattan/dust season, biomass burning) via month + cyclical day-of-year
- proximity to the sahara dust source
these attack the cross-station *baseline* gap (features that explain why a
location's typical pm2.5 differs), which is where the model is weakest.
"""

from __future__ import annotations

import math
from typing import Any, Dict

import numpy as np
import pandas as pd

# rough sahara centroid (dominant african dust source).
_SAHARA_LAT, _SAHARA_LON = 23.0, 13.0
_HARMATTAN_MONTHS = frozenset({11, 12, 1, 2, 3})

DERIVED_COLUMNS = ["month", "doy_sin", "doy_cos", "harmattan", "dist_sahara_km"]

_R_KM = 6371.0


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * _R_KM * math.asin(math.sqrt(a))


def for_point(lat: float, lon: float, day: str) -> Dict[str, float]:
    """derived features for a single request (used at inference)."""
    d = pd.to_datetime(day, errors="coerce")
    month = int(d.month) if not pd.isna(d) else 1
    doy = int(d.dayofyear) if not pd.isna(d) else 1
    return {
        "month": float(month),
        "doy_sin": math.sin(2 * math.pi * doy / 365.25),
        "doy_cos": math.cos(2 * math.pi * doy / 365.25),
        "harmattan": 1.0 if month in _HARMATTAN_MONTHS else 0.0,
        "dist_sahara_km": _haversine_km(float(lat), float(lon), _SAHARA_LAT, _SAHARA_LON),
    }


def add_to_frame(df: pd.DataFrame) -> pd.DataFrame:
    """add the derived columns to a training frame (vectorised)."""
    d = pd.to_datetime(df["date"], errors="coerce")
    month = d.dt.month.fillna(1)
    doy = d.dt.dayofyear.fillna(1)
    lat = pd.to_numeric(df["lat"], errors="coerce")
    lon = pd.to_numeric(df["lon"], errors="coerce")

    df["month"] = month.astype(float)
    df["doy_sin"] = np.sin(2 * np.pi * doy / 365.25)
    df["doy_cos"] = np.cos(2 * np.pi * doy / 365.25)
    df["harmattan"] = month.isin(_HARMATTAN_MONTHS).astype(float)

    phi1 = np.radians(lat)
    phi2 = math.radians(_SAHARA_LAT)
    dphi = np.radians(_SAHARA_LAT - lat)
    dl = np.radians(_SAHARA_LON - lon)
    a = np.sin(dphi / 2) ** 2 + np.cos(phi1) * math.cos(phi2) * np.sin(dl / 2) ** 2
    df["dist_sahara_km"] = 2 * _R_KM * np.arcsin(np.sqrt(a))
    return df
