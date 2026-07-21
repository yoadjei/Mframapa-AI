"""insights must not read like the same sentence every single time.

guidance for a category is stable, but a user who opens the app daily should not
see one identical string forever. a pool per category and language is built up
lazily and then rotated, so the wording changes without calling gemini on every
request.
"""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)
BODY = {"pm25": 30.0, "aqi_category": "Moderate", "language": "en"}


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _patch(monkeypatch, cache, generator=None):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    calls = []

    def gen(*_a, **kw):
        calls.append(kw)
        return f"variant {len(calls)}"

    monkeypatch.setattr(router.gemini_client, "generate_air_quality_insight",
                        generator or gen)
    return calls


def _ask():
    return client.post("/api/v1/generate-insight", json=BODY).json()["insight"]


def test_repeated_views_do_not_all_return_the_same_sentence(monkeypatch):
    _patch(monkeypatch, FakeCache())
    seen = {_ask() for _ in range(router._INSIGHT_POOL_TARGET)}
    assert len(seen) > 1, "every view returned identical copy"


def test_pool_stops_growing_so_gemini_is_not_called_forever(monkeypatch):
    calls = _patch(monkeypatch, FakeCache())
    for _ in range(router._INSIGHT_POOL_TARGET * 3):
        _ask()
    assert len(calls) <= router._INSIGHT_POOL_TARGET


def test_every_variant_is_used_before_any_repeats(monkeypatch):
    """rotation, not random choice: random would repeat within a few views."""
    _patch(monkeypatch, FakeCache())
    for _ in range(router._INSIGHT_POOL_TARGET):      # fill the pool
        _ask()
    seen = [_ask() for _ in range(router._INSIGHT_POOL_TARGET)]
    assert len(set(seen)) == router._INSIGHT_POOL_TARGET


def test_a_provider_failure_still_returns_guidance(monkeypatch):
    """a quota trip must not leave the card empty."""
    cache = FakeCache()

    def boom(*_a, **_k):
        raise RuntimeError("429")

    _patch(monkeypatch, cache, boom)
    r = client.post("/api/v1/generate-insight", json=BODY)
    assert r.status_code == 200
    assert r.json()["insight"]


def test_categories_do_not_share_a_pool(monkeypatch):
    _patch(monkeypatch, FakeCache())
    good = client.post("/api/v1/generate-insight",
                       json={**BODY, "pm25": 5.0, "aqi_category": "Good"}).json()["insight"]
    bad = client.post("/api/v1/generate-insight",
                      json={**BODY, "pm25": 200.0, "aqi_category": "Hazardous"}).json()["insight"]
    assert good != bad
