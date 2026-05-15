"""FastAPI /api routes (predict uncertainty, resolve-location)."""

from unittest.mock import MagicMock
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from backend.api.app import app
from backend.api.v1.router import get_feature_pipeline
from backend.pipeline.feature_pipeline import FeaturePipeline


@pytest.fixture
def client():
    # Provide the default API Key for tests to pass
    return TestClient(app, headers={"X-API-Key": "mframapa-internal-dev-key"})


def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_resolve_location_found(client):
    r = client.get("/api/v1/resolve-location", params={"city": "Lagos"})
    assert r.status_code == 200
    data = r.json()
    assert "lat" in data and "lon" in data
    assert "Lagos" in data["name"]


def test_resolve_location_missing(client):
    r = client.get("/api/v1/resolve-location", params={"city": "NonexistentCityXyz123"})
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
            "/api/v1/predict",
            params={"lat": 5.6, "lon": -0.19, "name": "Accra", "day": "2024-06-01"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["pm25"] > 0
        assert "uncertainty" in data
        assert data["uncertainty"]["pm25_lower"] < data["pm25"]
        assert data["uncertainty"]["pm25_upper"] > data["pm25"]
        assert data["model"]["region_id"]
        assert data["model"]["segment"] in ("urban", "rural")
    finally:
        app.dependency_overrides.clear()


def test_generate_insight(client):
    r = client.post(
        "/api/v1/generate-insight",
        json={"pm25": 80, "aqi_category": "Unhealthy", "weather": {}, "language": "en"},
    )
    assert r.status_code == 200
    assert "insight" in r.json()


def test_predict_out_of_range_lat(client):
    r = client.get("/api/v1/predict", params={"lat": 99.0, "lon": 0.0})
    assert r.status_code == 422


def test_predict_out_of_range_lon(client):
    r = client.get("/api/v1/predict", params={"lat": 0.0, "lon": 200.0})
    assert r.status_code == 422


def test_predict_missing_params(client):
    r = client.get("/api/v1/predict", params={"lon": 0.0})
    assert r.status_code == 422


def test_predict_aqi_category_matches_pm25(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {"pm25_surface": 8.0}
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get("/api/v1/predict", params={"lat": 5.6, "lon": -0.19})
        assert r.status_code == 200
        data = r.json()
        from backend.api.aqi import aqi_category_from_pm25
        assert data["aqi_category"] == aqi_category_from_pm25(data["pm25"])
    finally:
        app.dependency_overrides.clear()


def test_predict_fallback_when_pm25_missing(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {}
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get("/api/v1/predict", params={"lat": 5.6, "lon": -0.19})
        assert r.status_code == 200
        assert r.json()["pm25"] > 0
    finally:
        app.dependency_overrides.clear()


def test_resolve_location_empty_query(client):
    r = client.get("/api/v1/resolve-location", params={"city": ""})
    assert r.status_code == 422


def test_generate_insight_hazardous(client):
    r = client.post(
        "/api/v1/generate-insight",
        json={"pm25": 200.0, "aqi_category": "Hazardous", "weather": {}, "language": "en"},
    )
    assert r.status_code == 200
    text = r.json()["insight"].lower()
    assert any(w in text for w in ("high", "hazard", "exposure", "particulate", "level"))


def test_generate_insight_negative_pm25(client):
    r = client.post("/api/v1/generate-insight", json={"pm25": -1.0})
    assert r.status_code == 422


def test_batch_predict_success(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {
        "pm25_surface": 22.0,
        "temperature_2m": 27.0,
        "relative_humidity": 60.0,
        "u_component_of_wind_10m": 1.0,
        "v_component_of_wind_10m": 1.0,
        "population_density": 900.0,
    }
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.post(
            "/api/v1/batch-predict",
            json={
                "locations": [
                    {"lat": 5.6, "lon": -0.19, "name": "Accra"},
                    {"lat": 6.52, "lon": 3.37, "name": "Lagos"},
                ]
            },
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] == 2
        assert data["success_count"] == 2
        assert data["error_count"] == 0
        assert len(data["results"]) == 2
    finally:
        app.dependency_overrides.clear()


def test_batch_predict_enforces_cap(client):
    payload = {
        "locations": [
            {"lat": 0.1, "lon": 0.2, "name": f"City-{idx}"}
            for idx in range(21)
        ]
    }
    r = client.post("/api/v1/batch-predict", json=payload)
    assert r.status_code == 422


def test_predict_response_compression(client):
    mock_pipeline = MagicMock()
    mock_pipeline.get_features.return_value = {
        "pm25_surface": 45.0,
        "temperature_2m": 30.0,
        "relative_humidity": 65.0,
        "u_component_of_wind_10m": 2.0,
        "v_component_of_wind_10m": 2.0,
        "population_density": 1400.0,
        "no2_tropospheric_column": 1e-5,
        "aerosol_optical_depth": 0.3,
        "pm10_surface": 52.0,
        "elevation": 90.0,
    }
    app.dependency_overrides[get_feature_pipeline] = lambda: mock_pipeline
    try:
        r = client.get(
            "/api/v1/predict",
            params={"lat": 5.6, "lon": -0.19, "name": "Accra"},
            headers={"Accept-Encoding": "gzip"},
        )
        assert r.status_code == 200
        assert r.headers.get("content-encoding") == "gzip"
    finally:
        app.dependency_overrides.clear()


def test_ingest_to_predict_smoke(client):
    with patch("backend.pipeline.feature_pipeline.DataOrchestrator") as mock_orchestrator_cls, patch(
        "backend.pipeline.feature_pipeline.WorldPopDataSource"
    ) as mock_worldpop_cls, patch("backend.pipeline.feature_pipeline.SRTMDataSource") as mock_srtm_cls:
        mock_orchestrator_cls.return_value.get_features.return_value = {
            "pm25_surface": 18.0,
            "temperature_2m": 27.2,
            "relative_humidity": 63.0,
            "u_component_of_wind_10m": 0.8,
            "v_component_of_wind_10m": 1.1,
            "aerosol_optical_depth": 0.22,
            "pm10_surface": 26.0,
            "no2_tropospheric_column": 1.2e-5,
        }
        mock_worldpop_cls.return_value.fetch_data.return_value = {"population_density": 1150.0}
        mock_srtm_cls.return_value.fetch_data.return_value = {"elevation": 85.0}

        app.dependency_overrides[get_feature_pipeline] = lambda: FeaturePipeline()
        try:
            r = client.get("/api/v1/predict", params={"lat": 5.6037, "lon": -0.187, "name": "Accra"})
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["pm25"] > 0
            assert data["weather"]["temp"] == pytest.approx(27.2)
            assert data["factors"]["population_density"] == pytest.approx(1150.0)
            assert data["model"]["region_id"]
        finally:
            app.dependency_overrides.clear()
