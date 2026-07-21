# Mframapa AI v2.0: Backend & ML Super Prompt for AI Agents

**CONTEXT:** You are an autonomous AI coding assistant. This is the **ULTIMATE SYSTEM PROMPT AND REFERENCE** for the Backend (Python/FastAPI) and Machine Learning pipeline of Mframapa AI v2.0. Do not invent schemas, do not guess architectural decisions, and do not deviate from these constraints. 

The frontend and backend agents are working in parallel. Every API contract, push notification, and data structure described here MUST be strictly adhered to so the frontend doesn't break.

---

## 1. STRATEGY & CLOUD ARCHITECTURE
*   **Mission:** Episodic alerts (Harmattan, dust intrusions) delivered to intermediaries (radio, schools), backed by the app. Not "ambient checking".
*   **Infrastructure:** Oracle Cloud Always Free Tier (4 ARM Ampere A1 Cores, 24GB RAM).
*   **Services:** Cloudflare (TLS proxy) → Oracle ARM VM → Nginx → FastAPI (Uvicorn workers) + Local Redis container (port 6379).
*   **Monetization:** Free for individuals. Institutions pay via manual invoice. NEVER gate health-critical data.

---

## 2. THE STRICT API CONTRACT (FRONTEND SYNC)
The frontend expects exactly this JSON schema from `GET /api/v1/predict?lat=...&lon=...`. Do NOT alter it.
```json
{
  "pm25": 42.5,
  "aqi_category": "Unhealthy for Sensitive Groups",
  "factors": {
    "aerosol_optical_depth": 0.45,
    "no2_tropospheric_column": 0.0002,
    "population_density": 450,
    "elevation": 120
  },
  "weather": {
    "temp": 32.1,
    "humidity": 45.0,
    "wind": 4.2
  },
  "uncertainty": {
    "pm25_lower": 35.0,
    "pm25_upper": 50.0,
    "half_width": 7.5,
    "coverage": 0.9,
    "method": "split_conformal_manifest"
  },
  "location": {"name": "Accra", "lat": 5.60, "lon": -0.18},
  "model": {"region_id": "west_africa", "segment": "urban", "version": "2.0.0", "source": "feature_pipeline"}
}
```

**Push Notifications Sync:** You MUST implement `POST /api/v1/register-push-token` that accepts `{"token": "ExponentPushToken[xxx]", "platform": "android|web", "lat": 5.6, "lon": -0.1}`. Store these in SQLite/Redis so the `episode_detector.py` can trigger alerts.

---

## 3. ML MODEL RULES & TRAINING PIPELINE
1. **Continental First:** Train `continental` models. Only train regional (`west_africa`, etc.) if holdout data > 2,000 rows.
2. **Station-Level Split ONLY:** Never split by random row. Split by ground station to prevent spatial leaks.
3. **Handle NaNs Natively:** Cloud cover destroys satellite data. Pass NaNs to XGBoost/LightGBM. Do not drop rows.
4. **12 Exact Feature Columns (`ml/features.py`):** 
   `pblh`, `temperature_2m`, `relative_humidity`, `u_component_of_wind_10m`, `v_component_of_wind_10m`, `no2_tropospheric_column`, `aerosol_optical_depth`, `so2_total_column`, `co_total_column`, `pm10_surface`, `population_density`, `elevation`.
5. **Memory Management:** The FastAPI application must successfully load all XGBoost/LightGBM regional bundles into the Oracle VM's 24GB RAM without leaking memory over time.

---

## 4. EXACT DIRECTORY STRUCTURE & FILE MAP
Create or modify these exact files. No deviations.

### Root & Scripts
*   `.env` — Must have: `CDSAPI_KEY`, `CDSE_USERNAME`, `CDSE_PASSWORD`, `NASA_EARTHDATA_TOKEN`, `REDIS_URL`, `MFRAMAPA_INTERNAL_KEY`, `ALLOWED_ORIGINS=https://mframapa.ai,http://localhost:5173`, `SENTRY_DSN`.
*   `requirements.txt` — FastAPI, Uvicorn, XGBoost, LightGBM, Redis, Shapely, pandas, numpy, sentry-sdk.

### Backend APIs (`backend/api/`)
*   `app.py` — FastAPI root. Loads all ML bundles into memory `@app.on_event("startup")`.
*   `v1/router.py` — `GET /predict`, `GET /resolve-location`, `POST /generate-insight`, `POST /register-push-token`, `GET /health`.
*   `security.py` — Redis sliding-window rate limit (Internal: 1000/min, Institutional: 100/sec, Public: 10/min). Verifies keys via `X-API-Key`.
*   `middleware/tracing.py` — Injects `X-Request-ID` and logs response time.

### Pipeline & Data Sources (`backend/pipeline/` & `backend/data_sources/`)
*   `backend/pipeline/feature_pipeline.py` — Pulls data and formats into the 12 columns.
*   `backend/data_sources/orchestrator_async.py` — Uses `asyncio.gather()` to fetch concurrently.
    *   *ERA5* (Training only)
    *   *Sentinel-5P* (NO2, Aerosol Index)
    *   *VIIRS* (AOD) - **CRITICAL:** Delete the legacy MODIS connector (`modis.py`) as VIIRS duplicates it and removes the HDF4 dependency.
    *   *Open-Meteo* (Temp, RH, Wind, SO2, CO, PM10)
    *   *WorldPop* (Population), *SRTM* (Elevation)
*   `pipeline/config.py` — Fixes needed: `FETCH_START_DATE=2020-01-01`, `OPENAQ_DELAY_SECONDS=1.1`.

### Alerts & Inference (`backend/alerts/` & `backend/ml/`)
*   `backend/alerts/episode_detector.py` — Cron job finding Harmattan onset/inversions -> sends tokens to Expo Push API.
*   `backend/alerts/radio_digest.py` — Formats predictions into email text for radio stations.
*   `backend/ml/inference.py` — Model loader and OpenMeteo hallucination checker.

### Machine Learning Core (`ml/`)
*   `features.py` — Defines `FEATURE_COLUMNS` and `TARGET_COLUMN = "pm25_surface"`.
*   `training.py` — XGBoost/LightGBM fit, split conformal absolute residual calibration.
*   `regions.py` — Shapely PIP on `ml/data/african_regions.geojson`.
*   `column_mapper.py` — Translates pipeline columns to model columns.

---

## 5. EXACT COMMANDS & WORKFLOWS
Agent, run these exact commands when executing tasks:
*   **Run Server Locally:** `uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000`
*   **Run Tests:** `pytest backend/tests -q`
*   **Run Pipeline Data Fetch:** `python -m pipeline.run_pipeline`
*   **Train Models (Dry Run/CI):** 
    ```python
    from ml.training import synthetic_training_frame, train_regional_bundle
    train_regional_bundle(synthetic_training_frame(n_rows=400), "west_africa", "urban", "ml/exports/west_africa/urban")
    ```

**FINAL CHECK:** Before finishing any task, verify CORS allows the frontend, the JSON schema perfectly matches Section 2, and the ML models are not dropping NaN satellite rows.

---

## 8. EXACT IMPLEMENTATION SPECS (P0 CODE EXPECTATIONS)

### 1. Asynchronous Data Orchestrator & Live Sources (`backend/data_sources/orchestrator_async.py`)
*   Create an `AsyncDataOrchestrator` class using `asyncio.gather(*tasks, return_exceptions=True)`.
*   **Rich Live Sources & Fallback Hierarchy (Strict Order):**
    1.  *Primary Ground Truth:* **OpenAQ** and **AirQo** (Live African sensors, if available in the city).
    2.  *Primary EO:* **Sentinel-5P** via Copernicus CDSE (NO2, Aerosol Index).
    3.  *Secondary EO:* **VIIRS** via NASA EarthData (AOD).
    4.  *Fallback/Fast Operational:* **Open-Meteo** (Temp, RH, Wind, SO2, CO, PM10).
    5.  *Static Proxies:* **WorldPop** (Population), **SRTM** (Elevation).
*   **Timeouts & Graceful Degradation:** Wrap all external HTTP calls with a strict `timeout=5.0` seconds. If a satellite source 500s or times out, DO NOT crash. Log the failure to Redis, return `None` for those features, and let XGBoost handle the NaNs natively.
*   **OpenAQ Rate Limit Protection (CRITICAL):** OpenAQ strictly enforces 60 requests/minute. The orchestrator MUST read the `x-ratelimit-remaining` and `x-ratelimit-reset` headers from every OpenAQ response. If `x-ratelimit-remaining` hits 1, the pipeline must `asyncio.sleep(x-ratelimit-reset)` to prevent the server IP from being permanently banned.

### 2. Real ML Inference & Hallucination Rectifier (`backend/ml/inference.py` & `backend/api/app.py`)
*   **Inference Module:** Create a `ModelBundle` class that holds an XGBoost booster, a LightGBM booster, and the manifest dict. Load all bundles via `@app.on_event("startup")` into `app.state.models`.
*   **The Prediction Logic:** Extract the 12 features into a 2D numpy array: `X = np.array([[f1, f2...]])`. Call `xgb.predict(X)` and `lgb.predict(X)` and average them.
*   **Hallucination Catch & Rectify Check:**
    *   Compare the final model prediction against OpenMeteo's raw `pm25`.
    *   *Absolute Floor Check:* Ignore if absolute difference is negligible (e.g., `abs(model - openmeteo) < 15 µg/m³`).
    *   *Detect:* If absolute difference > 15, calculate `ratio = model / openmeteo`. If `ratio > 3.0` or `ratio < 0.33`, the model is hallucinating.
    *   *Rectify:* Set `"degraded": true`. Recalculate `final_pm25 = (0.5 * model) + (0.5 * openmeteo)` to aggressively smooth the error before returning it to the user.

### 3. Redis-Backed Logical Rate Limiter (`backend/api/security.py`)
*   **Sliding Window Logic:** For every incoming API Key, use a Redis Sorted Set (ZSET).
    1. `ZREMRANGEBYSCORE key 0 (current_time - 60)`
    2. `ZCARD key`
    3. If count > tier_limit: raise `HTTPException(429, "Rate limit exceeded")` **AND include a `Retry-After` header** so the frontend knows exactly when to unlock the UI.
    4. `ZADD key {current_time: current_time}` -> `EXPIRE key 60`.
*   **Burst Tolerance:** For the Institutional tier (100/sec), implement a Token Bucket hybrid so they can burst 500 requests instantly for batch processing without hitting the strict per-second wall.
*   **API Keys:** Remove the hardcoded `"mframapa-internal-dev-key"`. Read from `os.getenv("MFRAMAPA_INTERNAL_KEY")`.

### 4. Episode Alert Engine & Push Notifications (`backend/alerts/episode_detector.py` & `push.py`)
*   **Episode Detector:** Query the last 7 days of predictions for all 500+ pre-bundled African cities from the Redis cache. If `(today_pm25 > baseline * 2.0) AND (today_aqi_category in ["Unhealthy", "Hazardous"])`, an Episode is detected.
*   **Push Delivery (`push.py`):** Query the database/Redis for user Push Tokens registered to that city/region. Use `httpx` to POST to the Expo Push API: `https://exp.host/--/api/v2/push/send`.

### 5. Dynamic Translation API (`backend/api/v1/translations.py`)
*   **OTA Dictionaries:** Do not rely on static LLM files. Create `GET /api/v1/translations/sync` to serve the 27 language dictionaries from the database, allowing instant live updates.
*   **Community Corrections:** Create `POST /api/v1/translations/suggest` to allow native speakers to submit natural corrections for robotic text. Ensure the DB schema has a `verified_by_human` boolean.
