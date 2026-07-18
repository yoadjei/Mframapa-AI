"""
Redis cache backend.

Connects to Upstash (or any Redis-compatible server) via REDIS_URL env var.
Falls back gracefully when Redis is unavailable — the caller must check
`is_available` before use, or rely on CacheManager to handle the fallback.
"""

import json
import logging
import os
from typing import Any, Dict, Optional

from .base import BaseCache

try:
    import redis
except ImportError:
    redis = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class RedisCache(BaseCache):
    """Redis-backed cache using redis-py."""

    def __init__(self):
        self._client = None
        url = os.environ.get("REDIS_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
        if url and redis is not None:
            try:
                # short timeouts: a cache must never block the request path if redis
                # is slow/unreachable — ops fail fast and the caller degrades to a live fetch.
                self._client = redis.from_url(
                    url, decode_responses=True,
                    socket_connect_timeout=2, socket_timeout=2,
                )
            except Exception as e:
                logger.warning("Failed to connect to Redis: %s", e)

    @property
    def is_available(self) -> bool:
        if self._client is None:
            return False
        try:
            return bool(self._client.ping())   # actually verify reachability (2s-bounded)
        except Exception:
            return False

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        if not self.is_available:
            return None
        try:
            raw = self._client.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as e:
            logger.warning("Redis GET failed: %s", e)
            return None

    def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> None:
        if not self.is_available:
            return
        try:
            self._client.setex(key, ttl_seconds, json.dumps(value))
        except Exception as e:
            logger.warning("Redis SET failed: %s", e)

    def invalidate(self, key: str) -> None:
        if not self.is_available:
            return
        try:
            self._client.delete(key)
        except Exception as e:
            logger.warning("Redis DELETE failed: %s", e)
