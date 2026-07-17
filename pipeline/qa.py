"""Apply label and identity QA without imputing model features."""

from __future__ import annotations

import logging

import pandas as pd

from pipeline.config import ENRICHED_FILE, LAT_MAX, LAT_MIN, LON_MAX, LON_MIN, PM25_MAX, PM25_MIN, QA_FILE

logger = logging.getLogger(__name__)


def clean_station_days(frame: pd.DataFrame) -> pd.DataFrame:
    """Keep valid labelled station-days and retain all missing feature values."""
    data = frame.copy()
    data = data.rename(columns={"sensor_id": "station_id"})
    data["pm25_surface"] = pd.to_numeric(data["pm25_surface"], errors="coerce")
    data["lat"] = pd.to_numeric(data["lat"], errors="coerce")
    data["lon"] = pd.to_numeric(data["lon"], errors="coerce")
    # geography is enforced by the lat/lon african bounds; country is metadata only,
    # so we don't couple qa to the discovery country list.
    valid = (
        data["station_id"].notna()
        & data["pm25_surface"].gt(PM25_MIN)
        & data["pm25_surface"].le(PM25_MAX)
        & data["lat"].between(LAT_MIN, LAT_MAX)
        & data["lon"].between(LON_MIN, LON_MAX)
    )
    data = data.loc[valid].copy()
    data = data.sort_values(["station_id", "date"]).drop_duplicates(["station_id", "date"], keep="last")
    data["qa_flag"] = "ok"
    data.loc[data["n_obs_pm25"].fillna(0).lt(6), "qa_flag"] = "suspect"
    data.loc[data["imputed_fields"].fillna("").ne(""), "qa_flag"] = "imputed"
    return data.reset_index(drop=True)


def run_qa() -> bool:
    if not ENRICHED_FILE.exists():
        logger.error("Enriched data is missing: %s", ENRICHED_FILE)
        return False
    raw = pd.read_csv(ENRICHED_FILE)
    cleaned = clean_station_days(raw)
    cleaned.to_csv(QA_FILE, index=False)
    logger.info("[4/7] QA complete: %d/%d station-days retained", len(cleaned), len(raw))
    return True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if run_qa() else 1)
