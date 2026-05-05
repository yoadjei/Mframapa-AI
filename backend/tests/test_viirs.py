"""Tests for VIIRSDataSource."""

import os
import pytest
from unittest.mock import patch, MagicMock
from backend.data_sources.viirs import VIIRSDataSource

ACCRA = (5.6037, -0.1870, "2024-06-01")


class TestVIIRSDataSource:

    def test_source_name(self):
        assert VIIRSDataSource().source_name == "VIIRS-MAIAC"

    def test_provided_features(self):
        assert "aerosol_optical_depth" in VIIRSDataSource().provided_features

    def test_not_available_without_token(self):
        env = {k: v for k, v in os.environ.items() if k != "NASA_EARTHDATA_TOKEN"}
        with patch.dict(os.environ, env, clear=True):
            assert VIIRSDataSource().is_available is False

    def test_available_with_token(self):
        with patch.dict(os.environ, {"NASA_EARTHDATA_TOKEN": "tok123"}):
            assert VIIRSDataSource().is_available is True

    def test_raises_runtime_error_without_token(self):
        env = {k: v for k, v in os.environ.items() if k != "NASA_EARTHDATA_TOKEN"}
        with patch.dict(os.environ, env, clear=True):
            with pytest.raises(RuntimeError):
                VIIRSDataSource().fetch_data(*ACCRA)

    def test_invalid_date_raises_value_error(self):
        with patch.dict(os.environ, {"NASA_EARTHDATA_TOKEN": "tok"}):
            with pytest.raises(ValueError, match="invalid date"):
                VIIRSDataSource().fetch_data(5.6, -0.2, "bad")

    def test_returns_none_when_no_granule_found(self):
        with patch.dict(os.environ, {"NASA_EARTHDATA_TOKEN": "tok"}):
            src = VIIRSDataSource()
            with patch.object(src, "_search_granule", return_value=None):
                result = src.fetch_data(*ACCRA)
        assert result["aerosol_optical_depth"] is None
