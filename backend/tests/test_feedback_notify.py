"""Feedback email notify is best-effort and never blocks storage."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

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

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = "{}"

    with patch("backend.feedback.notify.requests.post", return_value=mock_resp) as post:
        ok = notify_feedback_email(
            feedback_id=9,
            category="feature",
            message="Please add X",
            email="user@example.com",
            platform="android",
        )
    assert ok is True
    assert post.called
    kwargs = post.call_args.kwargs["json"]
    assert kwargs["to"] == ["team@example.com"]
    assert "feature" in kwargs["subject"]
    assert kwargs["reply_to"] == "user@example.com"
