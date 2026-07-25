"""daily alert loop — record building, rolling baseline, and episode -> push wiring."""

import backend.alerts.daily as daily
from backend.alerts.scheduler import run_daily_scan


class FakeCache:
    """in-memory stand-in for RedisCache (same get/set contract)."""

    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


CITIES = [("Accra", 5.6, -0.19)]


def _prediction(pm25, category="Moderate"):
    return {"pm25": pm25, "aqi_category": category}


# ── record building ───────────────────────────────────────────────────────────

def test_baseline_excludes_today(monkeypatch):
    """today's spike must be compared against prior days, not diluted by itself."""
    cache = FakeCache()
    monkeypatch.setattr(daily, "_predict", lambda *a, **k: _prediction(80.0, "Unhealthy"))
    for prior in (10.0, 12.0, 11.0):
        daily.append_history(cache, "Accra", prior)

    records = daily.build_city_records(CITIES, cache=cache)
    assert records[0]["history"] == [10.0, 12.0, 11.0]   # today's 80 not included
    assert records[0]["today_pm25"] == 80.0


def test_today_is_appended_for_future_runs(monkeypatch):
    cache = FakeCache()
    monkeypatch.setattr(daily, "_predict", lambda *a, **k: _prediction(25.0))
    daily.build_city_records(CITIES, cache=cache)
    assert daily.read_history(cache, "Accra") == [25.0]


def test_history_window_is_bounded(monkeypatch):
    cache = FakeCache()
    for i in range(20):
        daily.append_history(cache, "Accra", float(i))
    assert len(daily.read_history(cache, "Accra")) == daily._HISTORY_DAYS


def test_failed_prediction_skips_city_without_killing_scan(monkeypatch):
    cache = FakeCache()
    monkeypatch.setattr(daily, "_predict", lambda *a, **k: None)
    assert daily.build_city_records(CITIES, cache=cache) == []


def test_prediction_without_pm25_is_skipped(monkeypatch):
    cache = FakeCache()
    monkeypatch.setattr(daily, "_predict", lambda *a, **k: {"aqi_category": "Moderate"})
    assert daily.build_city_records(CITIES, cache=cache) == []


# ── episode -> push wiring ────────────────────────────────────────────────────

class FakeStore:
    def __init__(self, tokens):
        self._tokens = tokens

    def near(self, lat, lon, radius_deg=0.75):
        return [{"token": t} for t in self._tokens]


def test_episode_pushes_to_nearby_devices():
    sent = []
    records = [{
        "name": "Accra", "lat": 5.6, "lon": -0.19,
        "history": [10.0, 12.0, 11.0],          # baseline 11 -> 80 is >2x
        "today_pm25": 80.0, "today_category": "Unhealthy",
    }]
    episodes = run_daily_scan(
        records,
        store=FakeStore(["ExponentPushToken[abc]"]),
        push=lambda tokens, title, body, data=None: sent.append((tokens, title)),
    )
    assert len(episodes) == 1
    assert sent and sent[0][0] == ["ExponentPushToken[abc]"]


def test_normal_day_sends_nothing():
    sent = []
    records = [{
        "name": "Accra", "lat": 5.6, "lon": -0.19,
        "history": [20.0, 22.0, 21.0],
        "today_pm25": 23.0, "today_category": "Moderate",
    }]
    episodes = run_daily_scan(
        records,
        store=FakeStore(["ExponentPushToken[abc]"]),
        push=lambda *a, **k: sent.append(a),
    )
    assert episodes == [] and sent == []


def test_high_pm25_without_episode_category_is_not_an_episode():
    """a 2x jump that stays 'Moderate' is not an episode — avoids alert fatigue."""
    sent = []
    records = [{
        "name": "Accra", "lat": 5.6, "lon": -0.19,
        "history": [5.0, 5.0, 5.0],
        "today_pm25": 30.0, "today_category": "Moderate",
    }]
    assert run_daily_scan(records, store=FakeStore(["t"]), push=lambda *a, **k: sent.append(a)) == []
    assert sent == []


def test_cold_start_unhealthy_is_an_episode():
    """no Redis history yet — still alert on Unhealthy/Hazardous (day-1 deploy)."""
    sent = []
    records = [{
        "name": "Accra", "lat": 5.6, "lon": -0.19,
        "history": [],
        "today_pm25": 90.0, "today_category": "Unhealthy",
    }]
    episodes = run_daily_scan(
        records,
        store=FakeStore(["ExponentPushToken[abc]"]),
        push=lambda *a, **k: sent.append(a),
    )
    assert len(episodes) == 1
    assert sent


# ── config ────────────────────────────────────────────────────────────────────

def test_alerts_disabled_by_default(monkeypatch):
    monkeypatch.delenv("ALERTS_ENABLED", raising=False)
    assert daily.alerts_enabled() is False


def test_alerts_hour_falls_back_on_bad_value(monkeypatch):
    monkeypatch.setenv("ALERTS_HOUR_UTC", "not-a-number")
    assert daily.alerts_hour() == 6
