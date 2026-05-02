"""
SRTM elevation connector via OpenTopoData (free, no auth required).

API: https://www.opentopodata.org/
Dataset: SRTM 90m (srtm90m)
"""

import logging
from typing import Dict, Any, List

import requests

from .base import DataSource

logger = logging.getLogger(__name__)

_API_URL = "https://api.opentopodata.org/v1/srtm90m"
_TIMEOUT = 30


class SRTMDataSource(DataSource):
    """OpenTopoData SRTM 90m elevation connector — no credentials required."""

    @property
    def source_name(self) -> str:
        return "SRTM"

    @property
    def provided_features(self) -> List[str]:
        return ["elevation"]

    @property
    def is_available(self) -> bool:
        return True

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """Fetch elevation for the given coordinates. date is ignored."""
        try:
            r = requests.get(
                _API_URL,
                params={"locations": f"{lat},{lon}"},
                timeout=_TIMEOUT,
            )
            r.raise_for_status()
            data = r.json()
            elevation = data["results"][0]["elevation"]
            return {"elevation": round(float(elevation), 1) if elevation is not None else None}
        except Exception as e:
            logger.warning("Failed to fetch SRTM data: %s", e)
            return {"elevation": None}
