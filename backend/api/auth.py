"""identity for the api: supabase user tokens and issued api keys.

two ways to authenticate:

  app users        Authorization: Bearer <supabase access token>
                   verified against supabase's published public keys (ES256/RS256 via
                   JWKS, fetched once and cached) — no shared secret lives on this
                   server. legacy HS256 projects still work if SUPABASE_JWT_SECRET is
                   set. tier comes from the token's app_metadata, set server-side by
                   the billing webhook, so a client cannot grant itself a paid tier.

                   configure with SUPABASE_URL (jwks url is derived from it).

  api customers    X-API-Key: <issued key>
                   looked up in a redis registry, so keys are revocable per client.
                   the internal key still comes from the environment.

keys are never accepted on prefix alone — an unknown key is rejected.
"""

from __future__ import annotations

import logging
import os
import secrets
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

try:
    import jwt as _jwt
except ImportError:                                  # pragma: no cover
    # without this every token is ignored and signed-in users silently become
    # anonymous — an outage that looks like working software, so say so loudly.
    _jwt = None
    logging.getLogger(__name__).critical(
        "PyJWT is not installed: supabase tokens cannot be verified and every "
        "signed-in user will be treated as anonymous. install pyjwt[crypto]."
    )

_REGISTRY_PREFIX = "apikey:"
_VALID_TIERS = {"free", "researcher", "institutional", "internal"}
_DEFAULT_USER_TIER = "free"


# ── supabase user tokens ──────────────────────────────────────────────────────

_ASYMMETRIC_ALGS = ["ES256", "RS256"]
_jwks_client = None


def _jwks_url() -> Optional[str]:
    explicit = os.getenv("SUPABASE_JWKS_URL")
    if explicit:
        return explicit
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    return f"{base}/auth/v1/.well-known/jwks.json" if base else None


def _get_jwks_client():
    """cached PyJWKClient — fetches supabase's public keys once, then reuses them."""
    global _jwks_client
    if _jwks_client is not None:
        return _jwks_client
    url = _jwks_url()
    if not url or _jwt is None:
        return None
    try:
        _jwks_client = _jwt.PyJWKClient(url, cache_keys=True, lifespan=3600)
    except Exception as e:                            # pragma: no cover
        logger.warning("could not build jwks client for %s: %s", url, e)
        return None
    return _jwks_client


def jwt_auth_configured() -> bool:
    if _jwt is None:
        return False
    return bool(_jwks_url()) or bool(os.getenv("SUPABASE_JWT_SECRET"))


def _decode(token: str) -> Optional[Dict[str, Any]]:
    """verify a supabase token: asymmetric (modern) first, shared secret (legacy) second."""
    audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    require = {"require": ["exp", "sub"]}
    # PyJWT's default leeway is zero, so exp/nbf are compared against this
    # server's clock with no tolerance. a token issued by supabase and checked
    # here a moment later can land right on that boundary if the two clocks
    # drift by even a couple of seconds — rejected on first use, then accepted
    # once refreshed, which looks like an intermittent auth bug but is really
    # just clock skew between two different servers. ten seconds absorbs that
    # without meaningfully loosening expiry enforcement.
    leeway = 10

    client = _get_jwks_client()
    if client is not None:
        try:
            key = client.get_signing_key_from_jwt(token).key
            return _jwt.decode(token, key, algorithms=_ASYMMETRIC_ALGS,
                               audience=audience, options=require, leeway=leeway)
        except Exception as e:
            logger.debug("asymmetric verification failed: %s", e)

    secret = os.getenv("SUPABASE_JWT_SECRET")
    if secret:
        try:
            return _jwt.decode(token, secret, algorithms=["HS256"],
                               audience=audience, options=require, leeway=leeway)
        except Exception as e:
            logger.debug("hs256 verification failed: %s", e)
    return None


def verify_supabase_jwt(token: str) -> Optional[Dict[str, Any]]:
    """return {"user_id", "tier", "email"} for a valid token, else None.

    the tier is read from app_metadata (server-controlled in supabase); user_metadata
    is client-writable and is deliberately ignored.
    """
    if _jwt is None:
        return None
    claims = _decode(token)
    if claims is None:
        return None

    tier = (claims.get("app_metadata") or {}).get("tier", _DEFAULT_USER_TIER)
    if tier not in _VALID_TIERS or tier == "internal":
        tier = _DEFAULT_USER_TIER                     # never let a token claim internal
    email = (claims.get("email") or "").strip() or None
    return {"user_id": str(claims["sub"]), "tier": tier, "email": email}


# ── issued api keys ───────────────────────────────────────────────────────────

def _redis():
    try:
        from backend.cache.redis_cache import RedisCache
        rc = RedisCache()
        return rc._client if rc.is_available else None
    except Exception:
        return None


def tier_for_api_key(key: str) -> Optional[str]:
    """resolve an api key to its tier, or None if unknown/revoked."""
    internal = os.getenv("MFRAMAPA_INTERNAL_KEY")
    if internal and secrets.compare_digest(key, internal):
        return "internal"

    client = _redis()
    if client is None:
        return None                                   # no registry -> no key access
    try:
        record = client.hgetall(f"{_REGISTRY_PREFIX}{key}")
    except Exception as e:
        logger.warning("api key lookup failed: %s", e)
        return None
    if not record or record.get("active") != "1":
        return None
    tier = record.get("tier")
    return tier if tier in _VALID_TIERS else None


def issue_api_key(tier: str, label: str = "") -> str:
    """mint and store a new api key for an api customer."""
    if tier not in _VALID_TIERS or tier == "internal":
        raise ValueError(f"tier must be one of {sorted(_VALID_TIERS - {'internal'})}")
    client = _redis()
    if client is None:
        raise RuntimeError("redis unavailable — cannot issue keys")
    key = f"mframapa-{tier[:4]}-{secrets.token_urlsafe(32)}"
    client.hset(f"{_REGISTRY_PREFIX}{key}", mapping={"tier": tier, "label": label, "active": "1"})
    return key


def revoke_api_key(key: str) -> bool:
    client = _redis()
    if client is None:
        return False
    return bool(client.hset(f"{_REGISTRY_PREFIX}{key}", "active", "0"))
