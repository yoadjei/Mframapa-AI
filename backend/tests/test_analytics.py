"""analytics — store metrics (esp. retention math) and endpoint access control."""

from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient

from backend.analytics.store import AnalyticsStore
from backend.api.app import app

client = TestClient(app)
INTERNAL = {"X-API-Key": "mframapa-internal-dev-key"}   # conftest sets this key


def _day(offset: int) -> str:
    return (date.today() - timedelta(days=offset)).isoformat()


@pytest.fixture
def store(tmp_path):
    return AnalyticsStore(db_path=str(tmp_path / "an.db"))


# ── store: counts + geography ─────────────────────────────────────────────────

def test_installs_count_distinct_devices(store):
    store.record("dev-a", "app_open")
    store.record("dev-a", "app_open")     # same device, still 1 install
    store.record("dev-b", "app_open")
    assert store.installs() == 2


def test_wau_only_counts_recent(store):
    store.record("old", "app_open", day=_day(10))
    store.record("recent", "app_open", day=_day(2))
    assert store.active_devices(7) == 1
    assert store.active_devices(30) == 2


def test_unknown_events_are_dropped(store):
    store.record("dev", "hack_the_planet")
    assert store.installs() == 0


def test_top_countries_ranks_by_distinct_devices(store):
    store.record("d1", "app_open", country="GH")
    store.record("d2", "app_open", country="GH")
    store.record("d3", "app_open", country="NG")
    top = store.top_countries()
    assert top[0] == {"country": "GH", "devices": 2}


# ── store: retention (the metric most likely to be wrong) ─────────────────────

def test_d7_retained_when_device_returns_on_day7(store):
    # first seen 7 days ago, active again exactly on D+7 (today) -> retained
    store.record("keeper", "app_open", day=_day(7))
    store.record("keeper", "app_open", day=_day(0))
    r = store.retention(7)
    assert r["cohort_size"] == 1 and r["retained"] == 1 and r["rate"] == 1.0


def test_d7_not_retained_when_device_never_returns(store):
    store.record("churned", "app_open", day=_day(7))   # only ever seen once
    r = store.retention(7)
    assert r["cohort_size"] == 1 and r["retained"] == 0 and r["rate"] == 0.0


def test_young_cohort_excluded_from_retention(store):
    # first seen 2 days ago: too young to have a D7 yet -> not counted
    store.record("newbie", "app_open", day=_day(2))
    r = store.retention(7)
    assert r["cohort_size"] == 0 and r["rate"] is None


def test_alert_open_rate(store):
    for _ in range(4):
        store.record("d", "alert_received")
    store.record("d", "alert_opened")
    rate = store.alert_open_rate()
    assert rate["received"] == 4 and rate["opened"] == 1 and rate["rate"] == 0.25


# ── endpoints: access control ─────────────────────────────────────────────────

def test_events_accepts_anonymous():
    r = client.post("/api/v1/events", json={
        "events": [{"device_id": "anon-device-1", "event": "app_open", "platform": "web"}]
    })
    assert r.status_code == 200 and r.json()["accepted"] == 1


def test_events_rejects_oversized_batch():
    r = client.post("/api/v1/events", json={
        "events": [{"device_id": "d", "event": "app_open"}] * 51
    })
    assert r.status_code == 422


def test_metrics_requires_internal_key():
    assert client.get("/api/v1/metrics").status_code in (401, 403)


def test_metrics_forbidden_for_non_internal(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "s")
    import jwt, time
    tok = jwt.encode({"sub": "u", "aud": "authenticated", "exp": int(time.time()) + 3600},
                     "s", algorithm="HS256")
    r = client.get("/api/v1/metrics", headers={"Authorization": f"Bearer {tok}"})
    assert r.status_code == 403          # a signed-in individual is not internal


def test_metrics_returns_summary_for_internal():
    r = client.get("/api/v1/metrics", headers=INTERNAL)
    assert r.status_code == 200
    body = r.json()
    assert {"installs", "dau", "wau", "retention", "alert_open_rate", "top_countries"} <= body.keys()
