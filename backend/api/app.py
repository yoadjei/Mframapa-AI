"""
FastAPI application — serves /api/* for the PWA (see frontend vite proxy :8000).

Run locally::
    uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()

import json
import logging
import os
from datetime import date as dt_date
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
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

# Optional: model bundle loader + batch router and tracing
from backend.api.middleware.tracing import TracingMiddleware
from backend.api.security import verify_and_rate_limit
from backend.api.v1.batch import batch_router
from backend.api.v1.router import router as v1_router
from backend.ml.inference import load_bundles

logger = logging.getLogger(__name__)

REPO_ROOT = repository_root()
CITIES_PATH = REPO_ROOT / "backend" / "data" / "african_cities.json"
_EXPORTS_DIR = REPO_ROOT / "ml" / "exports"


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


# major african cities pre-warmed into the feature cache on startup so first user
# hits are instant (name, lat, lon).
_PREWARM_CITIES = [
    ("Lagos", 6.52, 3.38), ("Cairo", 30.04, 31.24), ("Kinshasa", -4.32, 15.31),
    ("Johannesburg", -26.20, 28.04), ("Nairobi", -1.29, 36.82), ("Accra", 5.60, -0.19),
    ("Addis Ababa", 9.03, 38.74), ("Dar es Salaam", -6.79, 39.21), ("Abidjan", 5.36, -4.01),
    ("Cape Town", -33.92, 18.42), ("Casablanca", 33.57, -7.59), ("Khartoum", 15.50, 32.56),
    ("Dakar", 14.72, -17.47), ("Kampala", 0.35, 32.58), ("Luanda", -8.84, 13.23),
]


def _prewarm_cache() -> None:
    """Best-effort: populate the redis feature cache for major cities (daemon thread)."""
    today = dt_date.today().isoformat()
    pipeline = FeaturePipeline()
    for name, lat, lon in _PREWARM_CITIES:
        try:
            pipeline.get_features(lat, lon, today)
        except Exception as e:
            logger.debug("prewarm %s failed: %s", name, e)
    logger.info("cache prewarm complete (%d cities)", len(_PREWARM_CITIES))


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload model bundles into app.state for fast inference
    try:
        app.state.models = load_bundles(_EXPORTS_DIR)
    except Exception:
        logger.exception("Failed to load model bundles at startup")
        app.state.models = {}
    # warm the feature cache in the background — never blocks startup or requests.
    # disabled in ci/tests (PREWARM_ON_START=0) to avoid live upstream calls.
    if os.getenv("PREWARM_ON_START", "1") == "1":
        import threading
        threading.Thread(target=_prewarm_cache, daemon=True).start()
    yield
    app.state.models = {}


app = FastAPI(title="Mframapa API", version="2.0.0", description="Mframapa AI v2.0 Versioned API with rate limiting and API keys.", lifespan=lifespan)

_ALLOWED_ORIGINS = [
    o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()
]
app.add_middleware(TracingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=100)

app.include_router(v1_router, prefix="/api/v1", tags=["v1"])
# batch is mounted separately (not under v1_router) to avoid a router<->batch import cycle.
app.include_router(
    batch_router, prefix="/api/v1", tags=["v1"],
    dependencies=[Depends(verify_and_rate_limit)],
)

# Legacy support - keeping the old root paths but returning a hint to use v1.
@app.get("/api/health")
def old_health() -> Dict[str, str]:
    return {"status": "ok", "message": "Please upgrade to /api/v1/health"}

@app.get("/api/resolve-location")
def old_resolve_location(city: str = Query(...)) -> Dict[str, Any]:
    raise HTTPException(status_code=410, detail="Endpoint deprecated. Use /api/v1/resolve-location with an API key.")

@app.get("/api/predict")
def old_predict() -> Dict[str, Any]:
    raise HTTPException(status_code=410, detail="Endpoint deprecated. Use /api/v1/predict with an API key.")

@app.post("/api/generate-insight")
def old_generate_insight() -> Dict[str, str]:
    raise HTTPException(status_code=410, detail="Endpoint deprecated. Use /api/v1/generate-insight with an API key.")

