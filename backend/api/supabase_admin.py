"""supabase admin api — server-only writes to a user's app_metadata.

app_metadata is the trust anchor for tiers: it is writable *only* with the service
role key (never shipped to a client), and it is what lands in the user's jwt. that
is why the api reads tier from app_metadata rather than user_metadata, which any
client can edit.

requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)

_TIMEOUT = 15


def _admin_headers() -> Optional[Dict[str, str]]:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        return None
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _base() -> Optional[str]:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    return f"{url}/auth/v1/admin" if url else None


def admin_configured() -> bool:
    return bool(_base()) and bool(_admin_headers())


def find_user_id_by_email(email: str) -> Optional[str]:
    """look up a supabase user id by email. used when the payment metadata
    didn't carry the user id (older checkouts)."""
    base, headers = _base(), _admin_headers()
    if not base or not headers:
        return None
    try:
        resp = requests.get(f"{base}/users", headers=headers,
                            params={"page": 1, "per_page": 200}, timeout=_TIMEOUT)
        resp.raise_for_status()
        users = resp.json().get("users", [])
    except (requests.RequestException, ValueError) as e:
        logger.warning("supabase admin user lookup failed: %s", e)
        return None

    target = email.strip().lower()
    for user in users:
        if str(user.get("email", "")).lower() == target:
            return user.get("id")
    return None


def set_user_tier(user_id: str, tier: str) -> bool:
    """write app_metadata.tier for a user. returns True on success.

    the new tier only appears in the user's token after it refreshes, so clients
    should call refreshSession() after a successful payment to see it immediately.
    """
    base, headers = _base(), _admin_headers()
    if not base or not headers:
        logger.error("supabase admin not configured — cannot set tier")
        return False
    try:
        resp = requests.put(
            f"{base}/users/{user_id}",
            headers=headers,
            json={"app_metadata": {"tier": tier}},
            timeout=_TIMEOUT,
        )
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.error("failed to set tier=%s for user %s: %s", tier, user_id, e)
        return False
    logger.info("set tier=%s for user %s", tier, user_id)
    return True
