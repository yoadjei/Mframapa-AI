"""attach daily weather, air-quality, and static features to openaq station-days.

feasibility: one archive call per unique station location (covering its full active
range) instead of per station-day, so enrichment finishes in minutes, not weeks.
static features (population, elevation) are fetched once per location.

weather comes from open-meteo's era5 archive (incl. surface_pressure + precipitation);
pollutant columns come from open-meteo cams (incl. dust + openmeteo_pm25 baseline).
real sentinel-5p/viirs satellite columns are a defensibility upgrade handled
separately (batch/earth-engine extraction) — not a per-station-day live download.

Resilience: date ranges are chunked (Open-Meteo bills long windows as multiple
calls and often times out), DNS/connect failures back off hard, and locations
with zero weather+AQ are left incomplete so the next run retries them.
``force=True`` clears checkpoints so a rebuild is honest.
"""

from __future__ import annotations

import json
import logging
import math
import time
from datetime import date, datetime, timedelta, timezone
from typing import Any, Iterator

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from backend.data_sources.srtm import SRTMDataSource
from backend.data_sources.worldpop import WorldPopDataSource
from pipeline.config import (
    AIRQO_RAW_FILE,
    CHECKPOINT_DIR,
    ENRICHED_FILE,
    GEE_SATELLITE_FILE,
    OPENMETEO_ARCHIVE_URL,
    OPENMETEO_DELAY_SECONDS,
    OPENMETEO_MAX_RETRIES,
    OPENMETEO_RETRY_DELAY,
    RAW_OPENAQ_FILE,
)

# only overlay aod from gee: sentinel-5p no2/so2/co are mol/m2 columns and would
# unit-clash with the cams surface (ug/m3) columns; aod is comparably scaled.
_SATELLITE_COLUMNS = ["aerosol_optical_depth"]

logger = logging.getLogger(__name__)

_CHECKPOINT_FILE = CHECKPOINT_DIR / "enrichment.json"
_PARTIAL_FILE = CHECKPOINT_DIR / "enrichment_partial.csv"
_AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

# Open-Meteo counts windows >~2 weeks as multiple calls; short chunks survive flaky DNS.
_CHUNK_DAYS = 14
_CONNECT_TIMEOUT = 20
_READ_TIMEOUT = 90

_FEATURES = [
    "pblh", "temperature_2m", "relative_humidity", "u_component_of_wind_10m",
    "v_component_of_wind_10m", "surface_pressure", "precipitation",
    "no2_tropospheric_column", "aerosol_optical_depth",
    "so2_total_column", "co_total_column", "pm10_surface", "dust_surface",
    "openmeteo_pm25", "population_density", "elevation",
]

_SESSION: requests.Session | None = None


def _session() -> requests.Session:
    global _SESSION
    if _SESSION is not None:
        return _SESSION
    session = requests.Session()
    retry = Retry(
        total=0,  # we handle retries ourselves (need sleep between DNS failures)
        connect=0,
        read=0,
        redirect=3,
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=4)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": "MframapaEnrich/1.0 (+https://mframapa.live)"})
    _SESSION = session
    return session


def _load_raw() -> pd.DataFrame:
    # merge the openaq pull with the airqo pull when the latter exists; tag provenance.
    openaq = pd.read_csv(RAW_OPENAQ_FILE)
    if "source" not in openaq.columns:
        openaq["source"] = "openaq"
    frames = [openaq]
    if AIRQO_RAW_FILE.exists():
        airqo = pd.read_csv(AIRQO_RAW_FILE)
        if "source" not in airqo.columns:
            airqo["source"] = "airqo"
        frames.append(airqo)
        logger.info("merging %d airqo rows with the openaq pull", len(airqo))
    return pd.concat(frames, ignore_index=True)


def _daily_observations() -> pd.DataFrame:
    raw = _load_raw()
    raw["datetime"] = pd.to_datetime(raw["datetime"], utc=True, errors="coerce")
    raw["value"] = pd.to_numeric(raw["value"], errors="coerce")
    units = raw["unit"].fillna("ug/m3").str.lower().str.replace("μ", "u", regex=False)
    raw.loc[units.str.contains("mg", na=False), "value"] *= 1_000
    raw = raw.dropna(subset=["datetime", "sensor_id", "value"]).sort_values(["sensor_id", "datetime"])
    # drop stuck-sensor runs of >=6 identical consecutive readings.
    run = raw.groupby("sensor_id")["value"].transform(
        lambda values: values.groupby(values.ne(values.shift()).cumsum()).transform("size")
    )
    raw = raw[run < 6]
    raw["date"] = raw["datetime"].dt.date.astype(str)
    return raw.groupby(["date", "sensor_id", "location", "country", "lat", "lon", "source"], as_index=False).agg(
        pm25_surface=("value", "mean"), n_obs_pm25=("value", "size")
    )


def _date_chunks(start: str, end: str, max_days: int = _CHUNK_DAYS) -> Iterator[tuple[str, str]]:
    """Yield inclusive [start, end] windows of at most ``max_days`` days."""
    cursor = date.fromisoformat(start)
    last = date.fromisoformat(end)
    if cursor > last:
        return
    step = max(1, int(max_days))
    while cursor <= last:
        chunk_end = min(cursor + timedelta(days=step - 1), last)
        yield cursor.isoformat(), chunk_end.isoformat()
        cursor = chunk_end + timedelta(days=1)


def _request(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    """GET with exponential backoff on DNS / connect / 429 / 5xx."""
    timeout = (_CONNECT_TIMEOUT, _READ_TIMEOUT)
    for attempt in range(OPENMETEO_MAX_RETRIES + 1):
        try:
            response = _session().get(url, params=params, timeout=timeout)
        except requests.RequestException as error:
            wait = OPENMETEO_RETRY_DELAY * (2**attempt)
            logger.warning(
                "open-meteo request failed (attempt %d/%d): %s — pause %ds",
                attempt + 1, OPENMETEO_MAX_RETRIES + 1, error, wait,
            )
            time.sleep(wait)
            continue
        if response.status_code == 200:
            try:
                return response.json()
            except ValueError:
                logger.warning("open-meteo returned non-JSON for %s", url)
                return None
        if response.status_code in (429, 502, 503, 504):
            wait = OPENMETEO_RETRY_DELAY * (2**attempt)
            logger.warning("open-meteo http %s; pausing %ds", response.status_code, wait)
            time.sleep(wait)
            continue
        logger.warning("open-meteo http %s for %s", response.status_code, url)
        return None
    return None


def _hourly(payload: dict[str, Any] | None) -> pd.DataFrame | None:
    hourly = (payload or {}).get("hourly") or {}
    times = hourly.get("time")
    if not times:
        return None
    frame = pd.DataFrame(hourly)
    frame["date"] = frame["time"].str.slice(0, 10)
    return frame


def _merge_daily(*parts: dict[str, dict[str, float]]) -> dict[str, dict[str, float]]:
    out: dict[str, dict[str, float]] = {}
    for part in parts:
        for day, values in part.items():
            out.setdefault(day, {}).update(values)
    return out


def _weather_daily(lat: float, lon: float, start: str, end: str) -> dict[str, dict[str, float]]:
    """daily-mean era5 weather — fetched in short chunks to avoid timeouts."""
    parts: list[dict[str, dict[str, float]]] = []
    for chunk_start, chunk_end in _date_chunks(start, end):
        payload = _request(
            OPENMETEO_ARCHIVE_URL,
            {
                "latitude": lat, "longitude": lon,
                "start_date": chunk_start, "end_date": chunk_end,
                "hourly": (
                    "boundary_layer_height,temperature_2m,relative_humidity_2m,"
                    "surface_pressure,precipitation,"
                    "wind_speed_10m,wind_direction_10m"
                ),
                "timezone": "UTC",
            },
        )
        frame = _hourly(payload)
        if frame is None:
            continue
        speed = pd.to_numeric(frame.get("wind_speed_10m"), errors="coerce")
        direction = pd.to_numeric(frame.get("wind_direction_10m"), errors="coerce")
        radians = direction * math.pi / 180.0
        frame["u_component_of_wind_10m"] = -speed * radians.apply(math.sin)
        frame["v_component_of_wind_10m"] = -speed * radians.apply(math.cos)
        frame = frame.rename(
            columns={"boundary_layer_height": "pblh", "relative_humidity_2m": "relative_humidity"}
        )
        columns = [
            "pblh", "temperature_2m", "relative_humidity",
            "u_component_of_wind_10m", "v_component_of_wind_10m",
            "surface_pressure", "precipitation",
        ]
        parts.append(_daily_means(frame, columns))
        time.sleep(OPENMETEO_DELAY_SECONDS)
    return _merge_daily(*parts)


def _air_quality_daily(lat: float, lon: float, start: str, end: str) -> dict[str, dict[str, float]]:
    """daily-mean cams pollutant columns — chunked like weather."""
    parts: list[dict[str, dict[str, float]]] = []
    for chunk_start, chunk_end in _date_chunks(start, end):
        payload = _request(
            _AQ_URL,
            {
                "latitude": lat, "longitude": lon,
                "start_date": chunk_start, "end_date": chunk_end,
                "hourly": (
                    "nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,"
                    "aerosol_optical_depth,pm10,pm2_5,dust"
                ),
                "timezone": "UTC",
            },
        )
        frame = _hourly(payload)
        if frame is None:
            continue
        frame = frame.rename(columns={
            "nitrogen_dioxide": "no2_tropospheric_column",
            "sulphur_dioxide": "so2_total_column",
            "carbon_monoxide": "co_total_column",
            "pm10": "pm10_surface",
            "pm2_5": "openmeteo_pm25",
            "dust": "dust_surface",
        })
        columns = [
            "no2_tropospheric_column", "so2_total_column", "co_total_column",
            "aerosol_optical_depth", "pm10_surface", "openmeteo_pm25", "dust_surface",
        ]
        parts.append(_daily_means(frame, columns))
        time.sleep(OPENMETEO_DELAY_SECONDS)
    return _merge_daily(*parts)


def _daily_means(frame: pd.DataFrame, columns: list[str]) -> dict[str, dict[str, float]]:
    present = [c for c in columns if c in frame.columns]
    for column in present:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    daily = frame.groupby("date")[present].mean()
    return {d: {k: v for k, v in row.items() if pd.notna(v)} for d, row in daily.to_dict("index").items()}


def _gee_overlay() -> dict[tuple[int, str], dict[str, float]]:
    """optional real-satellite columns keyed by (sensor_id, date); empty if not generated."""
    if not GEE_SATELLITE_FILE.exists():
        return {}
    frame = pd.read_csv(GEE_SATELLITE_FILE)
    overlay: dict[tuple[int, str], dict[str, float]] = {}
    for record in frame.to_dict("records"):
        key = (int(record["sensor_id"]), str(record["date"]))
        overlay[key] = {c: record[c] for c in _SATELLITE_COLUMNS if c in record and pd.notna(record[c])}
    return overlay


def _static(worldpop: WorldPopDataSource, srtm: SRTMDataSource, lat: float, lon: float) -> dict[str, float]:
    out: dict[str, float] = {}
    for source in (worldpop, srtm):
        for attempt in range(3):
            try:
                out.update({k: v for k, v in source.fetch_data(lat, lon, "").items() if v is not None})
                break
            except Exception as error:
                wait = 5 * (2**attempt)
                logger.warning(
                    "%s failed at (%.3f, %.3f) attempt %d: %s — pause %ds",
                    source.source_name, lat, lon, attempt + 1, error, wait,
                )
                time.sleep(wait)
    return out


def _load_completed() -> set[str]:
    try:
        return set(json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8")).get("completed", []))
    except (OSError, json.JSONDecodeError):
        return set()


def _save_completed(completed: set[str]) -> None:
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    _CHECKPOINT_FILE.write_text(json.dumps({"completed": sorted(completed)}), encoding="utf-8")


def _clear_progress() -> None:
    """Wipe enrichment outputs/checkpoints so force rebuilds are honest."""
    for path in (ENRICHED_FILE, _PARTIAL_FILE, _CHECKPOINT_FILE):
        try:
            path.unlink(missing_ok=True)
        except OSError as error:
            logger.warning("could not remove %s: %s", path, error)


def enrich(force: bool = False) -> bool:
    """enrich station-days one unique location at a time; missing retrievals stay null."""
    if ENRICHED_FILE.exists() and not force:
        logger.info("[3/7] enrichment already present: %s (pass force=True to rebuild)", ENRICHED_FILE)
        return True
    if not RAW_OPENAQ_FILE.exists():
        logger.error("openaq pull is missing: %s", RAW_OPENAQ_FILE)
        return False
    if force:
        logger.info("[3/7] force=True — clearing enrichment checkpoints and partials")
        _clear_progress()

    observations = _daily_observations()
    observations["loc"] = observations["lat"].round(2).astype(str) + "," + observations["lon"].round(2).astype(str)
    groups = list(observations.groupby("loc"))
    completed = _load_completed()
    remaining = [(loc, df) for loc, df in groups if loc not in completed]
    worldpop, srtm = WorldPopDataSource(), SRTMDataSource()
    gee = _gee_overlay()  # real satellite columns override cams when available
    now = datetime.now(timezone.utc).isoformat()
    skipped = 0
    logger.info(
        "[3/7] enriching %d station-days across %d locations (%d already done, %d remaining)",
        len(observations), len(groups), len(completed), len(remaining),
    )
    try:
        for index, (loc, station_days) in enumerate(remaining, start=1):
            lat = float(station_days["lat"].iloc[0])
            lon = float(station_days["lon"].iloc[0])
            start, end = station_days["date"].min(), station_days["date"].max()
            weather = _weather_daily(lat, lon, start, end)
            air = _air_quality_daily(lat, lon, start, end)
            if not weather and not air:
                skipped += 1
                logger.warning(
                    "[3/7] [%d/%d] %s: no weather/AQ (network?) — left incomplete for retry",
                    index, len(remaining), loc,
                )
                time.sleep(OPENMETEO_DELAY_SECONDS * 2)
                continue

            static = _static(worldpop, srtm, lat, lon)
            rows = []
            for record in station_days.to_dict("records"):
                features = {feature: None for feature in _FEATURES}
                features.update(weather.get(record["date"], {}))
                features.update(air.get(record["date"], {}))
                features.update(static)
                satellite = gee.get((int(record["sensor_id"]), str(record["date"])))
                if satellite:
                    features.update(satellite)
                if satellite and satellite.get("aerosol_optical_depth") is not None:
                    aod_source = "modis_maiac"
                elif features.get("aerosol_optical_depth") is not None:
                    aod_source = "openmeteo"
                else:
                    aod_source = "none"
                rows.append({
                    "date": record["date"],
                    "sensor_id": record["sensor_id"],
                    "location": record["location"],
                    "country": record["country"],
                    "lat": record["lat"],
                    "lon": record["lon"],
                    "pm25_surface": record["pm25_surface"],
                    "n_obs_pm25": record["n_obs_pm25"],
                    **features,
                    "aod_source": aod_source,
                    "imputed_fields": "",
                    "qa_flag": "ok",
                    "pm25_source": record.get("source", "openaq"),
                    "pulled_at_utc": now,
                })
            CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
            pd.DataFrame(rows).to_csv(_PARTIAL_FILE, mode="a", index=False, header=not _PARTIAL_FILE.exists())
            completed.add(loc)
            _save_completed(completed)
            logger.info(
                "[3/7] [%d/%d] %s: %d station-days (weather_days=%d aq_days=%d)",
                index, len(remaining), loc, len(rows), len(weather), len(air),
            )
            time.sleep(OPENMETEO_DELAY_SECONDS)
    except KeyboardInterrupt:
        _save_completed(completed)
        logger.warning("enrichment interrupted; rerun to resume (%d done, %d skipped)", len(completed), skipped)
        return False

    if not _PARTIAL_FILE.exists():
        logger.error("[3/7] no locations enriched — check network / DNS for archive-api.open-meteo.com")
        return False

    if skipped:
        logger.warning(
            "[3/7] finished with %d location(s) still incomplete — rerun without force=True to resume",
            skipped,
        )
        return False

    pd.read_csv(_PARTIAL_FILE).to_csv(ENRICHED_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("enrichment complete: %s", ENRICHED_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if enrich() else 1)
