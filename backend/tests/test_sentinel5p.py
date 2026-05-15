"""Tests for Sentinel5PDataSource."""

import os
import pytest
from unittest.mock import patch, MagicMock
from backend.data_sources.sentinel5p import Sentinel5PDataSource

ACCRA = (5.6037, -0.1870, "2024-06-01")


class TestSentinel5PDataSource:

    def test_source_name(self):
        assert Sentinel5PDataSource().source_name == "Sentinel-5P"

    def test_provided_features(self):
        features = Sentinel5PDataSource().provided_features
        assert "no2_tropospheric_column" in features
        assert "aerosol_optical_depth"   in features
        assert "so2_total_column"        in features
        assert "co_total_column"         in features

    def test_not_available_without_credentials(self):
        env = {k: v for k, v in os.environ.items()
               if k not in ("CDSE_USERNAME", "CDSE_PASSWORD")}
        with patch.dict(os.environ, env, clear=True):
            assert Sentinel5PDataSource().is_available is False

    def test_available_with_credentials(self):
        with patch.dict(os.environ,
                        {"CDSE_USERNAME": "user@test.com", "CDSE_PASSWORD": "secret"}):
            assert Sentinel5PDataSource().is_available is True

    def test_raises_runtime_error_without_credentials(self):
        env = {k: v for k, v in os.environ.items()
               if k not in ("CDSE_USERNAME", "CDSE_PASSWORD")}
        with patch.dict(os.environ, env, clear=True):
            with pytest.raises(RuntimeError):
                Sentinel5PDataSource().fetch_data(*ACCRA)

    def test_invalid_date_raises_value_error(self):
        with patch.dict(os.environ,
                        {"CDSE_USERNAME": "u", "CDSE_PASSWORD": "p"}):
            with pytest.raises(ValueError, match="invalid date"):
                Sentinel5PDataSource().fetch_data(5.6, -0.2, "not-a-date")

    def test_invalid_latitude_raises_value_error(self):
        with patch.dict(os.environ,
                        {"CDSE_USERNAME": "u", "CDSE_PASSWORD": "p"}):
            with pytest.raises(ValueError, match="latitude"):
                Sentinel5PDataSource().fetch_data(999.0, -0.2, "2024-06-01")

    def test_returns_none_when_no_granule_found(self):
        with patch.dict(os.environ,
                        {"CDSE_USERNAME": "u", "CDSE_PASSWORD": "p"}):
            src = Sentinel5PDataSource()
            with patch.object(src, "_get_token", return_value="tok"), \
                 patch.object(src, "_search_granule", return_value=None):
                result = src.fetch_data(*ACCRA)
        assert result["no2_tropospheric_column"] is None
