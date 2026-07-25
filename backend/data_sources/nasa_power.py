"""
NASA POWER (Prediction Of Worldwide Energy Resources) — free weather fallback.

No API key. Daily meteorology from NASA/GEOS assimilation.
Docs: https://power.larc.nasa.gov/docs/services/api/
"""

from __future__ import annotations

import logging
import math
from datetime import date as date_cls
from typing import Any, Dict, List, Optional

import requests

from backend.data_sources.base import DataSource

logger = logging.getLogger(__name__)

_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
_TIMEOUT = 25
_PARAMS = "T2M,RH2M,WS10M,WD10M,PS,PRECTOTCORR"


def _uv_from_speed_dir(speed_ms: Optional[float], direction_deg: Optional[float]):
    if speed_ms is None or direction_deg is None:
        return None, None
    rad = math.radians(direction_deg)
    u = -speed_ms * math.sin(rad)
    v = -speed_ms * math.cos(rad)
    return u, v


def _finite(val: Any) -> Optional[float]:
    if val is None:
        return None
    try:
        f = float(val)
    except (TypeError, ValueError):
        return None
    # POWER uses -999 for fill
    if f <= -900:
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


class NASAPowerDataSource(DataSource):
    """Daily NASA POWER meteorology for a single lat/lon/date."""

    @property
    def source_name(self) -> str:
        return "NASA-POWER"

    @property
    def provided_features(self) -> List[str]:
        return [
            "temperature_2m",
            "relative_humidity",
            "u_component_of_wind_10m",
            "v_component_of_wind_10m",
            "surface_pressure",
            "precipitation",
            "wind_speed_10m",
            "wind_direction_10m",
        ]

    @property
    def is_available(self) -> bool:
        return True

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        try:
            d = date_cls.fromisoformat(date)
        except ValueError as exc:
            raise ValueError(f"date must be YYYY-MM-DD, got {date!r}") from exc

        ymd = d.strftime("%Y%m%d")
        try:
            resp = requests.get(
                _URL,
                params={
                    "parameters": _PARAMS,
                    "community": "RE",
                    "longitude": lon,
                    "latitude": lat,
                    "start": ymd,
                    "end": ymd,
                    "format": "JSON",
                },
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            payload = resp.json()
        except requests.RequestException as exc:
            raise ConnectionError(f"NASA POWER request failed: {exc}") from exc

        block = (payload.get("properties") or {}).get("parameter") or {}
        temp = _finite((block.get("T2M") or {}).get(ymd))
        rh = _finite((block.get("RH2M") or {}).get(ymd))
        speed = _finite((block.get("WS10M") or {}).get(ymd))
        direction = _finite((block.get("WD10M") or {}).get(ymd))
        # POWER PS is kPa → hPa to match Open-Meteo surface_pressure
        ps_kpa = _finite((block.get("PS") or {}).get(ymd))
        pressure = ps_kpa * 10.0 if ps_kpa is not None else None
        precip = _finite((block.get("PRECTOTCORR") or {}).get(ymd))
        u, v = _uv_from_speed_dir(speed, direction)

        if all(x is None for x in (temp, rh, u, v, pressure, precip)):
            raise ConnectionError(f"NASA POWER returned no usable values for {ymd}")

        return {
            "temperature_2m": temp,
            "relative_humidity": rh,
            "u_component_of_wind_10m": u,
            "v_component_of_wind_10m": v,
            "surface_pressure": pressure,
            "precipitation": precip,
            "wind_speed_10m": speed,
            "wind_direction_10m": direction,
        }
