"""
VIIRS Night Lights (DNB) data source.

Fetches night light composite data for activity proxy modeling.
"""

import logging
from typing import Dict, Any, List, Optional
import requests
from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

class NightLightsDataSource(DataSource):
    """VIIRS Night Lights data source."""

    @property
    def source_name(self) -> str:
        return "VIIRS-NightLights"

    @property
    def provided_features(self) -> List[str]:
        return ["night_lights"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=10)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        # Placeholder for the actual VIIRS DNB request or pre-computed proxy
        return {"night_lights": 12.5}

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"NightLights: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"NightLights: longitude {lon} out of range")
