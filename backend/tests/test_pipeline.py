"""Tests for FeaturePipeline (Week 5 — feature enrichment)."""

import pytest
from unittest.mock import patch, MagicMock
from backend.pipeline.feature_pipeline import FeaturePipeline

ACCRA = (5.6037, -0.1870, "2024-06-01")

MOCK_DYNAMIC = {
    "pblh": 850.0,
    "temperature_2m": 28.5,
    "relative_humidity": 72.0,
    "u_component_of_wind_10m": 1.2,
    "v_component_of_wind_10m": -0.8,
    "no2_tropospheric_column": 1.5e-5,
    "aerosol_optical_depth": 0.31,
    "so2_total_column": 5e-4,
    "co_total_column": 3.2e-2,
    "pm10_surface": 22.0,
    "pm25_surface": 14.0,
}
MOCK_POP     = {"population_density": 1500.0}
MOCK_TERRAIN = {"elevation": 61.0}


def _make_pipeline():
    with patch("backend.pipeline.feature_pipeline.DataOrchestrator") as MockOrch, \
         patch("backend.pipeline.feature_pipeline.WorldPopDataSource") as MockWP,  \
         patch("backend.pipeline.feature_pipeline.SRTMDataSource") as MockSRTM:

        MockOrch.return_value.get_features.return_value = MOCK_DYNAMIC
        MockWP.return_value.fetch_data.return_value     = MOCK_POP
        MockSRTM.return_value.fetch_data.return_value   = MOCK_TERRAIN

        pipeline = FeaturePipeline()

    return pipeline, MockOrch.return_value, MockWP.return_value, MockSRTM.return_value


class TestFeaturePipeline:

    def test_get_features_returns_all_groups(self):
        pipeline, *_ = _make_pipeline()
        features = pipeline.get_features(*ACCRA)
        assert "temperature_2m"     in features   # dynamic
        assert "population_density" in features   # demographic
        assert "elevation"          in features   # terrain

    def test_dynamic_features_correct(self):
        pipeline, *_ = _make_pipeline()
        features = pipeline.get_features(*ACCRA)
        assert features["pblh"] == pytest.approx(850.0)
        assert features["aerosol_optical_depth"] == pytest.approx(0.31)

    def test_population_density_correct(self):
        pipeline, *_ = _make_pipeline()
        assert pipeline.get_features(*ACCRA)["population_density"] == pytest.approx(1500.0)

    def test_elevation_correct(self):
        pipeline, *_ = _make_pipeline()
        assert pipeline.get_features(*ACCRA)["elevation"] == pytest.approx(61.0)

    def test_orchestrator_called_with_correct_args(self):
        pipeline, mock_orch, _, _ = _make_pipeline()
        pipeline.get_features(*ACCRA)
        mock_orch.get_features.assert_called_once_with(*ACCRA)

    def test_worldpop_failure_returns_none_density(self):
        with patch("backend.pipeline.feature_pipeline.DataOrchestrator") as MockOrch, \
             patch("backend.pipeline.feature_pipeline.WorldPopDataSource") as MockWP,  \
             patch("backend.pipeline.feature_pipeline.SRTMDataSource") as MockSRTM:

            MockOrch.return_value.get_features.return_value = MOCK_DYNAMIC
            MockWP.return_value.fetch_data.side_effect = ConnectionError("WorldPop down")
            MockSRTM.return_value.fetch_data.return_value = MOCK_TERRAIN

            features = FeaturePipeline().get_features(*ACCRA)

        assert features["population_density"] is None
        assert features["elevation"] == pytest.approx(61.0)

    def test_srtm_failure_returns_none_elevation(self):
        with patch("backend.pipeline.feature_pipeline.DataOrchestrator") as MockOrch, \
             patch("backend.pipeline.feature_pipeline.WorldPopDataSource") as MockWP,  \
             patch("backend.pipeline.feature_pipeline.SRTMDataSource") as MockSRTM:

            MockOrch.return_value.get_features.return_value = MOCK_DYNAMIC
            MockWP.return_value.fetch_data.return_value = MOCK_POP
            MockSRTM.return_value.fetch_data.side_effect = ConnectionError("SRTM down")

            features = FeaturePipeline().get_features(*ACCRA)

        assert features["elevation"] is None
        assert features["population_density"] == pytest.approx(1500.0)

    def test_all_features_merged_without_overwrite(self):
        """Static features must not overwrite dynamic ones."""
        with patch("backend.pipeline.feature_pipeline.DataOrchestrator") as MockOrch, \
             patch("backend.pipeline.feature_pipeline.WorldPopDataSource") as MockWP,  \
             patch("backend.pipeline.feature_pipeline.SRTMDataSource") as MockSRTM:

            MockOrch.return_value.get_features.return_value = {**MOCK_DYNAMIC}
            MockWP.return_value.fetch_data.return_value = MOCK_POP
            MockSRTM.return_value.fetch_data.return_value = MOCK_TERRAIN

            features = FeaturePipeline().get_features(*ACCRA)

        assert features["temperature_2m"] == pytest.approx(28.5)
