"""
fastapi application — serves /api/* for the pwa (see frontend vite proxy :8000).

run locally::
    uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

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

from backend.api.middleware.tracing import TracingMiddleware
from backend.api.security import verify_and_rate_limit
from backend.api.v1.batch import batch_router
from backend.api.v1.router import router as v1_router
from backend.ml.inference import load_bundles
from ml.paths import repository_root

logger = logging.getLogger(__name__)

REPO_ROOT = repository_root()
_EXPORTS_DIR = REPO_ROOT / "ml" / "exports"


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.models = load_bundles(_EXPORTS_DIR)
    yield
    app.state.models = {}


app = FastAPI(
    title="Mframapa API",
    version="2.0.0",
    description="Mframapa AI v2.0 Versioned API with rate limiting and API keys.",
    lifespan=lifespan,
)

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

app.include_router(v1_router, prefix="/api/v1", tags=["v1"])
# batch is mounted separately (not under v1_router) to avoid a router<->batch import cycle.
app.include_router(
    batch_router, prefix="/api/v1", tags=["v1"],
    dependencies=[Depends(verify_and_rate_limit)],
)


# legacy root paths — 410 with a pointer to the versioned api.
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
