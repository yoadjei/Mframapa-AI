"""
Tests for the caching layer:
  - RedisCache
  - SQLiteCache
  - CacheManager (Redis → SQLite fallback)
  - CachedOrchestrator (transparent caching wrapper)
"""

import os
import pytest
from unittest.mock import patch, MagicMock

from backend.cache.redis_cache   import RedisCache
from backend.cache.sqlite_cache  import SQLiteCache
from backend.cache.cache_manager import CacheManager, CachedOrchestrator

ACCRA  = {"lat": 5.6037, "lon": -0.1870, "date": "2024-06-01"}
SAMPLE = {"temperature_2m": 28.5, "pblh": 850.0, "aerosol_optical_depth": 0.31}


# ═══════════════════════════════════════════════════════════════════════
# RedisCache
# ═══════════════════════════════════════════════════════════════════════

class TestRedisCache:

    @patch("backend.cache.redis_cache.redis.from_url")
    def test_available_with_url(self, mock_from_url):
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            cache = RedisCache()
        assert cache.is_available is True

    def test_not_available_without_url(self):
        env = {k: v for k, v in os.environ.items()
               if k not in ("REDIS_URL", "UPSTASH_REDIS_REST_URL")}
        with patch.dict(os.environ, env, clear=True):
            cache = RedisCache()
        assert cache.is_available is False

    @patch("backend.cache.redis_cache.redis.from_url")
    def test_set_calls_setex(self, mock_from_url):
        mock_client = MagicMock()
        mock_from_url.return_value = mock_client
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            cache = RedisCache()
        cache.set("k1", SAMPLE, ttl_seconds=3600)
        mock_client.setex.assert_called_once()

    @patch("backend.cache.redis_cache.redis.from_url")
    def test_get_returns_deserialized_dict(self, mock_from_url):
        import json
        mock_client = MagicMock()
        mock_client.get.return_value = json.dumps(SAMPLE)
        mock_from_url.return_value = mock_client
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            cache = RedisCache()
        assert cache.get("k1") == SAMPLE

    @patch("backend.cache.redis_cache.redis.from_url")
    def test_get_returns_none_on_miss(self, mock_from_url):
        mock_client = MagicMock()
        mock_client.get.return_value = None
        mock_from_url.return_value = mock_client
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            cache = RedisCache()
        assert cache.get("missing_key") is None

    @patch("backend.cache.redis_cache.redis.from_url")
    def test_invalidate_calls_delete(self, mock_from_url):
        mock_client = MagicMock()
        mock_from_url.return_value = mock_client
        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            cache = RedisCache()
        cache.invalidate("k1")
        mock_client.delete.assert_called_once_with("k1")

    def test_get_returns_none_when_unavailable(self):
        env = {k: v for k, v in os.environ.items()
               if k not in ("REDIS_URL", "UPSTASH_REDIS_REST_URL")}
        with patch.dict(os.environ, env, clear=True):
            cache = RedisCache()
        assert cache.get("key") is None


# ═══════════════════════════════════════════════════════════════════════
# SQLiteCache
# ═══════════════════════════════════════════════════════════════════════

class TestSQLiteCache:

    def test_is_always_available(self, tmp_path):
        assert SQLiteCache(db_path=str(tmp_path / "c.db")).is_available is True

    def test_set_and_get(self, tmp_path):
        cache = SQLiteCache(db_path=str(tmp_path / "c.db"))
        cache.set("k1", SAMPLE, ttl_seconds=60)
        assert cache.get("k1") == SAMPLE

    def test_get_returns_none_on_miss(self, tmp_path):
        assert SQLiteCache(db_path=str(tmp_path / "c.db")).get("no_such_key") is None

    def test_invalidate_removes_entry(self, tmp_path):
        cache = SQLiteCache(db_path=str(tmp_path / "c.db"))
        cache.set("k1", SAMPLE, ttl_seconds=60)
        cache.invalidate("k1")
        assert cache.get("k1") is None

    def test_expired_entry_returns_none(self, tmp_path):
        cache = SQLiteCache(db_path=str(tmp_path / "c.db"))
        cache.set("k1", SAMPLE, ttl_seconds=-1)   # already expired
        assert cache.get("k1") is None

    def test_replace_overwrites_existing(self, tmp_path):
        cache = SQLiteCache(db_path=str(tmp_path / "c.db"))
        cache.set("k1", {"x": 1}, ttl_seconds=60)
        cache.set("k1", {"x": 99}, ttl_seconds=60)
        assert cache.get("k1") == {"x": 99}

    def test_multiple_keys_independent(self, tmp_path):
        cache = SQLiteCache(db_path=str(tmp_path / "c.db"))
        cache.set("ka", {"a": 1}, ttl_seconds=60)
        cache.set("kb", {"b": 2}, ttl_seconds=60)
        assert cache.get("ka") == {"a": 1}
        assert cache.get("kb") == {"b": 2}


# ═══════════════════════════════════════════════════════════════════════
# CacheManager
# ═══════════════════════════════════════════════════════════════════════

class TestCacheManager:

    def _manager(self, tmp_path, redis_available=False):
        sqlite = SQLiteCache(db_path=str(tmp_path / "c.db"))
        redis  = MagicMock(spec=RedisCache)
        redis.is_available = redis_available
        return CacheManager(redis=redis, sqlite=sqlite), redis

    def test_miss_returns_none(self, tmp_path):
        mgr, _ = self._manager(tmp_path)
        assert mgr.get(**ACCRA) is None

    def test_set_and_get_via_sqlite(self, tmp_path):
        mgr, _ = self._manager(tmp_path, redis_available=False)
        mgr.set(**ACCRA, value=SAMPLE)
        assert mgr.get(**ACCRA) == SAMPLE

    def test_redis_hit_skips_sqlite(self, tmp_path):
        mgr, mock_redis = self._manager(tmp_path, redis_available=True)
        mock_redis.get.return_value = SAMPLE
        result = mgr.get(**ACCRA)
        assert result == SAMPLE
        assert mgr._sqlite.get(
            f"mframapa:v1:features:{ACCRA['lat']:.2f}:{ACCRA['lon']:.2f}:{ACCRA['date']}"
        ) is None

    def test_sqlite_fallback_when_redis_miss(self, tmp_path):
        mgr, mock_redis = self._manager(tmp_path, redis_available=True)
        mock_redis.get.return_value = None
        mgr.set(**ACCRA, value=SAMPLE)
        mock_redis.get.return_value = None   # simulate Redis miss on read
        assert mgr.get(**ACCRA) == SAMPLE

    def test_set_writes_to_redis_when_available(self, tmp_path):
        mgr, mock_redis = self._manager(tmp_path, redis_available=True)
        mgr.set(**ACCRA, value=SAMPLE)
        mock_redis.set.assert_called_once()

    def test_invalidate_clears_entry(self, tmp_path):
        mgr, _ = self._manager(tmp_path)
        mgr.set(**ACCRA, value=SAMPLE)
        mgr.invalidate(**ACCRA)
        assert mgr.get(**ACCRA) is None

    def test_ttl_historical_date_is_longer(self, tmp_path):
        from backend.cache.cache_manager import _ttl_for_date
        assert _ttl_for_date("2020-01-01") == 7 * 24 * 3600
        assert _ttl_for_date("2099-12-31") == 6 * 3600


# ═══════════════════════════════════════════════════════════════════════
# CachedOrchestrator
# ═══════════════════════════════════════════════════════════════════════

class TestCachedOrchestrator:

    def _cached_orch(self, tmp_path):
        sqlite = SQLiteCache(db_path=str(tmp_path / "c.db"))
        redis  = MagicMock(spec=RedisCache)
        redis.is_available = False
        cache  = CacheManager(redis=redis, sqlite=sqlite)

        mock_orch = MagicMock()
        mock_orch.get_features.return_value = SAMPLE
        mock_orch.reliability_scores = {"ERA5": 1.0}

        with patch("backend.cache.cache_manager.DataOrchestrator",
                   return_value=mock_orch):
            co = CachedOrchestrator(cache=cache)

        return co, mock_orch

    def test_cache_miss_calls_orchestrator(self, tmp_path):
        co, mock_orch = self._cached_orch(tmp_path)
        result = co.get_features(**ACCRA)
        assert result == SAMPLE
        mock_orch.get_features.assert_called_once()

    def test_cache_hit_skips_orchestrator(self, tmp_path):
        co, mock_orch = self._cached_orch(tmp_path)
        co.get_features(**ACCRA)   # populates cache
        co.get_features(**ACCRA)   # should hit cache
        assert mock_orch.get_features.call_count == 1

    def test_result_stored_after_fetch(self, tmp_path):
        co, _ = self._cached_orch(tmp_path)
        co.get_features(**ACCRA)
        assert co.cache.get(**ACCRA) == SAMPLE

    def test_invalidate_forces_refetch(self, tmp_path):
        co, mock_orch = self._cached_orch(tmp_path)
        co.get_features(**ACCRA)
        co.invalidate(**ACCRA)
        co.get_features(**ACCRA)
        assert mock_orch.get_features.call_count == 2
