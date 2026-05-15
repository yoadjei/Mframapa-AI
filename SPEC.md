# Mframapa v2.0 — Development Specification

**Timeline**: 12 weeks (3 months) — full vision scope
**Scope contract**: See **`EXECUTION_PLAN.md`** for priorities and cut order
**Budget**: ≤ USD 30 cash; compute via free tiers + student credits

---

## Phase 1: Data Foundation (Weeks 1–2)

### Week 1: Credentials, First Sources & Infrastructure

**Focus**: Get real data flowing from at least 3 sources

| Task | Description | Deliverable |
|------|-------------|-------------|
| Register Copernicus CDS | Account + API key for ERA5 | Credentials in `.env` |
| Register Copernicus CDSE | Account for Sentinel-5P TROPOMI | Credentials in `.env` |
| Register NASA Earthdata | Account + bearer token for MODIS | Credentials in `.env` |
| Create Upstash Redis | Free tier Redis database | `REDIS_URL` in `.env` |
| Test ERA5 connector | Run `era5.py` against live CDS API | Successful data fetch for Accra |
| Test Open-Meteo connector | Run `open_meteo.py` (no auth needed) | Weather + AQ data returned |
| Test SRTM connector | Run `srtm.py` (no auth needed) | Elevation data returned |
| Test WorldPop connector | Run `worldpop.py` (no auth needed) | Population density returned |
| Validate structured logging | Confirm log output for all ingestion | Logs visible |
| Run `live_test.py` | At least auth-free tests pass | ≥4/9 tests passing |

**End of Week 1**: 3+ data sources returning real data. Redis connected.

---

### Week 2: Full Pipeline & Orchestration

**Focus**: All data sources operational. Orchestrator + cache tested.

| Task | Description | Deliverable |
|------|-------------|-------------|
| Test Sentinel-5P connector | Run against CDSE with real credentials | NO₂ + aerosol data |
| Test MODIS connector | Run against NASA Earthdata | AOD data |
| Test VIIRS connector | Run against NASA/NOAA | AOD data |
| Validate orchestrator | Test fallback chain with real + simulated failures | Degraded mode works |
| Test feature pipeline | Full `FeaturePipeline.get_features()` with real data | All ~20 features populated |
| Redis + SQLite cache | Test set/get/invalidate with real data | Cache round-trip works |
| Pre-materialise cities | Run `precompute_cache.py` for top-50 cities | Cached features available |
| API metadata | Confirm `sources_used`, `freshness`, `degraded` in responses | API returns provenance |
| Run full `live_test.py` | All 9 tests pass | 9/9 green |
| Unit test suite | Run `pytest backend/tests -q` | All tests pass |

**End of Week 2**: `live_test.py` 9/9 pass. API serves real (cached) data.

---

## Phase 2: ML Pipeline & Models (Weeks 3–4)

### Week 3: Training Data & Feature Engineering

**Focus**: Collect real data (2018-05-01 → today, 427 cities, Option C), build training datasets

| Task | Description | Deliverable |
|------|-------------|-------------|
| City-grid collection (whole Africa) | 427 cities × weekly 2018–2023 + daily 2024–today via collect_training_data.py | training_rows.parquet |
| ERA5 weather features | Temperature, wind (u/v), RH, PBLH from OpenMeteo archive | Weather features |
| CAMS AQ proxy features | NO₂, SO₂, CO, AOD, PM10, PM2.5 from OpenMeteo CAMS (2022 onwards) | AQ features |
| OpenAQ v3 calibration labels | Real PM2.5 ground truth; 25km match radius; ~200 Africa stations | Real labels |
| Temporal features | day_of_year (1–366) + month (1–12) added to FEATURE_COLUMNS | 14-feature schema |
| Checkpoint-safe collection | Per-city JSON checkpoint; parquet written per city; full resume on failure | Resilient pipeline |
| Rate-limited API calls | Per-API token bucket; respects free-tier limits | No bans |
| Temporal train/val/test split | Temporal CV: train 2018–2022 / val 2023 / test 2024–today | Split manifests |
| Feature validation | Completeness, distributions, outliers; ~490k rows | Validated dataset |
| Population + elevation | WorldPop + SRTM static features joined | Complete feature matrix |
| Auto-retrain pipeline | Weekly GitHub Actions: collect last 90 days → retrain → commit | Automated pipeline |

**End of Week 3**: Real training dataset: 2018-05-01 → today, 427 cities, ~490k rows, temporal train/val/test splits, automated weekly refresh.

---

### Week 4: Model Training & Production Inference

**Focus**: Train all models. Wire production path.

| Task | Description | Deliverable |
|------|-------------|-------------|
| Train West Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Train East Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Train North Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Train Central Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Train Southern Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Train Horn of Africa (urban + rural) | XGBoost + LightGBM | 2 model bundles |
| Continental fallback | If any region has sparse labels | Fallback model |
| Ensemble wiring | XGBoost + LightGBM combination | Ensemble inference |
| Conformal uncertainty | Calibrated prediction intervals | Uncertainty in API |
| Anomaly/spike flags | Residual / z-score detection | Anomaly fields |
| Model registry | All 12 models registered with versions | `model_registry.json` |
| End-to-end test | `GET /api/v1/predict` returns real prediction | Working inference |
| Model cards | Document limitations, regions, label density | Model documentation |
| Feature importance | Log top features per model | Importance artifacts |

**End of Week 4**: Real predictions. `GET /api/v1/predict?lat=5.6&lon=-0.19` → real PM2.5 + uncertainty.

---

## Phase 3: Design System & Web Core (Weeks 5–7)

### Week 5: Design System & Component Library

**Focus**: Complete foundation for all UI

| Task | Description | Deliverable |
|------|-------------|-------------|
| Colour tokens | bg, surface (3 levels), text (3 levels), border, divider, brand (3), semantic (4) | CSS custom properties |
| AQI semantic colours | good/moderate/sensitive/unhealthy/severe/hazardous | AQI palette |
| Typography system | Display, H1–H6, Body L/M, Caption, Label, Numeric, Monospace | Font scale |
| Spacing system | 4px base, 8px layout, responsive scale | Spacing tokens |
| Radius system | sm/md/lg/xl/pill | Border radius tokens |
| Elevation system | card/overlay/modal/sticky shadows | Shadow tokens |
| Motion system | Durations, easing, reduced-motion fallback | Animation tokens |
| Dark theme | Full dark palette | Theme toggle |
| Light theme | Full light palette | Default theme |
| Button components | primary/secondary/tertiary/destructive/icon/FAB × 7 states | Button system |
| Input components | text/password/email/search/select/autocomplete/textarea/date/range × 5 states | Input system |
| Card components | summary/AQI/analytics/insight/activity/expandable | Card system |
| Chart components | line/bar/heatmap/comparison/trend + live metrics | Chart library |
| Navigation | top nav, side nav, bottom nav, command palette, breadcrumbs | Nav components |
| Modal/sheet | modal, side sheet, bottom sheet, fullscreen modal | Overlay components |
| Loading states | skeleton loaders, spinners, progress bars, streaming placeholders | Loading system |
| Empty/error states | empty, loading, offline, server error, permission denied, no results | State components |
| Notification components | toast, inline alert, banner, push preview, emergency alert | Alert system |
| Responsive grid | Mobile single-col, tablet adaptive, desktop multi-panel, ultrawide dashboard | Grid system |

**End of Week 5**: Complete design system. All components built with all states.

---

### Week 6: Core Web Screens

**Focus**: Explorer, search, auth — the main product surface

| Task | Description | Deliverable |
|------|-------------|-------------|
| Landing page | Marketing + feature overview + CTA | Public page |
| Africa explorer | Interactive map with heatmap layer, clustering, smart filtering | Explorer screen |
| Country explorer | Country-level AQI overview, city list, regional stats | Country screen |
| City explorer | Detailed AQI dashboard: current, trends, weather, health, sources | City detail screen |
| Search/discovery | Multilingual city search, recent, popular, offline-capable | Search screen |
| Login | Email/password + validation | Auth screen |
| Signup | Registration + onboarding flow | Auth screen |
| Forgot/reset password | Email flow | Auth screen |
| Home dashboard | Saved cities overview, quick AQI, recent activity | Dashboard |
| Map integration | Interactive map with location picker, tap-to-explore | Map component |

**End of Week 6**: Core product screens functional with real API data.

---

### Week 7: Intelligence, Health & Product Features

**Focus**: What makes this an intelligence platform, not just a data viewer

| Task | Description | Deliverable |
|------|-------------|-------------|
| AI insight cards | ML-generated contextual insights per city | Insight component |
| Prediction dashboard | Forecast view with confidence bands | Prediction screen |
| Trend visualisations | Historical AQI with line/bar/comparison charts | Trend charts |
| Anomaly alert UI | Visual alert when predictions detect anomalies | Alert component |
| Health risk dashboard | Asthma risk, dust alerts, heat stress, vulnerable population | Health screen |
| Confidence indicators | Visual confidence scoring on all predictions | Overlay component |
| Historical playback | Time-slider for past AQI data | Playback component |
| Trust & transparency | Data source panel, timestamps, methodology page, model explanation cards, disclaimers | Trust components |
| Notification centre | Notification list, alert settings, category filtering | Notification screen |
| Saved locations | Add/remove/reorder saved cities | Saved screen |
| Profile & settings | Account, privacy, language, theme, notification prefs | Settings screens |
| Comparison dashboard | Compare AQI across multiple cities | Comparison screen |

**End of Week 7**: Intelligence platform experience. Insights, health context, trends, transparency.

---

## Phase 4: Offline, Mobile & Enterprise (Weeks 8–9)

### Week 8: PWA Hardening & Mobile App

**Focus**: Offline-capable PWA. Mobile with full feature parity.

| Task | Description | Deliverable |
|------|-------------|-------------|
| PWA icon set | 72, 96, 128, 144, 152, 192, 384, 512, maskable | Icon assets |
| Manifest + splash | Full PWA manifest, splash screens | PWA config |
| Service worker | CacheFirst static, NetworkFirst API, pre-cache city packs | `sw.js` tuned |
| Offline UI | Cache management, sync queue, reconnect state indicator | Offline system |
| Low-bandwidth mode | Compressed map, reduced data, lazy loading | Performance mode |
| Lighthouse audit | Target ≥ 90 PWA score | Audit report |
| Mobile: core screens | Home, map, search, city detail, alerts, settings | Mobile screens |
| Mobile: intelligence | AI insight cards, prediction alerts, health context | Mobile intelligence |
| Mobile: offline | MMKV persistence, sync-when-online, offline banner | Mobile offline |
| Mobile: push | Notification infrastructure | Push system |
| Mobile: theme/i18n | Dark/light themes, language switching | Mobile polish |

**End of Week 8**: PWA installable + offline. Mobile running with real data.

---

### Week 9: Enterprise, Large Screen & Responsive

**Focus**: Dashboards for organisations and operations centres

| Task | Description | Deliverable |
|------|-------------|-------------|
| Organisation dashboard | Multi-user org account overview | Enterprise screen |
| Multi-city monitoring | Simultaneous monitoring of N cities | Monitoring dashboard |
| Regional analytics | Aggregate stats by region/country | Analytics screen |
| Command centre layout | Dense analytics, split panels, live metrics (1920px+) | Large screen layout |
| Live monitoring grid | Multi-city grid with auto-refresh | Wallboard layout |
| Public health dashboard | Admin view for health agencies | Health admin screen |
| Export/reporting centre | CSV, GeoJSON, PDF generation | Export screen |
| Tablet layouts | Adaptive layouts for 768–1024px | Tablet responsive |
| Desktop layouts | Multi-panel layouts for 1280–1600px | Desktop responsive |
| Ultrawide layouts | Dashboard layouts for 1920–2560px+ | Ultrawide responsive |

**End of Week 9**: Enterprise dashboards functional. Responsive from 320 to 2560+.

---

## Phase 5: Monetisation, Developer & Community (Weeks 10–11)

### Week 10: Monetisation & Developer Portal

**Focus**: Revenue model technically enforced. API ready for external developers.

| Task | Description | Deliverable |
|------|-------------|-------------|
| Pricing page | Free / Pro / Enterprise comparison | Marketing page |
| Free tier UI | Feature limits visible, upgrade prompts | Tier enforcement |
| Subscription management | Plan selection, billing info, invoices | Subscription UI |
| Payment methods | Stripe/similar integration stub | Payment screen |
| Enterprise contact flow | Sales inquiry form | Contact flow |
| Tier enforcement | Backend rate limits + feature gates per tier | API middleware |
| API documentation | Interactive docs portal | Developer page |
| API key management | Create/revoke keys, usage stats | Key management UI |
| Usage dashboard | Request counts, rate limit status | Usage screen |
| Dataset exports | Bulk download endpoints | Export API |
| SDK examples | Python + JavaScript snippets | Documentation |

**End of Week 10**: Pricing live. Tiers enforced. Developer portal functional.

---

### Week 11: Community, Accessibility & Automation

**Focus**: Community features. Accessibility compliance. Operational automation.

| Task | Description | Deliverable |
|------|-------------|-------------|
| Citizen reporting | Submit environmental observations | Report form |
| Environmental submissions | Photo/text submissions with location | Submission flow |
| Verification states | Pending/verified/rejected badges | Moderation UI |
| Local observations feed | Community-sourced data display | Feed component |
| WCAG AA audit | Full accessibility review | Audit report |
| Keyboard navigation | Tab order, focus management | Navigation fixes |
| Screen reader labels | ARIA labels, roles, live regions | Accessibility fixes |
| Touch targets | Minimum 44px on all interactive elements | Size fixes |
| Reduced motion | `prefers-reduced-motion` support | Motion alternatives |
| Contrast validation | All text meets AA contrast ratios | Colour fixes |
| Scheduled retrain | GitHub Actions cron for model refresh | Retrain workflow |
| Drift heuristic | Feature stats / residual MAE monitoring | Drift detection |
| Deploy + rollback | Scripted deploy with documented rollback | Runbook |

**End of Week 11**: Community live. Accessibility passed. Retraining automated.

---

## Phase 6: Distribution & Launch (Week 12)

### Week 12: Ship v2.0

**Focus**: App stores, observability, documentation, freeze

| Task | Description | Deliverable |
|------|-------------|-------------|
| Release keystore | Secured signing key | Keystore |
| Optimised APK | Target < 15 MB | APK artifact |
| Samsung Galaxy Store | Submit listing + APK | Submission |
| Second channel | Huawei / Amazon / GitHub Releases | ≥2 channels |
| APK download page | Direct download + SHA-256 | Web page |
| Sentry | Backend + web + mobile error tracking | DSN wired |
| Uptime monitors | Health + critical route checks | Monitoring |
| Privacy analytics | Aggregate-only analytics (Umami/PostHog) | Analytics |
| Load smoke test | Concurrent burst test + results | Test report |
| Operator runbooks | Provider down, quota exhaustion, rollback | Documentation |
| API consumer docs | Auth, limits, exports, uncertainty semantics | Documentation |
| Privacy policy | Aligned with actual data retention | Legal doc |
| User guide / FAQ | End-user documentation | Help docs |
| Final QA | Full walkthrough PWA + Android | QA pass |
| Git tag | `v2.0.0` | Release |

**End of Week 12**: **v2.0 production freeze**. Conference-ready and maintainable.

---

## Error Pages & Edge Cases (Built Throughout)

- 404 Not Found
- Maintenance mode
- Network failure
- Timeout
- API unavailable
- Session expired
- Permission denied

---

## Success Criteria

| Metric | Target |
|--------|--------|
| EO independence | ≥3 families feeding fusion |
| Model quality | 12 regional models with documented metrics |
| API latency (p95) | < 500 ms cached |
| PWA Lighthouse | ≥ 90 |
| APK size | < 15 MB |
| Offline cities | Top-50+ pre-materialised |
| Responsive | 320px → 2560px+ |
| Accessibility | WCAG AA |
| Distribution | ≥2 Android channels |
| Uptime | Monitored with alerts |

---

*Mframapa v2.0 Specification — 12-week full vision timeline*
*Aligned with `EXECUTION_PLAN.md`*
