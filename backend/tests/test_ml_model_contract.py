"""Contract checks between ``ml.features`` and the data pipeline."""

from backend.data_sources import orchestrator as orch_mod
from ml.features import FEATURE_COLUMNS


def test_model_features_are_subset_of_orchestrator_plan():
    planned = set(orch_mod._FALLBACK_PLAN.keys())
    for col in FEATURE_COLUMNS:
        if col in ("population_density", "elevation"):
            continue
        assert col in planned, f"{col} missing from orchestrator _FALLBACK_PLAN"
