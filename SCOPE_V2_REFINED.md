# Mframapa AI — Refined Scope, Positioning & Execution Directive

**Status:** Supersedes conflicting guidance in EXECUTION_PLAN_4MONTHS.md, SPEC.md and the startup brief where they disagree.
**Fixed constraints:** 2 developers, ≤ USD 30 total budget, pitch at Digital Tech Summit Copenhagen (November 2026, Young Entrepreneurs track), launch September 2026.
**Purpose:** Single source of truth for any AI agent or contributor working on this project. Read fully before touching code, copy, or pitch material.

---

## 1. The Strategic Reframe (Read First)

The original thesis — "1.4 billion Africans habitually check an AQI app" — is the weak limb of this project and has been cut. Ambient air quality checking has poor retention everywhere, and it is worse where users have no agency (no purifiers, no alternative commutes, no sealed housing). Information without a decision attached gets deleted.

**The product is now episodic alerts, delivered through intermediaries, backed by an app.**

- **Episodic:** Harmattan onset, Saharan dust intrusions, biomass burning season, urban inversion episodes. During episodes, users CAN act: keep the asthmatic child indoors, reschedule outdoor events, prepare medication, move school break times. Episodes are also large-signal, regional-scale phenomena — exactly what satellites measure well, and exactly where a city-scale daily model is sufficient. This reframe simultaneously fixes retention, agency, and the accuracy problem.
- **Intermediaries:** Schools, clinics, asthma/COPD patients, outdoor employers, and radio stations. Radio reaches more Africans than smartphones. One "morning air quality forecast powered by Mframapa" radio partnership beats ten thousand passive installs.
- **App as backend:** The PWA and mobile app remain, repositioned as the detail layer behind the alert, and as the demo surface for the pitch.

Everything below serves this reframe.

---

## 2. What Leaves — Complete Cut List

### 2.1 Product / positioning cuts

| Item | Why it leaves |
|---|---|
| Three-tier Free/Pro/Enterprise structure | Predictions and health risk behind Pro contradicts the mission and is incoherent (every number the system produces IS a prediction — a "basic AQI" free tier is either secretly serving predictions or serving raw OpenMeteo passthrough). Revert to two tiers: see §5. |
| "Free forever, no subscriptions" claim | False under any paid tier. Replace with: "Free for every individual, forever. Institutions fund it." |
| "Real-time" and "any location / hyperlocal" language | Sentinel-5P overpasses once daily (~13:30 local); ERA5 pixels are ~31 km. The honest product is a city-scale daily estimate + episode forecasting. Pitch it as that. One probing question destroys the hyperlocal claim. |
| The 1.1M deaths/year headline as stated | A large share is HOUSEHOLD air pollution (indoor cooking smoke), which satellites cannot see and the product does not address. Verify the ambient-only GBD figure and use only that, explicitly labelled "outdoor/ambient". |
| "12 regional models" as a promise | README already mandates continental-first. On stage and in copy: "continental model, regional specialisation on the roadmap." Never promise untrained models. |
| `/generate-insight` marketed as "AI insights" | It is five hardcoded sentences. Either rename honestly (e.g. `/health-guidance`) or wire a real generation path. Never demo it as AI. |
| 27-languages claim without native review | If translations are machine-generated, one native speaker finding garbled health guidance converts a differentiator into a liability. Only claim languages that have passed native-speaker review; state the reviewed count. |
| Consumer growth targets (installs across Africa) | Replaced by concentrated Ghana launch with retention metrics. See §7. |

### 2.2 Pitch cuts

- All stack detail (FastAPI, XGBoost, Redis, Upstash, Expo). Juries do not care.
- Feature tours (dark mode, saved cities, map view).
- Any accuracy or coverage claim not backed by the held-out benchmark (§4.6).
- Presenting the papers — present the FACT of them, one line, one slide.
- Pitching with no ask. Close with a concrete non-monetary ask (§8.4).

### 2.3 Codebase cuts / de-scopes (pre-November)

- **Feature freeze after inference is wired (September).** Community hub, historical playback, city comparison: frozen. They do not move a jury; retention curves do.
- Remove MODIS connector (VIIRS duplicates it; HDF4 dependency).
- Remove CSV/GeoJSON from `/predict` (move to batch endpoint, institutional tier).
- Consolidate SPEC.md + CHECKLIST.md + EXECUTION_PLAN into one plan document (this file's companion).
- ERA5 excluded from realtime path (training only) — already documented, enforce it.

---

## 3. What Stays / What Must Be Built

### 3.1 Must-fix engineering checklist (from README §15, unchanged and mandatory)

1. Wire real model inference into `/predict` (`backend/ml/inference.py`, startup hook, in-memory bundle cache).
2. OpenMeteo sanity check: divergence > 5× → flag degraded, blend.
3. Fix pipeline schema mapping (pipeline columns → `ml/features.py` FEATURE_COLUMNS).
4. Add satellite enrichment (SO2, CO, PM10, elevation) to pipeline.
5. Fix pipeline config: `.env` path, `FETCH_START_DATE=2020-01-01`.
6. Redis sliding-window rate limiter (replace in-memory).
7. API keys to env vars; delete hardcoded `mframapa-internal-dev-key`.
8. CORS lockdown to real domains.
9. Real health check (Redis, models, OpenMeteo).
10. Request tracing middleware (X-Request-ID, response time).
11. Wire CachedOrchestrator into FeaturePipeline.
12. Async concurrent source fetching.
13. Privacy policy page (store requirement).

### 3.2 New build items (from the reframe)

| Item | Spec | Priority |
|---|---|---|
| **Episode/anomaly alert engine** | Detect regional PM2.5 episodes (forecast + threshold crossing, e.g. sustained AQI category jump over a region). Push notification: "Dust episode expected from <date>, ~<n> days." This is now the core product loop. | P0 |
| **Push notifications** | Expo push for mobile; web push for PWA. Free tier includes alerts (alerts are the product — never paywall them for individuals). | P0 |
| **Radio partner brief** | One-page daily forecast digest per city (auto-generated from API) that a radio presenter can read out. Text/email delivery. Near-zero engineering; enormous distribution leverage. | P1 |
| **Benchmark harness** | Reproducible script: same held-out stations, MAE/RMSE/R² for Mframapa vs OpenMeteo/CAMS. Output = the pitch slide and the third paper (§9.1). | P0 |
| **Analytics instrumentation** | Installs, WAU, D7/D30 retention, geography, alert open rate. From day one of September launch. | P0 |

---

## 4. ML Training Directives (Non-Negotiable)

1. **Split by station, never by row.** Random row splits leak spatial autocorrelation and produce fake R². Validation stations must be fully held out, spread across regions. Add a temporal holdout (train 2020–2024, test 2025–2026).
2. **Do not drop rows with missing satellite values.** Tropical cloud cover kills 30–60% of Sentinel-5P/VIIRS retrievals. XGBoost/LightGBM handle NaN natively; inference faces the same gaps, so train with them present.
3. **`pm10_surface` is a contamination risk.** OpenMeteo PM10 is CAMS output, correlated with CAMS PM2.5; including it risks the model learning to copy CAMS, hollowing the "we beat the global models" claim. Train two variants (with/without). If the without-variant holds on held-out stations, ship that one and pitch on it.
4. **Report per-region error and expect geographic bias.** South Africa + a few cities dominate the station network. Consider sample weighting. Conformal intervals must widen honestly in weak regions.
5. **QA the OpenAQ pull:** negative values, stuck sensors (identical repeated readings), unit inconsistencies, cross-aggregator duplicates. Colocate at daily-mean resolution (single daily satellite overpass makes hourly matching fiction).
6. **Continental model first.** Regional bundles only where >2,000 rows AND regional beats continental on that region's holdout. Expect tens of thousands of station-days after QA — enough for continental, thin for regional.
7. **The benchmark run is the deliverable.** If the model does not beat OpenMeteo/CAMS on held-out African stations, iterate in August. Do not discover this in November.
8. **Paper consistency check:** published results must match what the November model shows. A discrepancy between paper and pitch is worse than either alone.

---

## 5. Tier Structure (Final)

| Tier | Contents | Price |
|---|---|---|
| **Individual (Free, forever)** | AQI, predictions, health guidance, episode alerts, all reviewed languages, offline cache. Everything health-relevant. Never gated. | $0 |
| **Institutional** | API access, batch predict, exports (CSV/GeoJSON), Africa heatmap, country explorer, anomaly alert feeds, SLA-ish support. | Manual invoicing / grants |

Optional cosmetic Pro tier (historical playback, city comparison, community hub) may exist later but is out of scope pre-November. **Rule: health-critical information is never paywalled for individuals.** Internal honesty: near-term revenue is grants and institutional pilots; the freemium machinery exists so monetisation can switch on without re-architecture.

---

## 6. Validation Strategy Beyond the Benchmark

The core epistemic weakness: the product claims accuracy precisely where nobody can check (unmonitored areas), validated only where monitors exist (urban, biased). Mitigations, in order of value:

1. **Deploy ground truth where none exists.** Partner with a university or an AirQo-style network to place ~5 low-cost sensors in currently unmonitored areas; measure model error against them. Converts "we extrapolate and hope" into "we deployed ground truth and measured." Also = the third paper.
2. **Honest uncertainty.** Conformal intervals surfaced in every response and in the UI. "We tell you what we know and how sure we are" is a differentiator; most competitors show naked point estimates.
3. **Episode-level validation.** Episodes are regionally coherent; a correct harmattan-onset call is verifiable against multiple stations and satellite AOD simultaneously, and is the accuracy claim the product actually depends on.

---

## 7. Timeline (Backwards from Harmattan)

West African harmattan begins late November — during or immediately after the pitch. Plan backwards from it, not forwards from the codebase.

| Window | Deliverables |
|---|---|
| **Now → end August** | Pipeline fixes; full 2020–present data pull; QA; continental model trained; benchmark run complete; papers cross-checked against results. |
| **September** | Inference wired; alerts engine live; security fixes done; analytics in; **launch Ghana only** (PWA + Samsung Store + Huawei AppGallery + direct APK — ≥2 channels). Concentrated density beats thin continental spread: target one city's worth of real users and one human story (a school, a clinic, an asthmatic parent). |
| **October** | Feature freeze holds. Users, retention data, radio partnership, one institutional LOI (Ghana EPA / university / NGO), sensor-deployment partner conversation, press outreach (§9.3), Copernicus programme applications (§9.2). |
| **Early November** | Rehearse relentlessly (Danish teams will be rehearsed; delivery is where home advantage is real). Pre-cache the live demo location. Pitch during harmattan onset — demo genuinely bad air over Accra/Kano live, alerts going out that week. |

---

## 8. Pitch Architecture (Copenhagen, November)

### 8.1 The narrative spine

**"European satellite infrastructure, built with European taxpayer money, turned into life-saving health alerts for Africa by a two-person Ghanaian team on a $30 budget."** Copernicus/ESA data + Ghanaian founders + health impact is a made-for-this-room story. Open or close with it.

### 8.2 The seven slides that matter (one number each)

1. Ambient air pollution death toll (verified GBD outdoor-only figure) vs a familiar comparator.
2. ~100 monitors for 1.4 billion people (vs ~4,000 for 330M in the US).
3. **Live demo:** a point hundreds of km from any monitor → prediction + uncertainty interval → "there is no sensor within 500 km of this spot." The thesis in ten seconds. Local cache as fallback.
4. **The benchmark:** held-out station MAE vs OpenMeteo/CAMS, side by side. The slide that separates you from vapourware.
5. Credibility line: "Methodology peer-reviewed and published, including IEEE." One line. Do not present the papers.
6. Traction: September→November curve — users, D30 retention, alert open rate, the radio partnership, the human story.
7. Model: "Free for every individual, forever; institutions fund it" + the LOI.

### 8.3 Q&A ammunition (pre-written honest answers)

- *"How do you know you're right where nobody can check?"* → per-region holdout error + conformal intervals + the sensor deployment plan/result.
- *"Why won't Google do this?"* → they could; they won't — no purchasing power in the market is the uncomfortable, real moat. Speed, languages, radio, and local trust are the head start. Say it plainly; juries respect it.
- *"What can a user actually DO with this?"* → the episodic-alert answer: decisions exist during episodes (children, medication, scheduling). This is why the product is alerts, not ambient checking.
- *"Resolution/real-time?"* → city-scale daily + episode forecasting, stated up front, so the question never lands.
- *"Two students, who maintains this?"* → named academic/institutional advisor if secured (do this — a single named atmospheric scientist neutralises the credibility gap).

### 8.4 The ask

Non-monetary, concrete: **"We're looking for institutional pilot partners and introductions into EU–Africa digital health and space cooperation programmes."** Gives judges who like the project something to do about it.

### 8.5 Competitive field notes

No team in the field does air quality — the lane is owned. Main threats: EchoReach and Ally (Danish, polished, home networks) and Layn (hardware wow-factor). Counter with impact scale + the Copernicus narrative + real traction. Kasayie is the other Ghana team: keep the stories distinct (theirs clinical speech AI; ours environmental health at continental scale).

---

## 9. Publishing & Visibility Plan

### 9.1 Academic

- **Third paper = the public benchmark:** satellite-ML PM2.5 models vs African ground stations — Mframapa, CAMS, OpenMeteo, same held-out set, dataset released openly (Zenodo). Whoever publishes the benchmark becomes the citation everyone else must use. Targets: Environmental Research Letters, Atmospheric Environment, plus IEEE venues.
- Fourth paper (post-sensor-deployment): validation in previously unmonitored areas.

### 9.2 The Copernicus machine

ESA/EU actively showcase downstream Copernicus applications: success-story programmes, Copernicus Masters, EU–Africa space cooperation initiatives. Apply to everything with "Copernicus" in the name before November. Arriving in Copenhagen already featured by the EU's own space programme changes how the room reads the team.

### 9.3 Press

Pitch in September–October, pegged to launch + harmattan: **Rest of World** (exists to cover exactly this, read by exactly the right funders), TechCabal, Space in Africa, university press office. The sellable angle: peer-reviewed science, sensors deployed where none existed, radio partnership, $30 budget.

### 9.4 Open source strategy

Open: the benchmark + dataset, region definitions, training pipeline. Closed: trained model weights, the apps. Credibility of open science without handing competitors the product.

---

## 10. Standing Rules for Any Agent on This Project

1. No claim in code, copy, or pitch material that the benchmark or a paper cannot back.
2. Health-critical information is never paywalled for individuals.
3. Continental model before regional; never reference untrained models as existing.
4. Station-level holdout is the only acceptable validation split.
5. Feature freeze from October 1 to post-pitch; only bug fixes and pitch-critical work.
6. Every external number (deaths, monitor counts, market share) is verified against the primary source before publication.
7. When this document conflicts with older planning docs, this document wins.
