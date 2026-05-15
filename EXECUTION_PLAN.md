# Mframapa v2.0 — Execution Plan (12 Weeks)

**Product**: Africa-wide environmental and health intelligence platform
**Timeline**: 12 weeks (3 months)
**Team**: 2 developers
**Budget**: ≤ USD 30 cash; compute via free tiers + GitHub Student Pack credits
**Surfaces**: Web (PWA), Android, large-screen dashboards

This document is the **scope contract** for Mframapa v2.0. It supersedes all previous planning documents.

---

## 1. Product Vision

Mframapa v2.0 is a **scalable, intelligence-driven, prediction-ready, offline-capable, Africa-wide, production-grade** environmental intelligence platform.

### Core Principles

- **Every African city is first-class** — no geographic bias toward major cities only
- **Intelligence-driven** — not just data display; predictions, anomaly detection, health scoring, recommendations
- **Offline-first** — functional without internet on low-bandwidth networks
- **Enterprise-ready** — organisation accounts, regional dashboards, API access, bulk reporting
- **Monetisable** — tiered access (Free / Pro / Enterprise) with technical enforcement
- **Transparent** — data sources, confidence scores, methodology, model explanations visible to users
- **Accessible** — WCAG AA minimum, keyboard navigation, screen readers, reduced motion

### Platform Targets

| Surface | Description |
|---------|-------------|
| **Web (PWA)** | Primary — responsive from 320px mobile to 2560px+ ultrawide |
| **Android** | React Native (Expo) — ≥2 free distribution channels |
| **Large screens** | Command centre, wallboard, monitoring grid layouts |
| **API** | Versioned public API for developers, researchers, institutions |

---

## 2. Architecture

### Four Data Layers

| Layer | Role | Sources |
|-------|------|---------|
| **A — Satellite / EO** | Spatial coverage | Sentinel-5P (NO₂, aerosol), MODIS AOD, VIIRS AOD |
| **B — Reanalysis** | Gap filling, transport context | ERA5 (wind, humidity, PBLH, temperature), Open-Meteo (fallback) |
| **C — Proxies** | Physical plausibility | WorldPop population, SRTM elevation, NDVI, VIIRS night lights, OSM roads |
| **D — Calibration** | Accuracy | OpenAQ, AirQo (where available) |

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  Web PWA │ Android │ Large Screen │ Developer API            │
├─────────────────────────────────────────────────────────────┤
│                     API GATEWAY                              │
│  /api/v1/  │  Auth + Keys  │  Rate Limits  │  Usage Logs   │
├─────────────────────────────────────────────────────────────┤
│                   INTELLIGENCE LAYER                         │
│  Predictions │ Anomaly Detection │ Health Scoring │ Trends  │
├─────────────────────────────────────────────────────────────┤
│                      ML LAYER                                │
│  12 Regional Models │ Ensemble │ Uncertainty │ Drift Watch  │
├─────────────────────────────────────────────────────────────┤
│                   DATA ORCHESTRATOR                          │
│  Multi-source fallback │ Reliability scoring │ Gap fill     │
├─────────────────────────────────────────────────────────────┤
│                    DATA SOURCES                              │
│  ERA5 │ S5P │ MODIS │ VIIRS │ OpenMeteo │ WorldPop │ SRTM  │
├─────────────────────────────────────────────────────────────┤
│                   PERSISTENCE                                │
│  Redis (Upstash) │ SQLite │ Cache │ City Packs │ MMKV      │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Product Systems (Full Scope)

### 3.1 Consumer Layer
- AQI monitoring + predictions with uncertainty
- Africa-wide / country / city explorer with interactive maps
- Search/discovery with multilingual city search
- Saved locations with offline access
- Health context: asthma risk, dust alerts, heat stress, pollution explanations
- AI insight cards with recommendation panels
- Historical playback and trend visualisations
- Notification centre with push alerts, digest settings, emergency escalation

### 3.2 Intelligence Layer
- ML predictions with confidence scoring
- Anomaly detection and alerting
- Trend analysis and forecasting
- Environmental health impact estimation
- Recommendation systems (activity guidance, exposure reduction)

### 3.3 Enterprise Layer
- Organisation accounts with multi-user management
- Multi-city monitoring dashboards
- Regional analytics and operations panels
- Public health administration views
- Export/reporting centre (CSV, GeoJSON, PDF)
- Large screen: command centre, wallboard, monitoring grid layouts

### 3.4 Developer Layer
- API documentation portal
- API key management and usage dashboard
- Dataset exports
- SDK examples (Python/JS)

### 3.5 Monetisation Layer
- Free tier: essential AQI, limited saved cities, limited history
- Pro tier: advanced predictions, analytics, exports, unlimited monitoring
- Enterprise tier: organisation accounts, regional operations, API access, bulk reporting
- Technical enforcement via rate limits + API keys (payment rails manual initially)

### 3.6 Community Layer
- Citizen environmental reports
- Submission verification states
- Local observations feed

### 3.7 Trust & Transparency
- Data source attribution per result
- Confidence scoring visible in UI
- Methodology panels
- Model explanation cards
- Reporting disclaimers

---

## 4. Design System Requirements

### Tokens
- Full colour palette: bg, surface, surface-elevated, surface-overlay, text-primary/secondary/muted, border, divider, brand-primary/secondary/accent, success/warning/error/info
- AQI semantic colours: good, moderate, sensitive, unhealthy, severe, hazardous
- Typography: Display, H1–H6, Body Large/Body/Caption/Label, Numeric, Monospace
- Spacing: 4px base grid, 8px layout grid
- Radius: small/medium/large/xl/pill
- Elevation: card/overlay/modal/sticky shadows
- Motion: durations, easing curves, reduced-motion fallback

### Themes
- Light theme, dark theme, high-contrast mode

### Breakpoints
- 320, 375, 414, 768, 1024, 1280, 1440, 1600, 1920, 2560+

### Component States
Every component must support: default, loading, empty, error, offline, success

### Accessibility
- WCAG AA minimum
- Keyboard navigation
- Visible focus states
- Screen reader labels
- Touch target ≥ 44px
- Non-colour indicators
- Reduced motion alternatives

---

## 5. Twelve-Week Schedule

### Phase 1: Data Foundation (Weeks 1–2)

**Goal**: Every data source pulls real data. Orchestrator fallback chain works. Cache layer operational.

| Week | Deliverables |
|------|-------------|
| **W1** | Register Copernicus CDS + NASA Earthdata accounts. Test ERA5 + Open-Meteo + SRTM connectors live. Set up Upstash Redis. Validate structured logging. Run `live_test.py` successfully for auth-free sources. |
| **W2** | Test Sentinel-5P + MODIS + VIIRS connectors live. Validate orchestrator fallback chain (simulate provider failures). Feature pipeline (WorldPop, NDVI, night lights, roads) operational. Redis + SQLite cache tested. Pre-materialise top-N cities. API metadata fields working (`sources_used`, `freshness`, `degraded`). |

**Phase 1 exit**: `python live_test.py` passes all 9 tests. Multi-provider data flowing.

---

### Phase 2: ML Pipeline & Models (Weeks 3–4)

**Goal**: Real models trained on 8-year dataset (2018-05-01 → today), evaluated with temporal CV, auto-refreshed weekly.

| Week | Deliverables |
|------|-------------|
| **W3** | Collect 8-year city-grid data (2018-05-01 → today): 427 cities, weekly pre-2024 + daily post-2024, ~490k rows. ERA5 weather + CAMS AQ (2022+) + OpenAQ calibration labels. Temporal features (day_of_year, month). Checkpoint-safe with rate limiting. Temporal CV split: 2018–2022 train / 2023 val / 2024–today test. |
| **W4** | Train 13 model bundles (12 regional × urban/rural + 1 continental) on 2018–2022 data; validate on 2023; test on 2024–today. XGBoost + LightGBM ensemble. Conformal uncertainty. Weekly auto-retrain via GitHub Actions (collect last 90 days → retrain → commit). API end-to-end: request → features → model → response with pm25 + uncertainty + metadata. |

**Phase 2 exit**: `GET /api/v1/predict?lat=5.6&lon=-0.19` returns real prediction with uncertainty.

---

### Phase 3: Design System & Web Core (Weeks 5–7)

**Goal**: Complete design system. Core web app with Africa explorer, intelligence UI, responsive layouts.

| Week | Deliverables |
|------|-------------|
| **W5** | **Design system**: Complete token system (colours, typography, spacing, elevation, motion). AQI semantic palette. Dark/light themes. Responsive grid system. Core component library: buttons (7 states), inputs (5 states), cards (6 types), charts (5 types), navigation, modals/sheets, loading/empty/error/offline states, notification components. |
| **W6** | **Core screens**: Landing/marketing page. Africa-wide explorer with interactive map (heatmaps, clustering, smart filtering). Country explorer. City explorer (detailed AQI + weather + trends). Search/discovery with multilingual search. Authentication flows (login, signup, forgot/reset password). |
| **W7** | **Intelligence & product screens**: AI insight cards. Prediction dashboard. Trend visualisations (line, bar, comparison charts). Anomaly alerts. Health risk dashboard (asthma, dust, heat). Confidence indicators. Historical playback. Trust panels (data sources, timestamps, methodology, model explanation). Notification centre. Profile & settings. |

**Phase 3 exit**: Web app running with real API data, responsive from 320px to 1920px+.

---

### Phase 4: Offline, Mobile & Enterprise (Weeks 8–9)

**Goal**: PWA hardened. Mobile app complete. Enterprise dashboards functional.

| Week | Deliverables |
|------|-------------|
| **W8** | **PWA hardening**: Proper icon set (72–512px), manifest, service worker cache strategies, pre-cached city packs, offline UI + sync queue, reconnect flow, low-bandwidth mode, manual city picker, Lighthouse audit (≥90). **Mobile rebuild**: All core screens with vision-aligned UI, intelligence cards, health context, offline via MMKV, push notification infrastructure. |
| **W9** | **Enterprise & large screen**: Organisation dashboard, multi-city monitoring, regional analytics, command centre layout, live monitoring grid, wallboard mode, public health dashboard, export/reporting centre. **Responsive**: Tablet adaptive layouts (768–1024), desktop multi-panel (1280–1600), ultrawide dashboard (1920–2560+). |

**Phase 4 exit**: PWA installable + offline. Mobile build running. Enterprise layouts at 1920px+.

---

### Phase 5: Monetisation, Developer & Community (Weeks 10–11)

**Goal**: Tiered access working. Developer portal live. Community features scaffolded.

| Week | Deliverables |
|------|-------------|
| **W10** | **Monetisation**: Pricing page, free tier UI, upgrade prompts, subscription management UI, billing dashboard, payment methods stub, enterprise contact flow. **Tier enforcement**: Rate limits per tier, feature gating (Pro analytics, Enterprise API). **Developer portal**: API documentation, key management, usage dashboard, dataset export endpoints, SDK examples. |
| **W11** | **Community**: Citizen reporting, environmental submissions, verification states, local observations. **Accessibility audit**: WCAG AA pass, keyboard navigation, focus states, screen reader labels, touch targets, reduced motion, contrast validation. **Retraining automation**: Scheduled retrain workflow, drift heuristic, deploy script + rollback runbook. |

**Phase 5 exit**: Pricing page live. API docs published. Accessibility audit passed.

---

### Phase 6: Distribution & Launch (Week 12)

**Goal**: Ship it.

| Week | Deliverables |
|------|-------------|
| **W12** | **Android**: Release keystore, optimised APK (<15 MB), store screenshots/descriptions. Samsung Galaxy Store submission + second channel (Huawei/Amazon/GitHub Releases). APK download page + SHA-256. **Ops**: Sentry integration (API + web + mobile), uptime monitors, privacy-preserving analytics, load smoke test, cache tuning. **Docs**: Operator runbooks, API consumer docs, privacy policy audit, user guide/FAQ. **Freeze**: Critical bugs only. Git tag `v2.0.0`. |

**Phase 6 exit**: v2.0 production freeze. ≥2 install channels live. Monitoring operational.

---

## 6. Definition of Done — v2.0

### Data & ML
- [ ] ≥3 independent EO/atmosphere sources feeding fusion
- [ ] Fallback executes on provider failure (tested)
- [ ] 12 regional ensemble models deployed with version + training data ID
- [ ] Uncertainty and degradation visible in API + UI
- [ ] Anomaly detection operational

### Product
- [ ] Africa explorer with map (heatmaps, clustering)
- [ ] City detail with AQI, weather, trends, health context, intelligence insights
- [ ] Notification centre with push capability
- [ ] Offline mode with sync queue
- [ ] Saved locations, search, profile, settings
- [ ] Historical playback

### Enterprise
- [ ] Organisation dashboard with multi-city monitoring
- [ ] Large screen layouts (command centre, wallboard)
- [ ] Export centre (CSV, GeoJSON)

### Monetisation
- [ ] Free / Pro / Enterprise tiers technically enforced
- [ ] Pricing page and subscription UI

### Developer
- [ ] API documentation portal
- [ ] Key management and usage dashboard

### Clients
- [ ] PWA installable, Lighthouse ≥ 90, offline functional
- [ ] Android APK via ≥2 channels
- [ ] Responsive 320px → 2560px+

### Accessibility
- [ ] WCAG AA compliant
- [ ] Keyboard navigable
- [ ] Screen reader compatible

### Ops
- [ ] CI/CD + documented rollback
- [ ] Monitoring + alerting
- [ ] Privacy policy aligned with retention

---

## 7. Risk Register

| Risk | Mitigation |
|------|-----------|
| Scope exceeds 12 weeks | Cut community features + developer portal first; never cut data pipeline, ML, or core product |
| API credential delays (Copernicus/NASA) | Register Week 1 day 1; use Open-Meteo as fallback for dev |
| Label sparsity breaks regional models | Continental fallback model with explicit uncertainty inflation |
| Team overload | Cut enterprise large screen layouts before cutting consumer product |
| Credit exhaustion | Single primary cloud + billing alarms |
| Design system scope creep | Ship core components first; add advanced components in later sprints |

### Cut Order (if behind schedule)
1. Community features (citizen reporting, submissions)
2. Developer portal (API docs can be auto-generated OpenAPI)
3. Large screen layouts (command centre, wallboard)
4. Advanced enterprise features (public health admin)
5. **Never cut**: Data pipeline, ML models, core consumer product, offline, basic monetisation tiers

---

## 8. Budget

| Item | Cost |
|------|------|
| Infrastructure | $0/month (free tiers + student credits) |
| App stores | $0 (Samsung, Huawei, Amazon, direct APK) |
| Optional: Google Play | $25 one-time |
| **Total** | **≤ $30** |

### Free Infrastructure Stack

| Service | Purpose |
|---------|---------|
| Vercel / similar | Frontend hosting |
| AWS/Azure/DO (student) | Backend |
| Upstash | Redis cache + rate limiting |
| Cloudflare | CDN + DNS + SSL |
| GitHub Actions | CI/CD + scheduled jobs |
| Colab | ML training |
| Sentry (student) | Error monitoring |
| UptimeRobot | Uptime monitoring |

---

## 9. Team Roles

| Domain | Primary | Secondary |
|--------|---------|-----------|
| Data ingestion, orchestration, cache | Dev A | Dev B |
| ML training, evaluation, model registry | Dev A | Dev B |
| Web app, design system, responsive | Dev B | Dev A |
| Mobile app, PWA | Dev B | Dev A |
| API, security, exports | Rotate | Rotate |
| Infra, CI/CD, monitoring | Rotate | Rotate |

---

*Mframapa v2.0 Execution Plan — 12 weeks, full vision scope*
*Authoritative document for scope decisions*
