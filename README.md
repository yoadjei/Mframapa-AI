# Mframapa v2.0

**Satellite-powered air quality intelligence for Africa — full vision, 12-week build**

---

## Project Status

All code is **scaffolded but not yet tested, trained, or deployed**.

| Phase | Weeks | Status |
|-------|-------|--------|
| 1 — Data foundation | 1–2 | ⬜ Not started (code scaffolded) |
| 2 — ML pipeline & models | 3–4 | ⬜ Not started (code scaffolded) |
| 3 — Design system & web core | 5–7 | ⬜ Not started (partial scaffolds) |
| 4 — Offline, mobile & enterprise | 8–9 | ⬜ Not started (mobile scaffolded) |
| 5 — Monetisation, developer & community | 10–11 | ⬜ Not started |
| 6 — Distribution & launch | 12 | ⬜ Not started |

---

## Documents

| File | Description |
|------|-------------|
| **`EXECUTION_PLAN.md`** | Scope contract: full vision, 12-week timeline, priorities, cut order |
| **`SPEC.md`** | Week-by-week detailed specification |
| **`CHECKLIST.md`** | Executable weekly checklist with progress tracking |
| `frontend-pwa/STRUCTURE.md` | PWA architecture and file layout |
| `mobile/STRUCTURE.md` | Mobile app architecture and file layout |

**Authoritative order**: `EXECUTION_PLAN.md` (scope) → `SPEC.md` (tasks) → `CHECKLIST.md` (tracking).

---

## Quick Start

```bash
# Backend
.\venv\Scripts\Activate.ps1       # Windows
uvicorn backend.api.app:app --reload --host 127.0.0.1 --port 8000
pytest backend/tests -q
python live_test.py               # E2E test (needs .env credentials)

# Frontend PWA
cd frontend-pwa && npm install && npm run dev

# Mobile
cd mobile && npm install && npx expo start

# ML
python -m ml.training west_africa urban
```

---

## Budget

| Item | Cost |
|------|------|
| Infrastructure | $0/month (free tiers) |
| App stores | $0 (Samsung, Huawei, Amazon, APK) |
| Optional: Google Play | $25 |
| **Total** | **≤ $30** |

---

## Key Goals

1. **Multi-source satellite data** with tested orchestration and fallback
2. **12 regional ML models** with ensemble + uncertainty + anomaly detection
3. **Intelligence platform** — not just data display; insights, health scoring, predictions, trends
4. **Enterprise dashboards** — organisation accounts, regional analytics, command centre layouts
5. **Monetisation** — Free / Pro / Enterprise tiers with technical enforcement
6. **PWA + Android** — offline-capable, responsive 320px → 2560px+, accessible (WCAG AA)
7. **Developer portal** — API docs, key management, dataset exports
8. **Community** — citizen reporting, environmental submissions
