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
from typing import Dict, Optional

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


_PER_PAGE = 200
_MAX_PAGES = 50          # 10k users; beyond that the id must come from metadata


def find_user_id_by_email(email: str) -> Optional[str]:
    """look up a supabase user id by email, paging until found.

    used when the payment metadata didn't carry the user id. paging matters:
    a single-page scan silently stops matching once you pass one page of users.
    """
    base, headers = _base(), _admin_headers()
    if not base or not headers:
        return None

    target = email.strip().lower()
    for page in range(1, _MAX_PAGES + 1):
        try:
            resp = requests.get(f"{base}/users", headers=headers,
                                params={"page": page, "per_page": _PER_PAGE},
                                timeout=_TIMEOUT)
            resp.raise_for_status()
            users = resp.json().get("users", [])
        except (requests.RequestException, ValueError) as e:
            logger.warning("supabase admin user lookup failed on page %d: %s", page, e)
            return None

        for user in users:
            if str(user.get("email", "")).lower() == target:
                return user.get("id")
        if len(users) < _PER_PAGE:
            return None                      # last page, no match

    logger.warning("user lookup for %s exceeded %d pages", email, _MAX_PAGES)
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
