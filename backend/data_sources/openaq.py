"""
OpenAQ data source for ground truth calibration.

Fetches PM2.5/PM10 from reference monitors in OpenAQ.
"""

import logging
from typing import Dict, Any, List, Optional
import requests
from backend.utils.retry import with_retry
from .base import DataSource

logger = logging.getLogger(__name__)

class OpenAQDataSource(DataSource):
    """OpenAQ data source."""

    @property
    def source_name(self) -> str:
        return "OpenAQ"

    @property
    def provided_features(self) -> List[str]:
        return ["openaq_pm25", "openaq_pm10"]

    @property
    def is_available(self) -> bool:
        return True

    @with_retry(max_attempts=3, backoff_factor=2, timeout=10)
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        self._validate_inputs(lat, lon, date)
        # Placeholder for OpenAQ API request
        return {
            "openaq_pm25": 12.0,
            "openaq_pm10": 18.0
        }

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"OpenAQ: latitude {lat} out of range")
        if not (-180 <= lon <= 180):
            raise ValueError(f"OpenAQ: longitude {lon} out of range")
