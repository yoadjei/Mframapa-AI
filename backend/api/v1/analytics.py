"""analytics endpoints.

  POST /api/v1/events   anonymous, rate-limited — clients report bucketed events.
  GET  /api/v1/metrics  internal only — installs, WAU, retention, geography, alerts.

events carry an anonymous client-generated device id and, at most, a coarse
country code. no coordinates, no identity. see backend/analytics/store.py.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from backend.analytics.store import get_analytics_store
from backend.api.security import authenticate_or_anonymous, require_internal

analytics_router = APIRouter(tags=["analytics"])

_MAX_BATCH = 50


class AnalyticsEvent(BaseModel):
    device_id: str = Field(..., min_length=8, max_length=64)
    event: str = Field(..., min_length=1, max_length=32)
    country: Optional[str] = Field(default=None, max_length=56)
    platform: Optional[str] = Field(default=None, pattern="^(web|android|ios)$")


class EventBatch(BaseModel):
    events: List[AnalyticsEvent] = Field(..., min_length=1, max_length=_MAX_BATCH)


@analytics_router.post("/events", dependencies=[Depends(authenticate_or_anonymous)])
def record_events(batch: EventBatch) -> Dict[str, Any]:
    # fire-and-forget from the client's view; unknown event names are dropped in the store.
    store = get_analytics_store()
    for ev in batch.events:
        store.record(ev.device_id, ev.event, country=ev.country, platform=ev.platform)
    return {"accepted": len(batch.events)}


@analytics_router.get("/metrics", dependencies=[Depends(require_internal)])
def metrics(request: Request) -> Dict[str, Any]:
    return get_analytics_store().summary()
