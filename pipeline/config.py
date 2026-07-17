"""
config.py - central configuration for the data pipeline

all settings for date ranges, paths, API rate limits, exact training schema,
and QA thresholds live here.
"""

import os
from pathlib import Path
from datetime import date
from dotenv import load_dotenv

# project root
PROJECT_ROOT = Path(__file__).parent.parent

# Load the project-level environment used by every backend component.
load_dotenv(PROJECT_ROOT / ".env")

# ---------------------------------------------------------------------------
# DATE RANGE — what period of new data to pull
# ---------------------------------------------------------------------------
FETCH_START_DATE = "2020-01-01"
FETCH_END_DATE = date.today().isoformat()

# ---------------------------------------------------------------------------
# FILE PATHS
# ---------------------------------------------------------------------------
PIPELINE_DATA_DIR = Path(__file__).parent / "data"
OUTPUT_DIR = Path(__file__).parent / "output"
CHECKPOINT_DIR = PIPELINE_DATA_DIR / "checkpoints"
STATION_INVENTORY_FILE = PIPELINE_DATA_DIR / "station_inventory.csv"

# intermediate files
RAW_OPENAQ_FILE = PIPELINE_DATA_DIR / "openaq_raw.csv"
ENRICHED_FILE = PIPELINE_DATA_DIR / "enriched_station_days.csv"
QA_FILE = PIPELINE_DATA_DIR / "qa_station_days.csv"
# optional real satellite (sentinel-5p / modis maiac) columns from google earth engine;
# enrich_satellite overlays these onto the cams columns when present. see enrich_gee.py.
GEE_SATELLITE_FILE = PIPELINE_DATA_DIR / "gee_satellite.csv"

# final output
TRAINING_DATASET_FILE = OUTPUT_DIR / "training_dataset.csv"

# ---------------------------------------------------------------------------
# Exact output schema from docs/TRAINING_DATASET_SCHEMA.csv.
# ---------------------------------------------------------------------------
TRAINING_COLUMNS = [
    "date", "station_id", "location", "country", "lat", "lon", "region_id", "segment",
    "pm25_surface", "pblh", "temperature_2m", "relative_humidity",
    "u_component_of_wind_10m", "v_component_of_wind_10m", "no2_tropospheric_column",
    "aerosol_optical_depth", "so2_total_column", "co_total_column", "pm10_surface",
    "population_density", "elevation", "openmeteo_pm25", "n_obs_pm25", "pm25_source",
    "aod_source", "qa_flag", "imputed_fields", "pulled_at_utc",
]

# ---------------------------------------------------------------------------
# OpenAQ API v3
# ---------------------------------------------------------------------------
OPENAQ_BASE_URL = "https://api.openaq.org/v3"
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")  # loaded from backend/.env

# 29 african countries: ISO code -> OpenAQ v3 numeric country ID
# (discovered via https://api.openaq.org/v3/countries)
AFRICAN_COUNTRIES = {
    "BF": 150, "CD": 32,  "CI": 96,  "CM": 147, "CV": 222,
    "DZ": 122, "EG": 162, "ET": 14,  "GH": 152, "GM": 166,
    "GN": 83,  "KE": 17,  "LR": 84,  "MA": 27,  "MG": 182,
    "ML": 98,  "MU": 219, "MW": 18,  "MZ": 123, "NG": 100,
    "RW": 126, "SD": 86,  "SN": 99,  "TD": 115, "TN": 73,
    "UG": 133, "ZA": 37,  "ZM": 81,  "ZW": 108,
}

# OpenAQ rate limits (verified from docs.openaq.org/using-the-api/rate-limits):
#   free tier: 60 requests/minute, 2,000 requests/hour
#   with API key: same unless custom agreement
#   429 on exceed, repeated violations can cause temp/perm ban
#   our 2s delay = 30 req/min (under 60/min) and 1800 req/hr (under 2000/hr)
OPENAQ_DELAY_SECONDS = 1.1       # ~55 requests/minute, below the 60 request/minute limit
OPENAQ_RETRY_DELAY = 15          # base wait on 429 (doubles each retry)
OPENAQ_MAX_RETRIES = 3           # max retries per request on 429/5xx

# ---------------------------------------------------------------------------
# AirQo — largest african low-cost sensor network (secondary ground truth).
# historical calibrated data via the v3 analytics data-download endpoint.
# requires a STANDARD-tier token. set AIRQO_API_TOKEN in .env (never commit it).
# ---------------------------------------------------------------------------
AIRQO_ANALYTICS_URL = "https://api.airqo.net/api/v3/public/analytics/data-download"
AIRQO_API_TOKEN = os.getenv("AIRQO_API_TOKEN")
# optional: restrict to specific site ids (comma-separated) instead of the whole network.
AIRQO_SITES = [s.strip() for s in os.getenv("AIRQO_SITES", "").split(",") if s.strip()]
AIRQO_FREQUENCY = os.getenv("AIRQO_FREQUENCY", "hourly")  # hourly gives real n_obs per day
AIRQO_RAW_FILE = PIPELINE_DATA_DIR / "airqo_raw.csv"
AIRQO_BATCH_DAYS = 55        # each request is capped at ~2 months
AIRQO_DELAY_SECONDS = 1.0
AIRQO_MAX_RETRIES = 4

# ---------------------------------------------------------------------------
# Open-Meteo historical weather API (free, no key)
# ---------------------------------------------------------------------------
OPENMETEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

# Open-Meteo rate limits (verified from open-meteo.com/en/terms):
#   free tier: <600 requests/minute, <5,000/hour, <10,000/day
#   requests with >10 variables or >2 weeks count as multiple calls
#   we fetch 6 variables per request so each counts as 1 call
#   our 2s delay = ~30 req/min = safely under the 600/min limit
OPENMETEO_DELAY_SECONDS = 2.0    # 2s between requests (~30/min, limit is 600/min)
OPENMETEO_RETRY_DELAY = 30       # base wait on 429 (doubles each retry)
OPENMETEO_MAX_RETRIES = 3        # max retries per request on 429/5xx

# weather variables to fetch (must match training dataset columns)
WEATHER_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "surface_pressure",
    "wind_speed_10m",
    "cloud_cover",
    "precipitation"
]

# mapping from API variable names to our column names
WEATHER_COLUMN_MAP = {
    "temperature_2m": "temp",
    "relative_humidity_2m": "humidity",
    "surface_pressure": "pressure",
    "wind_speed_10m": "wind_speed",
    "cloud_cover": "clouds",
    "precipitation": "precip"
}

# ---------------------------------------------------------------------------
# QA THRESHOLDS (from data_dictionary.md and training notebook)
# ---------------------------------------------------------------------------
PM25_MIN = 0        # exclusive lower bound
PM25_MAX = 500      # inclusive upper bound
LAT_MIN = -35.0
LAT_MAX = 37.0
LON_MIN = -18.0
LON_MAX = 52.0

# ---------------------------------------------------------------------------
# ensure directories exist
# ---------------------------------------------------------------------------
PIPELINE_DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
