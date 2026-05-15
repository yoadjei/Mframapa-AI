"""Contract checks between ``ml.features`` and the data pipeline."""

from backend.data_sources import orchestrator as orch_mod
from ml.features import FEATURE_COLUMNS


def test_model_features_are_subset_of_orchestrator_plan():
    planned = set(orch_mod._FALLBACK_PLAN.keys())
    # population_density and elevation come from static sources (WorldPop, SRTM)
    # day_of_year and month are derived from the date string in FeaturePipeline
    derived = {"population_density", "elevation", "day_of_year", "month"}
    for col in FEATURE_COLUMNS:
        if col in derived:
            continue
        assert col in planned, f"{col} missing from orchestrator _FALLBACK_PLAN"
