"""
OSM Road Density data source.

Fetches zonal statistics or proxies for road density via Overpass API.
"""

import logging
from typing import Dict, Any, List, Optional
import requests
from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

class OSMRoadsDataSource(DataSource):
    """OSM Roads data source."""

    @property
    def source_name(self) -> str:
        return "OSM-Roads"

    @property
    def provided_features(self) -> List[str]:
        return ["road_density"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=10)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        # Placeholder for Overpass API query or pre-computed spatial join
        return {"road_density": 0.05}

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"OSMRoads: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"OSMRoads: longitude {lon} out of range")
