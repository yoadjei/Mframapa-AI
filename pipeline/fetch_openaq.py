"""Pull OpenAQ PM2.5 measurements from a freshly discovered station inventory."""

from __future__ import annotations

import calendar
import json
import logging
import time
from datetime import date
from typing import Any, Iterable

import pandas as pd
import requests

from pipeline.config import (
    CHECKPOINT_DIR,
    FETCH_END_DATE,
    FETCH_START_DATE,
    OPENAQ_API_KEY,
    OPENAQ_BASE_URL,
    OPENAQ_DELAY_SECONDS,
    OPENAQ_MAX_RETRIES,
    OPENAQ_RETRY_DELAY,
    RAW_OPENAQ_FILE,
    STATION_INVENTORY_FILE,
)

logger = logging.getLogger(__name__)

_CHECKPOINT_FILE = CHECKPOINT_DIR / "openaq_measurements.json"
_PARTIAL_FILE = CHECKPOINT_DIR / "openaq_measurements_partial.csv"
_RAW_COLUMNS = ["datetime", "sensor_id", "location", "country", "lat", "lon", "value", "unit"]


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if OPENAQ_API_KEY:
        headers["X-API-Key"] = OPENAQ_API_KEY
    return headers


def _request(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    for attempt in range(OPENAQ_MAX_RETRIES):
        try:
            response = requests.get(url, params=params, headers=_headers(), timeout=30)
        except requests.RequestException as error:
            logger.warning("OpenAQ request failed: %s", error)
        else:
            if response.status_code == 429:
                reset_time = response.headers.get("x-ratelimit-reset")
                sleep_time = int(reset_time) if reset_time and reset_time.isdigit() else 60
                logger.warning("OpenAQ rate limit exceeded (429). Pausing %ds", sleep_time)
                time.sleep(sleep_time)
                continue

            if response.ok:
                remaining = response.headers.get("x-ratelimit-remaining")
                if remaining is not None and remaining.isdigit() and int(remaining) <= 2:
                    reset_time = response.headers.get("x-ratelimit-reset")
                    sleep_time = int(reset_time) if reset_time and reset_time.isdigit() else 60
                    logger.warning("OpenAQ limit nearly exhausted; pausing %ds", sleep_time)
                    time.sleep(sleep_time)
                else:
                    time.sleep(OPENAQ_DELAY_SECONDS)
                return response.json()

            logger.warning("openaq returned http %s for %s", response.status_code, url)
            if response.status_code in (401, 403):
                return None  # fatal auth error, stop retrying
            if 500 <= response.status_code < 600:
                time.sleep(3)  # per-sensor 5xx is usually persistent; retry briefly, then give up
                continue

        time.sleep(OPENAQ_RETRY_DELAY * (2**attempt))
    return None


def _months(start: date, end: date) -> Iterable[tuple[date, date]]:
    current = start.replace(day=1)
    while current <= end:
        last_day = calendar.monthrange(current.year, current.month)[1]
        month_end = current.replace(day=last_day)
        yield max(start, current), min(end, month_end)
        current = date(current.year + (current.month == 12), current.month % 12 + 1, 1)


def _as_date(value: Any, fallback: date) -> date:
    # inventory may carry NaN/empty when openaq reported no coverage range.
    text = str(value)
    if len(text) < 10 or text.lower() == "nan":
        return fallback
    try:
        return date.fromisoformat(text[:10])
    except ValueError:
        return fallback


def _station_units(station: dict[str, Any], start: date, end: date) -> list[tuple[dict[str, Any], date, date]]:
    # only request months within the sensor's active window — skips dead years.
    s = max(start, _as_date(station.get("date_first"), start))
    e = min(end, _as_date(station.get("date_last"), end))
    if s > e:
        return []
    return [(station, m_start, m_end) for m_start, m_end in _months(s, e)]


def _checkpoint_signature() -> dict[str, str]:
    return {"start": FETCH_START_DATE, "end": FETCH_END_DATE}


def _load_checkpoint() -> set[str]:
    if not _CHECKPOINT_FILE.exists():
        return set()
    try:
        payload = json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    if payload.get("parameters") != _checkpoint_signature():
        return set()
    return {str(value) for value in payload.get("completed", [])}


def _save_checkpoint(completed: set[str]) -> None:
    _CHECKPOINT_FILE.write_text(
        json.dumps({"parameters": _checkpoint_signature(), "completed": sorted(completed)}),
        encoding="utf-8",
    )


def _measurement_time(measurement: dict[str, Any]) -> str | None:
    period = measurement.get("period") or {}
    value = period.get("datetimeFrom") or measurement.get("datetime")
    if isinstance(value, dict):
        value = value.get("utc")
    return str(value) if value else None


def _fetch_month(sensor: dict[str, Any], start: date, end: date) -> list[dict[str, Any]] | None:
    records: list[dict[str, Any]] = []
    page = 1
    url = f"{OPENAQ_BASE_URL}/sensors/{int(sensor['sensor_id'])}/measurements"
    while True:
        payload = _request(
            url,
            {
                "datetime_from": f"{start.isoformat()}T00:00:00Z",
                "datetime_to": f"{end.isoformat()}T23:59:59Z",
                "limit": 1_000,
                "page": page,
            },
        )
        if payload is None:
            return None
        measurements = payload.get("results", [])
        for measurement in measurements:
            timestamp = _measurement_time(measurement)
            value = measurement.get("value")
            if timestamp is None or value is None:
                continue
            records.append(
                {
                    "datetime": timestamp,
                    "sensor_id": int(sensor["sensor_id"]),
                    "location": sensor["location"],
                    "country": sensor["country"],
                    "lat": sensor["lat"],
                    "lon": sensor["lon"],
                    "value": value,
                    "unit": measurement.get("parameter", {}).get("units") or measurement.get("unit"),
                }
            )
        if len(measurements) < 1_000:
            return records
        page += 1


def _append(records: list[dict[str, Any]]) -> None:
    if not records:
        return
    pd.DataFrame.from_records(records, columns=_RAW_COLUMNS).to_csv(
        _PARTIAL_FILE,
        mode="a",
        index=False,
        header=not _PARTIAL_FILE.exists(),
    )


def fetch_all(force: bool = False) -> bool:
    """Fetch every station-month in the inventory and write the raw pull once complete."""
    if RAW_OPENAQ_FILE.exists() and not force:
        logger.info("[2/7] openaq pull already present: %s (pass force=True to rebuild)", RAW_OPENAQ_FILE)
        return True
    if not STATION_INVENTORY_FILE.exists():
        logger.error("Station inventory is missing: %s", STATION_INVENTORY_FILE)
        return False
    stations = pd.read_csv(STATION_INVENTORY_FILE).to_dict("records")
    start = date.fromisoformat(FETCH_START_DATE)
    end = date.fromisoformat(FETCH_END_DATE)
    units = [unit for station in stations for unit in _station_units(station, start, end)]
    completed = _load_checkpoint()
    remaining = [(i, u) for i, u in enumerate(units) if f"{int(u[0]['sensor_id'])}:{u[1]:%Y-%m}" not in completed]
    dead_sensors: set[int] = set()
    skipped = 0
    logger.info("[2/7] pulling openaq pm2.5: %d total station-months, %d already done, %d remaining",
                len(units), len(completed), len(remaining))
    try:
        for progress, (_, (station, month_start, month_end)) in enumerate(remaining, start=1):
            sensor_id = int(station["sensor_id"])
            unit_id = f"{sensor_id}:{month_start:%Y-%m}"
            if sensor_id in dead_sensors:
                completed.add(unit_id)
                continue
            records = _fetch_month(station, month_start, month_end)
            if records is None:
                dead_sensors.add(sensor_id)
                completed.add(unit_id)
                _save_checkpoint(completed)
                skipped += 1
                logger.warning("[%d/%d] sensor %s unreachable (5xx); skipping its remaining months", progress, len(remaining), sensor_id)
                continue
            _append(records)
            completed.add(unit_id)
            _save_checkpoint(completed)
            logger.info("[%d/%d] %s, %s (sensor %s): %d readings", progress, len(remaining), station["location"], station["country"], sensor_id, len(records))
    except KeyboardInterrupt:
        _save_checkpoint(completed)
        logger.warning("openaq pull interrupted; rerun to resume")
        return False

    if skipped:
        logger.warning("skipped %d sensor(s) whose measurements endpoint kept returning 5xx", skipped)
    raw = pd.read_csv(_PARTIAL_FILE) if _PARTIAL_FILE.exists() else pd.DataFrame(columns=_RAW_COLUMNS)
    raw.to_csv(RAW_OPENAQ_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("OpenAQ pull complete: %d readings in %s", len(raw), RAW_OPENAQ_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if fetch_all() else 1)
