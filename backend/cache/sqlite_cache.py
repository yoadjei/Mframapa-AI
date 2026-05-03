"""
SQLite cache backend — always available, no external dependencies.

Schema:
    cache(key TEXT PRIMARY KEY, value TEXT, expires_at REAL)

expires_at is a Unix timestamp; entries past it are treated as missing.
"""

import json
import logging
import os
import sqlite3
import time
from typing import Any, Dict, Optional

from .base import BaseCache

logger = logging.getLogger(__name__)

_DEFAULT_DB = os.path.join(os.path.expanduser("~"), ".mframapa_cache.db")


class SQLiteCache(BaseCache):
    """Local SQLite fallback cache — zero configuration required."""

    def __init__(self, db_path: str = _DEFAULT_DB):
        self.db_path = db_path
        self._init_db()

    def _init_db(self) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS cache (
                    key        TEXT PRIMARY KEY,
                    value      TEXT NOT NULL,
                    expires_at REAL NOT NULL
                )
                """
            )

    @property
    def is_available(self) -> bool:
        return True

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        try:
            with sqlite3.connect(self.db_path) as conn:
                row = conn.execute(
                    "SELECT value, expires_at FROM cache WHERE key = ?", (key,)
                ).fetchone()
            if row is None:
                return None
            value_str, expires_at = row
            if time.time() > expires_at:
                self.invalidate(key)
                return None
            return json.loads(value_str)
        except Exception as e:
            logger.warning("SQLite GET failed: %s", e)
            return None

    def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> None:
        try:
            expires_at = time.time() + ttl_seconds
            with sqlite3.connect(self.db_path) as conn:
                conn.execute(
                    """
                    INSERT INTO cache (key, value, expires_at)
                    VALUES (?, ?, ?)
                    ON CONFLICT(key) DO UPDATE SET value=excluded.value, expires_at=excluded.expires_at
                    """,
                    (key, json.dumps(value), expires_at),
                )
        except Exception as e:
            logger.warning("SQLite SET failed: %s", e)

    def invalidate(self, key: str) -> None:
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.execute("DELETE FROM cache WHERE key = ?", (key,))
        except Exception as e:
            logger.warning("SQLite DELETE failed: %s", e)
