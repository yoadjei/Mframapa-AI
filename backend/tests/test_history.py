"""/history — a real look back, over a window we can actually reconstruct."""

from datetime import date, timedelta

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def _ok(*_a, **_k):
    return {
        "pm25": 30.0,
        "aqi_category": "Moderate",
        "uncertainty": {"pm25_lower": 20.0, "pm25_upper": 40.0},
    }


def _patch(monkeypatch, cache, predictor=_ok):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    monkeypatch.setattr(router, "compute_prediction", predictor)


def test_public_and_returns_default_window(monkeypatch):
    _patch(monkeypatch, FakeCache())
    r = client.get("/api/v1/history?lat=5.6&lon=-0.19&name=Accra")   # no auth
    assert r.status_code == 200
    assert len(r.json()["days"]) == router._HISTORY_DAYS


def test_days_run_oldest_to_today(monkeypatch):
    """playback scrubs forwards in time, so the series must be chronological."""
    _patch(monkeypatch, FakeCache())
    days = client.get("/api/v1/history?lat=5.6&lon=-0.19&days=5").json()["days"]
    expected = [(date.today() - timedelta(days=i)).isoformat() for i in range(4, -1, -1)]
    assert [d["date"] for d in days] == expected
    assert days[-1]["date"] == date.today().isoformat()


def test_window_is_capped(monkeypatch):
    """no pretending we can replay 2024 — the window is bounded on purpose."""
    _patch(monkeypatch, FakeCache())
    over = router._MAX_HISTORY_DAYS + 1
    assert client.get(f"/api/v1/history?lat=5.6&lon=-0.19&days={over}").status_code == 422


def test_second_call_is_cached(monkeypatch):
    calls = []
    cache = FakeCache()
    _patch(monkeypatch, cache, lambda *a, **k: calls.append(1) or _ok())
    client.get("/api/v1/history?lat=5.6&lon=-0.19&days=4")
    first = len(calls)
    client.get("/api/v1/history?lat=5.6&lon=-0.19&days=4")
    assert len(calls) == first


def test_a_failing_day_is_skipped_not_faked(monkeypatch):
    def flaky(request, lat, lon, name, day, pipeline):
        if day != date.today().isoformat():
            raise RuntimeError("no archive for that day")
        return _ok()
    _patch(monkeypatch, FakeCache(), flaky)
    days = client.get("/api/v1/history?lat=5.6&lon=-0.19&days=6").json()["days"]
    assert len(days) == 1                # gaps are omitted, never interpolated


def test_empty_window_is_not_cached(monkeypatch):
    """a total upstream outage must not pin an empty series for hours."""
    cache = FakeCache()

    def down(*_a, **_k):
        raise RuntimeError("upstream down")

    _patch(monkeypatch, cache, down)
    assert client.get("/api/v1/history?lat=5.6&lon=-0.19&days=3").json()["days"] == []
    assert cache.store == {}
