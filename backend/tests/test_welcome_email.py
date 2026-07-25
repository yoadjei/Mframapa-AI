"""Welcome email is one-shot per user and needs a signed-in session."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api import security
from backend.email.welcome import WelcomeStore, send_welcome_email


@pytest.fixture()
def welcome_store(tmp_path):
    return WelcomeStore(db_path=str(tmp_path / "welcome.db"))


def test_send_welcome_once(welcome_store, monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    with patch("backend.email.welcome.send_resend_email", return_value=True) as send:
        status, emailed = send_welcome_email(
            user_id="u1", email="a@b.c", store=welcome_store
        )
        assert status == "sent" and emailed is True
        status2, emailed2 = send_welcome_email(
            user_id="u1", email="a@b.c", store=welcome_store
        )
        assert status2 == "already_sent" and emailed2 is False
        assert send.call_count == 1


def test_welcome_route_requires_auth():
    client = TestClient(app)
    r = client.post("/api/v1/auth/welcome")
    assert r.status_code == 401


def test_welcome_route_sends(monkeypatch, welcome_store):
    monkeypatch.setenv("RESEND_API_KEY", "re_test")

    def _claims():
        return {"user_id": "user-9", "email": "new@mframapa.live", "tier": "public"}

    app.dependency_overrides[security.current_user_claims] = _claims
    try:
        with patch("backend.email.welcome.WelcomeStore", return_value=welcome_store):
            with patch("backend.email.welcome.send_resend_email", return_value=True):
                client = TestClient(app)
                r = client.post("/api/v1/auth/welcome")
                assert r.status_code == 200
                assert r.json()["status"] == "sent"
                assert r.json()["emailed"] is True
    finally:
        app.dependency_overrides.pop(security.current_user_claims, None)
