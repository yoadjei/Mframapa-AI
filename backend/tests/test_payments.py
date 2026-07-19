"""paystack webhook tests — signature auth, tier mapping, and forgery resistance."""

import hashlib
import hmac
import json

from fastapi.testclient import TestClient

import backend.api.v1.payments as payments
from backend.api.app import app

client = TestClient(app)
SECRET = "sk_test_webhook_secret"


def _post(payload: dict, secret: str | None = SECRET, monkeypatch=None):
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if secret is not None:
        headers["x-paystack-signature"] = hmac.new(
            secret.encode(), body, hashlib.sha512
        ).hexdigest()
    return client.post("/api/v1/payments/paystack/webhook", content=body, headers=headers)


def _charge(plan_id="researcher_monthly", user_id="user-abc"):
    return {
        "event": "charge.success",
        "data": {
            "status": "success",
            "metadata": {"plan_id": plan_id, "user_id": user_id},
            "customer": {"email": "buyer@example.com"},
        },
    }


# ── authentication ────────────────────────────────────────────────────────────

def test_unsigned_request_rejected(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    assert _post(_charge(), secret=None).status_code == 401


def test_wrong_signature_rejected(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    assert _post(_charge(), secret="an-attackers-secret").status_code == 401


def test_rejected_when_secret_not_configured(monkeypatch):
    monkeypatch.delenv("PAYSTACK_SECRET_KEY", raising=False)
    assert _post(_charge()).status_code == 401


def test_tampered_body_rejected(monkeypatch):
    """signature covers the body — changing the plan after signing must fail."""
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    signed = json.dumps(_charge()).encode()
    sig = hmac.new(SECRET.encode(), signed, hashlib.sha512).hexdigest()
    tampered = json.dumps(_charge(plan_id="researcher_annual")).encode()
    r = client.post(
        "/api/v1/payments/paystack/webhook",
        content=tampered,
        headers={"x-paystack-signature": sig, "Content-Type": "application/json"},
    )
    assert r.status_code == 401


# ── tier changes ──────────────────────────────────────────────────────────────

def test_successful_charge_upgrades_tier(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    calls = []
    monkeypatch.setattr(payments, "set_user_tier",
                        lambda uid, tier: calls.append((uid, tier)) or True)
    r = _post(_charge())
    assert r.status_code == 200
    assert calls == [("user-abc", "researcher")]


def test_annual_plan_maps_to_same_tier(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    calls = []
    monkeypatch.setattr(payments, "set_user_tier",
                        lambda uid, tier: calls.append((uid, tier)) or True)
    _post(_charge(plan_id="researcher_annual"))
    assert calls == [("user-abc", "researcher")]


def test_unknown_plan_grants_nothing(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    calls = []
    monkeypatch.setattr(payments, "set_user_tier",
                        lambda uid, tier: calls.append((uid, tier)) or True)
    r = _post(_charge(plan_id="free_lunch_plan"))
    assert r.status_code == 200
    assert calls == []          # no tier granted for an unrecognised plan


def test_failed_charge_grants_nothing(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    calls = []
    monkeypatch.setattr(payments, "set_user_tier",
                        lambda uid, tier: calls.append((uid, tier)) or True)
    payload = _charge()
    payload["data"]["status"] = "failed"
    _post(payload)
    assert calls == []


def test_subscription_disable_downgrades_to_free(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    calls = []
    monkeypatch.setattr(payments, "set_user_tier",
                        lambda uid, tier: calls.append((uid, tier)) or True)
    r = _post({
        "event": "subscription.disable",
        "data": {"metadata": {"user_id": "user-abc"}, "customer": {"email": "b@e.com"}},
    })
    assert r.status_code == 200
    assert calls == [("user-abc", "free")]


def test_transient_failure_returns_500_so_paystack_retries(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    monkeypatch.setattr(payments, "set_user_tier", lambda uid, tier: False)
    assert _post(_charge()).status_code == 500


def test_unrelated_event_is_acked(monkeypatch):
    monkeypatch.setenv("PAYSTACK_SECRET_KEY", SECRET)
    r = _post({"event": "customer.create", "data": {}})
    assert r.status_code == 200
