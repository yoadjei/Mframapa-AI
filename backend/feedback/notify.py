"""Optional Resend email when a user submits in-app feedback.

Stores still go to SQLite even if email is unset, so reports are never lost.
Set RESEND_API_KEY + FEEDBACK_TO_EMAIL (and optional RESEND_FROM_EMAIL) to receive
inbox mail. HTML matches docs/email/feedback.html.
"""

from __future__ import annotations

import html
import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def _feedback_html(
    *,
    feedback_id: int,
    category: str,
    message: str,
    email: Optional[str],
    platform: Optional[str],
) -> str:
    safe_cat = html.escape(category or "general")
    safe_plat = html.escape(platform or "unknown")
    safe_email = html.escape((email or "").strip() or "(none)")
    safe_msg = html.escape(message or "")
    return f"""<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:0;background:#0B0F14;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B0F14;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" style="max-width:560px;background:#171E28;border-radius:16px;overflow:hidden;border:1px solid #25303C;">
<tr><td style="padding:28px 28px 12px;">
<div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#00C896;font-weight:700;">Mframapa</div>
<h1 style="margin:10px 0 0;font-size:22px;line-height:1.3;color:#FFFFFF;">New in-app feedback</h1>
</td></tr>
<tr><td style="padding:0 28px 8px;">
<table role="presentation" width="100%" style="font-size:14px;color:#9AA7B5;">
<tr><td style="padding:6px 0;"><strong style="color:#FFFFFF;">Category</strong> · {safe_cat}</td></tr>
<tr><td style="padding:6px 0;"><strong style="color:#FFFFFF;">Platform</strong> · {safe_plat}</td></tr>
<tr><td style="padding:6px 0;"><strong style="color:#FFFFFF;">Reply-to</strong> · {safe_email}</td></tr>
<tr><td style="padding:6px 0;"><strong style="color:#FFFFFF;">ID</strong> · #{feedback_id}</td></tr>
</table>
</td></tr>
<tr><td style="padding:16px 28px 28px;">
<div style="background:#10161F;border:1px solid #25303C;border-radius:12px;padding:16px;color:#E8EEF4;font-size:15px;line-height:1.55;white-space:pre-wrap;">{safe_msg}</div>
</td></tr>
<tr><td style="padding:0 28px 28px;font-size:12px;color:#647182;">
Stored in the feedback database even if delivery fails.
</td></tr>
</table>
</td></tr>
</table>
</body></html>"""


def notify_feedback_email(
    *,
    feedback_id: int,
    category: str,
    message: str,
    email: Optional[str],
    platform: Optional[str],
) -> bool:
    api_key = (os.getenv("RESEND_API_KEY") or "").strip()
    to_addr = (os.getenv("FEEDBACK_TO_EMAIL") or "privacy@mframapa.live").strip()
    from_addr = (
        os.getenv("RESEND_FROM_EMAIL") or "Mframapa Feedback <alerts@mframapa.live>"
    ).strip()
    if not api_key:
        logger.info("feedback #%s stored; RESEND_API_KEY unset so no email sent", feedback_id)
        return False

    reply = (email or "").strip()
    subject = f"[Mframapa feedback] {category} #{feedback_id}"
    payload = {
        "from": from_addr,
        "to": [to_addr],
        "subject": subject,
        "html": _feedback_html(
            feedback_id=feedback_id,
            category=category,
            message=message,
            email=email,
            platform=platform,
        ),
    }
    if reply:
        payload["reply_to"] = reply

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
            logger.warning("Resend feedback email failed %s: %s", r.status_code, r.text[:200])
            return False
        return True
    except Exception:
        logger.exception("Resend feedback email error")
        return False
