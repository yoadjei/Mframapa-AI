"""
NDVI via ORNL DAAC MODIS MOD13Q1 - 16-day 250m composite.

Free REST API, no authentication required.
Band: "250m_16_days_NDVI", scale factor 0.0001, fill threshold -2000.
Spatial window 3x3 km (kmAboveBelow=1, kmLeftRight=1) — averages valid pixels.
"""

import logging
from datetime import date as _date
from typing import Any, Dict, List, Optional

import requests

from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

_BASE = "https://modis.ornl.gov/rst/api/v1"
_PRODUCT = "MOD13Q1"
_BAND = "250m_16_days_NDVI"
_SCALE = 0.0001
_FILL_THRESHOLD = -2000


def _mod_date(d: _date) -> str:
    """ORNL DAAC date string for the 16-day MOD13Q1 period containing d."""
    doy = d.timetuple().tm_yday
    period_doy = ((doy - 1) // 16) * 16 + 1
    return f"A{d.year}{period_doy:03d}"


class NDVIDataSource(DataSource):
    """16-day NDVI from MODIS MOD13Q1 via ORNL DAAC REST API."""

    @property
    def source_name(self) -> str:
        return "NDVI-ORNL-DAAC"

    @property
    def provided_features(self) -> List[str]:
        return ["ndvi"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=30)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        d = _date.fromisoformat(date)
        ornl_date = _mod_date(d)

        resp = requests.get(
            f"{_BASE}/{_PRODUCT}/subset",
            params={
                "latitude": lat,
                "longitude": lon,
                "startDate": ornl_date,
                "endDate": ornl_date,
                "band": _BAND,
                "kmAboveBelow": 1,
                "kmLeftRight": 1,
            },
            timeout=30,
        )
        resp.raise_for_status()

        ndvi = _extract_ndvi(resp.json())
        if ndvi is None:
            logger.debug("NDVI: no valid data for (%.4f, %.4f) %s", lat, lon, date)
        return {"ndvi": ndvi}

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"NDVI: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"NDVI: longitude {lon} out of range")


def _extract_ndvi(payload: Dict[str, Any]) -> Optional[float]:
    """Average all valid raw NDVI values in the 3x3 spatial window."""
    valid: List[float] = []
    for subset in payload.get("subset", []):
        if _BAND not in subset.get("band", ""):
            continue
        for val in subset.get("data", []):
            if isinstance(val, (int, float)) and val > _FILL_THRESHOLD:
                valid.append(float(val))
    if not valid:
        return None
    return round(sum(valid) / len(valid) * _SCALE, 4)
