import json
from datetime import date as dt_date
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Query, HTTPException, Request
from pydantic import BaseModel, Field

from backend.api.aqi import aqi_category_from_pm25
from backend.api.security import verify_and_rate_limit
from backend.ml.inference import rectify_prediction, select_bundle
from backend.pipeline.feature_pipeline import FeaturePipeline
from ml.derived_features import for_point as _derived_for_point
from ml.static_features import for_point as _static_for_point
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

def _run_inference(request, feats, region_id, segment, om_pm25):
    """predict via the region/segment bundle; fall back to openmeteo, then a constant.

    returns (pm25, half_width, degraded, source, method).
    """
    bundles = getattr(request.app.state, "models", {}) or {}
    bundle = select_bundle(bundles, region_id, segment)
    if bundle is not None:
        pm25, degraded = rectify_prediction(bundle.predict_point(feats), om_pm25)
        half = bundle.conformal_half_width or _default_conformal_half_width(pm25)
        return pm25, half, degraded, "model_ensemble", "split_conformal_manifest"

    manifest_hw = _load_manifest_half_width(region_id, segment)
    if om_pm25 is not None:
        half = manifest_hw or _default_conformal_half_width(om_pm25)
        method = "split_conformal_manifest" if manifest_hw is not None else "heuristic_relative"
        return om_pm25, half, False, "openmeteo_fallback", method

    logger.warning("predict: no model or OpenMeteo pm25 for %s/%s; constant fallback", region_id, segment)
    return 25.0, _default_conformal_half_width(25.0), False, "fallback_constant", "heuristic_relative"

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

from backend.api.v1.translations import translations_router
router.include_router(translations_router)

@router.get("/health")
def health(request: Request) -> Dict[str, Any]:
    models = getattr(request.app.state, "models", {}) or {}
    try:
        from backend.cache.redis_cache import RedisCache
        redis_ok = RedisCache().is_available
    except Exception:
        redis_ok = False
    return {
        "status": "ok",
        "version": "v1",
        "models_loaded": len(models),
        "redis": bool(redis_ok),
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

def compute_prediction(
    request: Request,
    lat: float,
    lon: float,
    name: str,
    day: Optional[str],
    pipeline: FeaturePipeline,
) -> Dict[str, Any]:
    """assemble features, run inference, and build the §2 response dict."""
    d = day or dt_date.today().isoformat()

    feats = pipeline.get_features(lat, lon, d)
    feats["lat"], feats["lon"] = lat, lon  # spatial features for models that use them
    feats.update(_derived_for_point(lat, lon, d))  # season + dust-proximity features
    feats.update(_static_for_point(lat, lon))       # ndvi + night-lights (nan until grid built)
    om_pm25 = feats.get("pm25_surface")
    om_pm25 = float(om_pm25) if om_pm25 is not None else None

    pop = feats.get("population_density")
    region_id = assign_region(lat, lon) or "west_africa"
    segment = classify_from_population_density(pop if isinstance(pop, (int, float)) else None)

    pm25, half, degraded, source, method = _run_inference(request, feats, region_id, segment, om_pm25)
    pm25 = round(pm25, 2)

    u = feats.get("u_component_of_wind_10m") or 0.0
    v = feats.get("v_component_of_wind_10m") or 0.0
    wind_speed = (float(u) ** 2 + float(v) ** 2) ** 0.5

    temp = feats.get("temperature_2m")
    rh = feats.get("relative_humidity")
    factors = {
        k: feats.get(k)
        for k in ("aerosol_optical_depth", "no2_tropospheric_column", "population_density", "elevation")
        if feats.get(k) is not None
    }

    return {
        "pm25": pm25,
        "aqi_category": aqi_category_from_pm25(pm25),
        "degraded": degraded,
        "factors": factors,
        "weather": {
            "temp": float(temp) if temp is not None else None,
            "humidity": float(rh) if rh is not None else None,
            "wind": round(wind_speed, 2),
        },
        "uncertainty": {
            "pm25_lower": round(max(0.0, pm25 - half), 2),
            "pm25_upper": round(pm25 + half, 2),
            "half_width": round(half, 2),
            "coverage": 0.9,
            "method": method,
        },
        "location": {"name": name, "lat": lat, "lon": lon},
        "model": {"region_id": region_id, "segment": segment, "version": "2.0.0", "source": source},
    }

@router.get("/predict")
def predict(
    request: Request,
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    name: str = Query("Unknown"),
    day: Optional[str] = Query(None, description="ISO date YYYY-MM-DD (default: today)"),
    pipeline: FeaturePipeline = Depends(get_feature_pipeline),
) -> Dict[str, Any]:
    return compute_prediction(request, lat, lon, name, day, pipeline)

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

class PushTokenBody(BaseModel):
    token: str = Field(..., min_length=1)
    platform: str = "android"
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)

def get_push_store():
    from backend.alerts.storage import get_push_store as _default
    return _default()

@router.post("/register-push-token")
def register_push_token(body: PushTokenBody, store=Depends(get_push_store)) -> Dict[str, str]:
    if body.platform not in ("android", "web", "ios"):
        raise HTTPException(400, "platform must be android, web, or ios")
    store.register(body.token, body.platform, body.lat, body.lon)
    return {"status": "registered"}
