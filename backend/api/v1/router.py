import io
import csv
import json
from datetime import date as dt_date
from functools import lru_cache
from typing import Any, Dict, List, Optional

import numpy as np
from fastapi import APIRouter, Depends, Query, HTTPException, Response
from pydantic import BaseModel, Field

from backend.api.aqi import aqi_category_from_pm25
from backend.api.security import verify_and_rate_limit
from backend.services import gemini_client
from backend.pipeline.feature_pipeline import FeaturePipeline
from ml.ensemble import ensemble_mean
from ml.features import FEATURE_COLUMNS
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

    return {"insight": _STUB_INSIGHTS_EN[key]}
