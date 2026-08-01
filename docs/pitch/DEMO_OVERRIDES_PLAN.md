# Demo overrides + continental mock AQ

**Gates**
- `MFRAMAPA_DEMO_OVERRIDES=1` — exact 4 Ghana pitch sites **and** continent-wide spatial mock
- `MFRAMAPA_MOCK_AQ=1` — spatial mock only (no forced 4-site pinpoints)

**Code**
- `backend/api/demo_overrides.py` — Manso / Nsuta / Damongo / Kejetia exact payloads
- `backend/api/mock_aq.py` — spatial field for any Africa lat/lon
- Wired in `/api/v1/predict`, `/api/v1/generate-insight`, `/api/v1/map-summary`

This is **not** live street-sensor data. It is a believable pitch/demo field: high near mining, industry, dense urban, markets, dusty roads, oil/gas; lower in remote countryside.

---

## Four Ghana pitch sites (exact)

| Place | Story | PM2.5 | AQI badge | Coords |
|-------|--------|------:|-----------|--------|
| **Manso** | Artisanal mining dust | **82** | Unhealthy | 5.0833, −1.8333 |
| **Nsuta** | Ghana Manganese Company | **71** | Unhealthy | 5.269, −1.973 |
| **Damongo** | Dusty road (Savannah) | **64** | Unhealthy | 9.083, −1.818 |
| **Kejetia** | Crowded market (Adum / Kumasi) | **52** | Unhealthy for Sensitive Groups | 6.6985, −1.6248 |

Search aliases: `manso`, `nsuta` / `gmc`, `damongo` / `damango`, `kejetia` / `adum`.  
Kumasi proper (6.69) does **not** steal Kejetia (6.70).

---

## Spatial mock (rest of Africa)

Gaussian kernels around curated prone sites (Highveld coal belt, Copperbelt, Lagos, Niger Delta, Cairo, Accra/Tema, etc.) plus a soft Sahel dust band and a clean rural baseline. Cap stays in Unhealthy — no theatrical Hazardous.

**Map vs search:** map-summary keeps ~**200** major dots. Search / city pack uses the full ~**1000** named places with baked **usual** Aug–Dec afternoon temp, humidity, and typical AQI (UI picks the current month; live predict only when you open a city).

---

## Enable locally / for pitch window

```bash
# .env (API)
MFRAMAPA_DEMO_OVERRIDES=1
```

Restart the API. On **Render** (api.mframapa.live), set the same env var and redeploy — without it the apps hit the slow live path and can spin past the client timeout.

**Local PWA against local API:**
```bash
# frontend-pwa
$env:VITE_DEV_API_TARGET="http://127.0.0.1:8000"
npm run dev
```
