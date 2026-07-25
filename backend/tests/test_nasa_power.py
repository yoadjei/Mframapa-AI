"""Tests for NASAPowerDataSource."""

import pytest
from unittest.mock import patch, MagicMock
from backend.data_sources.nasa_power import NASAPowerDataSource

ACCRA = (5.6037, -0.1870, "2024-06-01")

_POWER_RESP = {
    "properties": {
        "parameter": {
            "T2M": {"20240601": 28.1},
            "RH2M": {"20240601": 74.0},
            "WS10M": {"20240601": 2.5},
            "WD10M": {"20240601": 180.0},
            "PS": {"20240601": 101.0},  # kPa
            "PRECTOTCORR": {"20240601": 0.2},
        }
    }
}


@patch("backend.data_sources.nasa_power.requests.get")
def test_fetch_parses_daily_meteo(mock_get):
    mock = MagicMock()
    mock.raise_for_status = MagicMock()
    mock.json.return_value = _POWER_RESP
    mock_get.return_value = mock

    data = NASAPowerDataSource().fetch_data(*ACCRA)
    assert data["temperature_2m"] == pytest.approx(28.1)
    assert data["relative_humidity"] == pytest.approx(74.0)
    assert data["surface_pressure"] == pytest.approx(1010.0)  # kPa → hPa
    assert data["precipitation"] == pytest.approx(0.2)
    assert data["u_component_of_wind_10m"] is not None


def test_invalid_date():
    with pytest.raises(ValueError):
        NASAPowerDataSource().fetch_data(5.6, -0.2, "nope")


def test_source_name():
    assert NASAPowerDataSource().source_name == "NASA-POWER"
