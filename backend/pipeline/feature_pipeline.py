"""
FeaturePipeline — assembles all ~20 model features for a given point/date.

Feature groups
──────────────
Dynamic (weather + air quality)  →  DataOrchestrator.get_features()   [6h cache]
    pblh, temperature_2m, relative_humidity, u/v_component_of_wind_10m,
    no2_tropospheric_column, so2_total_column, co_total_column,
    aerosol_optical_depth, pm10_surface, pm25_surface

Static demographic               →  WorldPopDataSource   [30d cache]
    population_density  (people/km², WorldPop 2020)

Static terrain                   →  SRTMDataSource       [30d cache]
    elevation  (metres, SRTM 90m via OpenTopoData)

Temporal (derived)               →  date string
    day_of_year  (1–366), month  (1–12)

The three external groups are fetched in parallel and memoised in Redis keyed by
~1km-rounded location: static features live for 30 days, dynamic ones for 6 hours.
A finite set of queried cities means almost every request is a warm (sub-second)
lookup; Redis being down just degrades to a parallel live fetch.
"""

import logging
from concurrent.futures import ThreadPoolExecutor
from datetime import date as _date
from typing import Dict, Any

from backend.cache.redis_cache import RedisCache
from backend.data_sources.orchestrator import DataOrchestrator
from backend.data_sources.worldpop import WorldPopDataSource
from backend.data_sources.srtm import SRTMDataSource

logger = logging.getLogger(__name__)

_STATIC_TTL  = 30 * 24 * 3600   # population + elevation never change
_DYNAMIC_TTL = 6 * 3600         # weather / air quality refresh intra-day

# Features the ML models expect — used for validation
_REQUIRED_FEATURES = {
    "pblh", "temperature_2m", "relative_humidity",
    "u_component_of_wind_10m", "v_component_of_wind_10m",
    "no2_tropospheric_column", "aerosol_optical_depth",
    "population_density", "elevation",
    "day_of_year", "month",
}


class FeaturePipeline:
    """Assembles model features, fetching external sources in parallel with a Redis cache."""

    def __init__(self):
        self.orchestrator = DataOrchestrator()
        self.worldpop     = WorldPopDataSource()
        self.srtm         = SRTMDataSource()
        self.cache        = RedisCache()

    def get_features(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """Return all model features; unresolved ones are None."""
        logger.info("FeaturePipeline: extracting features for (%.4f, %.4f) on %s", lat, lon, date)
        latr, lonr = round(lat, 2), round(lon, 2)   # ~1km cache granularity
        k_dyn  = f"feat:dyn:{latr}:{lonr}:{date}"
        k_pop  = f"feat:pop:{latr}:{lonr}"
        k_elev = f"feat:elev:{latr}:{lonr}"

        dyn  = self.cache.get(k_dyn)
        pop  = self.cache.get(k_pop)
        elev = self.cache.get(k_elev)

        # fetch only the cache misses, concurrently
        with ThreadPoolExecutor(max_workers=3) as ex:
            f_dyn  = ex.submit(self.orchestrator.get_features, lat, lon, date) if dyn is None else None
            f_pop  = ex.submit(self._safe, self.worldpop, lat, lon, date, "population_density") if pop is None else None
            f_elev = ex.submit(self._safe, self.srtm, lat, lon, date, "elevation") if elev is None else None

            if f_dyn is not None:
                dyn = f_dyn.result()
                if dyn.get("temperature_2m") is not None:
                    self.cache.set(k_dyn, dyn, _DYNAMIC_TTL)
            if f_pop is not None:
                pop = f_pop.result()
                if pop.get("population_density") is not None:
                    self.cache.set(k_pop, pop, _STATIC_TTL)
            if f_elev is not None:
                elev = f_elev.result()
                if elev.get("elevation") is not None:
                    self.cache.set(k_elev, elev, _STATIC_TTL)

        all_features = {**(dyn or {}), **(pop or {}), **(elev or {}), **self._temporal(date)}
        self._validate_features(all_features)
        return all_features

    # ------------------------------------------------------------------ #

    @staticmethod
    def _safe(source, lat: float, lon: float, date: str, key: str) -> Dict[str, Any]:
        """Fetch a source, returning {key: None} instead of raising."""
        try:
            return source.fetch_data(lat, lon, date)
        except Exception as e:
            logger.warning("FeaturePipeline: %s failed — %s", getattr(source, "source_name", "source"), e)
            return {key: None}

    @staticmethod
    def _temporal(date: str) -> Dict[str, Any]:
        try:
            d = _date.fromisoformat(date)
            return {"day_of_year": float(d.timetuple().tm_yday), "month": float(d.month)}
        except Exception as e:
            logger.warning("FeaturePipeline: temporal features failed — %s", e)
            return {"day_of_year": None, "month": None}

    @staticmethod
    def _validate_features(features: Dict[str, Any]) -> None:
        missing = [f for f in _REQUIRED_FEATURES if features.get(f) is None]
        if missing:
            logger.warning("FeaturePipeline: %d required feature(s) are None: %s", len(missing), missing)
        else:
            logger.info("FeaturePipeline: all required features resolved.")
