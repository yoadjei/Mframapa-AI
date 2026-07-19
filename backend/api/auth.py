"""identity for the api: supabase user tokens and issued api keys.

two ways to authenticate:

  app users        Authorization: Bearer <supabase access token>
                   verified locally (HS256, SUPABASE_JWT_SECRET) — no network hop.
                   tier comes from the token's app_metadata, set server-side by the
                   billing webhook, so a client cannot grant itself a paid tier.

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
    _jwt = None

_REGISTRY_PREFIX = "apikey:"
_VALID_TIERS = {"free", "researcher", "institutional", "internal"}
_DEFAULT_USER_TIER = "free"


# ── supabase user tokens ──────────────────────────────────────────────────────

def jwt_auth_configured() -> bool:
    return bool(os.getenv("SUPABASE_JWT_SECRET")) and _jwt is not None


def verify_supabase_jwt(token: str) -> Optional[Dict[str, Any]]:
    """return {"user_id", "tier"} for a valid token, else None.

    the tier is read from app_metadata (server-controlled in supabase); user_metadata
    is client-writable and is deliberately ignored.
    """
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret or _jwt is None:
        return None
    try:
        claims = _jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated"),
            options={"require": ["exp", "sub"]},
        )
    except Exception as e:                            # expired, bad signature, malformed
        logger.debug("supabase jwt rejected: %s", e)
        return None

    tier = (claims.get("app_metadata") or {}).get("tier", _DEFAULT_USER_TIER)
    if tier not in _VALID_TIERS or tier == "internal":
        tier = _DEFAULT_USER_TIER                     # never let a token claim internal
    return {"user_id": str(claims["sub"]), "tier": tier}


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
