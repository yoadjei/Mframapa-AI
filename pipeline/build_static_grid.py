"""build the static-feature grid (ndvi + night-lights) for africa via earth engine.

samples multi-year mean ndvi (modis) and night-lights (viirs) on a 0.2-degree grid,
writes ml/data/static_grid.csv. ml/static_features looks these up at training and
inference to give the model spatial-baseline context (vegetation, urbanisation).

setup: same as enrich_gee (earthengine authenticate, set EE_PROJECT).
    python -m pipeline.build_static_grid
"""

from __future__ import annotations

import json
import logging
import os

import numpy as np
import pandas as pd

from ml.paths import repository_root

logger = logging.getLogger(__name__)

_GRID_FILE = repository_root() / "ml" / "data" / "static_grid.csv"
_PARTIAL = repository_root() / "ml" / "data" / "static_grid_partial.csv"
_CHECKPOINT = repository_root() / "ml" / "data" / "static_grid.json"

_STEP = 0.2
_LAT_RANGE = (-35.0, 37.0)
_LON_RANGE = (-18.0, 52.0)
_BATCH = 4000
_SCALE_M = 1000


def _init():
    import ee
    from dotenv import load_dotenv
    load_dotenv(repository_root() / ".env")  # this script doesn't import pipeline.config
    ee.Initialize(project=os.getenv("EE_PROJECT"))
    return ee


def _static_image(ee):
    ndvi = (
        ee.ImageCollection("MODIS/061/MOD13A2").filterDate("2020-01-01", "2025-01-01")
        .select("NDVI").mean().multiply(0.0001).rename("ndvi")
    )
    lights = (
        ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG").filterDate("2020-01-01", "2025-01-01")
        .select("avg_rad").mean().rename("night_lights")
    )
    return ndvi.addBands(lights)


def _grid_points() -> list[tuple[float, float]]:
    lats = np.arange(_LAT_RANGE[0], _LAT_RANGE[1] + 1e-9, _STEP)
    lons = np.arange(_LON_RANGE[0], _LON_RANGE[1] + 1e-9, _STEP)
    return [(round(float(a), 2), round(float(b), 2)) for a in lats for b in lons]


def _sample(ee, image, batch: list[tuple[float, float]]) -> list[dict]:
    fc = ee.FeatureCollection([
        ee.Feature(ee.Geometry.Point([lon, lat]), {"lat": lat, "lon": lon}) for lat, lon in batch
    ])
    sampled = image.reduceRegions(collection=fc, reducer=ee.Reducer.mean(), scale=_SCALE_M)
    rows = []
    for f in sampled.getInfo().get("features", []):
        p = f.get("properties", {})
        rows.append({"lat": p.get("lat"), "lon": p.get("lon"), "ndvi": p.get("ndvi"), "night_lights": p.get("night_lights")})
    return rows


def _load_done() -> int:
    try:
        return int(json.loads(_CHECKPOINT.read_text(encoding="utf-8")).get("batches_done", 0))
    except (OSError, json.JSONDecodeError, ValueError):
        return 0


def _save_done(n: int) -> None:
    _CHECKPOINT.write_text(json.dumps({"batches_done": n}), encoding="utf-8")


def run() -> bool:
    try:
        ee = _init()
    except Exception as error:
        logger.error("earth engine init failed (authenticate + set EE_PROJECT): %s", error)
        return False

    image = _static_image(ee)
    points = _grid_points()
    batches = [points[i:i + _BATCH] for i in range(0, len(points), _BATCH)]
    done = _load_done()
    logger.info("static grid: %d points, %d batches, %d already done", len(points), len(batches), done)
    try:
        for index in range(done, len(batches)):
            rows = _sample(ee, image, batches[index])
            pd.DataFrame(rows, columns=["lat", "lon", "ndvi", "night_lights"]).to_csv(
                _PARTIAL, mode="a", index=False, header=not _PARTIAL.exists()
            )
            _save_done(index + 1)
            logger.info("static grid: batch %d/%d", index + 1, len(batches))
    except KeyboardInterrupt:
        logger.warning("static grid interrupted; rerun to resume")
        return False

    if not _PARTIAL.exists():
        logger.warning("static grid: no data collected")
        return False
    grid = pd.read_csv(_PARTIAL).dropna(subset=["ndvi", "night_lights"], how="all")
    grid.to_csv(_GRID_FILE, index=False)
    _PARTIAL.unlink(missing_ok=True)
    _CHECKPOINT.unlink(missing_ok=True)
    logger.info("static grid complete: %d land cells in %s", len(grid), _GRID_FILE)
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if run() else 1)
