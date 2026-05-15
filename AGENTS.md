# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What This Repo Is

Mframapa v2.0 — satellite-powered air quality intelligence for Africa. Three deliverables built in tandem:

1. **Python backend** (`backend/`) — FastAPI serving `/api/*`, feature pipeline, caching
2. **React PWA** (`frontend-pwa/`) — Vite + React + Tailwind, proxies `/api` to backend in dev
3. **React Native mobile app** (`mobile/`) — Expo + TypeScript, targets Android

The **ML layer** (`ml/`) trains 12 regional models (6 African regions × urban/rural) using XGBoost + LightGBM and exports them to `ml/exports/`. The backend loads these at runtime via `ml/model_selection.py`.

---

## Project Status

All code below is **scaffolded but not yet tested against live data sources or trained with real data**.

| Phase | Weeks | Status |
|-------|-------|--------|
| 1 — Data infrastructure & resilience | 1–4 | 📝 Code scaffolded; not tested against live APIs |
| 2 — Features & ML | 5–8 | 📝 Code scaffolded; no models trained |
| 3 — Versioned API & PWA | 9–12 | 📝 Code scaffolded; not tested |
| 4 — Mobile, distribution & observability | 13–16 | 📝 Mobile scaffolded; distribution not started |

---

## Commands

### Backend (Python)

```bash
# Activate venv (already present at ./venv)
source venv/bin/activate          # macOS/Linux
.\venv\Scripts\Activate.ps1       # Windows PowerShell

# Run API server (proxied by Vite in dev)
uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000

# Run all tests
pytest backend/tests -q

# Run a single test file
pytest backend/tests/test_api.py -q

# Run a single test by name
pytest backend/tests/test_api.py::test_predict_returns_uncertainty -q

# Live end-to-end test (requires .env credentials + internet)
python live_test.py
```

### Frontend PWA

```bash
cd frontend-pwa
npm install
npm run dev          # starts Vite dev server (proxies /api → :8000)
npm run build
npm run lint
npm run preview
```

### Mobile (Expo)

```bash
cd mobile
npm install
npx expo start       # starts dev server
npx expo start --android
npx expo run:android --variant release   # local APK build (free)
```

### ML Training

```bash
# Generate region boundaries and city splits
python -m ml.scripts.generate_region_geojson
python -m ml.scripts.build_training_splits

# Train a specific regional bundle (example)
python -m ml.training west_africa urban

# Smoke-train one bundle with synthetic data (used in CI)
python - <<'PY'
from ml.training import synthetic_training_frame, train_regional_bundle
from ml.model_selection import regional_export_dir
df = synthetic_training_frame(n_rows=400, seed=0)
out = regional_export_dir("west_africa", "urban")
train_regional_bundle(df, "west_africa", "urban", out, update_registry=True)
PY
```

---

## Architecture

### Data flow (backend request)

```
GET /api/predict?lat=&lon=&name=
  → FeaturePipeline.get_features()
      → DataOrchestrator  (priority fallback across ERA5 → S5P → MODIS → OpenMeteo)
      → WorldPopDataSource (population density)
      → SRTMDataSource (elevation)
  → ml.regions.assign_region()  → region_id
  → ml.urban_rural.classify_from_population_density()  → "urban" | "rural"
  → ml.model_selection.regional_export_dir(region_id, segment)
  → XGBoost model (.json) + conformal half-width from manifest.json
  → Response with pm25, aqi_category, uncertainty, weather, model metadata
```

### Fallback hierarchy

`backend/data_sources/orchestrator.py` defines `_FALLBACK_PLAN` — a dict mapping each output feature to an ordered list of (source_name, source_key) pairs. If a source raises an exception, the next source is tried. The orchestrator tracks per-source success/failure counts for monitoring.

### Cache layer

`backend/cache/cache_manager.py` — Redis (Upstash) primary, SQLite fallback. Cache keys are `mframapa:v1:features:{lat:.2f}:{lon:.2f}:{date}`. TTL is 6 h for recent data, 7 d for historical.

### ML registry

`ml/data/model_registry.json` — one entry per region/segment with paths to XGBoost + LightGBM artifacts and `conformal_half_width`. Updated by `train_regional_bundle(..., update_registry=True)`. The API reads manifests directly via `regional_export_dir()`, not the registry JSON.

### PWA service worker

Custom service worker at `frontend-pwa/public/sw.js` with Vite PWA plugin config in `frontend-pwa/vite.config.js`:
- CacheFirst for fonts, static assets
- NetworkFirst for `/api/*` (10 s timeout, 6 h stale fallback, 50 entry cap)

### Mobile store

Single Zustand store at `mobile/src/store/useStore.ts`, persisted to MMKV (`mframapa-persist`). Slices: theme, language, lastPrediction + predictionHistory (20 cap, deduplicated by lat/lon ±0.01°), offlineCities.

---

## Key Files

| Path | Purpose |
|------|---------|
| `backend/api/app.py` | API entry point, mounts `/api/v1` router |
| `backend/api/v1/router.py` | All versioned routes (`/api/v1/predict`, `/api/v1/batch-predict`, exports) |
| `backend/api/aqi.py` | AQI category calculation |
| `backend/api/security.py` | API key validation, rate limiting |
| `backend/pipeline/feature_pipeline.py` | Assembles ~20 features from orchestrator + static sources |
| `backend/data_sources/orchestrator.py` | Multi-source fallback logic + reliability scoring |
| `backend/cache/cache_manager.py` | Redis + SQLite fallback cache |
| `backend/jobs/precompute_cache.py` | Batch pre-materialisation for top-N cities |
| `ml/features.py` | `FEATURE_COLUMNS` and `TARGET_COLUMN` — canonical feature list |
| `ml/training.py` | `train_regional_bundle()` + `synthetic_training_frame()` for CI |
| `ml/regions.py` | `assign_region(lat, lon)` — Shapely point-in-polygon against `ml/data/african_regions.geojson` |
| `ml/uncertainty.py` | Conformal prediction interval utilities |
| `ml/urban_rural.py` | Population-density-based urban/rural classifier |
| `frontend-pwa/src/app/App.jsx` | PWA root component (routing, auth, screens) |
| `frontend-pwa/src/services/api.js` | Axios client hitting `/api/*` |
| `frontend-pwa/src/state/appState.jsx` | Global app state (context + reducer) |
| `mobile/src/services/api.ts` | Axios client — same API contract, reads `EXPO_PUBLIC_API_URL` |
| `mobile/src/store/useStore.ts` | Zustand + MMKV persistent store |
| `mobile/src/theme/index.ts` | `getColors(isDark)`, `getAQIColor(category)`, spacing/fontSize constants |

---

## Environment Variables

Copy `.env.example` → `.env`. Required for data ingestion (not needed to run tests):

- `CDSAPI_KEY` — Copernicus CDS (ERA5)
- `CDSE_USERNAME` / `CDSE_PASSWORD` — Copernicus CDSE (Sentinel-5P)
- `NASA_EARTHDATA_TOKEN` — NASA Earthdata (MODIS)
- `REDIS_URL` — Upstash Redis (`redis://...`)
- `SENTRY_DSN` — optional, leave blank to disable

For the mobile app: `EXPO_PUBLIC_API_URL` (defaults to `https://mframapa.ai`).

---

## Planning Documents

The docs are authoritative in this order: `EXECUTION_PLAN.md` (scope contract) → `SPEC.md` (week-by-week tasks) → `CHECKLIST.md` (tracking). When scope questions arise, defer to `EXECUTION_PLAN.md` §3 (product systems) and §7 (risk register / cut order).
