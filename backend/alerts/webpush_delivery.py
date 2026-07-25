"""Web Push (VAPID) delivery for PWA subscriptions.

Expo tokens stay on the Expo path in ``push.py``. Web subscriptions are JSON
blobs (endpoint + keys) stored in the same push_tokens table with platform=web.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


def vapid_public_key() -> Optional[str]:
    return (os.getenv("VAPID_PUBLIC_KEY") or "").strip() or None


def vapid_private_key() -> Optional[str]:
    raw = (os.getenv("VAPID_PRIVATE_KEY") or "").strip()
    if not raw:
        return None
    # Allow single-line .env with escaped newlines from generate_vapid_keys.py
    return raw.replace("\\n", "\n")


def vapid_subject() -> str:
    return (os.getenv("VAPID_SUBJECT") or "mailto:alerts@mframapa.live").strip()


def web_push_configured() -> bool:
    return bool(vapid_public_key() and vapid_private_key())


def _parse_subscription(token: str) -> Optional[Dict[str, Any]]:
    try:
        data = json.loads(token)
    except (TypeError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict) or not data.get("endpoint"):
        return None
    keys = data.get("keys") or {}
    if not keys.get("p256dh") or not keys.get("auth"):
        return None
    return data


def is_web_subscription(token: str) -> bool:
    return _parse_subscription(token) is not None


def send_web_push(
    tokens: List[str],
    title: str,
    body: str,
    data: Optional[Dict[str, Any]] = None,
) -> Dict[str, int]:
    """Send Web Push to PWA subscriptions. Returns {sent, failed}."""
    if not tokens:
        return {"sent": 0, "failed": 0}
    if not web_push_configured():
        logger.warning("web push: VAPID keys missing — skipped %d subscription(s)", len(tokens))
        return {"sent": 0, "failed": len(tokens)}

    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        logger.error("web push: pywebpush not installed")
        return {"sent": 0, "failed": len(tokens)}

    payload = json.dumps(
        {
            "title": title,
            "body": body,
            "data": data or {},
        }
    )
    claims = {"sub": vapid_subject()}
    priv = vapid_private_key()
    sent = failed = 0

    for token in tokens:
        sub = _parse_subscription(token)
        if not sub:
            failed += 1
            continue
        try:
            webpush(
                subscription_info=sub,
                data=payload,
                vapid_private_key=priv,
                vapid_claims=claims,
                ttl=86400,
            )
            sent += 1
        except WebPushException as exc:
            failed += 1
            status = getattr(getattr(exc, "response", None), "status_code", None)
            logger.warning("web push failed (%s): %s", status, exc)
        except Exception as exc:
            failed += 1
            logger.warning("web push failed: %s", exc)

    return {"sent": sent, "failed": failed}
