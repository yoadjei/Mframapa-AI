# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Mframapa v2.0 — satellite-powered air quality intelligence for Africa. Three deliverables built in tandem:

1. **Python backend** (`backend/`) — FastAPI serving `/api/v1/*`, feature pipeline, caching
2. **React PWA** (`frontend-pwa/`) — Vite + React + Tailwind, proxies `/api` to backend in dev
3. **React Native mobile app** (`mobile/`) — Expo + TypeScript, targets Android

The **ML layer** (`ml/`) trains 12 regional models (6 African regions × urban/rural) using XGBoost + LightGBM and exports them to `ml/exports/`. The backend loads these at runtime via `ml/model_selection.py`.

---

## Commands

### Backend (Python)

```bash
# Activate venv (already present at ./venv)
source venv/bin/activate

# Run API server (proxied by Vite in dev)
uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000

# Run all tests
pytest backend/tests -q

# Run a single test file
pytest backend/tests/test_api.py -q

# Run a single test by name
pytest backend/tests/test_api.py::test_predict_returns_uncertainty -q
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

### API versioning

All active routes live under `/api/v1/` (defined in `backend/api/v1/router.py`). The legacy `/api/health`, `/api/predict`, `/api/resolve-location`, and `/api/generate-insight` routes remain in `backend/api/app.py` but return HTTP 410 Gone. Every request to v1 routes must carry an API key (see Security below).

### Data flow (backend request)

```
GET /api/v1/predict?lat=&lon=&name=&day=&format=
  → verify_and_rate_limit()  (API key + sliding-window rate limiting)
  → FeaturePipeline.get_features()
      → DataOrchestrator  (priority fallback across ERA5 → S5P → MODIS → OpenMeteo + Phase 2 sources)
      → WorldPopDataSource (population density)
      → SRTMDataSource (elevation)
  → ml.regions.assign_region()  → region_id  (or "continental" fallback)
  → ml.urban_rural.classify_from_population_density()  → "urban" | "rural"
  → ml.model_selection.regional_export_dir(region_id, segment)
  → XGBoost (.json) + LightGBM (.txt) ensemble inference via ml.ensemble.ensemble_mean()
  → conformal half-width from manifest.json (heuristic fallback if missing)
  → Response with pm25, aqi_category, uncertainty, weather, factors, model metadata
  → Optional: format=csv or format=geojson for alternate response shapes
```

### Batch predict

`POST /api/v1/batch-predict` accepts up to 20 locations in one request. Returns `results[]` + `errors[]` with per-item success/failure.

### Security

`backend/api/security.py` — API key auth via `X-API-Key` header or `?api_key=` query param. Three tiers with 1-minute sliding-window limits (in-memory):

| Tier | Key format | Limit |
|------|-----------|-------|
| Internal | env `MFRAMAPA_INTERNAL_KEY` (default `mframapa-internal-dev-key`) | 1 000 / min |
| Institutional | prefix `mframapa-inst-` | 6 000 / min |
| Public | prefix `mframapa-pub-` | 10 / min |

### Fallback hierarchy

`backend/data_sources/orchestrator.py` defines `_FALLBACK_PLAN` — a dict mapping each output feature to an ordered list of (source_name, source_key) pairs. If a source raises an exception, the next source is tried. The orchestrator tracks per-source success/failure counts for monitoring.

**Phase 2 data sources** (proxy/derived): `ndvi.py` (vegetation index), `night_lights.py` (VIIRS nighttime lights proxy), `openaq.py` (OpenAQ ground truth), `osm_roads.py` (road proximity).

### Cache layer

`backend/cache/cache_manager.py` — Redis (Upstash) primary, SQLite fallback. Cache keys are `mframapa:v1:features:{lat:.2f}:{lon:.2f}:{date}`. TTL is 6 h for recent data, 7 d for historical.

### ML registry

`ml/data/model_registry.json` — one entry per region/segment with paths to XGBoost + LightGBM artifacts and `conformal_half_width`. Updated by `train_regional_bundle(..., update_registry=True)`. The API reads manifests directly via `regional_export_dir()`, not the registry JSON.

Continental fallback: when `assign_region()` returns `None`, the router uses `region_id="continental"` with `segment="all"` (a single bundle not split urban/rural).

### PWA state & services

Feature-based layout under `frontend-pwa/src/features/` (home, search, core, activity, auth, notifications, onboarding, preview, profile, settings). Global state is managed by `frontend-pwa/src/state/appState.jsx` — React Context + `useReducer`, persisted to `localStorage` under `mframapa:v2:pwa-state` (session token in `sessionStorage`). Service layer:

- `services/httpClient.js` — Axios base client
- `services/api.js` — raw API calls to `/api/v1/*`
- `services/predictionService.js` — prediction orchestration
- `services/authService.js` — login/logout
- `services/cityPackService.js` — offline city-pack loading

i18n JSON files live in `frontend-pwa/src/locales/` (30+ languages including Hausa, Swahili, Twi, Yoruba, Amharic, Somali, etc.).

### PWA service worker

Vite + `vite-plugin-pwa` (autoUpdate). Workbox config in `frontend-pwa/vite.config.js`:
- CacheFirst for fonts, static assets, city-pack JSON (`/city-packs/*.json`, 30-day TTL)
- StaleWhileRevalidate for Mapbox API tiles (7-day TTL, 150-entry cap)
- NetworkFirst for `/api/*` (10 s timeout, 6 h stale fallback, 50-entry cap)

### Mobile store

Single Zustand store at `mobile/src/store/useStore.ts`, persisted to MMKV (`mframapa-persist`). Slices: theme, language, lastPrediction + predictionHistory (20 cap, deduplicated by lat/lon ±0.01°), offlineCities.

Mobile navigation: `mobile/src/navigation/AppNavigator.tsx` with screens Home, Search, Map, Alerts, Settings. Services: `analytics.ts`, `location.ts`, `notifications.ts`, `offline.ts`.

---

## Key Files

| Path | Purpose |
|------|---------|
| `backend/api/app.py` | FastAPI app — mounts v1 router at `/api/v1`, legacy 410 stubs |
| `backend/api/v1/router.py` | Active routes: `/health`, `/predict`, `/batch-predict`, `/resolve-location`, `/generate-insight` |
| `backend/api/security.py` | API key verification + sliding-window rate limiting |
| `backend/api/aqi.py` | `aqi_category_from_pm25()` |
| `backend/pipeline/feature_pipeline.py` | Assembles ~20 features from orchestrator + static sources |
| `backend/data_sources/orchestrator.py` | Multi-source fallback logic + reliability scoring |
| `ml/features.py` | `FEATURE_COLUMNS` and `TARGET_COLUMN` — canonical feature list |
| `ml/ensemble.py` | `ensemble_mean()` — XGBoost + LightGBM blending |
| `ml/training.py` | `train_regional_bundle()` + `synthetic_training_frame()` for CI |
| `ml/regions.py` | `assign_region(lat, lon)` — Shapely point-in-polygon against `ml/data/african_regions.geojson` |
| `ml/uncertainty.py` | Conformal prediction interval utilities |
| `ml/paths.py` | `repository_root()` — repo path resolution |
| `frontend-pwa/src/state/appState.jsx` | React Context + useReducer global state, localStorage persistence |
| `frontend-pwa/src/services/api.js` | Axios client hitting `/api/v1/*` |
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
- `MFRAMAPA_INTERNAL_KEY` — internal API key (default `mframapa-internal-dev-key` in dev)
- `SENTRY_DSN` — optional, leave blank to disable

For the mobile app: `EXPO_PUBLIC_API_URL` (defaults to `https://mframapa.ai`).

---

## Planning Documents

The docs are authoritative in this order: `EXECUTION_PLAN_4MONTHS.md` (scope contract) → `SPEC.md` (week-by-week tasks) → `CHECKLIST.md` (tracking). When scope questions arise, defer to `EXECUTION_PLAN_4MONTHS.md` §3 (drop list) and §3.5 (explicitly not dropped).
