"""Tests for DataOrchestrator fallback hierarchy."""

import pytest
from unittest.mock import patch, MagicMock
from backend.data_sources.orchestrator import DataOrchestrator

ACCRA = {"lat": 5.6037, "lon": -0.1870, "date": "2024-06-01"}

MOCK_ERA5 = {
    "pblh": 850.0, "temperature_2m": 28.5, "relative_humidity": 72.0,
    "u_component_of_wind_10m": 1.2, "v_component_of_wind_10m": -0.8,
}
MOCK_S5P = {
    "no2_tropospheric_column": 1.5e-5, "aerosol_optical_depth": 0.31,
    "so2_total_column": 5e-4, "co_total_column": 3.2e-2,
}
MOCK_OM = {
    "temperature_2m": 27.0, "relative_humidity": 68.0,
    "u_component_of_wind_10m": 1.0, "v_component_of_wind_10m": -0.5,
    "no2_surface": 12.0, "so2_surface": 3.0, "co_surface": 150.0,
    "aerosol_optical_depth": 0.22, "pm10_surface": 20.0, "pm25_surface": 12.0,
}
MOCK_VIIRS = {"aerosol_optical_depth": 0.29}
MOCK_MODIS = {"aerosol_optical_depth": 0.28}


def _make_orchestrator(era5_ok=True, s5p_ok=True, viirs_ok=True, modis_ok=True, om_ok=True,
                        era5_data=None, s5p_data=None, viirs_data=None, modis_data=None, om_data=None):
    """Return an orchestrator with all sources mocked."""
    era5_data  = era5_data  or MOCK_ERA5
    s5p_data   = s5p_data   or MOCK_S5P
    viirs_data = viirs_data or MOCK_VIIRS
    modis_data = modis_data or MOCK_MODIS
    om_data    = om_data    or MOCK_OM

    orch = DataOrchestrator.__new__(DataOrchestrator)
    orch._counters = {n: {"success": 0, "failure": 0}
                      for n in ["ERA5", "Sentinel-5P", "VIIRS-MAIAC", "MODIS-MAIAC", "OpenMeteo", "NDVI-Composite", "VIIRS-NightLights", "OSM-Roads", "OpenAQ"]}

    def _mock_src(available, data=None, fail=False):
        m = MagicMock()
        m.is_available = available
        if fail:
            m.fetch_data.side_effect = ConnectionError("source down")
        else:
            m.fetch_data.return_value = data or {}
        return m

    orch._sources = {
        "ERA5":        _mock_src(era5_ok,  era5_data,  not era5_ok),
        "Sentinel-5P": _mock_src(s5p_ok,   s5p_data,   not s5p_ok),
        "VIIRS-MAIAC": _mock_src(viirs_ok, viirs_data, not viirs_ok),
        "MODIS-MAIAC": _mock_src(modis_ok, modis_data, not modis_ok),
        "OpenMeteo":   _mock_src(om_ok,    om_data,    not om_ok),
        "NDVI-Composite": _mock_src(True, {"ndvi": 0.45}, False),
        "VIIRS-NightLights": _mock_src(True, {"night_lights": 12.5}, False),
        "OSM-Roads": _mock_src(True, {"road_density": 0.05}, False),
        "OpenAQ": _mock_src(True, {"openaq_pm25": 12.0, "openaq_pm10": 18.0}, False),
    }
    return orch


class TestDataOrchestrator:

    def test_returns_dict_with_all_features(self):
        orch = _make_orchestrator()
        result = orch.get_features(**ACCRA)
        assert isinstance(result, dict)
        assert len(result) > 0

    def test_era5_values_used_for_pblh(self):
        orch = _make_orchestrator()
        result = orch.get_features(**ACCRA)
        assert result["pblh"] == pytest.approx(850.0)

    def test_sentinel5p_used_for_no2_first(self):
        orch = _make_orchestrator()
        result = orch.get_features(**ACCRA)
        assert result["no2_tropospheric_column"] == pytest.approx(1.5e-5)

    def test_falls_back_to_openmeteo_when_sentinel_unavailable(self):
        orch = _make_orchestrator(s5p_ok=False)
        result = orch.get_features(**ACCRA)
        assert result["no2_tropospheric_column"] == pytest.approx(MOCK_OM["no2_surface"])

    def test_falls_back_to_viirs_for_aod_when_sentinel_fails(self):
        s5p_no_aod = {**MOCK_S5P, "aerosol_optical_depth": None}
        orch = _make_orchestrator(s5p_data=s5p_no_aod)
        result = orch.get_features(**ACCRA)
        assert result["aerosol_optical_depth"] == pytest.approx(MOCK_VIIRS["aerosol_optical_depth"])

    def test_openmeteo_fallback_for_temperature_when_era5_fails(self):
        orch = _make_orchestrator(era5_ok=False)
        result = orch.get_features(**ACCRA)
        assert result["temperature_2m"] == pytest.approx(MOCK_OM["temperature_2m"])

    def test_reliability_scores_updated_on_success(self):
        orch = _make_orchestrator()
        orch.get_features(**ACCRA)
        scores = orch.reliability_scores
        assert scores["ERA5"] == pytest.approx(1.0)

    def test_reliability_scores_updated_on_failure(self):
        orch = _make_orchestrator(era5_ok=False)
        orch.get_features(**ACCRA)
        # ERA5 was unavailable — never called, score stays 1.0 (not called)
        # OpenMeteo was called and succeeded
        scores = orch.reliability_scores
        assert scores["OpenMeteo"] == pytest.approx(1.0)

    def test_source_only_called_once_per_request(self):
        orch = _make_orchestrator()
        orch.get_features(**ACCRA)
        # ERA5 provides multiple features but should only be fetched once
        assert orch._sources["ERA5"].fetch_data.call_count == 1

    def test_all_none_when_all_sources_fail(self):
        orch = _make_orchestrator(era5_ok=False, s5p_ok=False, viirs_ok=False,
                                   modis_ok=False, om_ok=False)
        result = orch.get_features(**ACCRA)
        assert result["pblh"] is None
        assert result["temperature_2m"] is None

    def test_available_sources_lists_only_configured_sources(self):
        orch = _make_orchestrator(era5_ok=False, modis_ok=False)
        available = orch.available_sources
        assert "ERA5" not in available
        assert "OpenMeteo" in available
        assert "Sentinel-5P" in available
