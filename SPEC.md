# Mframapa AI v2.0 — Development Specification

**Timeline**: **16 weeks (4 months)** — production v2.0 scope  
**Scope contract**: See **`EXECUTION_PLAN_4MONTHS.md`** for drop/priority rules (full functioning product, not a throwaway demo).  
**Budget**: ≤ **USD 30** cash out-of-pocket; compute via free tiers + GitHub Student Pack credits  
**Milestone**: Denmark / Young Entrepreneurs Track + live production release

---

## Timeline Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                      16-WEEK PRODUCTION TIMELINE                           │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  PHASE 1           PHASE 2        PHASE 3         PHASE 4                 │
│  Data & resilience Features & ML API & PWA        Mobile & launch         │
│  ─────────────     ──────────     ─────────        ─────────────            │
│  Weeks 1–4         Weeks 5–8      Weeks 9–12       Weeks 13–16             │
│                                                                            │
│  Ingestion +       Train +        Versioned API +  Android + stores +      │
│  orchestration +   uncertainty +  offline PWA +    observability + freeze │
│  cache + API meta  ensemble       batch + retrain                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

Testing, performance, and monitoring are **woven into every phase**; Weeks **15–16** concentrate integration/load smoke tests, alerting, docs, and release freeze (no separate “Phase 5 weeks 17–20”).

---

## Budget

| Category | Amount | Notes |
|----------|--------|-------|
| Infrastructure | $0/mo target | Free tiers + student credits |
| Domain / misc | $0–15 | Only if unavoidable |
| Google Play | $25 | Optional; consumes most of $30 envelope |
| Contingency | remainder | Quotas / surprises |
| **Total cash** | **≤ $30** | Paid EO APIs out of scope |

---

## Distribution Strategy

| Platform | Fee | Priority |
|----------|-----|----------|
| PWA | $0 | Primary |
| Samsung Galaxy Store | $0 | High |
| Huawei AppGallery | $0 | High |
| Direct APK / GitHub Releases | $0 | High (**minimum two** install paths by Week 16) |
| Amazon Appstore | $0 | Medium |
| F-Droid | $0 | Medium |
| Google Play | $25 | If budget allows |
| Apple App Store | $99/yr | Out of scope for v2.0 cash budget |

---

## Phase 1: Data Infrastructure & Resilience (Weeks 1–4)

### Week 1: Foundation

**Focus**: Deploy baseline, secrets hygiene, first reanalysis path, structured logging

| Task | Description | Deliverable |
|------|-------------|-------------|
| v2.0 branch / CI baseline | Clean branching; GitHub Actions smoke tests on PR | CI passing |
| `backend/data_sources/` scaffold | Abstract `DataSource`, shared errors, timeouts | `base.py`, package layout |
| ERA5 connector | PBLH, wind (u/v), temperature, humidity (+ precip when stable) | `era5.py` |
| Copernicus CDS | Account + quota awareness documented | Runbook note |
| Unit tests | ERA5 fetch + parsing | Tests |
| Logging | Structured logs for ingestion jobs | Observability baseline |

**End of Week 1**: ERA5 end-to-end for one bbox; architecture in place

---

### Week 2: Primary Satellite & Fallback Weather

**Focus**: Sentinel-5P + operational weather fallback interface

| Task | Description | Deliverable |
|------|-------------|-------------|
| Sentinel-5P connector | NO₂, aerosol index / UVAI (and gases per pipeline capability) | `sentinel5p.py` |
| Open-Meteo refactor | Align to `DataSource` pattern | `open_meteo.py` |
| Retries / backoff | Exponential backoff, circuit breaker hooks | Shared client utils |
| Unit tests | Connectors | Tests |
| Docs | Rate limits, quotas | README / data dictionary |

**End of Week 2**: S5P + Open-Meteo live independently

---

### Week 3: Multi-Source EO & Orchestration

**Focus**: Redundant AOD + orchestrator + reliability + failure simulation

| Task | Description | Deliverable |
|------|-------------|-------------|
| MODIS AOD connector | Terra/Aqua strategy per NASA Earthdata rules | `modis.py` |
| VIIRS AOD connector | Second independent AOD family | `viirs.py` |
| Orchestrator | Coordinates providers; fallback ladder | `orchestrator.py` |
| Fallback config | satellite → reanalysis → cache → conservative prior | YAML/config |
| Reliability scoring | Persist success/latency/freshness per source | DB or SQLite table |
| Integration tests | Simulate provider failure / stale data | Tests |

**End of Week 3**: System survives loss of at least one EO provider in tests

---

### Week 4: Caching, Historical Materialisation & API Transparency

**Focus**: Performance, offline batches, **prediction response metadata**

| Task | Description | Deliverable |
|------|-------------|-------------|
| Redis (Upstash) + disk fallback | SQLite/local fallback if Redis unavailable | Cache layer |
| Cache keys / TTL | Documented invalidation | Config |
| Pre-materialise Top-N cities | Batch job for historical/feature snapshots | Worker/cron |
| API fields | `sources_used[]`, `freshness`, `degraded`, provenance stub | API/schema update |
| OpenAPI | Contract starts reflecting stable prediction shape | `openapi.yaml` or FastAPI export |

**End of Week 4**: Faster cold paths; API honestly describes what fed the result

---

## Phase 2: Features & ML (Weeks 5–8)

### Week 5: Feature Pipeline & Calibration Joins

**Focus**: Full proxy stack + labels — no placeholders in training path

| Task | Description | Deliverable |
|------|-------------|-------------|
| WorldPop / GPW | Population density layer | Population features |
| SRTM | Elevation | Terrain features |
| NDVI | Single consistent composite (e.g. MODIS) | Vegetation features |
| VIIRS night lights | Monthly composite acceptable initially | Activity proxy |
| OSM road density | Zonal aggregates (hex/grid/admin) | Traffic proxy |
| OpenAQ + AirQo | Station joins where accessible | Calibration table |
| Unified feature pipeline | Deterministic join to grid/cities | Pipeline module |
| Validation tests | Feature completeness checks | Tests |

**End of Week 5**: Reproducible feature matrix for training/inference

---

### Week 6: Temporal & Baseline Modelling

**Focus**: Missing satellite days + climatology + light smoothing

| Task | Description | Deliverable |
|------|-------------|-------------|
| Temporal gap fill | Nearest-good-day / short window rules | Documented policy |
| Climatology baseline | Rolling normals from ERA5 / composites | Features |
| Spatiotemporal smoothing | Sparse-cell smoothing (kernel/statistical — keep tractable) | Module |
| Train/eval splits | Region × time grouped splits | Scripts |
| Separate train artifacts | Versioned training snapshots distinct from live API pulls | Storage layout |

**End of Week 6**: Training rows resilient to gaps; methodology documented

---

### Week 7: Regional Models & Ensemble

**Focus**: All regions + GBDT ensemble + registry

| Task | Description | Deliverable |
|------|-------------|-------------|
| Region boundaries | 6 regions GeoJSON + urban/rural classifier | Config |
| Train regional models | Target **12** artifacts (6 × urban/rural); **continental fallback** if labels force reduction | Model files |
| Ensemble | XGBoost + LightGBM combination | Ensemble inference |
| Selection logic | Region + UR → model id | Router |
| Export | Serialised models + metadata | Registry dir / DB |
| Evaluation | Notebooks or scripts → **CI-exported metrics artefact** where feasible | Metrics |

**End of Week 7**: Registered ensemble serves inference path in staging

---

### Week 8: Uncertainty, Anomalies & Production ML Docs

**Focus**: Intervals/flags + drift hooks + model cards

| Task | Description | Deliverable |
|------|-------------|-------------|
| Uncertainty | Conformal intervals or bootstrap — **must** surface in API | Inference patch |
| Anomaly flags | Residual / z-score hybrid acceptable | Response fields |
| Feature importance logging | Batch job post-training | Logs artefact |
| Validation suite | Holdouts + sanity checks | Tests |
| Model cards | Limitations, regions, label density | `docs/` |
| Inference integration | Production path returns uncertainty + anomaly | Wire-up |

**End of Week 8**: ML meets **`EXECUTION_PLAN_4MONTHS.md`** §8 ML bullets

---

## Phase 3: Versioned API & PWA (Weeks 9–12)

### Week 9: Public API Hardening

**Focus**: Versioned routes, keys, limits, exports

| Task | Description | Deliverable |
|------|-------------|-------------|
| `/v1/` routes | Stable URLs | Router layout |
| API keys | Public vs institutional tiers (**limits**, billing manual OK) | Key storage / hashing |
| Rate limiting | Abuse protection per key/IP | Middleware |
| Usage persistence | Per-key request counts for dashboard | Store |
| CSV + GeoJSON export | Documented export endpoints or query params | Handlers |
| OpenAPI sync | Published spec matches implementation | Docs |

**End of Week 9**: Partners can integrate without informal JSON drift

---

### Week 10: Batch & Integration Testing

**Focus**: Heavy queries + automated API/integration coverage

| Task | Description | Deliverable |
|------|-------------|-------------|
| Batch endpoint | Async job + poll **or** strict capped sync — **pick one**, document | API |
| API integration tests | Critical paths in CI | Test suite |
| End-to-end data test | Ingest → features → inference smoke | Pipeline test |
| Payload compression | gzip/brotli where applicable | Server config |

**End of Week 10**: Batch contract stable; CI guards regressions

---

### Week 11: Retraining, Drift & Deploy Discipline

**Focus**: Automation + operational safety

| Task | Description | Deliverable |
|------|-------------|-------------|
| Scheduled retrain | GitHub Actions or worker cron | Pipeline |
| Drift heuristic | Feature stats / residual MAE creep alerts | Monitor stub |
| Deployment | Scripted deploy + **documented rollback** | Runbook |
| Synthetic failure drill | Staged upstream outage rehearsal | Recorded outcome |

**End of Week 11**: Operators can refresh models without heroics

---

### Week 12: PWA Production UX

**Focus**: Installable, offline, low-bandwidth, accessibility

| Task | Description | Deliverable |
|------|-------------|-------------|
| manifest.json + icons + splash | Full set | Assets |
| Service worker | Asset + API cache policies; offline UX | `sw.js` |
| Pre-cache city packs | Align with backend Top-N materialisation | Config |
| Manual city picker | No GPS required | UI |
| Lazy map / lite mode | Reduce bandwidth | Map tuning |
| Compression | Assets + API consumer hints | Build |
| Accessibility | Contrast, scalable type, symbolic AQI | Audit fixes |
| Lighthouse | Target strong PWA score | Report |

**End of Week 12**: PWA matches production Definition of Done (client side)

---

## Phase 4: Mobile, Distribution & Observability (Weeks 13–16)

### Week 13: Android Client

**Focus**: Same API contract as web

| Task | Description | Deliverable |
|------|-------------|-------------|
| Expo / RN project | TypeScript, navigation, theme | App scaffold |
| Home / map / search | Core flows | Screens |
| API client | Versioned base URL + error handling | Service layer |
| MMKV / offline | Last-known AQI + pinned cities | Storage |
| Settings | Language, preferences | Screen |

**End of Week 13**: Signed debug/release path shows live API data

---

### Week 14: Distribution Minimum Two Paths

**Focus**: Real installs — not “submitted someday”

| Task | Description | Deliverable |
|------|-------------|-------------|
| Release signing | Keystore secured | Signing |
| Optimised APK / AAB | Target **< 15 MB** APK equivalent | Artefact |
| Samsung Galaxy Store | Submit | Tracker updated |
| **Plus one of**: Huawei OR Amazon OR **GitHub Releases direct APK** | Minimum **two** total paths | Live or submitted |
| Download page | SHA-256, install instructions | Web |

**End of Week 14**: ≥2 distribution channels in flight or live

---

### Week 15: Observability, Privacy-Preserving Analytics & Load Smoke

**Focus**: Production ops

| Task | Description | Deliverable |
|------|-------------|-------------|
| Sentry | Backend + frontend/mobile | DSN wired |
| Uptime monitors | Health + critical routes | UptimeRobot or equiv |
| Aggregated analytics | Adoption / cohorts / geo buckets — **no raw GPS retention** | Umami/PostHog/etc. |
| Load smoke script | Concurrent burst representative of launch | Results doc |
| Cache tuning | Hit rates, TTL adjustments | Notes |
| Mobile perf | Battery/memory sanity pass | Fixes |

**End of Week 15**: On-call lite playbook exists

---

### Week 16: Release Freeze & Documentation

**Focus**: Shipped v2.0 + operator clarity

| Task | Description | Deliverable |
|------|-------------|-------------|
| Bug sweep | Critical/zero-day fixes only | Stable tag |
| Operator runbooks | Provider down, quota exhaustion, rollback | `docs/` |
| API consumer docs | Auth, limits, exports, uncertainty semantics | Published |
| User-facing docs | Privacy alignment with actual retention | Site/docs |
| Launch checklist | Sign-off list | CHECKLIST |
| Pitch / metrics | Deck refreshed from analytics snapshots | Materials |

**End of Week 16**: **v2.0 production freeze** — conference-ready **and** maintainable

---

## Success Criteria

### Technical

| Metric | Target |
|--------|--------|
| EO independence | ≥3 independent families feeding fusion (e.g. S5P + MODIS AOD + VIIRS AOD; ERA5 separate layer) |
| Fallback | Proven in tests + staged drill |
| Model quality | Best-effort per region; **continental fallback** documented where sparse |
| API latency (p95) | < 500 ms cached hot paths where applicable |
| API | Versioned + keys + rate limits + uncertainty/degraded flags |
| Offline cities | Top-N pre-materialised + client packs (500 remains aspirational) |
| APK size | < 15 MB |
| PWA Lighthouse | Strong PWA score (≥ 90 ideal) |

### Distribution

| Platform | Target |
|----------|--------|
| PWA | Installable |
| Android | **≥2** of: Samsung / Huawei / Amazon / direct APK |

### Privacy & security

| Metric | Target |
|--------|--------|
| Transport | TLS everywhere |
| Location | Bucketed / minimised; policy matches implementation |
| Keys | Hashed at rest; institutional tier isolated |

---

## Free Infrastructure Stack

| Service | Purpose | Notes |
|---------|---------|-------|
| AWS EC2 / Azure / DO (student) | Backend | Pick **one** primary cloud |
| Vercel / similar | Frontend | As today |
| Upstash | Redis | Rate limit + cache |
| Cloudflare | CDN + DNS + SSL | As `docs/INFRASTRUCTURE.md` |
| GitHub Actions | CI/CD + scheduled jobs | |
| Colab / cloud notebook | Training bursts | |
| Sentry (student tier) | Errors | |
| UptimeRobot | Uptime | |

---

*Mframapa AI v2.0 Specification — **16-week production timeline***  
*Aligned with **`EXECUTION_PLAN_4MONTHS.md`***
