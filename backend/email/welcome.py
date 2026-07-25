"""Send the one-time Welcome to Mframapa email via Resend.

Triggered by POST /api/v1/auth/welcome after a real Supabase session exists
(confirm-signup landing or first password login). Deduped per user id in SQLite.
"""

from __future__ import annotations

import logging
import os
import re
import sqlite3
from pathlib import Path
from typing import Optional, Tuple

from backend.email.resend_client import send_resend_email

logger = logging.getLogger(__name__)

_DATA_DIR = os.getenv("MFRAMAPA_DATA_DIR", os.path.expanduser("~"))
_DEFAULT_DB = os.path.join(_DATA_DIR, ".mframapa_welcome.db")
_TEMPLATE = Path(__file__).resolve().parent / "templates" / "welcome.html"
_APP_URL = (os.getenv("WELCOME_APP_URL") or "https://mframapa.live").rstrip("/")


class WelcomeStore:
    def __init__(self, db_path: str = _DEFAULT_DB):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS welcome_sent (
                    user_id   TEXT PRIMARY KEY,
                    email     TEXT,
                    sent_at   TEXT NOT NULL DEFAULT (datetime('now'))
                )
                """
            )

    def already_sent(self, user_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(
                "SELECT 1 FROM welcome_sent WHERE user_id = ?",
                (user_id,),
            ).fetchone()
        return row is not None

    def mark_sent(self, user_id: str, email: str) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT OR IGNORE INTO welcome_sent (user_id, email) VALUES (?, ?)",
                (user_id, email),
            )


def _load_html(app_url: str = _APP_URL) -> str:
    raw = _TEMPLATE.read_text(encoding="utf-8")
    # Drop the leading ops comment block if present.
    raw = re.sub(r"^<!--.*?-->\s*", "", raw, count=1, flags=re.DOTALL)
    return raw.replace("https://mframapa.live", app_url)


def send_welcome_email(*, user_id: str, email: str, store: Optional[WelcomeStore] = None) -> Tuple[str, bool]:
    """Send welcome once. Returns (status, emailed).

    status: sent | already_sent | skipped_no_key | skipped_no_email | failed
    """
    clean_email = (email or "").strip().lower()
    if not user_id:
        return "skipped_no_email", False
    if not clean_email or "@" not in clean_email:
        return "skipped_no_email", False

    store = store or WelcomeStore()
    if store.already_sent(user_id):
        return "already_sent", False

    if not (os.getenv("RESEND_API_KEY") or "").strip():
        logger.info("welcome skipped for %s; RESEND_API_KEY unset", user_id)
        return "skipped_no_key", False

    from_addr = (
        os.getenv("RESEND_WELCOME_FROM")
        or os.getenv("RESEND_FROM_EMAIL")
        or "Mframapa <alerts@mframapa.live>"
    ).strip()

    ok = send_resend_email(
        to=[clean_email],
        subject="Welcome to Mframapa",
        html=_load_html(),
        from_addr=from_addr,
    )
    if not ok:
        return "failed", False

    store.mark_sent(user_id, clean_email)
    return "sent", True
