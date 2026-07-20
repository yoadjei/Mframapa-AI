"""/map-summary — one cached payload for the continental map."""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)


class FakeCache:
    def __init__(self, initial=None):
        self.store = dict(initial or {})

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _patch(monkeypatch, cache, predictor=None):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    if predictor is not None:
        monkeypatch.setattr(router, "compute_prediction", predictor)


def _ok(*_a, **_k):
    return {"pm25": 42.0, "aqi_category": "Unhealthy"}


def test_is_public_and_returns_cities(monkeypatch):
    _patch(monkeypatch, FakeCache(), _ok)
    r = client.get("/api/v1/map-summary")          # no credentials
    assert r.status_code == 200
    body = r.json()
    assert body["count"] == len(router.MAJOR_CITIES)
    first = body["cities"][0]
    assert {"name", "lat", "lon", "pm25", "aqi_category"} <= first.keys()


def test_second_call_is_served_from_cache(monkeypatch):
    calls = []
    cache = FakeCache()
    _patch(monkeypatch, cache, lambda *a, **k: calls.append(1) or _ok())
    client.get("/api/v1/map-summary")
    n_after_first = len(calls)
    client.get("/api/v1/map-summary")
    assert len(calls) == n_after_first        # no recompute on the second request


def test_one_failing_city_does_not_blank_the_map(monkeypatch):
    def flaky(request, lat, lon, name, day, pipeline):
        if name == router.MAJOR_CITIES[0][0]:
            raise RuntimeError("upstream down")
        return _ok()
    _patch(monkeypatch, FakeCache(), flaky)
    body = client.get("/api/v1/map-summary").json()
    assert body["count"] == len(router.MAJOR_CITIES) - 1


def test_empty_result_is_not_cached(monkeypatch):
    """a total outage must not pin an empty map for hours."""
    def boom(*a, **k):
        raise RuntimeError("everything down")
    cache = FakeCache()
    _patch(monkeypatch, cache, boom)
    assert client.get("/api/v1/map-summary").json()["count"] == 0
    assert cache.store == {}
