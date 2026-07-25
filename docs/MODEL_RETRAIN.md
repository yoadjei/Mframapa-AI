# Model retrain runbook

Commands to pull labels, enrich features (including precip / pressure / dust), train regional bundles, and ship exports. Run from the **repo root** with the project venv active.

## Prerequisites

```powershell
# Windows
.\venv\Scripts\Activate.ps1

# macOS / Linux
source venv/bin/activate
```

Copy `.env.example` → `.env` and set at least:

| Variable | Needed for |
|----------|------------|
| `OPENAQ_API_KEY` | Fresh ground-truth pull (`pipeline.run_pipeline`) |
| `EE_PROJECT` + Earth Engine auth | Rebuild `ml/data/static_grid.csv` (NDVI / night lights) |
| CDS / NASA tokens | Optional live ERA5 / MODIS at **inference**; training uses Open-Meteo archives |

Local artifacts (often gitignored): `pipeline/output/training_dataset.csv`, `ml/data/static_grid.csv`, `ml/exports/`.

---

## Quick paths

### A) Smoke train (synthetic — CI / sanity)

No network. Writes bundles under `ml/exports/`.

```powershell
python scripts/smoke_train_bundles.py
```

One bundle:

```powershell
python -c "from ml.training import synthetic_training_frame, train_regional_bundle; from ml.model_selection import regional_export_dir; df=synthetic_training_frame(n_rows=400, seed=0); train_regional_bundle(df, 'west_africa', 'urban', regional_export_dir('west_africa','urban'), update_registry=True)"
```

### B) Retrain from existing dataset (no re-pull)

Uses current `pipeline/output/training_dataset.csv`. Adds NDVI / night lights when `ml/data/static_grid.csv` exists. Adds `surface_pressure`, `precipitation`, `dust_surface` only when those columns have ≥10% non-null coverage.

```powershell
python -m ml.train_from_dataset
python -m ml.train_from_dataset --dataset pipeline/output/training_dataset.csv --holdout-start 2025-01-01
python -m ml.scripts.run_benchmark
```

### C) Full enriched retrain (recommended)

Rebuilds labels + Open-Meteo weather/AQ (now including pressure, precip, dust, CAMS `openmeteo_pm25`) then trains.

```powershell
# 1) Optional: static vegetation / lights grid (Earth Engine)
python -m pipeline.build_static_grid

# 2) Pull OpenAQ (+ AirQo if configured) → enrich → QA → training_dataset.csv
#    To force re-enrich after schema changes:
python -c "from pipeline.enrich_satellite import enrich; raise SystemExit(0 if enrich(force=True) else 1)"
python -m pipeline.run_pipeline

# 3) Train continental + regionals (keeps regional only if it beats continental)
python -m ml.train_from_dataset

# 4) Benchmark vs CAMS baseline
python -m ml.scripts.run_benchmark
```

Or one scripted loop (ships to the API host when env is set):

```bash
# Git Bash / WSL / macOS
MFRAMAPA_HOST=your.api.host MFRAMAPA_KEY=~/path/to.pem ./scripts/retrain.sh
```

```powershell
# Windows: run steps in C) then copy exports, or use Git Bash for retrain.sh
```

---

## What the enriched train uses

| Group | Columns | Source |
|-------|---------|--------|
| Base | `FEATURE_COLUMNS` in `ml/features.py` | Open-Meteo ERA5 archive + CAMS + WorldPop + SRTM |
| Enriched (optional) | `surface_pressure`, `precipitation`, `dust_surface` | Same enrich step; trained if coverage ≥ 10% |
| Static | `ndvi`, `night_lights` | `ml/data/static_grid.csv` |
| Derived | `month`, `doy_sin`, `doy_cos`, `harmattan`, `dist_sahara_km` | `ml/derived_features.py` |
| Spatial | `lat`, `lon` | Station coordinates |
| Label | `pm25_surface` | OpenAQ / AirQo |
| Residual / bench | `openmeteo_pm25` | CAMS — not a model feature; used by `run_benchmark` |

Inference already resolves precip / pressure / dust via `DataOrchestrator`. Models only consume columns listed in each `ml/exports/<region>/<segment>/manifest.json`.

---

## After training — deploy

```powershell
# Review
dir ml\exports

# Ship (example — adjust host/key)
scp -i $env:MFRAMAPA_KEY -r ml/exports ubuntu@${env:MFRAMAPA_HOST}:~/mframapa/ml/
scp -i $env:MFRAMAPA_KEY ml/data/static_grid.csv ubuntu@${env:MFRAMAPA_HOST}:~/mframapa/ml/data/
ssh -i $env:MFRAMAPA_KEY ubuntu@$env:MFRAMAPA_HOST "cd ~/mframapa && docker compose restart api"
```

Serving image reads exports from the mounted `ml/exports` volume; restart is enough (no image rebuild).

---

## Residual calibration (next enrichment step)

After a full enrich that includes `openmeteo_pm25`:

1. Fit a small region-level correction: `residual = pm25_surface - openmeteo_pm25`.
2. Store per-region bias / slope in the manifest.
3. Apply at inference after the ensemble mean.

Not automated yet — prefer a clean retrain with enriched columns first; then add residual calibration if CAMS bias remains systematic.

---

## Verify API after deploy

```powershell
curl -s "https://api.mframapa.live/api/v1/health"
curl -s "https://api.mframapa.live/api/v1/predict?lat=5.60&lon=-0.19&name=Accra" -H "X-API-Key: $env:MFRAMAPA_INTERNAL_KEY"
```

Confirm `weather.humidity` / `weather.pressure` are non-null and `model.region_id` / `model.source` look sane.
