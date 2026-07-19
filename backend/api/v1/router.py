import json
from datetime import date as dt_date
from functools import lru_cache
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import APIRouter, Depends, Query, HTTPException, Response, Request
from pydantic import BaseModel, Field

from backend.api.aqi import aqi_category_from_pm25
from backend.api.security import verify_and_rate_limit
from backend.api.aqi import aqi_category_from_pm25
from backend.api.security import verify_and_rate_limit
from backend.services import gemini_client
from backend.ml.inference import rectify_prediction, select_bundle
from backend.pipeline.feature_pipeline import FeaturePipeline
from ml.ensemble import ensemble_mean
from ml.features import FEATURE_COLUMNS
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


@lru_cache(maxsize=12)
def _load_bundle(region_id: str, segment: str):
    """Load and cache XGBoost + LightGBM models for a region/segment pair."""
    export_dir = regional_export_dir(region_id, segment)
    xgb_path = export_dir / "xgboost.json"
    lgb_path = export_dir / "lightgbm.txt"

    xgb_model = lgb_model = None
    try:
        import xgboost as xgb
        m = xgb.Booster()
        m.load_model(str(xgb_path))
        xgb_model = m
    except Exception as e:
        logger.warning("Failed to load XGBoost model for %s/%s: %s", region_id, segment, e)
    try:
        import lightgbm as lgb
        lgb_model = lgb.Booster(model_file=str(lgb_path))
    except Exception as e:
        logger.warning("Failed to load LightGBM model for %s/%s: %s", region_id, segment, e)

    return xgb_model, lgb_model


def _run_ml_inference(feats: Dict[str, Any], region_id: str, segment: str) -> Optional[float]:
    """Build feature vector and run ensemble inference. Returns pm25 or None."""
    xgb_model, lgb_model = _load_bundle(region_id, segment)
    if xgb_model is None and lgb_model is None:
        return None

    X = np.array(
        [[float(feats.get(col) or 0.0) for col in FEATURE_COLUMNS]],
        dtype=np.float32,
    )

    preds = []
    if xgb_model is not None:
        try:
            import xgboost as xgb
            dm = xgb.DMatrix(X, feature_names=list(FEATURE_COLUMNS))
            preds.append(xgb_model.predict(dm))
        except Exception as e:
            logger.warning("XGBoost inference failed: %s", e)
    if lgb_model is not None:
        try:
            preds.append(lgb_model.predict(X))
        except Exception as e:
            logger.warning("LightGBM inference failed: %s", e)

    if not preds:
        return None
    if len(preds) == 1:
        return float(np.clip(preds[0][0], 0.0, 500.0))
    return float(np.clip(ensemble_mean(preds[0], preds[1])[0], 0.0, 500.0))


def _default_conformal_half_width(pm25: float) -> float:
    v = max(float(pm25), 1.0)
    return max(5.0, v * 0.22)

def _load_manifest(region_id: str, segment: str) -> Dict[str, Any]:
    manifest = regional_export_dir(region_id, segment) / "manifest.json"
    if not manifest.is_file():
        return {}
    try:
        return json.loads(manifest.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _load_manifest_half_width(region_id: str, segment: str) -> Optional[float]:
    """conformal half-width from the region/segment manifest, or None."""
    width = (_load_manifest(region_id, segment).get("uncertainty") or {}).get("conformal_half_width")
    try:
        return float(width) if width is not None else None
    except (TypeError, ValueError):
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


def _build_prediction(
    lat: float,
    lon: float,
    name: str,
    day: str,
    pipeline: FeaturePipeline,
) -> Dict[str, Any]:
    feats = pipeline.get_features(lat, lon, day)
    pop = feats.get("population_density")
    assigned_region = assign_region(lat, lon)
    region_id = assigned_region or "continental"
    segment = classify_from_population_density(pop if isinstance(pop, (int, float)) else None)
    # Continental fallback uses a single "all" bundle (no urban/rural split)
    infer_segment = segment if assigned_region else "all"

    # Run XGBoost + LightGBM ensemble inference
    pm25_ml = _run_ml_inference(feats, region_id, infer_segment)
    if pm25_ml is not None:
        pm25 = pm25_ml
        source = "xgb_lgb_ensemble"
    else:
        # Fallback: use OpenMeteo PM2.5 surface value
        pm25_raw = feats.get("pm25_surface")
        pm25 = float(pm25_raw) if pm25_raw is not None else 25.0
        source = "feature_pipeline_pm25_surface"
        if pm25_raw is None:
            logger.warning("ML inference unavailable and pm25_surface missing for (%s,%s); using fallback", lat, lon)

    cat = aqi_category_from_pm25(pm25)
    manifest = _load_manifest(region_id, segment)
    manifest_hw = (manifest.get("uncertainty") or {}).get("conformal_half_width")
    half = float(manifest_hw) if manifest_hw is not None else _default_conformal_half_width(pm25)
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
            "source": source,
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

    result = None
    # assemble features and run inference pipeline
    feats = pipeline.get_features(lat, lon, d)
    feats["lat"], feats["lon"] = lat, lon  # spatial features for models that use them
    feats.update(_derived_for_point(lat, lon, d))  # season + dust-proximity features
    feats.update(_static_for_point(lat, lon))       # ndvi + night-lights (nan until grid built)
    om_pm25 = feats.get("pm25_surface")
    om_pm25 = float(om_pm25) if om_pm25 is not None else None

    pop = feats.get("population_density")
    # local import to avoid cross-module cycle at top-level
    from ml.urban_rural import classify_from_population_density
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
    language_name: str = ""

class TranslateBody(BaseModel):
    strings: Dict[str, str] = Field(..., min_length=1)
    target_language: str = Field(..., min_length=2, max_length=8)
    source_language: str = "en"
    target_language_name: str = ""

@router.post("/translate")
def translate_ui_strings(body: TranslateBody) -> Dict[str, Any]:
    """Translate UI string bundles via Gemini (cached server-side when configured)."""
    if body.target_language.lower() == body.source_language.lower():
        return {"translations": body.strings, "fallback": False, "provider": "none"}

    if not gemini_client.is_available():
        return {"translations": body.strings, "fallback": True, "provider": "none"}

    try:
        translations = gemini_client.translate_strings(
            body.strings,
            target_language=body.target_language,
            source_language=body.source_language,
            target_language_name=body.target_language_name or None,
        )
    except Exception as exc:
        logger.warning("Gemini translate failed: %s", exc)
        raise HTTPException(status_code=502, detail="Translation service unavailable") from exc

    return {"translations": translations, "fallback": False, "provider": "gemini"}


def _insight_category_key(aqi_category: str, pm25: float) -> str:
    cat = (aqi_category or aqi_category_from_pm25(pm25)).lower()
    if "hazardous" in cat:
        return "hazardous"
    if "unhealthy" in cat and "sensitive" not in cat:
        return "unhealthy"
    if "sensitive" in cat:
        return "sensitive"
    if "moderate" in cat:
        return "moderate"
    return "good"


@router.post("/generate-insight")
def generate_insight(body: InsightBody) -> Dict[str, str]:
    cat = body.aqi_category or aqi_category_from_pm25(body.pm25)
    key = _insight_category_key(cat, body.pm25)

    # Try Gemini first (richer insights); fall back to bundled English stubs and optional translation
    if gemini_client.is_available():
        try:
            text = gemini_client.generate_air_quality_insight(
                pm25=body.pm25,
                aqi_category=cat,
                weather=body.weather,
                language=body.language,
                language_name=body.language_name or None,
            )
            return {"insight": text}
        except Exception as exc:
            logger.warning("Gemini insight failed, using stub: %s", exc)
            if body.language.lower() not in ("en", ""):
                try:
                    translated = gemini_client.translate_strings(
                        {key: _STUB_INSIGHTS_EN[key]},
                        target_language=body.language,
                        target_language_name=body.language_name or None,
                    )
                    return {"insight": translated[key]}
                except Exception:
                    pass

    # final fallback: bundled stub
    return {"insight": _STUB_INSIGHTS_EN[key]}


# Push token registration — use persistent store if available

class PushTokenBody(BaseModel):
    token: str = Field(..., min_length=1)
    platform: str = Field(..., pattern="^(android|ios|web)$")
    lat: Optional[float] = None
    lon: Optional[float] = None


def get_push_store():
    from backend.alerts.storage import get_push_store as _default
    return _default()

@router.post("/register-push-token", status_code=200)
def register_push_token(body: PushTokenBody, store=Depends(get_push_store)) -> Dict[str, str]:
    """Register an Expo/Web Push token for AQI alert delivery using the configured store."""
    try:
        store.register(body.token, body.platform, body.lat, body.lon)
    except Exception:
        # fall back to an in-memory placeholder if the store fails
        logger.exception("Push store failed, falling back to in-memory registration")
        _push_tokens[body.token] = {
            "platform": body.platform,
            "lat": body.lat,
            "lon": body.lon,
            "registered_at": str(dt_date.today()),
        }
    logger.info("Push token registered: platform=%s lat=%s lon=%s", body.platform, body.lat, body.lon)
    return {"status": "registered"}
