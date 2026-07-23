"""feedback has to actually go somewhere.

both clients showed a form that waited 800ms and said thanks, then dropped the
message. someone reporting a wrong reading or a bad translation was talking to
nobody, and we lost the single cheapest source of truth about the product.
"""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.feedback.store import FeedbackStore

client = TestClient(app)


def _store(tmp_path, monkeypatch):
    store = FeedbackStore(str(tmp_path / "fb.db"))
    app.dependency_overrides[router.get_feedback_store] = lambda: store
    return store


def teardown_function():
    app.dependency_overrides.clear()


def test_report_is_persisted(tmp_path, monkeypatch):
    store = _store(tmp_path, monkeypatch)
    r = client.post("/api/v1/feedback", json={
        "category": "data", "message": "Reading looks far too low for Kumasi today.",
    })
    assert r.status_code == 200
    saved = store.recent()
    assert len(saved) == 1
    assert saved[0]["category"] == "data"
    assert "Kumasi" in saved[0]["message"]


def test_anonymous_can_report(tmp_path, monkeypatch):
    """the people most likely to hit a bug have no account."""
    _store(tmp_path, monkeypatch)
    r = client.post("/api/v1/feedback", json={"category": "bug", "message": "Map is blank."})
    assert r.status_code == 200


def test_empty_message_is_rejected(tmp_path, monkeypatch):
    _store(tmp_path, monkeypatch)
    r = client.post("/api/v1/feedback", json={"category": "bug", "message": "   "})
    assert r.status_code == 422


def test_unknown_category_is_filed_not_dropped(tmp_path, monkeypatch):
    """losing a real report over a label mismatch is worse than a wrong label."""
    store = _store(tmp_path, monkeypatch)
    r = client.post("/api/v1/feedback", json={"category": "nonsense", "message": "Something is off."})
    assert r.status_code == 200
    assert store.recent()[0]["category"] == "general"


def test_email_is_optional(tmp_path, monkeypatch):
    store = _store(tmp_path, monkeypatch)
    client.post("/api/v1/feedback", json={"category": "general", "message": "Nice app."})
    assert store.recent()[0]["email"] is None


def test_long_message_is_truncated_not_refused(tmp_path, monkeypatch):
    store = _store(tmp_path, monkeypatch)
    r = client.post("/api/v1/feedback", json={"category": "bug", "message": "x" * 9000})
    assert r.status_code == 200
    assert len(store.recent()[0]["message"]) <= 4000
