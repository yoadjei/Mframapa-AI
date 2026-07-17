"""repair an existing training_dataset.csv in place — no full re-enrichment.

1. population_density: the old worldpop 'wpgp' alias 422'd, so every value was NaN.
   fetch the fixed wpgppop density once per unique rounded location (static) and fill.
2. no2/so2/co: on gee rows these were sentinel-5p mol/m2 columns, unit-clashing with the
   cams surface (ug/m3) values elsewhere in the same column. null them on gee rows so
   each column carries a single unit.

resumable via a population cache. run:  python -m pipeline.backfill_dataset
"""

from __future__ import annotations

import logging
import time

import pandas as pd

from backend.data_sources.worldpop import WorldPopDataSource
from pipeline.config import PIPELINE_DATA_DIR, TRAINING_DATASET_FILE

logger = logging.getLogger(__name__)

_CACHE = PIPELINE_DATA_DIR / "population_cache.csv"
_MIXED = ["no2_tropospheric_column", "so2_total_column", "co_total_column"]


def _load_cache() -> dict[tuple[float, float], float | None]:
    if not _CACHE.exists():
        return {}
    cached = pd.read_csv(_CACHE)
    return {
        (round(float(r.lat), 2), round(float(r.lon), 2)):
            (None if pd.isna(r.population_density) else float(r.population_density))
        for r in cached.itertuples()
    }


def _save_cache(cache: dict) -> None:
    pd.DataFrame(
        [{"lat": k[0], "lon": k[1], "population_density": v} for k, v in cache.items()]
    ).to_csv(_CACHE, index=False)


def run() -> bool:
    if not TRAINING_DATASET_FILE.exists():
        logger.error("training dataset missing: %s", TRAINING_DATASET_FILE)
        return False
    df = pd.read_csv(TRAINING_DATASET_FILE)
    df["_lat"] = df["lat"].round(2)
    df["_lon"] = df["lon"].round(2)
    locations = list(df[["_lat", "_lon"]].drop_duplicates().itertuples(index=False, name=None))

    cache = _load_cache()
    worldpop = WorldPopDataSource()
    logger.info("population: %d unique locations (%d already cached)", len(locations), sum(1 for l in locations if l in cache))
    for index, (lat, lon) in enumerate(locations, start=1):
        if (lat, lon) in cache:
            continue
        try:
            cache[(lat, lon)] = worldpop.fetch_data(float(lat), float(lon), "").get("population_density")
        except Exception as error:
            logger.warning("worldpop failed (%.2f, %.2f): %s", lat, lon, error)
            cache[(lat, lon)] = None
        if index % 25 == 0:
            _save_cache(cache)
            logger.info("[%d/%d] population fetched", index, len(locations))
        time.sleep(0.2)
    _save_cache(cache)

    df["population_density"] = [cache.get((la, lo)) for la, lo in zip(df["_lat"], df["_lon"])]
    gee_rows = df["aod_source"].eq("modis_maiac")
    df.loc[gee_rows, _MIXED] = pd.NA
    df = df.drop(columns=["_lat", "_lon"])
    df.to_csv(TRAINING_DATASET_FILE, index=False)
    logger.info(
        "done: population_density %.1f%% filled; nulled unit-mixed no2/so2/co on %d gee rows",
        df["population_density"].notna().mean() * 100, int(gee_rows.sum()),
    )
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if run() else 1)
