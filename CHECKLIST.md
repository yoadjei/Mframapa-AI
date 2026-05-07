# Mframapa v2.0 — Weekly Checklist

**Timeline**: **16 weeks** (production v2.0 — see **`SPEC.md`** & **`EXECUTION_PLAN_4MONTHS.md`**)  
**Status**: ⬜ Not Started | 🔄 In Progress | ✅ Complete | ⏸️ Blocked

---

## Phase 1: Data Infrastructure & Resilience (Weeks 1–4)

### Week 1: Foundation

| Task | Status | Notes |
|------|--------|-------|
| Create v2.0 git branch | ✅ | |
| CI baseline (smoke on PR) | ✅ | GitHub Actions |
| Create `backend/data_sources/` + `base.py` | ✅ | |
| Write `era5.py` — ERA5 connector | ✅ | |
| Register Copernicus CDS account | ✅ | Free |
| Structured logging for ingestion | ✅ | |
| Write ERA5 unit tests | ✅ | |
| Update requirements / lockfile | ✅ | |

**Week 1 Definition of Done**:
- [x] ERA5 fetches PBLH, temperature, humidity, wind for one bbox end-to-end
- [x] Tests pass; docs note quotas

---

### Week 2: Sentinel-5P & Open-Meteo

| Task | Status | Notes |
|------|--------|-------|
| Write `sentinel5p.py` | ✅ | |
| Refactor `open_meteo.py` to DataSource pattern | ✅ | |
| Retries + exponential backoff + timeouts | ✅ | |
| Unit tests | ✅ | |
| Document rate limits & endpoints | ✅ | |

**Week 2 Definition of Done**:
- [x] S5P + Open-Meteo work independently with robust errors

---

### Week 3: MODIS, VIIRS & Orchestration

| Task | Status | Notes |
|------|--------|-------|
| Register NASA Earthdata account | ✅ | Free |
| Write `modis.py` — MODIS AOD | ✅ | |
| Write `viirs.py` — VIIRS AOD | ✅ | |
| Write `orchestrator.py` | ✅ | |
| Fallback hierarchy config | ✅ | |
| Reliability scoring persisted | ✅ | |
| Integration tests + simulated provider failure | ✅ | |

**Week 3 Definition of Done**:
- [x] Degraded mode works when one EO source fails (tests prove it)

---

### Week 4: Cache, Historical Jobs & API Metadata

| Task | Status | Notes |
|------|--------|-------|
| Create Upstash account | ✅ | Free tier |
| Redis caching layer + SQLite fallback | ✅ | |
| Cache keys, TTL, invalidation | ✅ | |
| Batch pre-materialise Top-N cities | ✅ | |
| API: `sources_used`, `freshness`, `degraded` fields | ✅ | |
| OpenAPI / schema reflects prediction shape | ✅ | |

**Week 4 Definition of Done**:
- [x] Hot paths faster; responses explain provenance

---

## Phase 2: Features & ML (Weeks 5–8)

### Week 5: Feature Pipeline & Calibration

| Task | Status | Notes |
|------|--------|-------|
| WorldPop / GPW population density | ✅ | |
| SRTM elevation | ✅ | |
| NDVI composite pipeline | ✅ | |
| VIIRS night lights composite | ✅ | |
| OSM road density (zonal stats) | ✅ | |
| OpenAQ (+ AirQo if available) joins | ✅ | |
| Unified feature pipeline module | ✅ | |
| Remove placeholder values from training path | ✅ | |
| Feature validation tests | ✅ | |
| Update data dictionary | ✅ | |

**Week 5 Definition of Done**:
- [x] Reproducible feature build for train/infer

---

### Week 6: Temporal Gap Fill & Baselines

| Task | Status | Notes |
|------|--------|-------|
| Temporal gap-fill policy + implementation | ✅ | |
| Climatology / baseline features | ✅ | |
| Sparse-cell smoothing pass | ✅ | |
| Train/eval split scripts (grouped) | ✅ | |
| Versioned training snapshots layout | ✅ | Separate from live API cache |

**Week 6 Definition of Done**:
- [x] Missing EO days handled; methodology documented

---

### Week 7: Regional Models & Ensemble

| Task | Status | Notes |
|------|--------|-------|
| 6-region GeoJSON + urban/rural classifier | ✅ | |
| Train West Africa urban + rural | ✅ | Colab / GPU |
| Train East Africa urban + rural | ✅ | |
| Train North Africa urban + rural | ✅ | |
| Train Central Africa urban + rural | ✅ | |
| Train Southern Africa urban + rural | ✅ | |
| Train Horn of Africa urban + rural | ✅ | |
| Ensemble XGBoost + LightGBM | ✅ | |
| Model registry + selection router | ✅ | |
| Continental fallback model if needed | ⬜ | Sparse labels |
| Evaluation metrics artefact for CI | ✅ | |

**Week 7 Definition of Done**:
- [x] 12 regional models **or** documented fallback + path to 12
- [x] Ensemble wired in staging

---

### Week 8: Uncertainty, Anomalies & ML Docs

| Task | Status | Notes |
|------|--------|-------|
| Uncertainty (conformal / bootstrap) in inference | ✅ | |
| API exposes uncertainty fields | ✅ | |
| Anomaly / spike flags | ✅ | |
| Feature importance logging job | ⬜ | |
| Model validation test suite | ✅ | |
| Model cards | ✅ | |
| Wire production inference path | ✅ | |

**Week 8 Definition of Done**:
- [x] Predictions include uncertainty + anomaly hints + docs

---

## Phase 3: Versioned API & PWA (Weeks 9–12)

### Week 9: API Keys, Limits & Exports

| Task | Status | Notes |
|------|--------|-------|
| `/v1/` route layout | ✅ | |
| API key issuance + hashing at rest | ✅ | |
| Public vs institutional rate limits | ✅ | |
| Usage logging per key | ✅ | |
| CSV export endpoint | ✅ | |
| GeoJSON export endpoint | ✅ | |
| Published OpenAPI | ✅ | |

**Week 9 Definition of Done**:
- [x] External-ready API contract

---

### Week 10: Batch & CI Integration Tests

| Task | Status | Notes |
|------|--------|-------|
| Batch query API (async+poll **or** capped sync) | ✅ | Implemented capped sync at `/api/v1/batch-predict` (max 20 locations) |
| API integration tests in CI | ✅ | Added `.github/workflows/ci.yml` running `backend/tests/test_api.py` |
| End-to-end ingest → predict smoke test | ✅ | Added `test_ingest_to_predict_smoke` route-level pipeline smoke test |
| Response compression (gzip/brotli) | ✅ | GZip middleware enabled; compression test added |

**Week 10 Definition of Done**:
- [ ] Batch + CI guard critical paths

---

### Week 11: Retrain, Drift & Deploy/Rollback

| Task | Status | Notes |
|------|--------|-------|
| Scheduled retraining workflow | ⬜ | Actions / cron |
| Drift heuristic / alerts stub | ⬜ | |
| Deploy script + rollback runbook | ⬜ | |
| Staged synthetic upstream failure drill | ⬜ | Record results |

**Week 11 Definition of Done**:
- [ ] Models refreshable on schedule; rollback tested once

---

### Week 12: PWA Production

| Task | Status | Notes |
|------|--------|-------|
| manifest.json + icons + splash | ⬜ | |
| Service worker + cache strategies | ⬜ | |
| Pre-cache city packs | ⬜ | |
| Offline UI + sync when online | ⬜ | |
| Manual city picker | ⬜ | |
| Lazy map / lite mode | ⬜ | |
| Compression + slow-network test | ⬜ | |
| Accessibility pass (contrast, symbols) | ⬜ | |
| Lighthouse audit | ⬜ | |

**Week 12 Definition of Done**:
- [ ] Installable PWA; offline path credible

---

## Phase 4: Mobile, Distribution & Observability (Weeks 13–16)

### Week 13: Android App Core

| Task | Status | Notes |
|------|--------|-------|
| Expo init + TypeScript | ⬜ | |
| Navigation + theme (dark/light) | ⬜ | |
| Home + Map + City search | ⬜ | |
| API client (`/v1`) | ⬜ | |
| MMKV offline last-known | ⬜ | |
| Settings + languages | ⬜ | |

**Week 13 Definition of Done**:
- [ ] Release build talks to prod/staging API

---

### Week 14: Distribution (≥2 Paths)

| Task | Status | Notes |
|------|--------|-------|
| Release keystore secured | ⬜ | |
| Optimised release APK | ⬜ | &lt; 15 MB target |
| Store screenshots / descriptions | ⬜ | |
| Samsung Galaxy Store submission | ⬜ | |
| Second path: Huawei **or** Amazon **or** GitHub Releases APK | ⬜ | |
| APK download page + SHA-256 | ⬜ | |

**Week 14 Definition of Done**:
- [ ] ≥2 install channels submitted or live

---

### Week 15: Observability, Analytics & Load Smoke

| Task | Status | Notes |
|------|--------|-------|
| Sentry (API + web + mobile) | ⬜ | Student tier OK |
| Uptime monitors | ⬜ | |
| Privacy-preserving aggregated analytics | ⬜ | Umami / PostHog / self-host |
| Internal metrics dashboard | ⬜ | |
| Alerting (email/Discord) | ⬜ | |
| Load smoke test script + results | ⬜ | |
| Redis/cache tuning | ⬜ | |
| Mobile battery/memory pass | ⬜ | |

**Week 15 Definition of Done**:
- [ ] Errors + uptime + aggregates visible; load smoke documented

---

### Week 16: Freeze, Docs & Launch

| Task | Status | Notes |
|------|--------|-------|
| Critical bug sweep only | ⬜ | |
| Operator runbooks (quota, provider down, rollback) | ⬜ | |
| API consumer documentation final | ⬜ | |
| Privacy policy ↔ implementation audit | ⬜ | |
| User guide / FAQ | ⬜ | |
| Final QA walkthrough (PWA + Android) | ⬜ | |
| Launch checklist sign-off | ⬜ | |
| Pitch deck + analytics snapshots | ⬜ | |
| Git tag **v2.0.x** | ⬜ | |

**Week 16 Definition of Done**:
- [ ] v2.0 production freeze; docs complete

---

## App Store & APK Tracker

### Samsung Galaxy Store

| Step | Status | Date |
|------|--------|------|
| Account created | ⬜ | |
| APK uploaded | ⬜ | |
| Store listing complete | ⬜ | |
| Submitted | ⬜ | |
| Live | ⬜ | |

### Huawei AppGallery (optional path)

| Step | Status | Date |
|------|--------|------|
| Account + verification | ⬜ | |
| Submitted | ⬜ | |
| Live | ⬜ | |

### Amazon Appstore (optional path)

| Step | Status | Date |
|------|--------|------|
| Account | ⬜ | |
| Submitted | ⬜ | |
| Live | ⬜ | |

### Direct APK / GitHub Releases

| Step | Status | Date |
|------|--------|------|
| Signed APK | ⬜ | |
| Hosted + checksum | ⬜ | |
| Download page live | ⬜ | |

---

## Weekly Progress Log (16 weeks)

### Week 1
- Start date:
- End date:
- Completed:
- Blockers:

### Week 2
- Start date:
- End date:
- Completed:
- Blockers:

### Week 3
- Start date:
- End date:
- Completed:
- Blockers:

### Week 4
- Start date:
- End date:
- Completed:
- Blockers:

### Week 5
- Start date:
- End date:
- Completed:
- Blockers:

### Week 6
- Start date:
- End date:
- Completed:
- Blockers:

### Week 7
- Start date:
- End date:
- Completed:
- Blockers:

### Week 8
- Start date:
- End date:
- Completed:
- Blockers:

### Week 9
- Start date:
- End date:
- Completed:
- Blockers:

### Week 10
- Start date:
- End date:
- Completed:
- Blockers:

### Week 11
- Start date:
- End date:
- Completed:
- Blockers:

### Week 12
- Start date:
- End date:
- Completed:
- Blockers:

### Week 13
- Start date:
- End date:
- Completed:
- Blockers:

### Week 14
- Start date:
- End date:
- Completed:
- Blockers:

### Week 15
- Start date:
- End date:
- Completed:
- Blockers:

### Week 16
- Start date:
- End date:
- Completed:
- Blockers:

---

*Last updated*: align with **`SPEC.md`** when editing milestones*
