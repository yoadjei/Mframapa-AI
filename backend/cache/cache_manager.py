"""
CacheManager — unified Redis → SQLite fallback interface.
CachedOrchestrator — wraps DataOrchestrator with transparent caching.

Key format:  mframapa:v1:features:{lat:.2f}:{lon:.2f}:{date}
  lat/lon are rounded to 2 d.p. (~1.1 km precision) to maximise cache hits
  across nearby requests.

TTL strategy:
  Historical (> 2 days ago) : 7 days   — satellite data is stable
  Recent    (0–2 days old)  : 6 hours  — may still be updated
  Default                   : 6 hours
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from .redis_cache  import RedisCache
from .sqlite_cache import SQLiteCache
from .base         import BaseCache
from backend.data_sources.orchestrator import DataOrchestrator

logger = logging.getLogger(__name__)

_KEY_PREFIX = "mframapa:v1:features"
_TTL_RECENT_SECONDS      = 6 * 3600        # 6 hours
_TTL_HISTORICAL_SECONDS  = 7 * 24 * 3600   # 7 days


def _build_key(lat: float, lon: float, date: str) -> str:
    return f"{_KEY_PREFIX}:{lat:.2f}:{lon:.2f}:{date}"


def _ttl_for_date(date: str) -> int:
    """Return appropriate TTL based on how old the date is."""
    try:
        d = datetime.strptime(date, "%Y-%m-%d").date()
        age_days = (datetime.utcnow().date() - d).days
        return _TTL_HISTORICAL_SECONDS if age_days > 2 else _TTL_RECENT_SECONDS
    except ValueError:
        return _TTL_RECENT_SECONDS


class CacheManager:
    """
    Unified cache interface: tries Redis first, falls back to SQLite.
    Both backends implement BaseCache so they're interchangeable.
    """

    def __init__(self, redis: Optional[RedisCache] = None, sqlite: Optional[SQLiteCache] = None):
        self._redis  = redis  or RedisCache()
        self._sqlite = sqlite or SQLiteCache()

    # ------------------------------------------------------------------ #

    def get(self, lat: float, lon: float, date: str) -> Optional[Dict[str, Any]]:
        key = _build_key(lat, lon, date)

        # 1. Try Redis
        if self._redis.is_available:
            value = self._redis.get(key)
            if value is not None:
                logger.debug("Cache HIT (Redis): %s", key)
                return value

        # 2. Fall back to SQLite
        value = self._sqlite.get(key)
        if value is not None:
            logger.debug("Cache HIT (SQLite): %s", key)
            # Promote back into Redis so it's faster next time
            if self._redis.is_available:
                self._redis.set(key, value, ttl_seconds=_ttl_for_date(date))
            return value

        logger.debug("Cache MISS: %s", key)
        return None

    def set(self, lat: float, lon: float, date: str, value: Dict[str, Any]) -> None:
        key = _build_key(lat, lon, date)
        ttl = _ttl_for_date(date)

        if self._redis.is_available:
            self._redis.set(key, value, ttl_seconds=ttl)

        self._sqlite.set(key, value, ttl_seconds=ttl)
        logger.debug("Cache SET: %s (TTL %ds)", key, ttl)

    def invalidate(self, lat: float, lon: float, date: str) -> None:
        key = _build_key(lat, lon, date)
        if self._redis.is_available:
            self._redis.invalidate(key)
        self._sqlite.invalidate(key)
        logger.info("Cache INVALIDATED: %s", key)

    def invalidate_all(self) -> None:
        """Wipe the entire SQLite cache (Redis requires FLUSHDB — use manually)."""
        import sqlite3
        try:
            with sqlite3.connect(self._sqlite.db_path) as conn:
                conn.execute("DELETE FROM cache")
            logger.info("SQLite cache cleared.")
        except Exception as e:
            logger.warning("Could not clear SQLite cache: %s", e)

    @property
    def redis_available(self) -> bool:
        return self._redis.is_available


class CachedOrchestrator:
    """
    Drop-in replacement for DataOrchestrator that transparently caches
    results in Redis (with SQLite fallback).

    Usage:
        orch = CachedOrchestrator()
        features = orch.get_features(lat=5.6037, lon=-0.1870, date="2024-06-01")
    """

    def __init__(self, cache: Optional[CacheManager] = None):
        self._orchestrator = DataOrchestrator()
        self._cache        = cache or CacheManager()

    def get_features(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """
        Return features for a point/date. Checks cache first;
        on miss, fetches from data sources and stores the result.
        """
        cached = self._cache.get(lat, lon, date)
        if cached is not None:
            return cached

        logger.info(
            "CachedOrchestrator: cache miss for (%.4f, %.4f, %s) — fetching from sources",
            lat, lon, date,
        )
        features = self._orchestrator.get_features(lat, lon, date)
        self._cache.set(lat, lon, date, features)
        return features

    def invalidate(self, lat: float, lon: float, date: str) -> None:
        self._cache.invalidate(lat, lon, date)

    @property
    def reliability_scores(self) -> Dict[str, float]:
        return self._orchestrator.reliability_scores

    @property
    def cache(self) -> CacheManager:
        return self._cache
