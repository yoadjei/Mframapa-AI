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


def test_every_line_appears_before_any_repeats(monkeypatch):
    _patch(monkeypatch, FakeCache())
    n = len(variants("moderate", DRY))
    seen = [_ask() for _ in range(n)]
    assert len(set(seen)) == n


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
