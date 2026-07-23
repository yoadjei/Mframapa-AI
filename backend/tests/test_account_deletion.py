"""deleting an account has to actually delete it.

both clients shipped a delete screen that only pretended: the web one waited a
second and signed the user out, the mobile button had no handler at all. the
data stayed in supabase. that is a store rejection on both platforms and, for
anyone in a jurisdiction with a right to erasure, a legal problem.
"""

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)


def _as_user(monkeypatch, user_id="user-123"):
    """make requests look authenticated as a specific user."""
    app.dependency_overrides[router.current_user_id] = lambda: user_id


def teardown_function():
    app.dependency_overrides.clear()


def test_anonymous_cannot_delete_an_account():
    """there is no account to delete, and this must never be callable blind."""
    r = client.delete("/api/v1/account")
    assert r.status_code in (401, 403)


def test_deletes_the_authenticated_user(monkeypatch):
    _as_user(monkeypatch, "user-abc")
    deleted = []
    monkeypatch.setattr(router.supabase_admin, "delete_user",
                        lambda uid: deleted.append(uid) or True)
    r = client.delete("/api/v1/account")
    assert r.status_code == 200
    assert deleted == ["user-abc"], "must delete the caller, and only the caller"


def test_reports_failure_instead_of_pretending(monkeypatch):
    """the old screen claimed success unconditionally; never do that again."""
    _as_user(monkeypatch)
    monkeypatch.setattr(router.supabase_admin, "delete_user", lambda uid: False)
    r = client.delete("/api/v1/account")
    assert r.status_code == 502
    assert "deleted" not in r.text.lower() or "not" in r.text.lower()


def test_unconfigured_admin_is_an_error_not_a_silent_success(monkeypatch):
    _as_user(monkeypatch)

    def boom(_uid):
        raise RuntimeError("service role key missing")

    monkeypatch.setattr(router.supabase_admin, "delete_user", boom)
    r = client.delete("/api/v1/account")
    assert r.status_code == 502
