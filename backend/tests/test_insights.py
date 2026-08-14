"""guidance is written and reviewed, not generated per request.

health advice shown in more than fifty languages cannot be produced by a model
at request time: nobody here could read most of it to check it. these tests pin
the properties that replace it — real rotation, seasonal wording, and a
translation path that never leaves the card blank.
"""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api.insights import DRY, HARMATTAN, RAINY, season_for, variants

client = TestClient(app)
BODY = {"pm25": 30.0, "aqi_category": "Moderate", "language": "en"}

# accra, in and out of the harmattan window
ACCRA = {"lat": 5.6, "lon": -0.19}


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _patch(monkeypatch, cache):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)


def _ask(**extra):
    return client.post("/api/v1/generate-insight", json={**BODY, **extra}).json()["insight"]


def test_no_api_call_is_needed_for_english(monkeypatch):
    """the whole point: instant, free, and works when the provider is down."""
    _patch(monkeypatch, FakeCache())
    called = []
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: called.append(1) or True)
    assert _ask()
    assert called == []


def test_every_line_is_reachable_across_callers(monkeypatch):
    """no line should be dead: across enough people, all of them get used.

    lines carrying a {{name}} placeholder are excluded here: those only ever
    surface for a caller who supplied a name (see
    test_personalized_line_is_reachable_when_a_name_is_supplied below), so an
    anonymous caller must never draw one.
    """
    _patch(monkeypatch, FakeCache())
    expected = {line for line in variants("moderate", DRY) if "{{name}}" not in line}
    seen = set()
    for i in range(400):
        r = client.post(
            "/api/v1/generate-insight",
            json=BODY,
            headers={"cf-connecting-ip": f"41.{i // 250}.{i % 250}.7"},
        )
        seen.add(r.json()["insight"])
    assert seen == expected


def test_anonymous_callers_never_see_a_raw_placeholder(monkeypatch):
    _patch(monkeypatch, FakeCache())
    for i in range(400):
        r = client.post(
            "/api/v1/generate-insight",
            json=BODY,
            headers={"cf-connecting-ip": f"41.{i // 250}.{i % 250}.9"},
        )
        assert "{{name}}" not in r.json()["insight"]


def test_personalized_line_is_reachable_when_a_name_is_supplied(monkeypatch):
    """with a name supplied, the {{name}} line is in rotation and gets filled in."""
    _patch(monkeypatch, FakeCache())
    seen = set()
    for i in range(400):
        r = client.post(
            "/api/v1/generate-insight",
            json={**BODY, "name": "Davis"},
            headers={"cf-connecting-ip": f"41.{i // 250}.{i % 250}.3"},
        )
        seen.add(r.json()["insight"])
    assert any("Davis" in line for line in seen)
    assert not any("{{name}}" in line for line in seen)


def test_west_africa_gets_harmattan_wording_in_january():
    assert season_for(5.6, -0.19, "2026-01-15") == HARMATTAN
    assert season_for(5.6, -0.19, "2026-07-15") != HARMATTAN


def test_southern_africa_seasons_are_flipped():
    """the rains arrive at opposite ends of the year across the equator."""
    assert season_for(-26.2, 28.0, "2026-01-15") == RAINY
    assert season_for(-26.2, 28.0, "2026-07-15") == DRY


def test_season_changes_the_advice(monkeypatch):
    _patch(monkeypatch, FakeCache())
    dry = set(variants("unhealthy", DRY))
    harmattan = set(variants("unhealthy", HARMATTAN))
    assert not dry & harmattan, "seasons should not share lines"


def test_categories_do_not_share_lines():
    assert not set(variants("good", DRY)) & set(variants("hazardous", DRY))


def test_hazardous_advice_tells_people_to_seek_help():
    """the one category where the wording has to carry real urgency."""
    joined = " ".join(variants("hazardous", DRY) + variants("hazardous", HARMATTAN)).lower()
    assert "medical" in joined or "help" in joined


def test_translation_is_cached_per_category_season_and_language(monkeypatch):
    cache = FakeCache()
    _patch(monkeypatch, cache)
    calls = []
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "translate_strings",
                        lambda m, **k: calls.append(1) or {key: f"fr {key}" for key in m})
    _ask(language="fr")
    first = len(calls)
    for _ in range(5):
        _ask(language="fr")
    assert len(calls) == first          # translated once, then rotated locally


def test_failed_translation_falls_back_to_english(monkeypatch):
    _patch(monkeypatch, FakeCache())
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)

    def boom(*_a, **_k):
        raise RuntimeError("429")

    monkeypatch.setattr(router.gemini_client, "translate_strings", boom)
    assert _ask(language="fr") in variants("moderate", DRY)


def test_no_line_mentions_how_the_estimate_is_made():
    """users get advice, not a description of our pipeline."""
    banned = ("satellite", "model", "ai ", "algorithm", "sensor data", "pm2.5")
    for category in ("good", "moderate", "sensitive", "unhealthy", "hazardous"):
        for season in (DRY, RAINY, HARMATTAN):
            for line in variants(category, season):
                low = line.lower()
                assert not any(b in low for b in banned), f"technical wording: {line}"


def test_advice_is_steady_for_one_person_on_one_day(monkeypatch):
    """it changed on every tap, so it read as though it kept changing its mind."""
    _patch(monkeypatch, FakeCache())
    first = _ask()
    assert all(_ask() == first for _ in range(6))


def test_different_callers_get_different_advice(monkeypatch):
    """otherwise everyone in a city reads the same sentence on the same day."""
    _patch(monkeypatch, FakeCache())
    seen = set()
    for i in range(24):
        r = client.post(
            "/api/v1/generate-insight",
            json=BODY,
            headers={"cf-connecting-ip": f"41.20.{i}.5"},
        )
        seen.add(r.json()["insight"])
    assert len(seen) > 1
