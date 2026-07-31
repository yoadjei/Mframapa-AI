"""Pitch demo overrides for four Ghana sites."""

from backend.api.aqi import aqi_category_from_pm25
from backend.api import demo_overrides as demo


def test_disabled_by_default(monkeypatch):
    monkeypatch.delenv("MFRAMAPA_DEMO_OVERRIDES", raising=False)
    assert demo.match_demo_site(5.0833, -1.8333, "Manso") is None


def test_four_sites_match_aqi_and_weather(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_DEMO_OVERRIDES", "1")

    expected = {
        "manso": (82.0, "Unhealthy"),
        "nsuta": (71.0, "Unhealthy"),
        "damongo": (64.0, "Unhealthy"),
        "kejetia": (52.0, "Unhealthy for Sensitive Groups"),
    }

    for site in demo._SITES:
        pm, cat = expected[site.id]
        assert site.pm25 == pm
        assert aqi_category_from_pm25(site.pm25) == cat
        payload = demo.prediction_payload(site, site.name, site.lat, site.lon)
        assert payload["pm25"] == pm
        assert payload["aqi_category"] == cat
        assert payload["weather"]["temp"] > 0
        assert payload["factors"]
        assert "dust" in demo.insight_for_site(site).lower() or "market" in demo.insight_for_site(site).lower() or "manganese" in demo.insight_for_site(site).lower() or "road" in demo.insight_for_site(site).lower()


def test_kejetia_alias_and_kumasi_not_stolen(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_DEMO_OVERRIDES", "1")
    assert demo.match_demo_site(6.70, -1.62, "Kejetia Adum").id == "kejetia"
    assert demo.match_demo_site(6.6985, -1.6248, None).id == "kejetia"
    # Kumasi city centre snaps to 6.69 — must not get Kejetia override
    assert demo.match_demo_site(6.69, -1.62, "Kumasi") is None


def test_damango_alias(monkeypatch):
    monkeypatch.setenv("MFRAMAPA_DEMO_OVERRIDES", "1")
    assert demo.match_demo_site(0.0, 0.0, "Damango dusty road").id == "damongo"
