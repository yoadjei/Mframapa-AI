"""/translate — redis caching so a bundle is translated once, then served cheaply."""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)
BODY = {"strings": {"home.title": "Mframapa", "card.aqi": "Air quality"},
        "target_language": "fr", "target_language_name": "French"}


class FakeCache:
    def __init__(self, initial=None):
        self.store = dict(initial or {})

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _patch(monkeypatch, cache):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)


def test_same_language_is_passthrough(monkeypatch):
    _patch(monkeypatch, FakeCache())
    r = client.post("/api/v1/translate", json={**BODY, "target_language": "en"})
    assert r.json()["provider"] == "none"


def test_cache_hit_skips_gemini(monkeypatch):
    cache = FakeCache()
    _patch(monkeypatch, cache)
    called = []
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: called.append(1) or True)
    monkeypatch.setattr(router.gemini_client, "translate_strings",
                        lambda *a, **k: {"home.title": "Mframapa", "card.aqi": "Qualite"})
    first = client.post("/api/v1/translate", json=BODY)
    assert first.json()["provider"] == "gemini"
    called.clear()
    second = client.post("/api/v1/translate", json=BODY)
    assert second.json()["provider"] == "cache"
    assert called == []                       # gemini not touched on the second call


def test_result_is_cached_with_ttl(monkeypatch):
    cache = FakeCache()
    _patch(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "translate_strings",
                        lambda *a, **k: {"home.title": "Mframapa", "card.aqi": "Qualite"})
    client.post("/api/v1/translate", json=BODY)
    assert any(k.startswith("i18n:fr:") for k in cache.store)


def test_no_key_returns_untranslated_fallback(monkeypatch):
    _patch(monkeypatch, FakeCache())
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: False)
    r = client.post("/api/v1/translate", json=BODY)
    assert r.json()["fallback"] is True
    assert r.json()["translations"] == BODY["strings"]


def test_different_copy_gets_a_different_cache_key(monkeypatch):
    """shipping new english copy must not serve stale translations."""
    cache = FakeCache()
    _patch(monkeypatch, cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    monkeypatch.setattr(router.gemini_client, "translate_strings",
                        lambda *a, **k: {k2: "x" for k2 in a[0]})
    client.post("/api/v1/translate", json=BODY)
    client.post("/api/v1/translate", json={**BODY, "strings": {"home.title": "New copy"}})
    keys = [k for k in cache.store if k.startswith("i18n:fr:")]
    assert len(keys) == 2                      # distinct bundles -> distinct keys
