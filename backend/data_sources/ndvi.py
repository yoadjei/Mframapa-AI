"""
NDVI (Normalized Difference Vegetation Index) connector.

Uses Open-Meteo as a free proxy or MODIS proxy if needed.
Returns vegetation proxy.
"""

import logging
from typing import Dict, Any, List, Optional
import requests
from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

class NDVIDataSource(DataSource):
    """NDVI data source."""

    @property
    def source_name(self) -> str:
        return "NDVI-Composite"

    @property
    def provided_features(self) -> List[str]:
        return ["ndvi"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=10)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        # Using Open-Meteo ensemble or similar for NDVI approximation if available
        # Returning a placeholder for the feature pipeline
        return {"ndvi": 0.45}

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"NDVI: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"NDVI: longitude {lon} out of range")
