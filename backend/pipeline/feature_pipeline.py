"""
FeaturePipeline — assembles all ~20 model features for a given point/date.

Feature groups
──────────────
Dynamic (satellite + reanalysis)  →  DataOrchestrator.get_features()
    pblh, temperature_2m, relative_humidity,
    u/v_component_of_wind_10m,
    no2_tropospheric_column, so2_total_column, co_total_column,
    aerosol_optical_depth, pm10_surface, pm25_surface

Static demographic                →  WorldPopDataSource
    population_density  (people/km², WorldPop 2020)

Static terrain                    →  SRTMDataSource
    elevation  (metres, SRTM 90m via OpenTopoData)

Temporal (derived)                →  date string
    day_of_year  (1–366), month  (1–12)
"""

import logging
from datetime import date as _date
from typing import Dict, Any

from backend.data_sources.orchestrator import DataOrchestrator
from backend.data_sources.worldpop import WorldPopDataSource
from backend.data_sources.srtm import SRTMDataSource

logger = logging.getLogger(__name__)

# Features the ML models expect — used for validation
_REQUIRED_FEATURES = {
    "pblh", "temperature_2m", "relative_humidity",
    "u_component_of_wind_10m", "v_component_of_wind_10m",
    "no2_tropospheric_column", "aerosol_optical_depth",
    "population_density", "elevation",
    "day_of_year", "month",
}


class FeaturePipeline:
    """
    Unified feature enrichment pipeline.
    Combines meteorological/satellite data from the Orchestrator with
    static demographic and terrain features.
    """

    def __init__(self):
        self.orchestrator = DataOrchestrator()
        self.worldpop     = WorldPopDataSource()
        self.srtm         = SRTMDataSource()

    def get_features(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """
        Fetch all features required by the ML models.

        Returns a dict with all available features; missing ones are None.
        Logs warnings for any features that could not be resolved.
        """
        logger.info("FeaturePipeline: extracting features for (%.4f, %.4f) on %s", lat, lon, date)

        # 1. Dynamic: weather + satellite via orchestrator (with fallback)
        dynamic_features = self.orchestrator.get_features(lat, lon, date)

        # 2. Static demographic: population density
        try:
            pop_features = self.worldpop.fetch_data(lat, lon, date)
        except Exception as e:
            logger.warning("FeaturePipeline: WorldPop failed — %s", e)
            pop_features = {"population_density": None}

        # 3. Static terrain: elevation
        try:
            terrain_features = self.srtm.fetch_data(lat, lon, date)
        except Exception as e:
            logger.warning("FeaturePipeline: SRTM failed — %s", e)
            terrain_features = {"elevation": None}

        # 4. Temporal: derived directly from date string — no external call needed
        #    (ndvi + night_lights come from the static grid at the router layer)
        try:
            d = _date.fromisoformat(date)
            temporal_features: Dict[str, Any] = {
                "day_of_year": float(d.timetuple().tm_yday),
                "month": float(d.month),
            }
        except Exception as e:
            logger.warning("FeaturePipeline: temporal features failed — %s", e)
            temporal_features = {"day_of_year": None, "month": None}

        all_features = {**dynamic_features, **pop_features, **terrain_features, **temporal_features}
        self._validate_features(all_features)
        return all_features

    # ------------------------------------------------------------------ #

    @staticmethod
    def _validate_features(features: Dict[str, Any]) -> None:
        """Log warnings for any required features that are missing or None."""
        missing = [f for f in _REQUIRED_FEATURES if features.get(f) is None]
        if missing:
            logger.warning(
                "FeaturePipeline: %d required feature(s) are None: %s",
                len(missing), missing,
            )
        else:
            logger.info("FeaturePipeline: all required features resolved.")
