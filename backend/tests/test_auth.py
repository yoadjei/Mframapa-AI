"""auth tests — issued keys, supabase bearer tokens, and privilege escalation."""

import os
import time

import jwt as pyjwt
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api.auth import verify_supabase_jwt

client = TestClient(app)
INTERNAL = {"X-API-Key": os.environ["MFRAMAPA_INTERNAL_KEY"]}


def _token(secret: str, **claims):
    payload = {
        "sub": "user-123",
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        **claims,
    }
    return pyjwt.encode(payload, secret, algorithm="HS256")


# ── issued keys ───────────────────────────────────────────────────────────────

def test_internal_key_still_works():
    assert client.get("/api/v1/health", headers=INTERNAL).status_code == 200


def test_unregistered_public_prefix_is_rejected():
    # regression: any "mframapa-pub-*" string used to be accepted on prefix alone
    r = client.get("/api/v1/health", headers={"X-API-Key": "mframapa-pub-anything"})
    assert r.status_code == 401


def test_unregistered_institutional_prefix_is_rejected():
    r = client.get("/api/v1/health", headers={"X-API-Key": "mframapa-inst-anything"})
    assert r.status_code == 401


def test_no_credentials_rejected():
    assert client.get("/api/v1/health").status_code == 401


# ── supabase bearer tokens ────────────────────────────────────────────────────

def test_garbage_bearer_rejected():
    r = client.get("/api/v1/health", headers={"Authorization": "Bearer not.a.jwt"})
    assert r.status_code == 401


def test_valid_supabase_token_authenticates(monkeypatch):
    secret = "test-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    r = client.get(
        "/api/v1/health",
        headers={"Authorization": f"Bearer {_token(secret)}"},
    )
    assert r.status_code == 200


def test_expired_token_rejected(monkeypatch):
    secret = "test-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    expired = pyjwt.encode(
        {"sub": "u1", "aud": "authenticated", "exp": int(time.time()) - 10},
        secret, algorithm="HS256",
    )
    r = client.get("/api/v1/health", headers={"Authorization": f"Bearer {expired}"})
    assert r.status_code == 401


def test_token_signed_with_wrong_secret_rejected(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "the-real-secret")
    r = client.get(
        "/api/v1/health",
        headers={"Authorization": f"Bearer {_token('an-attackers-secret')}"},
    )
    assert r.status_code == 401


# ── privilege escalation ──────────────────────────────────────────────────────

def test_token_cannot_claim_internal_tier(monkeypatch):
    secret = "test-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    identity = verify_supabase_jwt(_token(secret, app_metadata={"tier": "internal"}))
    assert identity["tier"] == "free"   # downgraded, never internal


def test_unknown_tier_falls_back_to_free(monkeypatch):
    secret = "test-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    identity = verify_supabase_jwt(_token(secret, app_metadata={"tier": "wizard"}))
    assert identity["tier"] == "free"


def test_paid_tier_from_app_metadata_is_honoured(monkeypatch):
    secret = "test-jwt-secret"
    monkeypatch.setenv("SUPABASE_JWT_SECRET", secret)
    identity = verify_supabase_jwt(_token(secret, app_metadata={"tier": "researcher"}))
    assert identity["tier"] == "researcher"
    assert identity["user_id"] == "user-123"
