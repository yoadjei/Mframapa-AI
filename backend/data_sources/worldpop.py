"""
WorldPop population density connector.

Uses the WorldPop v2 REST API (free, no auth required) to fetch
estimated population density (people/km²) for a given point.

API:  https://api.worldpop.org/v2/
Data: WorldPop R2025A 2020 100m resolution mosaic

How it works:
    1. POST a small bbox GeoJSON to /v2/population (async task).
    2. Poll /v2/tasks/{task_id}/result until status is not pending.
    3. Extract population_density from the result.
"""

import logging
import time
from typing import Dict, Any, List, Optional

import requests

from .base import DataSource

logger = logging.getLogger(__name__)

_BASE         = "https://api.worldpop.org/v2"
_TIMEOUT      = 30
_POLL_MAX     = 12
_POLL_SLEEP   = 3


class WorldPopDataSource(DataSource):
    """WorldPop v2 REST API connector — no credentials required."""

    @property
    def source_name(self) -> str:
        return "WorldPop"

    @property
    def provided_features(self) -> List[str]:
        return ["population_density"]

    @property
    def is_available(self) -> bool:
        return True

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon)
        density = self._query(lat, lon)
        return {"population_density": density}

    def _query(self, lat: float, lon: float) -> Optional[float]:
        delta = 0.01
        payload = {
            "year": 2020,
            "geojson": {
                "type": "Polygon",
                "coordinates": [[
                    [lon - delta, lat - delta],
                    [lon + delta, lat - delta],
                    [lon + delta, lat + delta],
                    [lon - delta, lat + delta],
                    [lon - delta, lat - delta],
                ]],
            },
        }
        try:
            resp = requests.post(f"{_BASE}/population", json=payload, timeout=_TIMEOUT)
            resp.raise_for_status()
        except requests.RequestException as e:
            raise ConnectionError(f"WorldPop: submit failed — {e}") from e

        task_id = resp.json().get("task_id")
        if not task_id:
            logger.warning("WorldPop: no task_id in response: %s", resp.json())
            return None

        return self._poll(task_id)

    def _poll(self, task_id: str) -> Optional[float]:
        url = f"{_BASE}/tasks/{task_id}/result"
        for attempt in range(_POLL_MAX):
            time.sleep(_POLL_SLEEP)
            try:
                resp = requests.get(url, timeout=_TIMEOUT)
                if resp.status_code == 404:
                    logger.debug("WorldPop: task not ready yet (attempt %d)", attempt + 1)
                    continue
                resp.raise_for_status()
                data = resp.json()
            except requests.RequestException as e:
                logger.warning("WorldPop: poll error — %s", e)
                continue

            density = data.get("population_density")
            if density is not None:
                return round(float(density), 2)

        logger.warning("WorldPop: task did not complete within %d polls", _POLL_MAX)
        return None

    @staticmethod
    def _validate_inputs(lat: float, lon: float) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"WorldPop: latitude {lat} out of range [-90, 90]")
        if not (-180 <= lon <= 180):
            raise ValueError(f"WorldPop: longitude {lon} out of range [-180, 180]")
