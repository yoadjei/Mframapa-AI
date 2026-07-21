"""the daily alert loop — what actually makes alerts happen.

`scheduler.run_daily_scan` is pure orchestration; this module supplies the missing
half: today's prediction per watched city plus the rolling baseline the episode
detector compares against.

today's value comes from our own /predict endpoint, so the alert path uses exactly
the same model, features and cache as users see (no second inference code path to
drift). the baseline is a short rolling window kept in redis: each run appends
today's value, so the detector has real history from day two onward without any
backfill job.

enable in production with ALERTS_ENABLED=1; the scan runs once daily at
ALERTS_HOUR_UTC (default 06:00 UTC).
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Sequence, Tuple

import httpx

from backend.alerts.scheduler import run_daily_scan
from backend.cache.redis_cache import RedisCache

logger = logging.getLogger(__name__)

_HISTORY_PREFIX = "alerts:hist:"
_HISTORY_DAYS = 7          # baseline window; detector flags today > 2x this mean
_HISTORY_TTL = 30 * 24 * 3600
_REQUEST_TIMEOUT = 30.0


def _history_key(name: str) -> str:
    return f"{_HISTORY_PREFIX}{name.lower().replace(' ', '_')}"


def read_history(cache: RedisCache, name: str) -> List[float]:
    record = cache.get(_history_key(name)) or {}
    values = record.get("values") or []
    return [float(v) for v in values if v is not None]


def append_history(cache: RedisCache, name: str, pm25: float) -> None:
    """append today's value, keeping only the most recent window."""
    values = read_history(cache, name)
    values.append(float(pm25))
    cache.set(_history_key(name), {"values": values[-_HISTORY_DAYS:]}, _HISTORY_TTL)


def _predict(base_url: str, name: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """today's prediction via our own public endpoint (same model + cache as users)."""
    try:
        resp = httpx.get(
            f"{base_url}/api/v1/predict",
            params={"lat": lat, "lon": lon, "name": name},
            timeout=_REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:                       # a single city must not kill the scan
        logger.warning("alert scan: predict failed for %s — %s", name, e)
        return None


def build_city_records(
    cities: Sequence[Tuple[str, float, float]],
    *,
    base_url: str = "http://127.0.0.1:8000",
    cache: Optional[RedisCache] = None,
) -> List[Dict[str, Any]]:
    """one record per city in the shape episode_detector.scan_cities expects.

    the baseline excludes today's value (history is read before the append), so a
    spike is compared against prior days rather than diluted by itself.
    """
    cache = cache or RedisCache()
    records: List[Dict[str, Any]] = []
    for name, lat, lon in cities:
        prediction = _predict(base_url, name, lat, lon)
        if not prediction:
            continue
        pm25 = prediction.get("pm25")
        if pm25 is None:
            continue
        history = read_history(cache, name)       # prior days only
        records.append({
            "name": name,
            "lat": lat,
            "lon": lon,
            "history": history,
            "today_pm25": pm25,
            "today_category": prediction.get("aqi_category"),
        })
        append_history(cache, name, pm25)
    return records


def run_daily_job(
    cities: Sequence[Tuple[str, float, float]],
    *,
    base_url: str = "http://127.0.0.1:8000",
) -> List[Dict[str, Any]]:
    """scan watched cities, push alerts to nearby devices, log the radio bulletin."""
    records = build_city_records(cities, base_url=base_url)
    if not records:
        logger.warning("alert scan: no city records resolved; skipping")
        return []
    episodes = run_daily_scan(records, digest_sink=lambda text: logger.info("radio bulletin:\n%s", text))
    logger.info("alert scan complete: %d cities, %d episode(s)", len(records), len(episodes))

    # a quiet day still gets one useful notification, so the app does not go
    # silent for the weeks between episodes and get forgotten.
    if not episodes:
        try:
            send_daily_fact()
        except Exception:
            logger.exception('daily fact push failed')
    return episodes


def send_daily_fact(*, sender=None) -> Dict[str, int]:
    """push the day's fact to every registered device.

    this is the quiet half of the notification loop. episode alerts only fire
    when the air is genuinely bad, which in a good month is never, so without
    this the app would go silent and people would forget it is there. the fact
    is short, true and useful on its own, so it earns the interruption.
    """
    from backend.alerts.push import send_push
    from backend.alerts.storage import get_push_store
    from backend.api.facts import fact_for

    tokens = [row["token"] for row in get_push_store().all() if row.get("token")]
    if not tokens:
        logger.info("daily fact: no registered devices")
        return {"sent": 0, "batches": 0, "failed": 0}

    result = send_push(
        tokens,
        title="Mframapa",
        body=fact_for(),
        data={"type": "daily_fact"},
        post=sender,
    )
    logger.info("daily fact pushed to %d device(s)", result.get("sent", 0))
    return result


def alerts_enabled() -> bool:
    return os.getenv("ALERTS_ENABLED", "0") == "1"


def alerts_hour() -> int:
    try:
        return int(os.getenv("ALERTS_HOUR_UTC", "6"))
    except ValueError:
        return 6
