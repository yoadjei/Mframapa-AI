"""
api key verification and tiered rate limiting.

sliding-window (redis zset) limits for the internal and public tiers, and a
token-bucket burst for the institutional tier so batch jobs can spike. redis is
primary with an in-memory fallback so local dev and tests run without it. keys
come from the environment — never hardcoded.
"""

import os
import time
import uuid
from threading import Lock
from typing import Dict, List, Optional, Tuple

from fastapi import Depends, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader, APIKeyQuery

PUBLIC_KEY_PREFIX = "mframapa-pub-"
INSTITUTIONAL_KEY_PREFIX = "mframapa-inst-"

# tier -> (limit, window_seconds)
_TIER_LIMITS: Dict[str, Tuple[int, int]] = {
    "internal": (1000, 60),      # 1000/min
    "institutional": (100, 1),   # 100/sec, plus burst below
    "public": (10, 60),          # 10/min
}
_INSTITUTIONAL_BURST = 500       # token-bucket capacity for batch spikes

API_KEY_NAME = "X-API-Key"
_api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
_api_key_query = APIKeyQuery(name="api_key", auto_error=False)

# atomic token-bucket refill/consume (avoids read-modify-write races across workers).
_BUCKET_LUA = """
local d = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(d[1])
local ts = tonumber(d[2])
local cap = tonumber(ARGV[1])
local rate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
if tokens == nil then tokens = cap; ts = now end
tokens = math.min(cap, tokens + (now - ts) * rate)
local allowed = 0
if tokens >= 1 then tokens = tokens - 1; allowed = 1 end
redis.call('HMSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.ceil(cap / rate) + 1)
return {allowed, tostring(tokens)}
"""


def _internal_key() -> Optional[str]:
    return os.getenv("MFRAMAPA_INTERNAL_KEY")


def _tier_for(key: str) -> Optional[str]:
    internal = _internal_key()
    if internal and key == internal:
        return "internal"
    if key.startswith(INSTITUTIONAL_KEY_PREFIX):
        return "institutional"
    if key.startswith(PUBLIC_KEY_PREFIX):
        return "public"
    return None


class RateLimiter:
    """redis-backed limiter with an in-memory fallback."""

    def __init__(self) -> None:
        self._mem_windows: Dict[str, List[float]] = {}
        self._mem_buckets: Dict[str, Tuple[float, float]] = {}
        self._lock = Lock()

    @staticmethod
    def _redis():
        try:
            from backend.cache.redis_cache import RedisCache
            rc = RedisCache()
            return rc._client if rc.is_available else None
        except Exception:
            return None

    def check(self, key: str, tier: str) -> Tuple[bool, int]:
        limit, window = _TIER_LIMITS[tier]
        if tier == "institutional":
            return self._token_bucket(key, _INSTITUTIONAL_BURST, limit / window)
        return self._sliding_window(key, limit, window)

    def _sliding_window(self, key: str, limit: int, window: int) -> Tuple[bool, int]:
        now = time.time()
        client = self._redis()
        if client is not None:
            try:
                rkey = f"ratelimit:sw:{key}"
                client.zremrangebyscore(rkey, 0, now - window)
                if client.zcard(rkey) >= limit:
                    oldest = client.zrange(rkey, 0, 0, withscores=True)
                    return False, _retry_after(oldest, now, window)
                client.zadd(rkey, {f"{now:.6f}:{uuid.uuid4().hex}": now})
                client.expire(rkey, window + 1)
                return True, 0
            except Exception:
                pass  # fall through to in-memory
        with self._lock:
            hits = [t for t in self._mem_windows.get(key, []) if now - t < window]
            if len(hits) >= limit:
                self._mem_windows[key] = hits
                return False, max(1, int(window - (now - hits[0])) + 1)
            hits.append(now)
            self._mem_windows[key] = hits
            return True, 0

    def _token_bucket(self, key: str, capacity: int, rate: float) -> Tuple[bool, int]:
        now = time.time()
        client = self._redis()
        if client is not None:
            try:
                allowed, _ = client.eval(_BUCKET_LUA, 1, f"ratelimit:tb:{key}", capacity, rate, now)
                return (bool(int(allowed)), 0 if int(allowed) else 1)
            except Exception:
                pass
        with self._lock:
            tokens, last = self._mem_buckets.get(key, (float(capacity), now))
            tokens = min(capacity, tokens + (now - last) * rate)
            if tokens < 1.0:
                self._mem_buckets[key] = (tokens, now)
                return False, max(1, int((1.0 - tokens) / rate) + 1)
            self._mem_buckets[key] = (tokens - 1.0, now)
            return True, 0


def _retry_after(oldest_with_scores, now: float, window: int) -> int:
    # seconds until the window frees a slot, from the oldest entry's score.
    if oldest_with_scores:
        _, score = oldest_with_scores[0]
        return max(1, int(window - (now - float(score))) + 1)
    return window


_limiter = RateLimiter()


def get_api_key(
    header_key: str = Security(_api_key_header),
    query_key: str = Security(_api_key_query),
) -> str:
    key = header_key or query_key
    if not key:
        raise HTTPException(status_code=401, detail="API Key required")
    return key


def verify_and_rate_limit(key: str = Security(get_api_key)) -> str:
    # verify the key's tier and enforce its rate limit; returns the tier name.
    tier = _tier_for(key)
    if tier is None:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    allowed, retry_after = _limiter.check(key, tier)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
    return tier


def current_tier(key: str = Security(get_api_key)) -> str:
    # resolve the tier for authz checks without consuming rate-limit budget.
    tier = _tier_for(key)
    if tier is None:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return tier


def require_institutional(tier: str = Depends(current_tier)) -> str:
    if tier not in ("institutional", "internal"):
        raise HTTPException(status_code=403, detail="Institutional tier required")
    return tier
