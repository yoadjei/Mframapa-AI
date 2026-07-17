"""
over-the-air translation dictionaries + community corrections.

dictionaries are served from the database so languages update live without an app
release (guide §8.5). native speakers submit corrections via /suggest; these land
unverified (``verified_by_human`` = 0) for review before promotion.
"""

import os
import sqlite3
import time
from functools import lru_cache
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

_DEFAULT_DB = os.path.join(os.path.expanduser("~"), ".mframapa_translations.db")


class TranslationStore:
    def __init__(self, db_path: str = _DEFAULT_DB):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS translations (
                    lang             TEXT NOT NULL,
                    key              TEXT NOT NULL,
                    value            TEXT NOT NULL,
                    verified_by_human INTEGER NOT NULL DEFAULT 1,
                    updated_at       REAL NOT NULL,
                    PRIMARY KEY (lang, key)
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS translation_suggestions (
                    id                INTEGER PRIMARY KEY AUTOINCREMENT,
                    lang              TEXT NOT NULL,
                    key               TEXT NOT NULL,
                    value             TEXT NOT NULL,
                    submitted_by      TEXT,
                    verified_by_human INTEGER NOT NULL DEFAULT 0,
                    created_at        REAL NOT NULL
                )
                """
            )

    def upsert(self, lang: str, key: str, value: str, verified_by_human: bool = True) -> None:
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO translations (lang, key, value, verified_by_human, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(lang, key) DO UPDATE SET
                    value=excluded.value, verified_by_human=excluded.verified_by_human,
                    updated_at=excluded.updated_at
                """,
                (lang, key, value, int(verified_by_human), time.time()),
            )

    def dictionaries(
        self, langs: Optional[List[str]] = None, since: Optional[float] = None
    ) -> Dict[str, Dict[str, str]]:
        sql = "SELECT lang, key, value FROM translations"
        conds: List[str] = []
        params: List[Any] = []
        if langs:
            conds.append(f"lang IN ({','.join('?' * len(langs))})")
            params.extend(langs)
        if since is not None:
            conds.append("updated_at > ?")
            params.append(since)
        if conds:
            sql += " WHERE " + " AND ".join(conds)
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(sql, params).fetchall()
        out: Dict[str, Dict[str, str]] = {}
        for lang, key, value in rows:
            out.setdefault(lang, {})[key] = value
        return out

    def latest_version(self) -> float:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute("SELECT MAX(updated_at) FROM translations").fetchone()
        return float(row[0]) if row and row[0] is not None else 0.0

    def add_suggestion(
        self, lang: str, key: str, value: str, submitted_by: Optional[str] = None
    ) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.execute(
                """
                INSERT INTO translation_suggestions (lang, key, value, submitted_by, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (lang, key, value, submitted_by, time.time()),
            )
            return int(cur.lastrowid)


@lru_cache(maxsize=1)
def get_translation_store() -> TranslationStore:
    return TranslationStore(os.getenv("MFRAMAPA_TRANSLATIONS_DB", _DEFAULT_DB))


class SuggestionBody(BaseModel):
    lang: str = Field(..., min_length=2, max_length=8)
    key: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)
    submitted_by: Optional[str] = None


translations_router = APIRouter(prefix="/translations")


@translations_router.get("/sync")
def sync(
    lang: Optional[str] = Query(None, description="optional single-language filter"),
    since: Optional[float] = Query(None, description="only entries updated after this version"),
    store: TranslationStore = Depends(get_translation_store),
) -> Dict[str, Any]:
    langs = [lang] if lang else None
    return {"version": store.latest_version(), "languages": store.dictionaries(langs, since)}


@translations_router.post("/suggest")
def suggest(
    body: SuggestionBody,
    store: TranslationStore = Depends(get_translation_store),
) -> Dict[str, Any]:
    sid = store.add_suggestion(body.lang, body.key, body.value, body.submitted_by)
    return {"status": "received", "id": sid, "verified_by_human": False}
