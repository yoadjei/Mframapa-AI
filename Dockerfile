# mframapa api — lean serving image (arm64 + amd64). training/satellite deps excluded.
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    WORKERS=2

# libgomp1: openmp runtime required by xgboost/lightgbm. curl: container healthcheck.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgomp1 curl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements-api.txt .
RUN pip install -r requirements-api.txt

# ml bundles (ml/exports) are mounted at runtime, not baked in — see docker-compose.
COPY backend/ ./backend/
COPY ml/ ./ml/

EXPOSE 8000

# legacy /api/health is unauthenticated, so it works as a container probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:8000/api/health || exit 1

CMD uvicorn backend.api.app:app --host 0.0.0.0 --port 8000 --workers ${WORKERS}
