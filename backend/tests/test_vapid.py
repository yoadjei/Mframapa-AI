"""Web Push VAPID public-key endpoint."""

from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)


def test_vapid_public_key_503_when_unconfigured(monkeypatch):
    monkeypatch.delenv("VAPID_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    r = client.get("/api/v1/vapid-public-key")
    assert r.status_code == 503
    assert "not configured" in r.json()["detail"].lower()


def test_vapid_public_key_200_when_configured(monkeypatch):
    monkeypatch.setenv("VAPID_PUBLIC_KEY", "BTEST_PUBLIC_KEY_FOR_UNIT_TEST_ONLY")
    monkeypatch.setenv(
        "VAPID_PRIVATE_KEY",
        "-----BEGIN PRIVATE KEY-----\\nTEST\\n-----END PRIVATE KEY-----\\n",
    )
    r = client.get("/api/v1/vapid-public-key")
    assert r.status_code == 200
    body = r.json()
    assert body["configured"] is True
    assert body["publicKey"] == "BTEST_PUBLIC_KEY_FOR_UNIT_TEST_ONLY"


def test_vapid_public_key_allows_anonymous():
    """PWA subscribe must work without a signed-in user or API key."""
    # Even with keys unset we assert anonymous is not 401 — 503 is fine.
    r = client.get("/api/v1/vapid-public-key")  # no credentials
    assert r.status_code in (200, 503)
