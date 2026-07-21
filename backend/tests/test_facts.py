"""daily facts — one a day, the same for everyone, translated not invented."""

from datetime import date, timedelta

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api.facts import FACTS, fact_for

client = TestClient(app)


class FakeCache:
    def __init__(self):
        self.store = {}

    def get(self, key):
        return self.store.get(key)

    def set(self, key, value, ttl):
        self.store[key] = value


def test_everyone_sees_the_same_fact_on_a_given_day():
    assert fact_for("2026-03-04") == fact_for("2026-03-04")


def test_the_fact_changes_from_one_day_to_the_next():
    assert fact_for("2026-03-04") != fact_for("2026-03-05")


def test_no_repeat_within_the_run_of_facts():
    start = date(2026, 1, 1)
    seen = [fact_for((start + timedelta(days=i)).isoformat()) for i in range(len(FACTS))]
    assert len(set(seen)) == len(FACTS)


def test_facts_avoid_technical_and_unsourced_claims():
    """these go out as notifications; they must be plain and defensible."""
    banned = ("satellite", "model", "our data", "pm2.5", "µg", "algorithm", "ai ")
    for f in FACTS:
        low = f.lower()
        assert not any(b in low for b in banned), f"not plain enough: {f}"
        assert 40 < len(f) < 240, f"bad length for a notification: {f}"


def test_endpoint_is_public(monkeypatch):
    monkeypatch.setattr(router, "RedisCache", lambda: FakeCache())
    r = client.get("/api/v1/daily-fact")            # no auth
    assert r.status_code == 200
    assert r.json()["fact"] in FACTS


def test_endpoint_translates_once_then_serves_from_cache(monkeypatch):
    cache = FakeCache()
    monkeypatch.setattr(router, "RedisCache", lambda: cache)
    monkeypatch.setattr(router.gemini_client, "is_available", lambda: True)
    calls = []
    monkeypatch.setattr(router.gemini_client, "translate_strings",
                        lambda m, **k: calls.append(1) or {key: "habari" for key in m})
    first = client.get("/api/v1/daily-fact?language=sw").json()["fact"]
    for _ in range(4):
        client.get("/api/v1/daily-fact?language=sw")
    assert first == "habari"
    assert len(calls) == 1


def test_a_quiet_day_still_sends_one_notification(monkeypatch):
    """episode alerts can go weeks without firing; the app should not go silent."""
    import backend.alerts.daily as daily

    sent = []
    monkeypatch.setattr(daily, "build_city_records", lambda *a, **k: [{"name": "Accra"}])
    monkeypatch.setattr(daily, "run_daily_scan", lambda *a, **k: [])      # no episodes
    monkeypatch.setattr("backend.alerts.storage.get_push_store",
                        lambda: type("S", (), {"all": lambda self: [{"token": "ExpoTok"}]})())
    monkeypatch.setattr("backend.alerts.push.send_push",
                        lambda tokens, title, body, data=None, post=None:
                            sent.append(body) or {"sent": len(tokens), "batches": 1, "failed": 0})
    daily.run_daily_job([("Accra", 5.6, -0.19)])
    assert sent and sent[0] in FACTS


def test_an_episode_day_does_not_also_send_a_fact(monkeypatch):
    """a real warning must not be diluted by a second, softer notification."""
    import backend.alerts.daily as daily

    sent = []
    monkeypatch.setattr(daily, "build_city_records", lambda *a, **k: [{"name": "Accra"}])
    monkeypatch.setattr(daily, "run_daily_scan", lambda *a, **k: [{"city": "Accra"}])
    monkeypatch.setattr(daily, "send_daily_fact", lambda **k: sent.append(1))
    daily.run_daily_job([("Accra", 5.6, -0.19)])
    assert not sent
