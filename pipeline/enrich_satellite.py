"""attach daily weather, air-quality, and static features to openaq station-days.

feasibility: one archive call per unique station location (covering its full active
range) instead of per station-day, so enrichment finishes in minutes, not weeks.
static features (population, elevation) are fetched once per location.

weather comes from open-meteo's era5 archive (incl. surface_pressure + precipitation);
pollutant columns come from open-meteo cams (incl. dust + openmeteo_pm25 baseline).
real sentinel-5p/viirs satellite columns are a defensibility upgrade handled
separately (batch/earth-engine extraction) — not a per-station-day live download.
"""

from __future__ import annotations

import json
import logging
import math
import time
from datetime import datetime, timezone
from typing import Any

import pandas as pd
import requests

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

_FEATURES = [
    "pblh", "temperature_2m", "relative_humidity", "u_component_of_wind_10m",
    "v_component_of_wind_10m", "surface_pressure", "precipitation",
    "no2_tropospheric_column", "aerosol_optical_depth",
    "so2_total_column", "co_total_column", "pm10_surface", "dust_surface",
    "openmeteo_pm25", "population_density", "elevation",
]


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


def _request(url: str, params: dict[str, Any]) -> dict[str, Any] | None:
    for attempt in range(OPENMETEO_MAX_RETRIES + 1):
        try:
            response = requests.get(url, params=params, timeout=60)
        except requests.RequestException as error:
            logger.warning("open-meteo request failed: %s", error)
        else:
            if response.status_code == 200:
                return response.json()
            if response.status_code in (429, 502, 503, 504):
                wait = OPENMETEO_RETRY_DELAY * (2**attempt)
                logger.warning("open-meteo http %s; pausing %ds", response.status_code, wait)
                time.sleep(wait)
                continue
            logger.warning("open-meteo http %s for %s", response.status_code, url)
            return None
        time.sleep(OPENMETEO_RETRY_DELAY * (2**attempt))
    return None


def _hourly(payload: dict[str, Any] | None) -> pd.DataFrame | None:
    hourly = (payload or {}).get("hourly") or {}
    times = hourly.get("time")
    if not times:
        return None
    frame = pd.DataFrame(hourly)
    frame["date"] = frame["time"].str.slice(0, 10)
    return frame


def _weather_daily(lat: float, lon: float, start: str, end: str) -> dict[str, dict[str, float]]:
    """daily-mean era5 weather for a location over the whole range (one call)."""
    payload = _request(
        OPENMETEO_ARCHIVE_URL,
        {
            "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
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
        return {}
    speed = pd.to_numeric(frame.get("wind_speed_10m"), errors="coerce")
    direction = pd.to_numeric(frame.get("wind_direction_10m"), errors="coerce")
    radians = direction * math.pi / 180.0
    frame["u_component_of_wind_10m"] = -speed * radians.apply(math.sin)
    frame["v_component_of_wind_10m"] = -speed * radians.apply(math.cos)
    frame = frame.rename(columns={"boundary_layer_height": "pblh", "relative_humidity_2m": "relative_humidity"})
    columns = [
        "pblh", "temperature_2m", "relative_humidity",
        "u_component_of_wind_10m", "v_component_of_wind_10m",
        "surface_pressure", "precipitation",
    ]
    return _daily_means(frame, columns)


def _air_quality_daily(lat: float, lon: float, start: str, end: str) -> dict[str, dict[str, float]]:
    """daily-mean cams pollutant columns for a location over the whole range (one call)."""
    payload = _request(
        _AQ_URL,
        {
            "latitude": lat, "longitude": lon, "start_date": start, "end_date": end,
            "hourly": (
                "nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,"
                "aerosol_optical_depth,pm10,pm2_5,dust"
            ),
            "timezone": "UTC",
        },
    )
    frame = _hourly(payload)
    if frame is None:
        return {}
    frame = frame.rename(columns={
        "nitrogen_dioxide": "no2_tropospheric_column",
        "sulphur_dioxide": "so2_total_column",
        "carbon_monoxide": "co_total_column",
        "pm10": "pm10_surface",
        "pm2_5": "openmeteo_pm25",  # cams baseline for residual / benchmark
        "dust": "dust_surface",
    })
    columns = [
        "no2_tropospheric_column", "so2_total_column", "co_total_column",
        "aerosol_optical_depth", "pm10_surface", "openmeteo_pm25", "dust_surface",
    ]
    return _daily_means(frame, columns)


def _daily_means(frame: pd.DataFrame, columns: list[str]) -> dict[str, dict[str, float]]:
    present = [c for c in columns if c in frame.columns]
    for column in present:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    daily = frame.groupby("date")[present].mean()
    return {date: {k: v for k, v in row.items() if pd.notna(v)} for date, row in daily.to_dict("index").items()}


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
        try:
            out.update({k: v for k, v in source.fetch_data(lat, lon, "").items() if v is not None})
        except Exception as error:
            logger.warning("%s failed at (%.3f, %.3f): %s", source.source_name, lat, lon, error)
    return out


def _load_completed() -> set[str]:
    try:
        return set(json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8")).get("completed", []))
    except (OSError, json.JSONDecodeError):
        return set()


def _save_completed(completed: set[str]) -> None:
    _CHECKPOINT_FILE.write_text(json.dumps({"completed": sorted(completed)}), encoding="utf-8")


def enrich(force: bool = False) -> bool:
    """enrich station-days one unique location at a time; missing retrievals stay null."""
    if ENRICHED_FILE.exists() and not force:
        logger.info("[3/7] enrichment already present: %s (pass force=True to rebuild)", ENRICHED_FILE)
        return True
    if not RAW_OPENAQ_FILE.exists():
        logger.error("openaq pull is missing: %s", RAW_OPENAQ_FILE)
        return False
    observations = _daily_observations()
    observations["loc"] = observations["lat"].round(2).astype(str) + "," + observations["lon"].round(2).astype(str)
    groups = list(observations.groupby("loc"))
    completed = _load_completed()
    remaining = [(loc, df) for loc, df in groups if loc not in completed]
    worldpop, srtm = WorldPopDataSource(), SRTMDataSource()
    gee = _gee_overlay()  # real satellite columns override cams when available
    now = datetime.now(timezone.utc).isoformat()
    logger.info("[3/7] enriching %d station-days across %d locations (%d already done, %d remaining)",
                len(observations), len(groups), len(completed), len(remaining))
    try:
        for index, (loc, station_days) in enumerate(remaining, start=1):
            lat = float(station_days["lat"].iloc[0])
            lon = float(station_days["lon"].iloc[0])
            start, end = station_days["date"].min(), station_days["date"].max()
            weather = _weather_daily(lat, lon, start, end)
            air = _air_quality_daily(lat, lon, start, end)
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
            pd.DataFrame(rows).to_csv(_PARTIAL_FILE, mode="a", index=False, header=not _PARTIAL_FILE.exists())
            completed.add(loc)
            _save_completed(completed)
            logger.info("[3/7] [%d/%d] %s: %d station-days", index, len(remaining), loc, len(rows))
            time.sleep(OPENMETEO_DELAY_SECONDS)
    except KeyboardInterrupt:
        _save_completed(completed)
        logger.warning("enrichment interrupted; rerun to resume")
        return False

    pd.read_csv(_PARTIAL_FILE).to_csv(ENRICHED_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("enrichment complete: %s", ENRICHED_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if enrich() else 1)
