"""/forecast — a multi-day outlook that only promises what the inputs support."""

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


def _full(*_a, **_k):
    return {
        "pm25": 30.0, "aqi_category": "Moderate",
        "uncertainty": {"pm25_lower": 20.0, "pm25_upper": 40.0},
        "weather": {"temp": 27.0},
        "factors": {"aerosol_optical_depth": 0.6, "no2_tropospheric_column": 1.2},
    }


def _patch(monkeypatch, cache, predictor=_full):
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    monkeypatch.setattr(router, "compute_prediction", predictor)


def test_public_and_returns_default_horizon(monkeypatch):
    _patch(monkeypatch, FakeCache())
    r = client.get("/api/v1/forecast?lat=5.6&lon=-0.19&name=Accra")   # no auth
    assert r.status_code == 200
    body = r.json()
    assert len(body["days"]) == router._FORECAST_DAYS
    assert body["days"][0]["date"] == date.today().isoformat()


def test_horizon_is_capped(monkeypatch):
    """we must not offer a 7 day outlook we cannot back with real inputs."""
    _patch(monkeypatch, FakeCache())
    assert client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=7").status_code == 422


def test_days_are_consecutive_from_today(monkeypatch):
    _patch(monkeypatch, FakeCache())
    days = client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=3").json()["days"]
    expected = [(date.today() + timedelta(days=i)).isoformat() for i in range(3)]
    assert [d["date"] for d in days] == expected
    assert [d["day_offset"] for d in days] == [0, 1, 2]


def test_marks_days_with_full_inputs(monkeypatch):
    _patch(monkeypatch, FakeCache())
    days = client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=2").json()["days"]
    assert all(d["inputs"] == "full" for d in days)


def test_marks_reduced_when_air_quality_is_missing(monkeypatch):
    """beyond the CAMS horizon the prediction is weaker — say so, don't hide it."""
    def no_air(*_a, **_k):
        out = _full()
        out["factors"] = {"population_density": 100.0}
        return out
    _patch(monkeypatch, FakeCache(), no_air)
    days = client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=2").json()["days"]
    assert all(d["inputs"] == "reduced" for d in days)


def test_marks_reduced_when_weather_is_missing(monkeypatch):
    def no_weather(*_a, **_k):
        out = _full()
        out["weather"] = {"temp": None}
        return out
    _patch(monkeypatch, FakeCache(), no_weather)
    assert client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=1").json()["days"][0]["inputs"] == "reduced"


def test_second_call_is_cached(monkeypatch):
    calls = []
    cache = FakeCache()
    _patch(monkeypatch, cache, lambda *a, **k: calls.append(1) or _full())
    client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=3")
    first = len(calls)
    client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=3")
    assert len(calls) == first


def test_a_failing_day_is_skipped_not_faked(monkeypatch):
    def flaky(request, lat, lon, name, day, pipeline):
        if day != date.today().isoformat():
            raise RuntimeError("upstream down")
        return _full()
    _patch(monkeypatch, FakeCache(), flaky)
    days = client.get("/api/v1/forecast?lat=5.6&lon=-0.19&days=3").json()["days"]
    assert len(days) == 1        # missing days are omitted, never invented
