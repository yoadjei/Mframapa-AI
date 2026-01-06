# Mframapa AI: Backend Requirements

## API Endpoints Required

### 1. Core Prediction
| Endpoint | Method | Description |
|---|---|---|
| `/api/predict` | GET/POST | Returns PM2.5, AQI category, weather data for lat/lon |
| `/api/resolve-location` | GET | Geocodes city name → lat/lon (Africa-only) |
| `/api/health` | GET | System status check |

### 2. Gemini AI (NEW)
| Endpoint | Method | Description |
|---|---|---|
| `/api/translate-ui` | POST | Translates UI strings to target language |
| `/api/generate-insight` | POST | Generates 20-word contextual insight in user's language |

### 3. Community Reporting (NEW)
| Endpoint | Method | Description |
|---|---|---|
| `/api/report` | POST | Submit citizen air quality report |
| `/api/reports` | GET | Retrieve reports for a region (optional) |

---

## External Services & APIs

| Service | Purpose | Required? |
|---|---|---|
| **Sentinel Hub API** | Sentinel-5P NO2 data | ✅ Yes |
| **NASA Earthdata** | MERRA-2 AOD data | ✅ Yes |
| **Open-Meteo API** | Weather (temp, humidity, wind, pressure) | ✅ Yes (FREE) |
| **Google Gemini API** | Translation + AI insights | ✅ Yes |
| **Mapbox Geocoding** | City → Lat/Lon | ✅ Yes (or use Nominatim free) |

---

## Environment Variables (.env)

```env
# Satellite Data
SH_CLIENT_ID=your_sentinel_hub_client_id
SH_CLIENT_SECRET=your_sentinel_hub_client_secret
EARTHDATA_USERNAME=your_nasa_username
EARTHDATA_PASSWORD=your_nasa_password

# AI
GEMINI_API_KEY=your_gemini_api_key

# Geocoding (optional if using Nominatim)
MAPBOX_TOKEN=your_mapbox_token

# Ground Truth
OPENAQ_API_KEY=your_openaq_key
```

---

## Data Requirements

### Satellite Features (per prediction)
| Feature | Source | Unit |
|---|---|---|
| NO2 | Sentinel-5P | mol/m² |
| AOD | MERRA-2 | dimensionless |

### Weather Features (per prediction)
| Feature | Source | Unit |
|---|---|---|
| Temperature | Open-Meteo | °C |
| Humidity | Open-Meteo | % |
| Pressure | Open-Meteo | hPa |
| Wind Speed | Open-Meteo | km/h |

### Ground Truth (for model training)
- 425 stations across 29 African countries
- Stored in: `backend/data/ground_truth/*.csv`

---

## `/api/predict` Response Schema

```json
{
  "location": {
    "name": "Lagos",
    "lat": 6.5244,
    "lon": 3.3792,
    "country": "Nigeria"
  },
  "pm25": 85.2,
  "aqi_category": "Unhealthy",
  "weather": {
    "temperature": 31,
    "humidity": 78,
    "pressure": 1012,
    "wind_speed": 12
  },
  "factors": {
    "satellite_no2": 0.00042,
    "satellite_aod": 0.35
  },
  "timestamp": "2026-01-03T15:30:00Z"
}
```

---

## `/api/translate-ui` Request/Response

**Request:**
```json
{
  "strings": {
    "search_placeholder": "Search a city...",
    "aqi_good": "Good air quality"
  },
  "target_language": "sw"  // Swahili
}
```

**Response:**
```json
{
  "translations": {
    "search_placeholder": "Tafuta jiji...",
    "aqi_good": "Ubora mzuri wa hewa"
  }
}
```

---

## `/api/generate-insight` Request/Response

**Request:**
```json
{
  "pm25": 85,
  "aqi_category": "Unhealthy",
  "weather": {
    "wind_speed": 5,
    "humidity": 80
  },
  "language": "ha"  // Hausa
}
```

**Response:**
```json
{
  "insight": "Iska ba ta da kyau yau saboda rashin iska. A guji fita waje."
}
```

---

## `/api/report` Request Schema

```json
{
  "lat": 6.5244,
  "lon": 3.3792,
  "perceived_quality": "bad",  // "good" | "moderate" | "bad"
  "comment": "Burning smell from nearby dump",
  "timestamp": "2026-01-03T15:30:00Z"
}
```

---

## File Structure (Backend)

```
backend/
├── main.py                 # FastAPI app, routes
├── .env                    # Credentials
├── requirements.txt        # Dependencies
├── models/
│   ├── train_model.py      # XGBoost training script
│   └── universal_african_model.json  # Trained model
├── utils/
│   ├── geo.py              # Geocoding, Africa validation
│   ├── satellite.py        # Sentinel/Earthdata data fetcher
│   ├── weather.py          # Open-Meteo API (NEW)
│   └── gemini.py           # Gemini translation/insights (NEW)
├── data/
│   ├── ground_truth/       # OpenAQ CSVs
│   ├── space/              # NASA satellite CSVs
│   └── reports.csv         # Crowdsourced reports (NEW)
└── scripts/
    ├── harvest_ground.py   # OpenAQ data harvester
    └── satellite_data_pipeline.py  # NASA data harvester
```

---

## What Needs To Be Built (NEW)

| Component | Status |
|---|---|
| `utils/weather.py` - Open-Meteo integration | ❌ New |
| `utils/gemini.py` - Gemini API wrapper | ❌ New |
| `/api/translate-ui` endpoint | ❌ New |
| `/api/generate-insight` endpoint | ❌ New |
| `/api/report` endpoint | ❌ New |
| Update `/api/predict` to include weather | ⚠️ Modify |
