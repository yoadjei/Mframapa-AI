"""api smoke tests — auth, input validation, routing.

these run without models, redis, or network: the rate limiter has an in-memory
fallback, and every case here is rejected/handled before any upstream call.
"""

import os

from fastapi.testclient import TestClient

from backend.api.app import app

# env (PREWARM_ON_START, MFRAMAPA_INTERNAL_KEY) is set by conftest.py
client = TestClient(app)
KEY = {"X-API-Key": os.environ["MFRAMAPA_INTERNAL_KEY"]}


def test_legacy_health_is_open():
    assert client.get("/api/health").status_code == 200


def test_v1_health_is_public():
    # core read endpoints are anonymous-accessible (rate-limited per ip)
    assert client.get("/api/v1/health").status_code == 200


def test_institutional_endpoint_rejects_anonymous():
    # batch-predict is an institutional feature (scope §5)
    r = client.post("/api/v1/batch-predict",
                    json={"locations": [{"lat": 5.6, "lon": -0.19}]})
    assert r.status_code == 401


def test_alert_registration_is_free_for_individuals():
    # scope §3.2: alerts are the product and are never paywalled — no account needed
    r = client.post("/api/v1/register-push-token",
                    json={"token": "t", "platform": "android", "lat": 5.6, "lon": -0.19})
    assert r.status_code == 200


def test_v1_health_rejects_wrong_key():
    assert client.get("/api/v1/health", headers={"X-API-Key": "nope"}).status_code == 401


def test_v1_health_with_key():
    r = client.get("/api/v1/health", headers=KEY)
    assert r.status_code == 200
    assert r.json()["version"] == "v1"


def test_predict_rejects_out_of_range_lat():
    assert client.get("/api/v1/predict?lat=100&lon=0", headers=KEY).status_code == 422


def test_predict_rejects_missing_param():
    assert client.get("/api/v1/predict?lon=0", headers=KEY).status_code == 422


def test_resolve_rejects_empty_city():
    assert client.get("/api/v1/resolve-location?city=", headers=KEY).status_code == 422


def test_generate_insight_ok():
    r = client.post("/api/v1/generate-insight", headers=KEY, json={"pm25": 45, "language": "en"})
    assert r.status_code == 200
    assert "insight" in r.json()


def test_generate_insight_rejects_negative():
    assert client.post("/api/v1/generate-insight", headers=KEY, json={"pm25": -5}).status_code == 422


def test_unknown_path_is_404():
    assert client.get("/api/v1/does-not-exist", headers=KEY).status_code == 404


def test_method_not_allowed():
    assert client.post("/api/v1/predict?lat=5&lon=5", headers=KEY).status_code == 405
