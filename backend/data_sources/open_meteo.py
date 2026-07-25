"""
Open-Meteo data source — free, no-auth weather + air-quality APIs.

Weather:  https://api.open-meteo.com
Air quality: https://air-quality-api.open-meteo.com (CAMS)

Weather and AQ are fetched independently so a CAMS outage does not
wipe humidity / temperature / wind from the response.
"""

from __future__ import annotations

import logging
import math
from datetime import date as date_cls
from typing import Any, Dict, List, Optional

import requests

from backend.data_sources.base import DataSource

logger = logging.getLogger(__name__)

_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
_TIMEOUT = 20
_MIDDAY = 12

_WEATHER_HOURLY = ",".join(
    [
        "temperature_2m",
        "relative_humidity_2m",
        "dew_point_2m",
        "precipitation",
        "surface_pressure",
        "cloud_cover",
        "wind_speed_10m",
        "wind_direction_10m",
    ]
)

_AQ_HOURLY = ",".join(
    [
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "carbon_monoxide",
        "aerosol_optical_depth",
        "pm10",
        "pm2_5",
        "dust",
        "ozone",
    ]
)


def _pick_hour(series: Optional[List], prefer: int = _MIDDAY) -> Optional[float]:
    """Prefer midday; otherwise nearest non-null hour."""
    if not series:
        return None
    if prefer < len(series) and series[prefer] is not None:
        return float(series[prefer])
    best_val = None
    best_dist = 10**9
    for i, v in enumerate(series):
        if v is None:
            continue
        dist = abs(i - prefer)
        if dist < best_dist:
            best_dist = dist
            best_val = float(v)
    return best_val


def _uv_from_speed_dir(speed_ms: Optional[float], direction_deg: Optional[float]):
    if speed_ms is None or direction_deg is None:
        return None, None
    rad = math.radians(direction_deg)
    # Meteorological: wind FROM direction → u/v components of flow TO
    u = -speed_ms * math.sin(rad)
    v = -speed_ms * math.cos(rad)
    return u, v


class OpenMeteoDataSource(DataSource):
    """Free Open-Meteo weather + CAMS air-quality connector."""

    @property
    def source_name(self) -> str:
        return "OpenMeteo"

    @property
    def provided_features(self) -> List[str]:
        return [
            "temperature_2m",
            "relative_humidity",
            "dew_point_2m",
            "precipitation",
            "surface_pressure",
            "cloud_cover",
            "u_component_of_wind_10m",
            "v_component_of_wind_10m",
            "no2_surface",
            "so2_surface",
            "co_surface",
            "aerosol_optical_depth",
            "pm10_surface",
            "pm25_surface",
            "dust_surface",
            "o3_surface",
        ]

    @property
    def is_available(self) -> bool:
        return True

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        try:
            date_cls.fromisoformat(date)
        except ValueError as exc:
            raise ValueError(f"date must be YYYY-MM-DD, got {date!r}") from exc

        out: Dict[str, Any] = {}
        weather_err: Optional[Exception] = None
        aq_err: Optional[Exception] = None

        try:
            out.update(self._fetch_weather(lat, lon, date))
        except Exception as exc:  # noqa: BLE001 — isolate weather from AQ
            weather_err = exc
            logger.warning("Open-Meteo weather failed (%.4f, %.4f, %s): %s", lat, lon, date, exc)

        try:
            out.update(self._fetch_aq(lat, lon, date))
        except Exception as exc:  # noqa: BLE001
            aq_err = exc
            logger.warning("Open-Meteo AQ failed (%.4f, %.4f, %s): %s", lat, lon, date, exc)

        if not out:
            raise ConnectionError(
                f"Open-Meteo unavailable: weather={weather_err}; aq={aq_err}"
            )
        return out

    def _get_json(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        try:
            resp = requests.get(url, params=params, timeout=_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            raise ConnectionError(f"Open-Meteo request failed: {exc}") from exc

    def _fetch_weather(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        data = self._get_json(
            _WEATHER_URL,
            {
                "latitude": lat,
                "longitude": lon,
                "hourly": _WEATHER_HOURLY,
                "start_date": date,
                "end_date": date,
                "timezone": "UTC",
                "wind_speed_unit": "ms",
            },
        )
        hourly = data.get("hourly") or {}
        temp = _pick_hour(hourly.get("temperature_2m"))
        rh = _pick_hour(hourly.get("relative_humidity_2m"))
        dew = _pick_hour(hourly.get("dew_point_2m"))
        precip = _pick_hour(hourly.get("precipitation"))
        pressure = _pick_hour(hourly.get("surface_pressure"))
        cloud = _pick_hour(hourly.get("cloud_cover"))
        speed = _pick_hour(hourly.get("wind_speed_10m"))
        direction = _pick_hour(hourly.get("wind_direction_10m"))
        u, v = _uv_from_speed_dir(speed, direction)

        return {
            "temperature_2m": temp,
            "relative_humidity": rh,
            "dew_point_2m": dew,
            "precipitation": precip,
            "surface_pressure": pressure,
            "cloud_cover": cloud,
            "u_component_of_wind_10m": u,
            "v_component_of_wind_10m": v,
            "wind_speed_10m": speed,
            "wind_direction_10m": direction,
        }

    def _fetch_aq(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        data = self._get_json(
            _AQ_URL,
            {
                "latitude": lat,
                "longitude": lon,
                "hourly": _AQ_HOURLY,
                "start_date": date,
                "end_date": date,
                "timezone": "UTC",
            },
        )
        hourly = data.get("hourly") or {}
        return {
            "no2_surface": _pick_hour(hourly.get("nitrogen_dioxide")),
            "so2_surface": _pick_hour(hourly.get("sulphur_dioxide")),
            "co_surface": _pick_hour(hourly.get("carbon_monoxide")),
            "aerosol_optical_depth": _pick_hour(hourly.get("aerosol_optical_depth")),
            "pm10_surface": _pick_hour(hourly.get("pm10")),
            "pm25_surface": _pick_hour(hourly.get("pm2_5")),
            "dust_surface": _pick_hour(hourly.get("dust")),
            "o3_surface": _pick_hour(hourly.get("ozone")),
        }
