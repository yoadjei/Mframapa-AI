#!/usr/bin/env bash
# periodic retrain: pull fresh data, retrain, benchmark, ship models to the server.
# runs on your local machine (the pipeline needs the heavy training deps, the
# serving box only needs the exported bundles).
#
#   MFRAMAPA_HOST=16.28.118.13 MFRAMAPA_KEY=~/Downloads/mframapa.pem ./scripts/retrain.sh
#
# schedule it (windows task scheduler / cron) weekly or monthly. models are only
# shipped if training succeeds, so a failed run leaves production untouched.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${MFRAMAPA_HOST:-}"
KEY="${MFRAMAPA_KEY:-}"
REMOTE_DIR="${MFRAMAPA_REMOTE_DIR:-~/mframapa}"

echo "==> 1/4 pulling fresh ground truth + enrichment"
python -m pipeline.run_pipeline

echo "==> 2/4 training continental + regional bundles"
python -m ml.train_from_dataset

echo "==> 3/4 benchmarking vs cams (review before shipping)"
python -m ml.scripts.run_benchmark || echo "(benchmark failed; models still trained)"

if [ -z "$HOST" ] || [ -z "$KEY" ]; then
  echo "==> 4/4 skipped: set MFRAMAPA_HOST and MFRAMAPA_KEY to ship to the server"
  echo "    models are in ml/exports/ — review, then re-run to deploy."
  exit 0
fi

echo "==> 4/4 shipping models to $HOST"
scp -i "$KEY" -r ml/exports "ubuntu@$HOST:$REMOTE_DIR/ml/"
scp -i "$KEY" ml/data/static_grid.csv "ubuntu@$HOST:$REMOTE_DIR/ml/data/"
# models are a read-only volume mount — a restart picks them up, no rebuild needed.
ssh -i "$KEY" "ubuntu@$HOST" "cd $REMOTE_DIR && docker compose restart api"

echo "==> verifying"
ssh -i "$KEY" "ubuntu@$HOST" "sleep 15 && curl -fsS localhost/api/health >/dev/null && echo 'api healthy'"
echo "retrain complete."
