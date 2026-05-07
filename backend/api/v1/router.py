import io
import csv
import json
from datetime import date as dt_date
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, Response
from pydantic import BaseModel, Field

from backend.api.aqi import aqi_category_from_pm25
from backend.api.security import verify_and_rate_limit
from backend.pipeline.feature_pipeline import FeaturePipeline
from ml.model_selection import regional_export_dir
from ml.paths import repository_root
from ml.regions import assign_region
from ml.urban_rural import classify_from_population_density
import logging

logger = logging.getLogger(__name__)

REPO_ROOT = repository_root()
CITIES_PATH = REPO_ROOT / "backend" / "data" / "african_cities.json"

def _default_conformal_half_width(pm25: float) -> float:
    v = max(float(pm25), 1.0)
    return max(5.0, v * 0.22)

def _load_manifest_half_width(region_id: str, segment: str) -> Optional[float]:
    manifest = regional_export_dir(region_id, segment) / "manifest.json"
    if not manifest.is_file():
        return None
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
        u = data.get("uncertainty") or {}
        w = u.get("conformal_half_width")
        return float(w) if w is not None else None
    except (json.JSONDecodeError, TypeError, ValueError):
        return None

def _cities() -> list:
    with CITIES_PATH.open(encoding="utf-8") as f:
        return json.load(f)["cities"]

_STUB_INSIGHTS_EN = {
    "good": "Satellite-based estimate suggests favorable dispersion today.",
    "moderate": "Particulate levels are slightly elevated; sensitive people may notice.",
    "sensitive": "Elevated PM2.5 — children and older adults should limit strenuous outdoor time.",
    "unhealthy": "Poor air quality likely from stagnant conditions or local emissions.",
    "hazardous": "Very high particulate levels — reduce outdoor exposure.",
}

def get_feature_pipeline() -> FeaturePipeline:
    return FeaturePipeline()

router = APIRouter(dependencies=[Depends(verify_and_rate_limit)])

@router.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok", "version": "v1"}


def _build_prediction(
    lat: float,
    lon: float,
    name: str,
    day: str,
    pipeline: FeaturePipeline,
) -> Dict[str, Any]:
    feats = pipeline.get_features(lat, lon, day)
    pm25_raw = feats.get("pm25_surface")
    if pm25_raw is None:
        pm25 = 25.0
        logger.warning("pm25_surface missing for (%s,%s); using fallback", lat, lon)
    else:
        pm25 = float(pm25_raw)

    cat = aqi_category_from_pm25(pm25)
    pop = feats.get("population_density")
    region_id = assign_region(lat, lon) or "west_africa"
    segment = classify_from_population_density(pop if isinstance(pop, (int, float)) else None)
    half = _load_manifest_half_width(region_id, segment) or _default_conformal_half_width(pm25)
    lower = max(0.0, pm25 - half)
    upper = pm25 + half

    temp = feats.get("temperature_2m")
    rh = feats.get("relative_humidity")
    u = feats.get("u_component_of_wind_10m") or 0.0
    v = feats.get("v_component_of_wind_10m") or 0.0
    wind_speed = (float(u) ** 2 + float(v) ** 2) ** 0.5

    factors = {
        k: feats.get(k)
        for k in (
            "no2_tropospheric_column",
            "aerosol_optical_depth",
            "pm10_surface",
            "population_density",
            "elevation",
        )
        if feats.get(k) is not None
    }

    manifest_hw = _load_manifest_half_width(region_id, segment)
    uncertainty_method = "split_conformal_manifest" if manifest_hw is not None else "heuristic_relative"

    return {
        "pm25": round(pm25, 2),
        "aqi_category": cat,
        "factors": factors,
        "weather": {
            "temp": float(temp) if temp is not None else None,
            "humidity": float(rh) if rh is not None else None,
            "wind": round(wind_speed, 2),
            "pressure": None,
        },
        "uncertainty": {
            "pm25_lower": round(lower, 2),
            "pm25_upper": round(upper, 2),
            "half_width": round(half, 2),
            "coverage": 0.9,
            "method": uncertainty_method,
        },
        "location": {"name": name, "lat": lat, "lon": lon},
        "model": {
            "region_id": region_id,
            "segment": segment,
            "version": "2.0.0",
            "source": "feature_pipeline_pm25_surface",
        },
    }

@router.get("/resolve-location")
def resolve_location(
    city: str = Query(..., min_length=1, description="City name (partial match, Africa dataset)"),
) -> Dict[str, Any]:
    q = city.strip().lower()
    if not q:
        raise HTTPException(400, "city is required")
    best: Optional[Dict[str, Any]] = None
    for c in _cities():
        name = str(c.get("name", "")).lower()
        country = str(c.get("country", "")).lower()
        if q in name or q in f"{name}, {country}".lower() or name.startswith(q):
            best = c
            break
    if best is None:
        for c in _cities():
            if q in str(c.get("country", "")).lower():
                best = c
                break
    if best is None:
        raise HTTPException(404, "City not found in African coverage dataset")
    return {
        "lat": float(best["lat"]),
        "lon": float(best["lon"]),
        "name": f"{best['name']}, {best['country']}",
        "is_africa": True,
    }

@router.get("/predict")
def predict(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str = Query("Unknown"),
    day: Optional[str] = Query(None, description="ISO date YYYY-MM-DD (default: today)"),
    format: Optional[str] = Query("json", description="Output format: json, csv, geojson"),
    pipeline: FeaturePipeline = Depends(get_feature_pipeline),
) -> Any:
    d = day or dt_date.today().isoformat()

    result = _build_prediction(lat=lat, lon=lon, name=name, day=d, pipeline=pipeline)

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["lat", "lon", "name", "day", "pm25", "aqi_category", "uncertainty_half_width"])
        writer.writerow([lat, lon, name, d, result["pm25"], result["aqi_category"], result["uncertainty"]["half_width"]])
        return Response(content=output.getvalue(), media_type="text/csv")
        
    elif format == "geojson":
        geojson = {
            "type": "FeatureCollection",
            "features": [{
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "name": name,
                    "day": d,
                    "pm25": result["pm25"],
                    "aqi_category": result["aqi_category"],
                    "uncertainty_lower": result["uncertainty"]["pm25_lower"],
                    "uncertainty_upper": result["uncertainty"]["pm25_upper"]
                }
            }]
        }
        return Response(content=json.dumps(geojson), media_type="application/geo+json")

    return result


class BatchLocation(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    name: str = Field(default="Unknown")


class BatchPredictRequest(BaseModel):
    locations: List[BatchLocation] = Field(..., min_length=1, max_length=20)
    day: Optional[str] = Field(default=None)


@router.post("/batch-predict")
def batch_predict(
    body: BatchPredictRequest,
    pipeline: FeaturePipeline = Depends(get_feature_pipeline),
) -> Dict[str, Any]:
    day = body.day or dt_date.today().isoformat()
    results: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    for idx, item in enumerate(body.locations):
        try:
            results.append(
                _build_prediction(
                    lat=item.lat,
                    lon=item.lon,
                    name=item.name,
                    day=day,
                    pipeline=pipeline,
                )
            )
        except Exception as exc:
            logger.exception("Batch prediction failed at index %s", idx)
            errors.append({"index": idx, "name": item.name, "detail": str(exc)})

    return {
        "day": day,
        "count": len(body.locations),
        "success_count": len(results),
        "error_count": len(errors),
        "results": results,
        "errors": errors,
    }

class InsightBody(BaseModel):
    pm25: float = Field(..., ge=0)
    aqi_category: str = ""
    weather: Dict[str, Any] = Field(default_factory=dict)
    language: str = "en"

@router.post("/generate-insight")
def generate_insight(body: InsightBody) -> Dict[str, str]:
    cat = (body.aqi_category or aqi_category_from_pm25(body.pm25)).lower()
    key = "good"
    if "hazardous" in cat:
        key = "hazardous"
    elif "unhealthy" in cat and "sensitive" not in cat:
        key = "unhealthy"
    elif "sensitive" in cat:
        key = "sensitive"
    elif "moderate" in cat:
        key = "moderate"
    text = _STUB_INSIGHTS_EN[key]
    return {"insight": text}
