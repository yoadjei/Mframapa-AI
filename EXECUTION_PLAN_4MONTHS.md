# Mframapa AI v2.0 — Four-Month Production Plan

**Audience**: Young Entrepreneurs Track (partnerships, exhibitions, inclusion) — **the product itself is a full functioning v2.0**, not a disposable prototype.

**Constraints**

| Constraint | How we treat it |
| ---------- | ---------------- |
| **Timeline** | ~16 weeks (4 months) to **production-grade v2.0**: real ingestion, real models, real API + clients, observability, security baseline |
| **Team** | 2 developers, **shared ownership** of deploy, data health, and releases (see §6) |
| **Cash (≤ USD 30)** | Pay only what credits cannot cover (domain oddments, contingency). **Compute/storage** via free tiers + **GitHub Student Pack** credits (Azure, DigitalOcean, AWS student/new-account patterns, etc.) |

**Relationship to repo docs**: This plan **supersedes** the “demo-first” reading of earlier drafts. Use **`SPEC.md` / `CHECKLIST.md`** as task granularity; use **this file** as the **scope contract** for what v2.0 *is*.

---

## 1. What “full functioning v2.0” means

By end of Month 4 the system should satisfy **all** of the following:

1. **Live pipeline**: Scheduled + on-demand ingestion from **multiple independent providers**, not a single satellite SKU.
2. **Predictions**: **Regional models** + **ensemble inference** + **uncertainty** surfaced to clients (intervals or calibrated bands — not vibes).
3. **Resilience**: Documented **fallback chain**, **degraded-accuracy mode**, **automatic provider switching**, **reliability scoring**, **integration tests** that simulate provider failure.
4. **Persistence**: **Versioned** training snapshots + config; **cached** historical atmospheric fields sufficient for **offline / stale-network inference** on pre-materialised cities (and honest staleness).
5. **Product surfaces**: **Installable PWA** (offline-capable) + **Android app** on **at least one** free distribution channel (Samsung / Huawei / direct APK / GitHub Releases — per `docs/STORES.md`).
6. **API**: **Versioned** HTTP API, **rate limiting**, **API keys** (public vs institutional tiers implemented as **limits**, even if billing is manual at first).
7. **Trust UX**: **Per-result source attribution**, **uncertainty**, short **cause/context** copy where data supports it (not a research paper — but not empty marketing).
8. **Operations**: CI/CD, rollback path, monitoring + alerting, privacy-preserving **aggregated** analytics, documented **data retention** and location handling.

Anything that fails the above is **not optional polish** — it is core v2.0 unless explicitly listed in §3 as **not relevant soon**.

---

## 2. Architecture spine — four layers (unchanged truth)

Everything you ingest should roll up to:

| Layer | Role | v2.0 production content |
| ----- | ---- | ----------------------- |
| **A — Satellite / EO** | Spatial coverage where monitors are thin | **Sentinel-5P** (NO₂, aerosol index / UVAI as implemented) + **MODIS AOD** + **VIIRS AOD** (dual AOD for redundancy and fusion) |
| **B — Reanalysis / meteorology** | Gap filling, transport context, stability | **ERA5** (wind, humidity, PBLH, temperature; precip if you pull it). **Open-Meteo** as fast operational fallback for synoptic sanity / backup paths |
| **C — Proxies (land / activity)** | Physical plausibility + model stability | Population (**WorldPop/GPW**), **SRTM** elevation, **NDVI** (single consistent composite), **VIIRS night lights**, **OSM-derived road density** (zonal stats — exact tile pipeline optional) |
| **D — Calibration** | Accuracy and honesty | **OpenAQ** everywhere it exists; **AirQo** where you have agreement/access; explicit **low-confidence regions** in API + UI |

**Fusion rule**: Multiple overlapping datasets per prediction where cheap; **dynamic weighting** starts as **fixed weights + reliability multipliers**, evolves toward learned weights only if time permits in Month 4.

---

## 3. Drop list — **only** what is **not relevant soon**

Everything **not** in this section is **in scope for v2.0** within 4 months **as an ambition**; sequencing is in §7. If slip happens, you **cut leaf features** (e.g. extra export formats), not the spine in §2.

### 3.1 Drop / park (business model & buyer mismatch — not “soon”)

| Item | Why not soon |
| ---- | ------------- |
| **Insurer climate risk dashboards** (and similar bespoke vertical analytics SKUs) | Different sales cycle, compliance, and liability framing — not required to ship a credible AQ intelligence platform |
| **Heavy enterprise procurement artefacts** (full multi-tenant SOC2-style audit programme, formal external model audit) | You can ship **logs + transparency + methodology docs**; formal audit is later |
| **Paid commercial Earth observation APIs** (metered EO brokers) | Violates **$30 cash** unless donated credits; public science archives + Copernicus/NASA paths suffice for v2.0 |

### 3.2 Drop / park (science depth — not required to run production v2.0)

| Item | Why not soon |
| ---- | ------------- |
| **CALIPSO lidar vertical profiling** in the inference loop | High integration cost; revisit when vertical mixing is a named product module |
| **Online chemical transport models** (GEOS-Chem / CMAQ operations) | Research-grade ops; v2.0 uses **reanalysis + EO + proxies**, not running CTMs |
| **Hospital admissions / full GBD coupling** inside the live product | Use **WHO/GBD as citation + offline validation studies**, not nightly ETL |

### 3.3 Drop / park (platform extravagance — not soon)

| Item | Why not soon |
| ---- | ------------- |
| **Microservices explosion + multi-region active-active + edge inference fleet** | Ship **modular monolith** + **background workers** + CDN; edge comes when traffic justifies |
| **Multi-cloud mirror / on-prem appliance SKU** | Ship **Docker Compose / single VM + backups + restore runbook** first |

### 3.4 Drop / park (product surfaces — defer without blocking v2.0)

| Item | Why not soon |
| ---- | ------------- |
| **Apple App Store** as a commitment | **$99/year** breaks ultra-low cash posture unless funded later |
| **Conversational voice assistant / NLP SMS bot** | Expensive product surface; **SMS/WhatsApp alerts as templated notifications** can ship later via provider integration once messaging credentials exist |

### 3.5 Explicitly **not dropped** (included in v2.0 “soon relevant”)

These were previously over-pruned in demo-minded planning — they **stay**:

- Multi-source ingestion + redundancy + fallback hierarchy + graceful degradation  
- Reliability scoring per source + degraded input detection + fallback ensemble behaviour  
- Temporal handling for missing satellite days + baseline climatology + simple spatiotemporal smoothing for sparse cells  
- Separate **training dataset builds** from **live inference features** (logical separation + version pins)  
- **ERA5** primary reanalysis; optional **CAMS** if Copernicus access is already stable (secondary — not instead of ERA5)  
- **Ensemble** models (e.g. XGBoost + LightGBM) + **uncertainty** in API  
- **Anomaly / spike flags** (rule + residual based is enough)  
- Feature stack: **AOD fusion**, **wind/PBLH/humidity**, **NDVI**, **night lights**, **population**, **roads**, **elevation**  
- **Public API** + **institutional tier** (limits/keys), **versioned routes**, **usage accounting**, exports (**CSV + GeoJSON** minimum; NetCDF if cheap)  
- **PWA** install + offline + compression + lazy map loading + manual city  
- **Android** distribution via free channels  
- **CI/CD**, **automated rollback discipline**, **monitoring**, **load smoke tests**  
- **Security baseline**: TLS, secret management, hashed API keys, coarse RBAC, anonymised analytics buckets  
- **Analytics** (merged duplicate backlog themes): adoption, retention cohorts, peak query times, geo density aggregates, feature usage — **aggregates only**  
- **Freemium technical shape**: enforce via **rate limits + keys** even if payment rails are manual  

Optional **fast-follow** immediately after Month 4 if keys exist: WhatsApp/SMS alert delivery (templates), lightweight SDK examples (Python/JS snippets in docs counts as v2.0-adjacent).

---

## 4. Dataset catalogue — production v2.0 vs later

### 4.1 Ingest for v2.0 (Months 1–2 foundation, expanded through Month 3)

**Satellite / atmosphere**

- Sentinel-5P TROPOMI (NO₂, aerosol index / UVAI per capability)
- MODIS AOD (Terra/Aqua strategy per NASA Earthdata constraints)
- VIIRS AOD
- ERA5 (wind u/v, humidity, PBLH, temperature; add precip when pipeline stable)

**Land / proxies**

- NDVI (MODIS composite recommended)
- VIIRS DNB night lights (monthly composite acceptable at first)
- WorldPop or GPW population density
- SRTM elevation
- OSM road density via regional aggregates

**Ground calibration**

- OpenAQ PM2.5/PM10 where available
- AirQo if legally and technically accessible

**Training artefacts (internal)**

- Satellite–station matched pairs table(s), versioned  
- Cached historical pulls for replay/offline inference batches  

### 4.2 Later (post-v2.0.x — not blocking launch)

- CAMS reanalysis as alternate atmospheric prior  
- MERRA-2 redundancy  
- Agricultural burning / fire radiative power fused into **indices** beyond hotspot badges  
- Wildfire / dust / flood / heat stress as **separate risk modules** with their own validation harness  

---

## 5. Engineering pillars (map to your backlog clusters)

| Pillar | Backlog themes covered | v2.0 delivery |
| ------ | ------------------------ | ------------- |
| **Ingestion & orchestration** | 1–20, 141–160, 211–215 | Provider adapters, queues for heavy pulls, circuit breakers, reliability scores, stored raw-ish derivatives for replay |
| **ML** | 21–40, 158–159 | Regional models (target **SPEC**: 6 regions × urban/rural — if label poverty bites, ship **6 region models** first and add urban/rural split in Month 3–4), ensemble, uncertainty, anomaly flags, retraining job + drift heuristics |
| **API & integrations** | 81–90 | Versioned API, keys, limits, usage logs, exports, optional batch endpoint |
| **Clients** | 61–80, 181–210 | PWA + Android; low-bandwidth paths; offline last-known; accessibility and plain-language outputs |
| **Infra & reliability** | 111–120, 191–200 | Monolith + workers + Redis/cache + CDN; CI/CD; backups; observability; synthetic failure tests for ingestion |
| **Privacy & security** | 121–130 | TLS, secrets, location bucketing, retention policy, abuse-resistant rate limits |
| **Analytics & growth instrumentation** | 41–50 + 131–140 (merged) | One pipeline: aggregates, cohort views in internal dashboard |
| **Policy alignment (non-blocking builds)** | 101–110 | SDG/NDC/WHO framing in copy + metadata — **not** a policy scenario solver in v2.0 |

---

## 6. Two developers — shared duties (production discipline)

### 6.1 Roles (flex 70/30 weekly)

| Domain | Primary | Secondary |
| ------ | ------- | --------- |
| Ingestion orchestration, reliability scoring, cache/versioning | Dev A | Dev B |
| ML training/retrain, evaluation harness, model registry | Dev A | Dev B |
| PWA + Android UX, performance, accessibility | Dev B | Dev A |
| API (versioning, keys, limits), exports, docs | Rotate odd/even weeks | Rotate |
| Infra (CI/CD, secrets, monitoring), incident runbooks | Rotate odd/even weeks | Rotate |

### 6.2 Non-negotiables

- **OpenAPI** (or equivalent) is the contract — clients never chase informal JSON drift  
- **Tagged releases** + **rollback** tested at least twice before Month 4  
- **Synthetic failure tests** for at least **two** upstream providers  
- **On-call lite**: whoever merged last owns fires until handed off explicitly  

### 6.3 Cadence

- Daily 15m unblock standup  
- Weekly ingestion health review (success rates, freshness, cost/quota)  
- Bi-weekly release candidate  

---

## 7. Sixteen-week schedule — production outcomes by week

### Month 1 — Ingestion factory + resilience

| Week | Deliverables |
| ---- | ------------ |
| **W1** | Deploy baseline; secrets; **ERA5** ingestion job(s); structured logging; CDS/NASA accounts wired |
| **W2** | **Sentinel-5P** adapter; retries/backoff; normalised internal schema |
| **W3** | **MODIS AOD** + **VIIRS AOD** adapters; **orchestrator**; **fallback ladder**; **reliability scoring** persisted |
| **W4** | **Redis/Upstash** + disk fallback cache; **historical cache** job for top-N cities; API returns **`sources_used[]`, `freshness`, `degraded` flags** |

**Month 1 exit**: Multi-provider ingestion + orchestration + caching + transparent metadata in API responses.

### Month 2 — Features + training pipeline + models in production path

| Week | Deliverables |
| ---- | ------------ |
| **W5** | Feature pipeline: pop, elev, NDVI, night lights, OSM road density zonal stats; join to labels |
| **W6** | **Temporal gap fill** for missing EO days + **climatology baseline** features + smoothing pass for sparse tiles |
| **W7** | Train **regional models v1** + export to registry; **ensemble** wiring (two GBDTs minimum); **evaluation notebook → CI artefact** |
| **W8** | **Uncertainty** in API; **anomaly flag** (residual / z-score hybrid acceptable); **feature importance logging** batch |

**Month 2 exit**: End-to-end train → register → serve with uncertainty + anomaly hints.

### Month 3 — Product hardening + API maturity + separation of concerns

| Week | Deliverables |
| ---- | ------------ |
| **W9** | **API versioning** (`/v1/...`), **keys**, **rate limits**, usage persistence; **CSV + GeoJSON** export paths |
| **W10** | **Batch query** endpoint (async job + poll) *or* chunked synchronous with strict caps — pick one and document |
| **W11** | **Retraining automation** (scheduled GitHub Action or worker cron) + **drift heuristic** (feature stats / residual MAE creep) |
| **W12** | **PWA**: manifest, SW, offline bundles for city packs; compression; lazy map; manual city; dark/low-power theme |

**Month 3 exit**: External-ready API shape + resilient web client patterns.

### Month 4 — Android + observability + analytics + launch readiness

| Week | Deliverables |
| ---- | ------------ |
| **W13** | **Expo/Android** integrated with same API contract; MMKV/offline mirroring |
| **W14** | Store submissions **Samsung + Huawei** *and/or* **signed APK + GitHub Releases** — minimum two install paths live |
| **W15** | **Sentry** + uptime checks + structured dashboards; **privacy-preserving analytics** (internal); **load smoke test** script |
| **W16** | **Freeze**, docs (operator + API consumer), **runbooks** (provider down, quota exhaustion, rollback). Conference-ready **but product is not demo-only** |

**Month 4 exit**: Operators can run it; users can install it; partners can call a documented API.

---

## 8. Definition of Done — v2.0 production (not “demo checklist”)

### Data & ML

- [ ] ≥ **3** independent EO/atmosphere families feeding fusion (S5P + MODIS AOD + VIIRS AOD counts toward redundancy; ERA5 is separate layer)  
- [ ] Fallback executes automatically on provider failure in tests **and** has been observed in staging drill  
- [ ] Regional ensemble deployed with **model version** + **training data slice ID** in logs  
- [ ] Uncertainty and degradation visible in **API + UI**  

### API & clients

- [ ] Versioned endpoints; keys; limits; abuse protection  
- [ ] PWA installable + offline behaviour defined and tested  
- [ ] Android artefact available through agreed channels  

### Ops & trust

- [ ] CI/CD deploy path + documented rollback  
- [ ] Monitoring + paging/email alerts on critical failures  
- [ ] Privacy policy aligned with actual retention (no precise GPS history unless explicitly justified)  

---

## 9. Budget ≤ USD 30 — production on student rails

| Spend bucket | Guidance |
| ------------ | -------- |
| Domains | Avoid new purchases; use existing assets |
| Play Console ($25) | Only if you consciously prioritise Google Play over contingency |
| SSL/CDN | $0 via Cloudflare / Let’s Encrypt patterns |
| Compute | Student credits + Always-Free migration plan documented before AWS cliff |
| Paid datasets | None on cash budget |

**GitHub Student Pack** (excluding `.me` / `.tech` per your preference): prioritise **Codespaces**, **Actions**, **Azure credit**, **DigitalOcean credit**, **Sentry**, **one** of Datadog/New Relic — same guidance as prior revision, but framed as **production tooling**, not demos.

---

## 10. Risk register (production-minded)

| Risk | Mitigation |
| ---- | ---------- |
| Quota / outage at Copernicus or NASA | Multi-provider AOD + ERA5 + cached replay + staged backoff |
| Label sparsity breaks regionalisation | Fallback **continental ensemble** with explicit uncertainty inflation in weak regions |
| Team overload | Cut **leaf** exports/UI extras — never cut orchestration, versioning, or transparency |
| Credit exhaustion | Single primary cloud + billing alarms + documented cold migrate |

---

## 11. After v2.0 launch (first 60 days) — not “never”

- Scenario tooling for NDC-style reporting  
- WhatsApp/SMS institutional alert packs  
- Dedicated Python/JS SDK packages  
- Secondary reanalysis (CAMS/MERRA)  
- Hazard modules (wildfire/dust/flood/heat) as separate validated layers  

---

*Document version*: **2.0 — production v2.0 scope for 16 weeks / 2 developers / ≤ $30 cash**, dropping **only** §3 items as not relevant soon.

**Synced artefacts**: Weekly execution detail lives in **`SPEC.md`**; track completion in **`CHECKLIST.md`** (`README.md` summarises doc order).
