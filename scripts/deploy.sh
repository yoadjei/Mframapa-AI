#!/usr/bin/env bash
# deploy the api on the server with minimal downtime.
#
#   ./scripts/deploy.sh          # single replica: build first, then a fast swap (~10s gap)
#   REPLICAS=2 ./scripts/deploy.sh   # true zero-downtime rolling restart (needs >=2GB ram)
#
# the image is built while the old container keeps serving, so the only gap is the
# swap itself. with REPLICAS>=2 nginx fails over to the live replica and the gap is zero.
set -euo pipefail
cd "$(dirname "$0")/.."

REPLICAS="${REPLICAS:-1}"

echo "==> pulling latest code"
git pull --ff-only

echo "==> building new image (old container still serving)"
docker compose build api

if [ "$REPLICAS" -gt 1 ]; then
  echo "==> rolling restart across $REPLICAS replicas"
  docker compose up -d --no-deps --scale "api=$REPLICAS" api
else
  echo "==> swapping single api container"
  docker compose up -d --no-deps api
fi

echo "==> waiting for health"
for i in $(seq 1 30); do
  if curl -fsS localhost/api/health >/dev/null 2>&1; then
    echo "healthy after ${i}s"
    docker compose ps
    exit 0
  fi
  sleep 1
done

echo "ERROR: api did not become healthy in 30s" >&2
docker compose logs api --tail 40
exit 1
