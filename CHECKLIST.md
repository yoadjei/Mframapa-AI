# Mframapa v2.0 — Weekly Checklist

**Timeline**: 12 weeks — full vision scope (see `SPEC.md` & `EXECUTION_PLAN.md`)
**Status**: ⬜ Not Started | 📝 Scaffolded | 🔄 In Progress | ✅ Complete | ⏸️ Blocked

---

## Phase 1: Data Foundation (Weeks 1–2)

### Week 1: Credentials & First Sources

| Task | Status | Notes |
|------|--------|-------|
| Register Copernicus CDS account | ✅ | CDSAPI_KEY configured |
| Register Copernicus CDSE account | ✅ | CDSE_USERNAME/PASSWORD configured |
| Register NASA Earthdata account | ✅ | NASA_EARTHDATA_TOKEN configured |
| Create Upstash Redis database | ✅ | Upstash Redis connected (TLS) |
| Test ERA5 connector (live) | ✅ | Returns temperature, wind, humidity |
| Test Open-Meteo connector (live) | ✅ | Archive routing fixed for historical dates |
| Test SRTM connector (live) | ✅ | Returns elevation |
| Test WorldPop connector (live) | ✅ | Returns population density |
| Validate structured logging | ✅ | |
| `live_test.py` ≥4/9 pass | ✅ | 9/9 passed 2026-05-09 |

**Week 1 DoD**: [x] 3+ sources returning real data. Redis connected.

---

### Week 2: Full Pipeline & Orchestration

| Task | Status | Notes |
|------|--------|-------|
| Test Sentinel-5P connector (live) | ✅ | BadZipFile fix; returns NO2 column |
| Test MODIS connector (live) | ✅ | Sinusoidal projection + lpdaac domain fix; returns AOD |
| Test VIIRS connector (live) | ✅ | No granules for test date (acceptable — secondary fallback) |
| Validate orchestrator fallback | ✅ | Priority fallback chain operational |
| Test feature pipeline end-to-end | ✅ | |
| Redis + SQLite cache tested | ✅ | Redis primary + SQLite fallback working |
| Pre-materialise top-50 cities | ⬜ | `precompute_cache.py` scaffolded |
| API metadata fields working | ✅ | |
| `live_test.py` 9/9 pass | ✅ | 9/9 passed 2026-05-09 |
| `pytest backend/tests -q` all pass | ✅ | 103 tests passed 2026-05-09 |

**Week 2 DoD**: [x] `live_test.py` 9/9. Multi-provider data flowing.

---

## Phase 2: ML Pipeline & Models (Weeks 3–4)

### Week 3: Training Data & Feature Engineering

| Task | Status | Notes |
|------|--------|-------|
| City-grid collection script | ✅ | collect_training_data.py with checkpoint + rate limiting |
| ERA5 weather features (2018–today) | ⬜ | OpenMeteo archive; temp, wind u/v, RH, PBLH |
| CAMS AQ proxy features (2022–today) | ⬜ | OpenMeteo CAMS; NO₂, SO₂, CO, AOD, PM10, PM2.5 |
| OpenAQ v3 calibration labels | ⬜ | Real API integrated; 25km match radius |
| 427-city data pull (~490k rows) | ⬜ | Run: python -m ml.scripts.collect_training_data |
| Temporal gap fill implementation | ⬜ | |
| Climatology baselines | ⬜ | |
| Temporal features added | ✅ | day_of_year + month in FEATURE_COLUMNS (14 total) |
| Feature validation | ⬜ | Run after first full collection |
| Temporal train/val/test split | ⬜ | 2018–2022 train / 2023 val / 2024–today test |
| NDVI + night lights composites | ⬜ | |
| Complete feature matrix | ✅ | 14-feature matrix in ml/features.py (12 + day_of_year + month) |

**Week 3 DoD**: [ ] training_rows.parquet exists with real data from 2018-05-01 → today, 427 cities, temporal CV split ready, auto-retrain workflow active.

---

### Week 4: Model Training & Production Inference

| Task | Status | Notes |
|------|--------|-------|
| Train West Africa (urban + rural) | ✅ | Smoke-trained; swap when real data ready |
| Train East Africa (urban + rural) | ✅ | Smoke-trained |
| Train North Africa (urban + rural) | ✅ | Smoke-trained |
| Train Central Africa (urban + rural) | ✅ | Smoke-trained |
| Train Southern Africa (urban + rural) | ✅ | Smoke-trained |
| Train Horn of Africa (urban + rural) | ✅ | Smoke-trained |
| Continental fallback model | ⬜ | |
| Ensemble wiring (XGB + LGBM) | ✅ | `ensemble.py` + router inference |
| Conformal uncertainty | ✅ | Half-width from manifest per region |
| Anomaly/spike flags | ⬜ | |
| Model registry updated | ✅ | All 12 entries in registry |
| End-to-end predict test | ✅ | `/api/v1/predict` returns ML pm25 |
| Model cards written | ⬜ | |
| Feature importance logged | ⬜ | |

**Week 4 DoD**: [x] Predictions via API with conformal uncertainty (synthetic weights; real data pending).

---

## Phase 3: Design System & Web Core (Weeks 5–7)

### Week 5: Design System & Components

| Task | Status | Notes |
|------|--------|-------|
| Colour tokens (full palette) | ⬜ | |
| AQI semantic colours | ⬜ | |
| Typography system | ⬜ | |
| Spacing system (4px grid) | ⬜ | |
| Radius + elevation + motion | ⬜ | |
| Dark + light themes | ⬜ | |
| Button components (7 states) | ⬜ | |
| Input components (5 states) | ⬜ | |
| Card components (6 types) | ⬜ | |
| Chart components (5 types) | ⬜ | |
| Navigation components | ⬜ | Partial scaffold |
| Modal/sheet components | ⬜ | |
| Loading/empty/error states | ⬜ | `StateMessage.jsx` scaffolded |
| Notification components | ⬜ | |
| Responsive grid system | ⬜ | |

**Week 5 DoD**: [ ] Complete design system with all component states.

---

### Week 6: Core Web Screens

| Task | Status | Notes |
|------|--------|-------|
| Landing/marketing page | ⬜ | |
| Africa explorer (map + heatmap + clustering) | ⬜ | |
| Country explorer | ⬜ | |
| City explorer (AQI detail) | ⬜ | |
| Search/discovery (multilingual) | ⬜ | `SearchScreen.jsx` scaffolded |
| Login / signup | ⬜ | `AuthScreen.jsx` scaffolded |
| Forgot / reset password | ⬜ | |
| Home dashboard | ⬜ | `HomeScreen.jsx` scaffolded |
| Map integration | ⬜ | `MapCanvas.jsx` scaffolded |
| First-time onboarding | ⬜ | `OnboardingScreen.jsx` scaffolded |

**Week 6 DoD**: [ ] Core screens functional with real API data.

---

### Week 7: Intelligence & Product Features

| Task | Status | Notes |
|------|--------|-------|
| AI insight cards | ⬜ | |
| Prediction dashboard | ⬜ | |
| Trend visualisations | ⬜ | |
| Anomaly alert UI | ⬜ | |
| Health risk dashboard | ⬜ | |
| Confidence indicators | ⬜ | |
| Historical playback | ⬜ | |
| Trust & transparency panels | ⬜ | |
| Notification centre | ⬜ | `NotificationsScreen.jsx` scaffolded |
| Saved locations | ⬜ | |
| Profile & settings | ⬜ | Scaffolded |
| Comparison dashboard | ⬜ | |

**Week 7 DoD**: [ ] Intelligence platform experience live.

---

## Phase 4: Offline, Mobile & Enterprise (Weeks 8–9)

### Week 8: PWA Hardening & Mobile

| Task | Status | Notes |
|------|--------|-------|
| PWA icon set (72–512px + maskable) | ⬜ | |
| Manifest + splash | ⬜ | Basic manifest scaffolded |
| Service worker tuning | ⬜ | `sw.js` scaffolded |
| Offline UI + sync queue | ⬜ | |
| Low-bandwidth mode | ⬜ | |
| Lighthouse ≥ 90 | ⬜ | |
| Mobile: core screens | ⬜ | Screens scaffolded |
| Mobile: intelligence cards | ⬜ | |
| Mobile: offline (MMKV) | ⬜ | Store scaffolded |
| Mobile: push notifications | ⬜ | `notifications.ts` scaffolded |
| Mobile: theme + i18n | ⬜ | Theme + locales scaffolded |

**Week 8 DoD**: [ ] PWA installable + offline. Mobile running.

---

### Week 9: Enterprise & Large Screen

| Task | Status | Notes |
|------|--------|-------|
| Organisation dashboard | ⬜ | |
| Multi-city monitoring | ⬜ | |
| Regional analytics | ⬜ | |
| Command centre layout (1920px+) | ⬜ | |
| Live monitoring grid | ⬜ | |
| Public health dashboard | ⬜ | |
| Export/reporting centre | ⬜ | |
| Tablet layouts (768–1024) | ⬜ | |
| Desktop layouts (1280–1600) | ⬜ | |
| Ultrawide layouts (1920–2560+) | ⬜ | |

**Week 9 DoD**: [ ] Enterprise dashboards. Responsive 320 → 2560+.

---

## Phase 5: Monetisation, Developer & Community (Weeks 10–11)

### Week 10: Monetisation & Developer Portal

| Task | Status | Notes |
|------|--------|-------|
| Pricing page | ⬜ | |
| Free tier UI + upgrade prompts | ⬜ | |
| Subscription management | ⬜ | |
| Payment methods stub | ⬜ | |
| Enterprise contact flow | ⬜ | |
| Tier enforcement (backend) | ⬜ | Rate limiting scaffolded |
| API documentation portal | ⬜ | |
| API key management UI | ⬜ | |
| Usage dashboard | ⬜ | |
| Dataset export endpoints | ⬜ | CSV/GeoJSON scaffolded |
| SDK examples | ⬜ | |

**Week 10 DoD**: [ ] Pricing live. Tiers enforced. Developer portal up.

---

### Week 11: Community, Accessibility & Automation

| Task | Status | Notes |
|------|--------|-------|
| Citizen reporting | ⬜ | |
| Environmental submissions | ⬜ | |
| Verification states | ⬜ | |
| Local observations feed | ⬜ | |
| WCAG AA audit + fixes | ⬜ | |
| Keyboard navigation | ⬜ | |
| Screen reader labels | ⬜ | |
| Touch targets ≥ 44px | ⬜ | |
| Reduced motion support | ⬜ | |
| Contrast validation | ⬜ | |
| Scheduled retrain workflow | ⬜ | `retrain_models.yml` scaffolded |
| Drift heuristic | ⬜ | |
| Deploy + rollback runbook | ⬜ | |

**Week 11 DoD**: [ ] Accessibility passed. Community live. Retraining automated.

---

## Phase 6: Distribution & Launch (Week 12)

### Week 12: Ship v2.0

| Task | Status | Notes |
|------|--------|-------|
| Release keystore | ⬜ | |
| Optimised APK (< 15 MB) | ⬜ | |
| Samsung Galaxy Store submission | ⬜ | |
| Second channel (Huawei/Amazon/GitHub) | ⬜ | |
| APK download page + SHA-256 | ⬜ | |
| Sentry integration | ⬜ | |
| Uptime monitors | ⬜ | |
| Privacy analytics | ⬜ | |
| Load smoke test | ⬜ | |
| Operator runbooks | ⬜ | |
| API consumer docs | ⬜ | |
| Privacy policy | ⬜ | |
| User guide / FAQ | ⬜ | |
| Final QA walkthrough | ⬜ | |
| Git tag `v2.0.0` | ⬜ | |

**Week 12 DoD**: [ ] v2.0 production freeze. ≥2 install channels. Monitoring live.

---

## Weekly Progress Log

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

---

*Last updated*: 2026-05-09 — full vision scope, 12-week timeline
