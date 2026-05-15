"""
OpenAQ v3 data source — ground truth PM2.5/PM10 from reference monitors.

No authentication required. Rate-limited: 10 req/s on free tier.
Docs: https://docs.openaq.org/
"""

import logging
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

import requests
from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

_BASE = "https://api.openaq.org/v3"
_TIMEOUT = 15
_PM25_PARAM_ID = 2
_PM10_PARAM_ID = 1
_SEARCH_RADIUS_KM = 25


class OpenAQDataSource(DataSource):
    """Nearest-station PM2.5/PM10 from OpenAQ v3."""

    @property
    def source_name(self) -> str:
        return "OpenAQ"

    @property
    def provided_features(self) -> List[str]:
        return ["openaq_pm25", "openaq_pm10"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        station_id = self._nearest_station(lat, lon)
        if station_id is None:
            logger.debug("OpenAQ: no station within %skm of (%s,%s)", _SEARCH_RADIUS_KM, lat, lon)
            return {}
        return self._daily_means(station_id, date)

    # ------------------------------------------------------------------ #

    def _nearest_station(self, lat: float, lon: float) -> Optional[int]:
        """Return the closest station id with PM2.5 measurements, or None."""
        try:
            r = requests.get(
                f"{_BASE}/locations",
                params={
                    "coordinates": f"{lat},{lon}",
                    "radius": _SEARCH_RADIUS_KM * 1000,
                    "parameters_id": _PM25_PARAM_ID,
                    "limit": 5,
                },
                timeout=_TIMEOUT,
                headers={"User-Agent": "Mframapa/2.0"},
            )
            r.raise_for_status()
            results = r.json().get("results", [])
            if results:
                return results[0]["id"]
        except Exception as exc:
            logger.debug("OpenAQ station lookup failed: %s", exc)
        return None

    def _daily_means(self, location_id: int, date: str) -> Dict[str, Any]:
        """Fetch hourly measurements for the date and return daily means."""
        date_from = f"{date}T00:00:00Z"
        date_to   = f"{date}T23:59:59Z"

        readings: Dict[int, List[float]] = {_PM25_PARAM_ID: [], _PM10_PARAM_ID: []}

        for param_id in (_PM25_PARAM_ID, _PM10_PARAM_ID):
            try:
                r = requests.get(
                    f"{_BASE}/measurements",
                    params={
                        "location_id": location_id,
                        "parameters_id": param_id,
                        "date_from": date_from,
                        "date_to": date_to,
                        "limit": 100,
                    },
                    timeout=_TIMEOUT,
                    headers={"User-Agent": "Mframapa/2.0"},
                )
                r.raise_for_status()
                for m in r.json().get("results", []):
                    v = m.get("value")
                    if v is not None and float(v) >= 0:
                        readings[param_id].append(float(v))
                time.sleep(0.1)
            except Exception as exc:
                logger.debug("OpenAQ measurements fetch failed (param %s): %s", param_id, exc)

        result: Dict[str, Any] = {}
        if readings[_PM25_PARAM_ID]:
            result["openaq_pm25"] = round(sum(readings[_PM25_PARAM_ID]) / len(readings[_PM25_PARAM_ID]), 3)
        if readings[_PM10_PARAM_ID]:
            result["openaq_pm10"] = round(sum(readings[_PM10_PARAM_ID]) / len(readings[_PM10_PARAM_ID]), 3)
        return result

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"OpenAQ: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"OpenAQ: longitude {lon} out of range")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"OpenAQ: invalid date '{date}' — expected YYYY-MM-DD")
