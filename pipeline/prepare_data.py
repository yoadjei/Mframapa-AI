"""Produce the fresh training dataset with the canonical 27-column schema."""

from __future__ import annotations

import logging

import pandas as pd

from ml.regions import assign_region
from ml.urban_rural import classify_from_population_density
from pipeline.config import QA_FILE, TRAINING_COLUMNS, TRAINING_DATASET_FILE

logger = logging.getLogger(__name__)


def prepare() -> pd.DataFrame | None:
    """Assign routing fields and write the training table without feature imputation."""
    if not QA_FILE.exists():
        logger.error("QA data is missing: %s", QA_FILE)
        return None
    data = pd.read_csv(QA_FILE)
    data["date"] = pd.to_datetime(data["date"], errors="coerce").dt.date.astype("string")
    data["region_id"] = [assign_region(float(lat), float(lon)) for lat, lon in zip(data["lat"], data["lon"])]
    data = data[data["region_id"].notna()].copy()
    data["segment"] = [classify_from_population_density(value if pd.notna(value) else None) for value in data["population_density"]]
    for column in TRAINING_COLUMNS:
        if column not in data:
            data[column] = pd.NA
    output = data[TRAINING_COLUMNS].copy()
    output.to_csv(TRAINING_DATASET_FILE, index=False)
    logger.info("[5/7] Training dataset complete: %d rows in %s", len(output), TRAINING_DATASET_FILE)
    return output


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    raise SystemExit(0 if prepare() is not None else 1)
