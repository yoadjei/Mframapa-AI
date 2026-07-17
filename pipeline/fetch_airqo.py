"""pull calibrated pm2.5 from airqo analytics api (v3) — african ground truth #2.

posts to the historical data-download endpoint in <=2-month batches with cursor
pagination (per docs.airqo.net). writes pipeline/data/airqo_raw.csv in the openaq
raw schema plus a `source` column, which enrich_satellite merges automatically.

requires a STANDARD-tier airqo token (historical access). set AIRQO_API_TOKEN in .env.
    python -m pipeline.fetch_airqo
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from datetime import date, timedelta
from typing import Any, Iterable

import pandas as pd
import requests

from pipeline.config import (
    AIRQO_ANALYTICS_URL,
    AIRQO_API_TOKEN,
    AIRQO_BATCH_DAYS,
    AIRQO_DELAY_SECONDS,
    AIRQO_FREQUENCY,
    AIRQO_MAX_RETRIES,
    AIRQO_RAW_FILE,
    AIRQO_SITES,
    CHECKPOINT_DIR,
    FETCH_END_DATE,
    FETCH_START_DATE,
)

logger = logging.getLogger(__name__)

_CHECKPOINT_FILE = CHECKPOINT_DIR / "airqo.json"
_PARTIAL_FILE = CHECKPOINT_DIR / "airqo_partial.csv"
_COLUMNS = ["datetime", "sensor_id", "location", "country", "lat", "lon", "value", "unit", "source"]


def _first(node: Any, *keys: str) -> Any:
    if not isinstance(node, dict):
        return None
    for key in keys:
        value = node.get(key)
        if value is not None:
            return value
    return None


def _stable_id(value: str) -> int:
    # airqo ids are strings; hash to a big int well above openaq's id range (no collisions).
    return int(hashlib.sha1(value.encode()).hexdigest()[:12], 16)


def _windows(start: date, end: date) -> Iterable[tuple[date, date]]:
    current = start
    while current <= end:
        window_end = min(end, current + timedelta(days=AIRQO_BATCH_DAYS - 1))
        yield current, window_end
        current = window_end + timedelta(days=1)


def _post(body: dict[str, Any]) -> dict[str, Any] | None:
    for attempt in range(AIRQO_MAX_RETRIES):
        try:
            response = requests.post(AIRQO_ANALYTICS_URL, params={"token": AIRQO_API_TOKEN}, json=body, timeout=120)
        except requests.RequestException as error:
            logger.warning("airqo request failed: %s", error)
        else:
            if response.ok:
                time.sleep(AIRQO_DELAY_SECONDS)
                return response.json()
            logger.warning("airqo http %s for data-download", response.status_code)
            if response.status_code in (401, 402, 403):
                logger.error("airqo auth/tier error %s — historical needs a standard-tier token", response.status_code)
                return None
            if response.status_code == 429:
                time.sleep(15 * (2**attempt))
                continue
            if 500 <= response.status_code < 600:
                time.sleep(3)
                continue
        time.sleep(5 * (2**attempt))
    return None


def _rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data") or payload.get("measurements") or []
    out: list[dict[str, Any]] = []
    for m in data:
        timestamp = _first(m, "time", "timestamp", "datetime", "created_at")
        pm = m.get("pm2_5")
        value = _first(pm, "calibratedValue", "value") if isinstance(pm, dict) else pm
        if value is None:
            value = _first(m, "pm2_5_calibrated_value", "pm2_5_raw_value")
        lat = _first(m, "latitude", "site_latitude")
        lon = _first(m, "longitude", "site_longitude")
        site = _first(m, "site_id", "device_id", "device_name", "device", "site")
        if timestamp is None or value is None or site is None or lat is None or lon is None:
            continue
        out.append({
            "datetime": timestamp,
            "sensor_id": _stable_id(str(site)),
            "location": str(_first(m, "site_name", "device_name") or site),
            "country": str(_first(m, "country") or ""),
            "lat": float(lat),
            "lon": float(lon),
            "value": value,
            "unit": "ug/m3",
            "source": "airqo",
        })
    return out


def _cursor(payload: dict[str, Any]) -> str | None:
    meta = payload.get("meta") or {}
    return meta.get("cursor") or meta.get("nextCursor") or payload.get("cursor") or payload.get("nextCursor")


def _base_body(start: date, end: date) -> dict[str, Any]:
    body: dict[str, Any] = {
        "network": "airqo",
        "datatype": "calibrated",
        "downloadType": "json",
        "frequency": AIRQO_FREQUENCY,
        "startDateTime": f"{start.isoformat()}T00:00:00Z",
        "endDateTime": f"{end.isoformat()}T23:59:59Z",
        "pollutants": ["pm2_5"],
        "metaDataFields": ["latitude", "longitude"],
    }
    if AIRQO_SITES:
        body["sites"] = AIRQO_SITES
    return body


def _load_completed() -> set[str]:
    try:
        return set(json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8")).get("completed", []))
    except (OSError, json.JSONDecodeError):
        return set()


def _save_completed(completed: set[str]) -> None:
    _CHECKPOINT_FILE.write_text(json.dumps({"completed": sorted(completed)}), encoding="utf-8")


def fetch_all() -> bool:
    if not AIRQO_API_TOKEN:
        logger.error("AIRQO_API_TOKEN is not set; skipping airqo pull")
        return False
    windows = list(_windows(date.fromisoformat(FETCH_START_DATE), date.fromisoformat(FETCH_END_DATE)))
    completed = _load_completed()
    logger.info("[airqo] pulling pm2.5 for %d date windows (~2-month batches)", len(windows))
    failures = 0
    try:
        for index, (start, end) in enumerate(windows, start=1):
            window_id = f"{start.isoformat()}:{end.isoformat()}"
            if window_id in completed:
                continue
            cursor: str | None = None
            total = 0
            ok = True
            while True:
                body = _base_body(start, end)
                if cursor:
                    body["cursor"] = cursor
                payload = _post(body)
                if payload is None:
                    ok = False
                    break
                rows = _rows(payload)
                if rows:
                    pd.DataFrame(rows, columns=_COLUMNS).to_csv(_PARTIAL_FILE, mode="a", index=False, header=not _PARTIAL_FILE.exists())
                    total += len(rows)
                cursor = _cursor(payload)
                if not cursor:
                    break
            if not ok:
                failures += 1
                logger.warning("[airqo] [%d/%d] %s failed; will resume", index, len(windows), window_id)
                continue
            completed.add(window_id)
            _save_completed(completed)
            logger.info("[airqo] [%d/%d] %s: %d readings", index, len(windows), window_id, total)
    except KeyboardInterrupt:
        _save_completed(completed)
        logger.warning("airqo pull interrupted; rerun to resume")
        return False

    if failures or len(completed) != len(windows):
        logger.warning("airqo pull incomplete: %d/%d windows", len(completed), len(windows))
        return False
    raw = pd.read_csv(_PARTIAL_FILE) if _PARTIAL_FILE.exists() else pd.DataFrame(columns=_COLUMNS)
    raw.to_csv(AIRQO_RAW_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("airqo pull complete: %d readings in %s", len(raw), AIRQO_RAW_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if fetch_all() else 1)
