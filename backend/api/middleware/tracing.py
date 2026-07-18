"""request tracing: attach x-request-id and log method, path, status, duration."""

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("mframapa.access")

_SLOW_MS = 3000.0   # log a warning for requests slower than this


class TracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:16]
        request.state.request_id = rid
        start = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        response.headers["X-Request-ID"] = rid
        response.headers["X-Response-Time-ms"] = f"{elapsed_ms:.1f}"
        level = logging.WARNING if elapsed_ms > _SLOW_MS else logging.INFO
        logger.log(
            level, "%s %s -> %d %.1fms [%s]",
            request.method, request.url.path, response.status_code, elapsed_ms, rid,
        )
        return response
