# Demo overrides — 4 Ghana pitch sites

**Gate:** `MFRAMAPA_DEMO_OVERRIDES=1`  
**Code:** `backend/api/demo_overrides.py` (wired in `/api/v1/predict` + `/api/v1/generate-insight`)

Only these four places are forced. Everyone else is unchanged.

AQI is elevated but not theatrical (no Hazardous / 185).

---

## Sites (exact)

| Place | Story | PM2.5 | AQI badge | Coords |
|-------|--------|------:|-----------|--------|
| **Manso** | Artisanal mining dust | **82** | Unhealthy | 5.0833, −1.8333 |
| **Nsuta** | Ghana Manganese Company | **71** | Unhealthy | 5.269, −1.973 |
| **Damongo** | Dusty road (Savannah) | **64** | Unhealthy | 9.083, −1.818 |
| **Kejetia** | Crowded market (Adum / Kumasi) | **52** | Unhealthy for Sensitive Groups | 6.6985, −1.6248 |

Search aliases: `manso`, `nsuta` / `gmc`, `damongo` / `damango`, `kejetia` / `adum`.  
Kumasi proper (6.69) does **not** steal Kejetia (6.70).

---

## What each City Detail should show

Weather is **August afternoon climatology** (~14:00) — pitch / field tests are in August.

| Place | Afternoon temp | Humidity | Factors emphasised | What to do (forced insight) |
|-------|---------------:|---------:|--------------------|-----------------------------|
| Manso | **29°C** (28.9) | ~84% | Dust · AOD · PM10 | Mining dust — stay indoors, cut outdoor work, cover face |
| Nsuta | **30°C** (29.8) | ~86% | Dust · AOD · PM10 | Manganese works — limit outdoor time, children indoors |
| Damongo | **30°C** (30.2) | ~81% | Dust · PM10 · AOD | Road dust — avoid roadside, cover face, short errands |
| Kejetia | **29°C** (28.5) | ~84% | Population · NO₂ · AOD | Market air — shorter open-air time for kids / chest conditions |

Uncertainty bands and factors are part of the same override payload so the screen stays coherent.

---

## Enable locally / for pitch window

```bash
# .env (API)
MFRAMAPA_DEMO_OVERRIDES=1
```

Restart the API. On **Render** (api.mframapa.live), set the same env var and redeploy — without it the apps hit the slow live path and can spin past the client timeout (“failed to load”).

**Local PWA against local API:**
```bash
# frontend-pwa
$env:VITE_DEV_API_TARGET="http://127.0.0.1:8000"
npm run dev
```

Search **Manso / Nsuta / Damongo / Kejetia** only for pitch screenshots.
