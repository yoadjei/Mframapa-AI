"""
FastAPI application — serves /api/* for the PWA (see frontend vite proxy :8000).

Run locally::
    uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date as dt_date
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.logging import LoggingIntegration
    _dsn = os.getenv("SENTRY_DSN")
    if _dsn:
        sentry_sdk.init(
            dsn=_dsn,
            integrations=[FastApiIntegration(), LoggingIntegration()],
            traces_sample_rate=0.2,
            environment=os.getenv("ENVIRONMENT", "production"),
        )
except ImportError:
    pass

from backend.api.aqi import aqi_category_from_pm25
from backend.pipeline.feature_pipeline import FeaturePipeline
from ml.model_selection import regional_export_dir
from ml.paths import repository_root
from ml.regions import assign_region
from ml.urban_rural import classify_from_population_density

logger = logging.getLogger(__name__)

REPO_ROOT = repository_root()
CITIES_PATH = REPO_ROOT / "backend" / "data" / "african_cities.json"


def _default_conformal_half_width(pm25: float) -> float:
    """Fallback interval half-width when no trained manifest is present."""
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


@lru_cache(maxsize=1)
def _cities() -> List[Dict[str, Any]]:
    with CITIES_PATH.open(encoding="utf-8") as f:
        return json.load(f)["cities"]


def get_feature_pipeline() -> FeaturePipeline:
    return FeaturePipeline()


app = FastAPI(title="Mframapa API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/resolve-location")
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


@app.get("/api/predict")
def predict(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str = Query("Unknown"),
    day: Optional[str] = Query(
        None,
        description="ISO date YYYY-MM-DD (default: today)",
    ),
    pipeline: FeaturePipeline = Depends(get_feature_pipeline),
) -> Dict[str, Any]:
    d = day or dt_date.today().isoformat()

    feats = pipeline.get_features(lat, lon, d)
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
    uncertainty_method = (
        "split_conformal_manifest" if manifest_hw is not None else "heuristic_relative"
    )

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
        "model": {
            "region_id": region_id,
            "segment": segment,
            "version": "2.0.0",
            "source": "feature_pipeline_pm25_surface",
        },
    }


class InsightBody(BaseModel):
    pm25: float = Field(..., ge=0)
    aqi_category: str = ""
    weather: Dict[str, Any] = Field(default_factory=dict)
    language: str = "en"


_STUB_INSIGHTS_EN = {
    "good": "Satellite-based estimate suggests favorable dispersion today.",
    "moderate": "Particulate levels are slightly elevated; sensitive people may notice.",
    "sensitive": "Elevated PM2.5 — children and older adults should limit strenuous outdoor time.",
    "unhealthy": "Poor air quality likely from stagnant conditions or local emissions.",
    "hazardous": "Very high particulate levels — reduce outdoor exposure.",
}


@app.post("/api/generate-insight")
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
