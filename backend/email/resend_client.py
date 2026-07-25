"""Thin Resend HTTP client shared by feedback + welcome mail."""

from __future__ import annotations

import logging
import os
from typing import List, Optional

import requests

logger = logging.getLogger(__name__)


def send_resend_email(
    *,
    to: List[str],
    subject: str,
    html: str,
    from_addr: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> bool:
    api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    if not api_key:
        logger.info("RESEND_API_KEY unset; skip email subject=%r to=%s", subject, to)
        return False

    sender = (
        from_addr
        or (os.getenv("RESEND_FROM_EMAIL") or "").strip()
        or "Mframapa <alerts@mframapa.live>"
    )
    payload = {
        "from": sender,
        "to": to,
        "subject": subject,
        "html": html,
    }
    if reply_to:
        payload["reply_to"] = reply_to

    try:
        r = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=12,
        )
        if r.status_code >= 300:
            logger.warning("Resend failed %s: %s", r.status_code, r.text[:240])
            return False
        return True
    except Exception:
        logger.exception("Resend request error")
        return False
