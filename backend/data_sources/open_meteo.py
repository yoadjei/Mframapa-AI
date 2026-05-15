"""
Open-Meteo connector — free, no authentication required.

Weather endpoint:  https://api.open-meteo.com/v1/forecast
Air quality endpoint: https://air-quality-api.open-meteo.com/v1/air-quality

Returns midday (hour-index 12) values as the daily representative.
"""

import logging
from datetime import datetime
from typing import Dict, Any, List

import requests

from .base import DataSource
from backend.utils.retry import with_retry

logger = logging.getLogger(__name__)

_WEATHER_URL    = "https://api.open-meteo.com/v1/forecast"
_WEATHER_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
_AQ_URL         = "https://air-quality-api.open-meteo.com/v1/air-quality"
_TIMEOUT        = 30
_MIDDAY_INDEX   = 12
_FORECAST_DAYS  = 92  # forecast API supports up to ~92 days of history


class OpenMeteoDataSource(DataSource):
    """
    Pulls weather and air-quality data from Open-Meteo's free APIs.
    No credentials required — always available.
    """

    @property
    def source_name(self) -> str:
        return "OpenMeteo"

    @property
    def provided_features(self) -> List[str]:
        return [
            "temperature_2m",
            "relative_humidity",
            "u_component_of_wind_10m",
            "v_component_of_wind_10m",
            "no2_surface",
            "so2_surface",
            "co_surface",
            "aerosol_optical_depth",
            "pm10_surface",
            "pm25_surface",
        ]

    @property
    def is_available(self) -> bool:
        return True   # no credentials needed

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_date(date)
        weather = self._fetch_weather(lat, lon, date)
        aq      = self._fetch_air_quality(lat, lon, date)
        return {**weather, **aq}

    # ------------------------------------------------------------------ #

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def _fetch_weather(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        import math
        from datetime import date as _date, timedelta
        cutoff = (_date.today() - timedelta(days=_FORECAST_DAYS)).isoformat()
        url = _WEATHER_ARCHIVE if date < cutoff else _WEATHER_URL
        params = {
            "latitude":   lat,
            "longitude":  lon,
            "hourly":     "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m",
            "start_date": date,
            "end_date":   date,
            "timezone":   "UTC",
        }
        try:
            r = requests.get(url, params=params, timeout=_TIMEOUT)
            r.raise_for_status()
            data = r.json()
        except requests.RequestException as e:
            raise ConnectionError(f"OpenMeteo weather request failed: {e}") from e

        hourly = data.get("hourly", {})
        idx    = _MIDDAY_INDEX

        temp    = self._idx(hourly.get("temperature_2m"),        idx)
        rh      = self._idx(hourly.get("relative_humidity_2m"),  idx)
        wspd    = self._idx(hourly.get("wind_speed_10m"),         idx)
        wdir    = self._idx(hourly.get("wind_direction_10m"),     idx)

        # Decompose speed + direction into u/v components
        u = v = None
        if wspd is not None and wdir is not None:
            wdir_rad = math.radians(wdir)
            u = round(-wspd * math.sin(wdir_rad), 4)
            v = round(-wspd * math.cos(wdir_rad), 4)

        return {
            "temperature_2m":          round(temp, 2) if temp is not None else None,
            "relative_humidity":       round(rh,   2) if rh   is not None else None,
            "u_component_of_wind_10m": u,
            "v_component_of_wind_10m": v,
        }

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def _fetch_air_quality(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        params = {
            "latitude":   lat,
            "longitude":  lon,
            "hourly":     "nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,aerosol_optical_depth,pm10,pm2_5",
            "start_date": date,
            "end_date":   date,
            "timezone":   "UTC",
        }
        try:
            r = requests.get(_AQ_URL, params=params, timeout=_TIMEOUT)
            r.raise_for_status()
            data = r.json()
        except requests.RequestException as e:
            raise ConnectionError(f"OpenMeteo AQ request failed: {e}") from e

        hourly = data.get("hourly", {})
        idx    = _MIDDAY_INDEX

        return {
            "no2_surface":         self._idx(hourly.get("nitrogen_dioxide"),     idx),
            "so2_surface":         self._idx(hourly.get("sulphur_dioxide"),      idx),
            "co_surface":          self._idx(hourly.get("carbon_monoxide"),      idx),
            "aerosol_optical_depth": self._idx(hourly.get("aerosol_optical_depth"), idx),
            "pm10_surface":        self._idx(hourly.get("pm10"),                 idx),
            "pm25_surface":        self._idx(hourly.get("pm2_5"),                idx),
        }

    @staticmethod
    def _idx(lst, i):
        try:
            return lst[i]
        except (TypeError, IndexError):
            return None

    @staticmethod
    def _validate_date(date: str) -> None:
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"OpenMeteo: invalid date '{date}' — expected YYYY-MM-DD")
