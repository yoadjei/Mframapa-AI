"""Feedback email notify is best-effort and never blocks storage."""

from __future__ import annotations

from unittest.mock import patch

from backend.feedback.notify import notify_feedback_email


def test_notify_skips_without_api_key(monkeypatch):
    monkeypatch.delenv("RESEND_API_KEY", raising=False)
    assert (
        notify_feedback_email(
            feedback_id=1,
            category="bug",
            message="Map blank",
            email="a@b.c",
            platform="pwa",
        )
        is False
    )


def test_notify_posts_to_resend(monkeypatch):
    monkeypatch.setenv("RESEND_API_KEY", "re_test")
    monkeypatch.setenv("FEEDBACK_TO_EMAIL", "team@example.com")
    monkeypatch.setenv("RESEND_FROM_EMAIL", "Mframapa <alerts@example.com>")

    with patch("backend.feedback.notify.send_resend_email", return_value=True) as send:
        ok = notify_feedback_email(
            feedback_id=9,
            category="feature",
            message="Please add X",
            email="user@example.com",
            platform="android",
        )
    assert ok is True
    assert send.called
    kwargs = send.call_args.kwargs
    assert kwargs["to"] == ["team@example.com"]
    assert "feature" in kwargs["subject"]
    assert kwargs["reply_to"] == "user@example.com"
