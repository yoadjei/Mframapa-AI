# Mframapa v2.0

**Satellite-powered air quality intelligence for Africa — production v2.0 roadmap**

---

## Overview

This folder defines **v2.0** delivery:

- **16-week (4-month)** timeline to a **full functioning** release (not a throwaway demo)
- **≤ USD 30** cash out-of-pocket; infra via **free tiers + GitHub Student Pack** credits
- **Multi-provider ingestion**, **regional ensemble ML**, **versioned API**, **PWA + Android**, **observability**

---

## Documents

| File | Description |
|------|-------------|
| **`EXECUTION_PLAN_4MONTHS.md`** | Scope contract: what ships vs what waits |
| **`SPEC.md`** | Week-by-week specification (16 weeks) |
| **`CHECKLIST.md`** | Executable weekly checklist |
| `docs/README.md` | Index of infra + store docs |
| `docs/STORES.md` | App store submission guide |
| `docs/INFRASTRUCTURE.md` | Hosting, data APIs, observability |
| `mobile/STRUCTURE.md` | Mobile app architecture |
| `frontend-pwa/STRUCTURE.md` | PWA enhancement plan |

**Authoritative order**: `EXECUTION_PLAN_4MONTHS.md` (scope) → `SPEC.md` (tasks) → `CHECKLIST.md` (tracking).

---

## Timeline

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1–4 | Data ingestion, MODIS+VIIRS+orchestrator, cache, API provenance metadata |
| 2 | 5–8 | Features (pop, elev, NDVI, lights, roads), regional ensemble, uncertainty |
| 3 | 9–12 | Versioned API, keys, limits, exports, batch, PWA offline |
| 4 | 13–16 | Android, ≥2 distribution paths, Sentry/uptime/analytics, freeze |

Testing and performance run **throughout**; Weeks **15–16** consolidate smoke tests, alerting, and docs.

---

## Budget

| Item | Cost |
|------|------|
| Infrastructure (target) | $0/month |
| App stores | $0 (Samsung, Huawei, Amazon, direct APK) |
| Optional: Google Play | $25 one-time |
| **Cash envelope** | **≤ $30 total** |

---

## Distribution

| Platform | Fee | Target week (see SPEC) |
|----------|-----|-------------------------|
| PWA | $0 | Through Phase 3 |
| Samsung Galaxy Store | $0 | Week 14 |
| Huawei / Amazon / GitHub Releases APK | $0 | Week 14 (**pick second path**) |
| Google Play | $25 | Optional |

---

## Getting Started

1. Read **`EXECUTION_PLAN_4MONTHS.md`** for scope boundaries  
2. Read **`SPEC.md`** for weekly deliverables  
3. Track execution in **`CHECKLIST.md`**  
4. Use **`docs/README.md`** → **`INFRASTRUCTURE.md`** / **`STORES.md`** for ops and releases  

---

## Commit Strategy

After completing each week:

```bash
git add .
git commit -m "v2.0: Complete Week N - [brief description]"
```

Example:

```bash
git commit -m "v2.0: Complete Week 4 - cache layer and API provenance fields"
```

---

## Key Goals

1. **Multi-source EO + ERA5** with orchestration, reliability scoring, and **tested** fallback  
2. **Regional ensemble** (12 models target: 6 regions × urban/rural) + **uncertainty** + anomaly hints  
3. **Versioned public API** — keys, rate limits, CSV/GeoJSON exports, batch contract  
4. **PWA + Android** — offline-capable, low-bandwidth-aware  
5. **Operations** — CI/CD, rollback runbook, Sentry, uptime, privacy-preserving analytics  
6. **Conference-ready** — Denmark / Young Entrepreneurs Track with a **maintainable** v2.0
