"""
WorldPop population density connector.

Uses the WorldPop REST API (free, no auth required) to fetch
estimated population density (people/km²) for a given point.

API docs: https://www.worldpop.org/sdi/introapi
Dataset:  wpgp — Unconstrained global mosaic, 2020, 100m resolution

How it works:
    1. Build a small bounding-box GeoJSON around the point (±0.01°, ~1 km).
    2. POST to the WorldPop stats service requesting the mean pixel value.
    3. If the async job is still running, poll until complete (max 60 s).

Fallback:
    If the WorldPop API is unreachable, the orchestrator skips this source.
    The ML pipeline uses 0.0 as a safe default rather than crashing.
"""

import json
import logging
import time
from typing import Dict, Any, List, Optional

import requests

from .base import DataSource
from backend.utils.retry import with_retry

logger = logging.getLogger(__name__)

_STATS_URL   = "https://api.worldpop.org/v1/services/stats"
_TIMEOUT     = 30   # seconds per HTTP call
_POLL_MAX    = 10   # maximum poll attempts for async tasks
_POLL_SLEEP  = 5    # seconds between polls


class WorldPopDataSource(DataSource):
    """
    WorldPop REST API connector — no credentials required.
    Returns population density (people per km²) for any lat/lon.
    """

    @property
    def source_name(self) -> str:
        return "WorldPop"

    @property
    def provided_features(self) -> List[str]:
        return ["population_density"]

    @property
    def is_available(self) -> bool:
        return True   # always attempt — no credentials needed

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """
        Fetch WorldPop population density for the given point.
        date is accepted but ignored (WorldPop mosaic is for year 2020).
        """
        self._validate_inputs(lat, lon)
        density = self._query_worldpop(lat, lon)
        return {"population_density": density}

    # ------------------------------------------------------------------ #

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def _query_worldpop(self, lat: float, lon: float) -> Optional[float]:
        """
        Query WorldPop stats API with a 0.02° bounding box around the point.
        Handles both synchronous and asynchronous API responses.
        """
        delta = 0.01
        geojson = {
            "type": "Polygon",
            "coordinates": [[
                [lon - delta, lat - delta],
                [lon + delta, lat - delta],
                [lon + delta, lat + delta],
                [lon - delta, lat + delta],
                [lon - delta, lat - delta],
            ]]
        }

        params = {
            "dataset":    "wpgp",
            "version":    "2020",
            "geojson":    json.dumps(geojson),
            "stat":       "mean",
            "runasync":   "false",
        }

        try:
            resp = requests.get(_STATS_URL, params=params, timeout=_TIMEOUT)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            raise ConnectionError(f"WorldPop: API request failed — {e}") from e

        # Synchronous response
        if data.get("status") == "finished":
            return self._extract_mean(data)

        # Asynchronous response — poll the taskid URL
        taskid_url = data.get("data", {}).get("taskid")
        if taskid_url:
            return self._poll_async(taskid_url)

        logger.warning("WorldPop: unexpected response format: %s", data)
        return None

    def _poll_async(self, taskid_url: str) -> Optional[float]:
        """Poll a WorldPop async task URL until it finishes."""
        for attempt in range(_POLL_MAX):
            time.sleep(_POLL_SLEEP)
            try:
                resp = requests.get(taskid_url, timeout=_TIMEOUT)
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException as e:
                logger.warning("WorldPop: poll error — %s", e)
                continue

            if data.get("status") == "finished":
                return self._extract_mean(data)

            logger.debug(
                "WorldPop: task still running (attempt %d/%d)", attempt + 1, _POLL_MAX
            )

        logger.warning("WorldPop: async task did not finish within %d polls", _POLL_MAX)
        return None

    @staticmethod
    def _extract_mean(data: dict) -> Optional[float]:
        """Pull the mean population density value from an API response."""
        try:
            stats = data["data"]["statistic"]
            for item in stats:
                if item.get("statistic") == "mean":
                    value = float(item["value"])
                    return round(value, 2)
        except (KeyError, TypeError, ValueError) as e:
            logger.warning("WorldPop: could not parse response: %s | %s", data, e)
        return None

    @staticmethod
    def _validate_inputs(lat: float, lon: float) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"WorldPop: latitude {lat} out of range [-90, 90]")
        if not (-180 <= lon <= 180):
            raise ValueError(f"WorldPop: longitude {lon} out of range [-180, 180]")
