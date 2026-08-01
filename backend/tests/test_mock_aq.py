"""Continent-wide spatial mock AQ field."""

from backend.api import mock_aq as mock
from backend.api.aqi import aqi_category_from_pm25


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("MFRAMAPA_MOCK_AQ", raising=False)
    monkeypatch.delenv("MFRAMAPA_DEMO_OVERRIDES", raising=False)
    assert mock.prediction_payload(5.56, -0.20, "Accra") is None


def test_demo_flag_enables_mock(monkeypatch):
    monkeypatch.delenv("MFRAMAPA_MOCK_AQ", raising=False)
    monkeypatch.setenv("MFRAMAPA_DEMO_OVERRIDES", "1")
    assert mock.mock_aq_enabled() is True
    payload = mock.prediction_payload(5.56, -0.20, "Accra")
    assert payload is not None
    assert payload["uncertainty"]["method"] == "mock_spatial"


def test_mining_hotter_than_remote_clean(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_MOCK_AQ", "1")
    manso = mock.pm25_at(5.0833, -1.8333)
    # Deep rural Namibia-ish / sparse inland south of Congo — away from kernels
    remote = mock.pm25_at(-19.0, 18.0)
    assert manso is not None and remote is not None
    assert manso > 55  # Unhealthy band at mining centre
    assert remote < 30  # clean-ish countryside
    assert aqi_category_from_pm25(manso) == "Unhealthy"


def test_highveld_elevated(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_MOCK_AQ", "1")
    highveld = mock.pm25_at(-26.15, 29.10)
    assert highveld is not None and highveld >= 50


def test_outside_africa_none(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_MOCK_AQ", "1")
    assert mock.pm25_at(51.5, -0.12) is None  # London
    assert mock.prediction_payload(40.7, -74.0, "NYC") is None


def test_deterministic(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_MOCK_AQ", "1")
    a = mock.pm25_at(6.52, 3.38, "2026-08-01")
    b = mock.pm25_at(6.52, 3.38, "2026-08-01")
    assert a == b


def test_usual_profile_baked_fields():
    u = mock.usual_profile(5.56, -0.20)
    assert u is not None
    assert u["pm25"] > 0
    assert u["aqi_category"]
    assert 20 <= u["humidity"] <= 95
    assert 10 <= u["temp"] <= 45


def test_usual_season_aug_to_dec():
    season = mock.usual_season(5.56, -0.20)
    assert season is not None
    assert set(season["months"]) == {"8", "9", "10", "11", "12"}
    # Accra: Dec should be drier / dustier than wet August
    assert season["months"]["12"]["humidity"] < season["months"]["8"]["humidity"]
    assert season["months"]["12"]["pm25"] >= season["months"]["8"]["pm25"]
