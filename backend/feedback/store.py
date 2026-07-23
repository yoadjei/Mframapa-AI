"""user feedback (sqlite).

the feedback form in both apps used to wait 800ms and say "thanks", then throw
the message away. anyone who reported a wrong reading, a broken screen or a bad
translation was talking to nobody. this stores it.

kept deliberately small: a category, the message, an optional reply address and
the day. no device id, no coordinates, no identity — someone reporting a problem
should not have to pay for it with data about themselves. the email is optional
precisely because most reports do not need a reply.
"""

import logging
import os
import sqlite3
from datetime import date
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# same mounted volume as analytics, so reports survive a container rebuild
_DATA_DIR = os.getenv("MFRAMAPA_DATA_DIR", os.path.expanduser("~"))
_DEFAULT_DB = os.path.join(_DATA_DIR, ".mframapa_feedback.db")

CATEGORIES = {"bug", "feature", "data", "general"}
MAX_MESSAGE = 4000


class FeedbackStore:
    def __init__(self, db_path: str = _DEFAULT_DB):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS feedback (
                    id       INTEGER PRIMARY KEY AUTOINCREMENT,
                    day      TEXT NOT NULL,
                    category TEXT NOT NULL,
                    message  TEXT NOT NULL,
                    email    TEXT,
                    platform TEXT
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_feedback_day ON feedback(day)")

    def add(
        self,
        *,
        category: str,
        message: str,
        email: Optional[str] = None,
        platform: Optional[str] = None,
    ) -> int:
        """store one report. returns its id.

        an unknown category is filed as general rather than rejected: losing a
        real report over a client-side label mismatch would be the worse bug.
        """
        clean_message = (message or "").strip()[:MAX_MESSAGE]
        if not clean_message:
            raise ValueError("message is required")
        clean_category = category if category in CATEGORIES else "general"

        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                "INSERT INTO feedback (day, category, message, email, platform)"
                " VALUES (?, ?, ?, ?, ?)",
                (
                    date.today().isoformat(),
                    clean_category,
                    clean_message,
                    (email or "").strip() or None,
                    platform,
                ),
            )
            return int(cur.lastrowid)

    def recent(self, limit: int = 100) -> List[Dict[str, Any]]:
        """newest reports first, for the internal metrics view."""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT id, day, category, message, email, platform"
                " FROM feedback ORDER BY id DESC LIMIT ?",
                (max(1, min(limit, 500)),),
            ).fetchall()
        return [dict(r) for r in rows]

    def count_by_category(self) -> Dict[str, int]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT category, COUNT(*) FROM feedback GROUP BY category"
            ).fetchall()
        return {category: count for category, count in rows}
