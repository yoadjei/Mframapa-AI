"""first-party, privacy-preserving analytics (sqlite).

what it stores: one row per (anonymous device, event, day). the device id is a
random uuid the client generates and keeps locally — never a hardware id, never
tied to identity. no raw coordinates: geography is a coarse country code at most.
day granularity (not timestamps) is enough for the metrics the pitch needs and
minimises what we hold.

metrics derived here: installs, DAU/WAU, classic Dn cohort retention, top
countries, and alert open rate — see scope §3.2 (analytics) and §8.2 (traction).
"""

import logging
import os
import sqlite3
import time
from datetime import date, timedelta
from functools import lru_cache
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_DEFAULT_DB = os.path.join(os.path.expanduser("~"), ".mframapa_analytics.db")
_KNOWN_EVENTS = {
    "app_open", "prediction_view", "search",
    "alert_received", "alert_opened", "offline_view",
}


def _today() -> str:
    return date.today().isoformat()


class AnalyticsStore:
    def __init__(self, db_path: str = _DEFAULT_DB):
        self.db_path = db_path
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    device_id TEXT NOT NULL,
                    event     TEXT NOT NULL,
                    day       TEXT NOT NULL,
                    country   TEXT,
                    platform  TEXT,
                    ts        REAL NOT NULL
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_day ON events(day)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_dev ON events(device_id, day)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_events_evt ON events(event, day)")

    def record(
        self,
        device_id: str,
        event: str,
        *,
        country: Optional[str] = None,
        platform: Optional[str] = None,
        day: Optional[str] = None,
    ) -> None:
        if event not in _KNOWN_EVENTS:
            return                                   # ignore unknown events, don't error
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO events (device_id, event, day, country, platform, ts) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (device_id, event, day or _today(),
                 (country or None), (platform or None), time.time()),
            )

    # ── metrics ────────────────────────────────────────────────────────────────

    def _scalar(self, sql: str, params: tuple = ()) -> int:
        with sqlite3.connect(self.db_path) as conn:
            row = conn.execute(sql, params).fetchone()
            return int(row[0]) if row and row[0] is not None else 0

    def installs(self) -> int:
        return self._scalar("SELECT COUNT(DISTINCT device_id) FROM events")

    def active_devices(self, days: int) -> int:
        since = (date.today() - timedelta(days=days - 1)).isoformat()
        return self._scalar(
            "SELECT COUNT(DISTINCT device_id) FROM events WHERE day >= ?", (since,)
        )

    def retention(self, n: int) -> Dict[str, Any]:
        """classic Dn: of the devices first seen on day D, the share active again on
        day D+n, summed over every cohort old enough to have a D+n. returns the
        pooled rate plus the cohort size it is based on."""
        with sqlite3.connect(self.db_path) as conn:
            first_seen = dict(conn.execute(
                "SELECT device_id, MIN(day) FROM events GROUP BY device_id"
            ).fetchall())
            active = set(conn.execute("SELECT DISTINCT device_id, day FROM events").fetchall())

        today = date.today()
        cohort = retained = 0
        for device, d0 in first_seen.items():
            try:
                start = date.fromisoformat(d0)
            except (TypeError, ValueError):
                continue
            target = start + timedelta(days=n)
            if target > today:
                continue                             # cohort too young to measure Dn yet
            cohort += 1
            if (device, target.isoformat()) in active:
                retained += 1
        rate = round(retained / cohort, 3) if cohort else None
        return {"window": f"D{n}", "cohort_size": cohort, "retained": retained, "rate": rate}

    def top_countries(self, limit: int = 10) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            rows = conn.execute(
                "SELECT country, COUNT(DISTINCT device_id) AS n FROM events "
                "WHERE country IS NOT NULL GROUP BY country ORDER BY n DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [{"country": c, "devices": int(n)} for c, n in rows]

    def alert_open_rate(self) -> Dict[str, Any]:
        received = self._scalar("SELECT COUNT(*) FROM events WHERE event='alert_received'")
        opened = self._scalar("SELECT COUNT(*) FROM events WHERE event='alert_opened'")
        rate = round(opened / received, 3) if received else None
        return {"received": received, "opened": opened, "rate": rate}

    def summary(self) -> Dict[str, Any]:
        return {
            "installs": self.installs(),
            "dau": self.active_devices(1),
            "wau": self.active_devices(7),
            "mau": self.active_devices(30),
            "retention": {"d7": self.retention(7), "d30": self.retention(30)},
            "alert_open_rate": self.alert_open_rate(),
            "top_countries": self.top_countries(),
        }


@lru_cache(maxsize=1)
def get_analytics_store() -> AnalyticsStore:
    return AnalyticsStore()
