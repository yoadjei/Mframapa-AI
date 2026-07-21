"""the same place must give the same reading twice.

latitude and longitude are model inputs, and a phone's gps wanders by tens of
metres between readings. used raw, that jitter changed the prediction every time
the user refreshed, which makes the number look invented. our spatial resolution
is about a kilometre, so anything finer is false precision and is rounded away.
"""

from datetime import date

import backend.api.v1.router as router
from fastapi.testclient import TestClient

from backend.api.app import app

client = TestClient(app)


class Recorder:
    """captures the coordinates the pipeline is actually asked for."""

    def __init__(self):
        self.seen = []

    def get_features(self, lat, lon, day):
        self.seen.append((lat, lon))
        return {"pm25_surface": 20.0, "temperature_2m": 27.0}


def _pipeline(recorder):
    app.dependency_overrides[router.get_feature_pipeline] = lambda: recorder
    return recorder


def teardown_function():
    app.dependency_overrides.pop(router.get_feature_pipeline, None)


# a few metres of gps drift, well inside one grid cell
JITTER = [
    (6.688000, -1.624000),
    (6.688300, -1.624400),
    (6.687600, -1.623700),
]


def test_gps_jitter_does_not_move_the_reading():
    rec = _pipeline(Recorder())
    readings = []
    for lat, lon in JITTER:
        r = client.get(f"/api/v1/predict?lat={lat}&lon={lon}&name=Kumasi")
        assert r.status_code == 200
        readings.append(r.json()["pm25"])
    assert len(set(readings)) == 1, f"same spot gave different readings: {readings}"


def test_coordinates_are_snapped_before_inference():
    rec = _pipeline(Recorder())
    for lat, lon in JITTER:
        client.get(f"/api/v1/predict?lat={lat}&lon={lon}&name=Kumasi")
    assert len(set(rec.seen)) == 1, f"pipeline saw several coordinates: {set(rec.seen)}"


def test_genuinely_different_places_still_differ():
    """snapping must not merge neighbouring towns into one reading."""
    rec = _pipeline(Recorder())
    client.get("/api/v1/predict?lat=6.69&lon=-1.62&name=Kumasi")
    client.get("/api/v1/predict?lat=5.60&lon=-0.19&name=Accra")
    assert len(set(rec.seen)) == 2
