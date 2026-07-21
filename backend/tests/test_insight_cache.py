"""insight caching — keeps gemini calls off the request path and out of rate limits.

guidance is served from a per category/language pool (see test_insight_variety);
these tests cover the caching properties of that pool.
"""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)
BODY = {"pm25": 45, "aqi_category": "Unhealthy", "weather": {"temp": 30, "wind": 2}, "language": "en"}


class FakeCache:
    def __init__(self, initial=None):
        self.store = dict(initial or {})
        self.sets = []

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value
        self.sets.append((key, value, ttl))


def _patch_cache(monkeypatch, cache):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)


def test_full_pool_skips_gemini_entirely(monkeypatch):
    """the whole point: real traffic must not hit the model per request."""
    full = [f"cached guidance {i}" for i in range(router._INSIGHT_POOL_TARGET)]
    cache = FakeCache({"insight:pool:unhealthy:en": {"variants": full}})
    _patch_cache(monkeypatch, cache)
    called = []
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: called.append(1) or True)

    r = client.post("/api/v1/generate-insight", json=BODY)
    assert r.status_code == 200
    assert r.json()["insight"] in full
    assert called == []          # never even checked availability


def test_generated_insight_is_cached(monkeypatch):
    cache = FakeCache()
    _patch_cache(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "generate_air_quality_insight",
                        lambda **kw: "fresh guidance")

    r = client.post("/api/v1/generate-insight", json=BODY)
    assert r.json()["insight"] == "fresh guidance"
    assert cache.store["insight:pool:unhealthy:en"] == {"variants": ["fresh guidance"]}
    assert cache.sets[0][2] == router._INSIGHT_TTL


def test_live_weather_is_not_baked_into_a_cached_string(monkeypatch):
    """a cached insight must not claim today's conditions weeks later."""
    cache = FakeCache()
    _patch_cache(monkeypatch, cache)
    seen = {}
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "generate_air_quality_insight",
                        lambda **kw: seen.update(kw) or "generic guidance")

    client.post("/api/v1/generate-insight", json=BODY)
    assert seen["weather"] == {}          # request weather deliberately dropped


def test_language_gets_its_own_cache_entry(monkeypatch):
    cache = FakeCache({"insight:pool:unhealthy:en": {"variants": ["english"]}})
    _patch_cache(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "generate_air_quality_insight",
                        lambda **kw: "conseil francais")

    r = client.post("/api/v1/generate-insight", json={**BODY, "language": "fr"})
    assert r.json()["insight"] == "conseil francais"
    assert "insight:pool:unhealthy:fr" in cache.store
    assert cache.store["insight:pool:unhealthy:en"] == {"variants": ["english"]}


def test_stub_fallback_is_not_cached(monkeypatch):
    """otherwise a temporary gemini outage would pin stubs for 30 days."""
    cache = FakeCache()
    _patch_cache(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: False)

    r = client.post("/api/v1/generate-insight", json=BODY)
    assert r.status_code == 200
    assert r.json()["insight"] == router._STUB_INSIGHTS_EN["unhealthy"]
    assert cache.store == {}          # nothing cached, so it retries later


def test_gemini_failure_falls_back_without_caching(monkeypatch):
    cache = FakeCache()
    _patch_cache(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    def boom(**kw): raise RuntimeError("rate limited")
    monkeypatch.setattr(router.gemini_client, "generate_air_quality_insight", boom)

    r = client.post("/api/v1/generate-insight", json=BODY)
    assert r.status_code == 200
    assert r.json()["insight"] == router._STUB_INSIGHTS_EN["unhealthy"]
    assert cache.store == {}
