"""
institutional batch predict.

multi-point predictions with csv/geojson export — moved off /predict, which stays
pure json per the frontend contract (scope §2.3). institutional/internal tier only.
"""

import csv
import io
import json
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, Request, Response
from pydantic import BaseModel, Field

from backend.api.security import require_institutional
from backend.api.v1.router import compute_prediction, get_feature_pipeline
from backend.pipeline.feature_pipeline import FeaturePipeline

_MAX_POINTS = 200


class BatchPoint(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    name: str = "Unknown"
    day: Optional[str] = None


class BatchBody(BaseModel):
    points: List[BatchPoint] = Field(..., min_length=1, max_length=_MAX_POINTS)


batch_router = APIRouter(prefix="/batch", dependencies=[Depends(require_institutional)])


@batch_router.post("/predict")
def batch_predict(
    request: Request,
    body: BatchBody,
    format: str = Query("json", description="json | csv | geojson"),
    pipeline: FeaturePipeline = Depends(get_feature_pipeline),
) -> Any:
    results = [
        compute_prediction(request, p.lat, p.lon, p.name, p.day, pipeline)
        for p in body.points
    ]
    if format == "csv":
        return Response(content=_to_csv(results), media_type="text/csv")
    if format == "geojson":
        return Response(content=json.dumps(_to_geojson(results)), media_type="application/geo+json")
    return {"predictions": results}


def _to_csv(results: List[Dict[str, Any]]) -> str:
    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(["name", "lat", "lon", "pm25", "aqi_category", "half_width", "degraded"])
    for r in results:
        loc, unc = r["location"], r["uncertainty"]
        writer.writerow([
            loc["name"], loc["lat"], loc["lon"],
            r["pm25"], r["aqi_category"], unc["half_width"], r["degraded"],
        ])
    return out.getvalue()


def _to_geojson(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    features = []
    for r in results:
        loc, unc = r["location"], r["uncertainty"]
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [loc["lon"], loc["lat"]]},
            "properties": {
                "name": loc["name"],
                "pm25": r["pm25"],
                "aqi_category": r["aqi_category"],
                "uncertainty_lower": unc["pm25_lower"],
                "uncertainty_upper": unc["pm25_upper"],
            },
        })
    return {"type": "FeatureCollection", "features": features}
