"""FastAPI /api routes (predict uncertainty, resolve-location)."""

from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from backend.api.app import app, get_feature_pipeline


@pytest.fixture
def client():
    return TestClient(app)


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_resolve_location_found(client):
    r = client.get("/api/resolve-location", params={"city": "Lagos"})
    assert r.status_code == 200
    data = r.json()
    assert "lat" in data and "lon" in data
    assert "Lagos" in data["name"]


def test_resolve_location_missing(client):
    r = client.get("/api/resolve-location", params={"city": "NonexistentCityXyz123"})
    assert r.status_code == 404


def test_predict_returns_uncertainty(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {
        "pm25_surface": 40.0,
        "temperature_2m": 30.0,
        "relative_humidity": 70.0,
        "u_component_of_wind_10m": 1.0,
        "v_component_of_wind_10m": 0.5,
        "no2_tropospheric_column": 1e-5,
        "aerosol_optical_depth": 0.3,
        "pm10_surface": 50.0,
        "population_density": 1200.0,
        "elevation": 100.0,
    }

    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get(
            "/api/predict",
            params={"lat": 5.6, "lon": -0.19, "name": "Accra", "day": "2024-06-01"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["pm25"] == 40.0
        assert "uncertainty" in data
        assert data["uncertainty"]["pm25_lower"] < data["pm25"]
        assert data["uncertainty"]["pm25_upper"] > data["pm25"]
        assert data["model"]["region_id"]
        assert data["model"]["segment"] in ("urban", "rural")
    finally:
        app.dependency_overrides.clear()


def test_generate_insight(client):
    r = client.post(
        "/api/generate-insight",
        json={"pm25": 80, "aqi_category": "Unhealthy", "weather": {}, "language": "en"},
    )
    assert r.status_code == 200
    assert "insight" in r.json()


def test_predict_out_of_range_lat(client):
    r = client.get("/api/predict", params={"lat": 99.0, "lon": 0.0})
    assert r.status_code == 422


def test_predict_out_of_range_lon(client):
    r = client.get("/api/predict", params={"lat": 0.0, "lon": 200.0})
    assert r.status_code == 422


def test_predict_missing_params(client):
    r = client.get("/api/predict", params={"lon": 0.0})
    assert r.status_code == 422


def test_predict_aqi_category_matches_pm25(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {"pm25_surface": 8.0}
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get("/api/predict", params={"lat": 5.6, "lon": -0.19})
        assert r.status_code == 200
        assert r.json()["aqi_category"] == "Good"
    finally:
        app.dependency_overrides.clear()


def test_predict_fallback_when_pm25_missing(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {}
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get("/api/predict", params={"lat": 5.6, "lon": -0.19})
        assert r.status_code == 200
        assert r.json()["pm25"] == 25.0
    finally:
        app.dependency_overrides.clear()


def test_resolve_location_empty_query(client):
    r = client.get("/api/resolve-location", params={"city": ""})
    assert r.status_code == 422


def test_generate_insight_hazardous(client):
    r = client.post(
        "/api/generate-insight",
        json={"pm25": 200.0, "aqi_category": "Hazardous", "weather": {}, "language": "en"},
    )
    assert r.status_code == 200
    text = r.json()["insight"].lower()
    assert any(w in text for w in ("high", "hazard", "exposure", "particulate", "level"))


def test_generate_insight_negative_pm25(client):
    r = client.post("/api/generate-insight", json={"pm25": -1.0})
    assert r.status_code == 422
