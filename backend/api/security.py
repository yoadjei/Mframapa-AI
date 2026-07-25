"""
authentication and tiered rate limiting.

callers identify themselves either as a signed-in app user (supabase bearer token)
or as an api customer (issued key). limits are applied per identity — per user id
for app users, per key for api customers — so one shared credential can't throttle
everybody. sliding-window (redis zset) for most tiers, token-bucket burst for
institutional batch jobs. redis is primary with an in-memory fallback so local dev
and tests run without it. credentials come from the environment or the key registry
— never hardcoded, never accepted on prefix alone.
"""

import os
import time
import uuid
from threading import Lock
from typing import Any, Dict, List, Optional, Tuple

from fastapi import Depends, HTTPException, Request, Security
from fastapi.security.api_key import APIKeyHeader, APIKeyQuery
from fastapi.security.http import HTTPAuthorizationCredentials, HTTPBearer

from backend.api.auth import tier_for_api_key, verify_supabase_jwt

# tier -> (limit, window_seconds)
#
# app screens fan out on mount (the playback and map screens fire several
# requests at once), and in much of the continent a whole office, campus or
# cafe shares one ip. a flat per-minute window turns both of those into 429s
# for ordinary users. the user-facing tiers are therefore token buckets: the
# limit below is the burst capacity, refilled at limit/window. bursts pass,
# sustained scraping still stops, and the cost ceiling is the refill rate
# rather than the burst.
_TIER_LIMITS: Dict[str, Tuple[int, int]] = {
    "internal": (1000, 60),      # 1000/min
    "institutional": (100, 1),   # 100/sec, plus burst below
    "researcher": (600, 60),     # burst 600, refills 600/min — paid app users
    "free": (240, 60),           # burst 240, refills 240/min — signed-in app users
    "anonymous": (120, 60),      # burst 120, refills 120/min per ip
}
_INSTITUTIONAL_BURST = 500       # token-bucket capacity for batch spikes
# tiers whose traffic is human and bursty; the rest keep a strict window.
_BURSTY_TIERS = ("anonymous", "free", "researcher")

API_KEY_NAME = "X-API-Key"
_api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
_api_key_query = APIKeyQuery(name="api_key", auto_error=False)
_bearer_scheme = HTTPBearer(auto_error=False)

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
    # registry-backed: an unknown or revoked key is rejected, never accepted on prefix.
    return tier_for_api_key(key)


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
        if tier in _BURSTY_TIERS:
            return self._token_bucket(key, limit, limit / window)
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


def _identify(
    bearer: Optional[HTTPAuthorizationCredentials],
    header_key: Optional[str],
    query_key: Optional[str],
) -> Tuple[str, str]:
    """resolve the caller to (subject, tier).

    subject is what rate limits are counted against: the user id for app users,
    the key itself for api customers — so users never share one budget.
    """
    if bearer is not None and bearer.credentials:
        identity = verify_supabase_jwt(bearer.credentials)
        if identity is None:
            raise HTTPException(status_code=401, detail="Invalid or expired session")
        return f"user:{identity['user_id']}", identity["tier"]

    key = header_key or query_key
    if not key:
        raise HTTPException(status_code=401, detail="Authentication required")
    tier = _tier_for(key)
    if tier is None:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return f"key:{key}", tier


def verify_and_rate_limit(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
    header_key: str = Security(_api_key_header),
    query_key: str = Security(_api_key_query),
) -> str:
    # authenticate, then enforce the tier's rate limit per identity; returns the tier.
    subject, tier = _identify(bearer, header_key, query_key)
    allowed, retry_after = _limiter.check(subject, tier)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
    return tier


def _client_ip(request: Request) -> str:
    # behind cloudflare -> nginx, the real client ip is in these headers.
    return (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        or (request.client.host if request.client else "unknown")
    )


def authenticate_or_anonymous(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
    header_key: str = Security(_api_key_header),
    query_key: str = Security(_api_key_query),
) -> str:
    """public access: identified callers get their tier, everyone else is limited
    per-ip as 'anonymous'. an invalid credential is still rejected (never silently
    downgraded), so client auth bugs surface instead of hiding."""
    if (bearer and bearer.credentials) or header_key or query_key:
        subject, tier = _identify(bearer, header_key, query_key)   # 401 on bad credential
    else:
        subject, tier = f"ip:{_client_ip(request)}", "anonymous"
    allowed, retry_after = _limiter.check(subject, tier)
    if not allowed:
        raise HTTPException(
            status_code=429, detail="Rate limit exceeded",
            headers={"Retry-After": str(retry_after)},
        )
    return tier


def current_user_claims(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> Optional[Dict[str, Any]]:
    """full identity from the supabase bearer token, or None."""
    if not (bearer and bearer.credentials):
        return None
    return verify_supabase_jwt(bearer.credentials)


def current_user_id(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
) -> Optional[str]:
    """the signed-in user's id, or None for anonymous/api-key callers.

    authenticate_or_anonymous only yields a tier, which is all rate limiting
    needs. anything acting *on* a specific account (deleting it) needs to know
    exactly whose account it is, and must never fall back to a guess.
    """
    claims = current_user_claims(bearer)
    return claims.get("user_id") if claims else None


def current_tier(
    bearer: Optional[HTTPAuthorizationCredentials] = Security(_bearer_scheme),
    header_key: str = Security(_api_key_header),
    query_key: str = Security(_api_key_query),
) -> str:
    # resolve the tier for authz checks without consuming rate-limit budget.
    _, tier = _identify(bearer, header_key, query_key)
    return tier


def require_institutional(tier: str = Depends(current_tier)) -> str:
    if tier not in ("institutional", "internal"):
        raise HTTPException(status_code=403, detail="Institutional tier required")
    return tier


def require_internal(tier: str = Depends(current_tier)) -> str:
    # admin-only surface (e.g. metrics); only the internal key qualifies.
    if tier != "internal":
        raise HTTPException(status_code=403, detail="Internal access required")
    return tier

