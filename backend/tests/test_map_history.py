"""/map-history — the playback window, rebuilt once and shared by every client."""

from datetime import date, timedelta

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api.cities import PLAYBACK_CITIES

client = TestClient(app)


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _ok(*_a, **_k):
    return {"pm25": 30.0, "aqi_category": "Moderate"}


def _patch(monkeypatch, cache, predictor=_ok):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    monkeypatch.setattr(router, "compute_prediction", predictor)


def test_public_and_covers_every_playback_city(monkeypatch):
    _patch(monkeypatch, FakeCache())
    r = client.get("/api/v1/map-history")           # no auth
    assert r.status_code == 200
    names = {c["name"] for c in r.json()["cities"]}
    assert names == {n for n, _, _ in PLAYBACK_CITIES}


def test_one_request_replaces_the_per_city_fanout(monkeypatch):
    """the point of this endpoint is that a client makes one call, not five."""
    cache = FakeCache()
    _patch(monkeypatch, cache)
    body = client.get("/api/v1/map-history?days=5").json()
    assert len(body["cities"]) == len(PLAYBACK_CITIES)
    assert all(len(c["days"]) == 5 for c in body["cities"])


def test_days_run_oldest_to_today(monkeypatch):
    _patch(monkeypatch, FakeCache())
    body = client.get("/api/v1/map-history?days=3").json()
    expected = [(date.today() - timedelta(days=i)).isoformat() for i in range(2, -1, -1)]
    assert body["dates"] == expected
    assert [d["date"] for d in body["cities"][0]["days"]] == expected


def test_second_call_is_served_from_cache(monkeypatch):
    """without this the endpoint would cost more than the fan-out it replaces."""
    calls = []
    cache = FakeCache()
    _patch(monkeypatch, cache, lambda *a, **k: calls.append(1) or _ok())
    client.get("/api/v1/map-history?days=4")
    first = len(calls)
    assert first > 0
    client.get("/api/v1/map-history?days=4")
    assert len(calls) == first


def test_window_is_capped(monkeypatch):
    _patch(monkeypatch, FakeCache())
    over = router._MAX_HISTORY_DAYS + 1
    assert client.get(f"/api/v1/map-history?days={over}").status_code == 422


def test_a_failing_city_is_omitted_not_faked(monkeypatch):
    def flaky(request, lat, lon, name, day, pipeline):
        if name == "Cairo":
            raise RuntimeError("upstream down")
        return _ok()
    _patch(monkeypatch, FakeCache(), flaky)
    names = {c["name"] for c in client.get("/api/v1/map-history").json()["cities"]}
    assert "Cairo" not in names
    assert len(names) == len(PLAYBACK_CITIES) - 1
