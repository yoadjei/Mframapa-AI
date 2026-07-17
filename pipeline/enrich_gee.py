"""real satellite columns via google earth engine (defensibility upgrade).

samples sentinel-5p (no2/so2/co) and modis maiac (aod) server-side, one image per
day for all that day's stations — no per-station downloads. writes
pipeline/data/gee_satellite.csv keyed by (sensor_id, date); enrich_satellite
overlays it onto the cams columns when present.

setup:
    pip install earthengine-api
    earthengine authenticate
    $env:EE_PROJECT = "your-gcp-project-id"
    python -m pipeline.enrich_gee
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import pandas as pd

from pipeline.config import CHECKPOINT_DIR, GEE_SATELLITE_FILE, RAW_OPENAQ_FILE

logger = logging.getLogger(__name__)

_CHECKPOINT_FILE = CHECKPOINT_DIR / "gee.json"
_PARTIAL_FILE = CHECKPOINT_DIR / "gee_partial.csv"
_COLUMNS = ["sensor_id", "date", "no2_tropospheric_column", "so2_total_column", "co_total_column", "aerosol_optical_depth"]

# output column -> (earth-engine collection, band, scale_factor)
_S5P = {
    "no2_tropospheric_column": ("COPERNICUS/S5P/OFFL/L3_NO2", "tropospheric_NO2_column_number_density", 1.0),
    "so2_total_column": ("COPERNICUS/S5P/OFFL/L3_SO2", "SO2_column_number_density", 1.0),
    "co_total_column": ("COPERNICUS/S5P/OFFL/L3_CO", "CO_column_number_density", 1.0),
}
_AOD = ("MODIS/061/MCD19A2_GRANULES", "Optical_Depth_055", 0.001)
_SAMPLE_SCALE_M = 7000  # ~sentinel-5p native pixel size


def _init():
    import ee  # imported lazily so the pipeline doesn't hard-depend on earth engine
    ee.Initialize(project=os.getenv("EE_PROJECT"))
    return ee


def _safe_band(ee, collection_id: str, band: str, start, end, factor: float, out_name: str):
    """Return a single-band image, masked everywhere when the collection is empty for this day."""
    col = ee.ImageCollection(collection_id).filterDate(start, end).select(band)
    # Server-side branch: if collection has images, use mean*factor; otherwise return a fully-masked constant
    empty_img = ee.Image.constant(0).rename(out_name).updateMask(ee.Image.constant(0))
    filled_img = col.mean().multiply(factor).rename(out_name)
    return ee.Image(ee.Algorithms.If(col.size().gt(0), filled_img, empty_img))


def _day_image(ee, date: str):
    start = ee.Date(date)
    end = start.advance(1, "day")
    image = None
    for column, (collection, band, factor) in _S5P.items():
        band_image = _safe_band(ee, collection, band, start, end, factor, column)
        image = band_image if image is None else image.addBands(band_image)
    aod_collection, aod_band, aod_factor = _AOD
    aod = _safe_band(ee, aod_collection, aod_band, start, end, aod_factor, "aerosol_optical_depth")
    return image.addBands(aod)


def _sample_day(ee, date: str, stations: list[dict[str, Any]]) -> list[dict[str, Any]]:
    points = ee.FeatureCollection([
        ee.Feature(ee.Geometry.Point([float(s["lon"]), float(s["lat"])]), {"sensor_id": int(s["sensor_id"])})
        for s in stations
    ])
    sampled = _day_image(ee, date).reduceRegions(collection=points, reducer=ee.Reducer.mean(), scale=_SAMPLE_SCALE_M)
    rows = []
    for feature in sampled.getInfo().get("features", []):
        props = feature.get("properties", {})
        rows.append({column: props.get(column) for column in _COLUMNS[2:]} | {"sensor_id": props.get("sensor_id"), "date": date})
    return rows


def _stations_by_date() -> dict[str, list[dict[str, Any]]]:
    raw = pd.read_csv(RAW_OPENAQ_FILE)
    raw["date"] = pd.to_datetime(raw["datetime"], utc=True, errors="coerce").dt.date.astype(str)
    raw = raw.dropna(subset=["date", "sensor_id"])
    return {
        date: group.drop_duplicates("sensor_id")[["sensor_id", "lat", "lon"]].to_dict("records")
        for date, group in raw.groupby("date")
    }


def _load_completed() -> set[str]:
    try:
        return set(json.loads(_CHECKPOINT_FILE.read_text(encoding="utf-8")).get("completed", []))
    except (OSError, json.JSONDecodeError):
        return set()


def _save_completed(completed: set[str]) -> None:
    _CHECKPOINT_FILE.write_text(json.dumps({"completed": sorted(completed)}), encoding="utf-8")


def run() -> bool:
    if not RAW_OPENAQ_FILE.exists():
        logger.error("openaq pull is missing: %s", RAW_OPENAQ_FILE)
        return False
    try:
        ee = _init()
    except Exception as error:
        logger.error("earth engine init failed (run `earthengine authenticate`, set EE_PROJECT): %s", error)
        return False

    by_date = _stations_by_date()
    dates = sorted(by_date)
    completed = _load_completed()
    remaining = [d for d in dates if d not in completed]
    logger.info("[gee] %d total dates, %d already done, %d remaining", len(dates), len(completed), len(remaining))
    errors = 0
    try:
        for index, date in enumerate(remaining, start=1):
            try:
                rows = _sample_day(ee, date, by_date[date])
            except Exception as exc:
                errors += 1
                logger.warning("[gee] [%d/%d] %s: SKIPPED (%s)", index, len(remaining), date, exc)
                # still mark as completed so we don't retry endlessly on a permanently-bad day
                completed.add(date)
                _save_completed(completed)
                continue
            pd.DataFrame(rows, columns=_COLUMNS).to_csv(_PARTIAL_FILE, mode="a", index=False, header=not _PARTIAL_FILE.exists())
            completed.add(date)
            _save_completed(completed)
            logger.info("[gee] [%d/%d] %s: %d stations", index, len(remaining), date, len(rows))
            time.sleep(0.5)
    except KeyboardInterrupt:
        _save_completed(completed)
        logger.warning("gee sampling interrupted; rerun to resume")
        return False

    if errors:
        logger.warning("[gee] %d dates had errors and were skipped", errors)
    if not _PARTIAL_FILE.exists():
        logger.warning("[gee] no data was collected")
        return False
    pd.read_csv(_PARTIAL_FILE).to_csv(GEE_SATELLITE_FILE, index=False)
    _PARTIAL_FILE.unlink(missing_ok=True)
    _CHECKPOINT_FILE.unlink(missing_ok=True)
    logger.info("gee satellite enrichment complete: %s", GEE_SATELLITE_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if run() else 1)
