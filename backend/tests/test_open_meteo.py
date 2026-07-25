"""Tests for OpenMeteoDataSource."""

import pytest
from unittest.mock import patch, MagicMock
from backend.data_sources.open_meteo import OpenMeteoDataSource

ACCRA = (5.6037, -0.1870, "2024-06-01")

_WEATHER_RESP = {
    "hourly": {
        "temperature_2m": [20.0] * 24,
        "relative_humidity_2m": [70.0] * 24,
        "dew_point_2m": [14.0] * 24,
        "precipitation": [0.1] * 24,
        "surface_pressure": [1012.0] * 24,
        "cloud_cover": [40.0] * 24,
        "wind_speed_10m": [3.0] * 24,
        "wind_direction_10m": [180.0] * 24,
    }
}

_AQ_RESP = {
    "hourly": {
        "nitrogen_dioxide": [15.0] * 24,
        "sulphur_dioxide": [5.0] * 24,
        "carbon_monoxide": [200.0] * 24,
        "aerosol_optical_depth": [0.25] * 24,
        "pm10": [20.0] * 24,
        "pm2_5": [12.0] * 24,
        "dust": [8.0] * 24,
        "ozone": [40.0] * 24,
    }
}


def _mock_get(url, **kwargs):
    mock = MagicMock()
    mock.raise_for_status = MagicMock()
    if "air-quality-api" in url:
        mock.json.return_value = _AQ_RESP
    else:
        mock.json.return_value = _WEATHER_RESP
    return mock


class TestOpenMeteoDataSource:

    @patch("backend.data_sources.open_meteo.requests.get", side_effect=_mock_get)
    def test_fetch_data_returns_all_features(self, _):
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        for key in ["temperature_2m", "relative_humidity", "u_component_of_wind_10m",
                    "v_component_of_wind_10m", "aerosol_optical_depth",
                    "pm10_surface", "pm25_surface", "surface_pressure", "precipitation"]:
            assert key in data

    @patch("backend.data_sources.open_meteo.requests.get", side_effect=_mock_get)
    def test_temperature_parsed_correctly(self, _):
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        assert data["temperature_2m"] == pytest.approx(20.0)

    @patch("backend.data_sources.open_meteo.requests.get", side_effect=_mock_get)
    def test_humidity_and_pressure(self, _):
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        assert data["relative_humidity"] == pytest.approx(70.0)
        assert data["surface_pressure"] == pytest.approx(1012.0)

    @patch("backend.data_sources.open_meteo.requests.get", side_effect=_mock_get)
    def test_wind_decomposed_into_uv(self, _):
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        assert data["u_component_of_wind_10m"] is not None
        assert data["v_component_of_wind_10m"] is not None

    @patch("backend.data_sources.open_meteo.requests.get", side_effect=_mock_get)
    def test_aod_parsed_correctly(self, _):
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        assert data["aerosol_optical_depth"] == pytest.approx(0.25)

    @patch("backend.data_sources.open_meteo.requests.get")
    def test_weather_survives_aq_failure(self, mock_get):
        import requests as req

        def _side(url, **kwargs):
            if "air-quality-api" in url:
                raise req.RequestException("aq down")
            mock = MagicMock()
            mock.raise_for_status = MagicMock()
            mock.json.return_value = _WEATHER_RESP
            return mock

        mock_get.side_effect = _side
        data = OpenMeteoDataSource().fetch_data(*ACCRA)
        assert data["relative_humidity"] == pytest.approx(70.0)
        assert data["temperature_2m"] == pytest.approx(20.0)
        assert "pm25_surface" not in data or data.get("pm25_surface") is None

    def test_invalid_date_raises_value_error(self):
        with pytest.raises(ValueError):
            OpenMeteoDataSource().fetch_data(5.6, -0.2, "bad-date")

    @patch("backend.data_sources.open_meteo.requests.get")
    def test_network_error_raises_connection_error(self, mock_get):
        import requests as req
        mock_get.side_effect = req.RequestException("timeout")
        with pytest.raises(Exception):
            OpenMeteoDataSource().fetch_data(*ACCRA)

    def test_source_name(self):
        assert OpenMeteoDataSource().source_name == "OpenMeteo"

    def test_is_always_available(self):
        assert OpenMeteoDataSource().is_available is True
