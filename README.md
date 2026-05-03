# Mframapa v2.0

**Satellite-Powered Air Quality Intelligence for Africa**

---

## Overview

This folder contains the v2.0 development plan for Mframapa:
- 20-week timeline (16 build + 4 testing)
- $0 monthly infrastructure cost
- Free app store distribution

---

## Documents

| File | Description |
|------|-------------|
| `SPEC.md` | Full specification with weekly breakdown |
| `CHECKLIST.md` | Task checklist for all 20 weeks |
| `mobile/STRUCTURE.md` | Mobile app architecture |
| `frontend-pwa/STRUCTURE.md` | PWA enhancement plan |
| `docs/STORES.md` | App store submission guide |
| `docs/INFRASTRUCTURE.md` | Free hosting setup |

---

## Timeline

| Phase | Weeks | Focus |
|-------|-------|-------|
| 1 | 1-5 | Data Infrastructure |
| 2 | 6-9 | ML Models |
| 3 | 10-12 | PWA |
| 4 | 13-16 | Mobile App |
| 5 | 17-20 | Testing & Cleanup |

---

## Budget

| Item | Cost |
|------|------|
| Infrastructure | $0/month |
| App stores | $0 |
| Optional: Google Play | $25 (one-time) |
| **Total** | **$0-25** |

---

## Distribution

| Platform | Fee | Status |
|----------|-----|--------|
| PWA | $0 | Week 12 |
| Samsung Galaxy Store | $0 | Week 15 |
| Huawei AppGallery | $0 | Week 16 |
| Direct APK | $0 | Week 16 |
| Amazon Appstore | $0 | Week 16 |

---

## Getting Started

1. Read `SPEC.md` for full plan
2. Use `CHECKLIST.md` to track progress
3. Refer to other docs as needed

---

## Commit Strategy

After completing each week:
```bash
git add .
git commit -m "v2.0: Complete Week N - [brief description]"
```

Example:
```bash
git commit -m "v2.0: Complete Week 1 - ERA5 connector and base architecture"
```

---

## Key Goals

1. **No placeholder data** - All features from real sources
2. **Regional models** - 12 models (6 regions × urban/rural)
3. **PWA + Mobile** - Reach 90%+ of African users for $0
4. **Offline-first** - Works without internet
5. **Conference-ready** - Stable demo for Denmark
