"""discover active african pm2.5 sensors from openaq v3."""

from __future__ import annotations

import json
import logging
import time
from pathlib import Path
from typing import Any, Iterable

import pandas as pd
import requests

from pipeline.config import (
    AFRICAN_COUNTRIES,
    CHECKPOINT_DIR,
    OPENAQ_API_KEY,
    OPENAQ_BASE_URL,
    OPENAQ_DELAY_SECONDS,
    OPENAQ_MAX_RETRIES,
    OPENAQ_RETRY_DELAY,
    STATION_INVENTORY_FILE,
)

logger = logging.getLogger(__name__)

_CHECKPOINT_FILE = CHECKPOINT_DIR / "station_discovery.json"
_PARTIAL_FILE = CHECKPOINT_DIR / "station_discovery_partial.csv"
# date_first/date_last carry each sensor's active range so the fetch skips empty months.
_INVENTORY_COLUMNS = ["sensor_id", "location", "country", "lat", "lon", "date_first", "date_last"]


def _headers() -> dict[str, str]:
    headers = {"Accept": "application/json"}
    if OPENAQ_API_KEY:
        headers["X-API-Key"] = OPENAQ_API_KEY
    return headers


# every african iso-3166 alpha-2 code; the openaq id for each is resolved at runtime.
_AFRICAN_ISO = frozenset({
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD",
    "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
    "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
    "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
    "ZM", "ZW",
})


def _load_checkpoint(countries: dict[str, int]) -> set[str]:
    if not _CHECKPOINT_FILE.exists():
        return set()
    try:
        payload = json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return set()
    if payload.get("countries") != countries:
        return set()
    return {str(value) for value in payload.get("completed", [])}


def _save_checkpoint(completed: set[str], countries: dict[str, int]) -> None:
    payload = {"countries": countries, "completed": sorted(completed)}
    _CHECKPOINT_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _request(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    for attempt in range(OPENAQ_MAX_RETRIES):
        try:
            response = requests.get(url, params=params, headers=_headers(), timeout=30)
        except requests.RequestException as error:
            logger.warning("openaq request failed: %s", error)
        else:
            if response.status_code == 429:
                reset_time = response.headers.get("x-ratelimit-reset")
                sleep_time = int(reset_time) if reset_time and reset_time.isdigit() else 60
                logger.warning("openaq rate limit exceeded (429). pausing %ds", sleep_time)
                time.sleep(sleep_time)
                continue

            if response.ok:
                remaining = response.headers.get("x-ratelimit-remaining")
                if remaining is not None and remaining.isdigit() and int(remaining) <= 2:
                    reset_time = response.headers.get("x-ratelimit-reset")
                    sleep_time = int(reset_time) if reset_time and reset_time.isdigit() else 60
                    logger.warning("openaq limit nearly exhausted; pausing %ds", sleep_time)
                    time.sleep(sleep_time)
                else:
                    time.sleep(OPENAQ_DELAY_SECONDS)
                return response.json()

            logger.warning("openaq returned http %s for %s", response.status_code, url)
            if response.status_code in (401, 403):
                return None  # fatal auth error, stop retrying

        time.sleep(OPENAQ_RETRY_DELAY * (2**attempt))
    return None


def _pages(url: str, params: dict[str, Any]) -> Iterable[dict[str, Any]]:
    page = 1
    while True:
        payload = _request(url, {**params, "page": page, "limit": 1_000})
        if payload is None:
            return
        results = payload.get("results", [])
        if not results:
            return
        yield from results
        if len(results) < 1_000:
            return
        page += 1


def _is_pm25(sensor: dict[str, Any]) -> bool:
    parameter = sensor.get("parameter") or {}
    name = str(parameter.get("name") or parameter.get("displayName") or "").lower()
    return name in {"pm25", "pm2.5"}


def african_countries() -> dict[str, int]:
    """resolve openaq country ids for every african iso code; fall back to the config map."""
    mapping: dict[str, int] = {}
    for country in _pages(f"{OPENAQ_BASE_URL}/countries", {}):
        code = str(country.get("code") or "").upper()
        country_id = country.get("id")
        if code in _AFRICAN_ISO and country_id is not None:
            mapping[code] = int(country_id)
    if not mapping:
        logger.warning("could not fetch openaq /countries; using built-in list of %d", len(AFRICAN_COUNTRIES))
        return dict(AFRICAN_COUNTRIES)
    logger.info("resolved %d african countries from openaq /countries", len(mapping))
    return dict(sorted(mapping.items()))


def _iso_date(node: Any) -> str | None:
    if isinstance(node, dict):
        node = node.get("utc") or node.get("local")
    return str(node)[:10] if node else None


def _country_sensors(country: str, country_id: int) -> list[dict[str, Any]]:
    """read pm2.5 sensors inline from the /locations payload (no per-location call)."""
    records: list[dict[str, Any]] = []
    for location in _pages(f"{OPENAQ_BASE_URL}/locations", {"countries_id": country_id}):
        coordinates = location.get("coordinates") or {}
        latitude = coordinates.get("latitude")
        longitude = coordinates.get("longitude")
        if latitude is None or longitude is None:
            continue
        # location-level coverage is the fallback; sensor-level is much tighter.
        loc_first = _iso_date(location.get("datetimeFirst"))
        loc_last = _iso_date(location.get("datetimeLast"))
        name = str(location.get("name") or "Unknown").strip() or "Unknown"
        for sensor in location.get("sensors") or []:
            if not _is_pm25(sensor) or sensor.get("id") is None:
                continue
            records.append(
                {
                    "sensor_id": int(sensor["id"]),
                    "location": name,
                    "country": country,
                    "lat": float(latitude),
                    "lon": float(longitude),
                    "date_first": _iso_date(sensor.get("datetimeFirst")) or loc_first,
                    "date_last": _iso_date(sensor.get("datetimeLast")) or loc_last,
                }
            )
    return records


def _append(records: list[dict[str, Any]]) -> None:
    if not records:
        return
    pd.DataFrame.from_records(records, columns=_INVENTORY_COLUMNS).to_csv(
        _PARTIAL_FILE,
        mode="a",
        index=False,
        header=not _PARTIAL_FILE.exists(),
    )


def discover_stations(force: bool = False) -> Path | None:
    """write one fresh openaq pm2.5 sensor inventory for the configured countries."""
    # already built on a prior run — reuse it so reruns resume at the fetch stage.
    if not force and STATION_INVENTORY_FILE.exists():
        logger.info("[1/7] station inventory already present: %s (pass force=True to rebuild)", STATION_INVENTORY_FILE)
        return STATION_INVENTORY_FILE

    countries = african_countries()
    completed = _load_checkpoint(countries)
    total = len(countries)
    logger.info("[1/7] discovering openaq stations for %d countries", total)
    try:
        for index, (country, country_id) in enumerate(countries.items(), start=1):
            if country in completed:
                logger.info("[%d/%d] %s: already complete", index, total, country)
                continue
            records = _country_sensors(country, country_id)
            _append(records)
            completed.add(country)
            _save_checkpoint(completed, countries)
            logger.info("[%d/%d] %s: %d pm2.5 sensors", index, total, country, len(records))
    except KeyboardInterrupt:
        _save_checkpoint(completed, countries)
        logger.warning("discovery interrupted; rerun to resume")
        return None

    if len(completed) != total:
        logger.warning("discovery incomplete: %d/%d countries complete", len(completed), total)
        return None
    if _PARTIAL_FILE.exists():
        inventory = pd.read_csv(_PARTIAL_FILE).drop_duplicates(subset="sensor_id")
    else:
        inventory = pd.DataFrame(columns=_INVENTORY_COLUMNS)
    inventory.to_csv(STATION_INVENTORY_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("station discovery complete: %d sensors in %s", len(inventory), STATION_INVENTORY_FILE)
    return STATION_INVENTORY_FILE


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    discover_stations()
