"""
Mframapa AI - Pan-African Virtual Air Quality Station
FastAPI Backend with AI Insights, Weather, and Crowd Reports
"""

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict
import xgboost as xgb
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()

from backend.utils.geo import get_african_location
from backend.utils.satellite import get_live_satellite_features
from backend.utils.weather import get_weather, check_weather_api
from backend.utils.database import save_report, get_report_count, init_db
from backend.utils.rate_limiter import check_rate_limit
from backend.utils.gemini import (
    generate_insight, 
    translate_strings, 
    check_gemini_api,
    get_supported_languages
)

init_db()

app = FastAPI(
    title="Mframapa AI API", 
    description="Pan-African Virtual Air Quality Station",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "backend/models/universal_african_model.json"
MODEL_GDRIVE_ID = "1bX8XI0ViGqm8FFxXkLNys6FmWxtgL1So"
model = None

def download_model_from_gdrive():
    """Download model from Google Drive if not found locally."""
    import requests
    
    # create models directory if needed
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # google drive direct download url
    url = f"https://drive.google.com/uc?export=download&id={MODEL_GDRIVE_ID}&confirm=t"
    
    print(f"Downloading model from Google Drive...")
    try:
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()
        
        with open(MODEL_PATH, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Model downloaded successfully ({os.path.getsize(MODEL_PATH) / 1024 / 1024:.1f} MB)")
        return True
    except Exception as e:
        print(f"Model download failed: {e}")
        return False

# load model - download from gdrive if not found locally
if not os.path.exists(MODEL_PATH) or os.path.getsize(MODEL_PATH) < 1000:
    download_model_from_gdrive()

if os.path.exists(MODEL_PATH):
    try:
        model = xgb.XGBRegressor()
        model.load_model(MODEL_PATH)
        print("Model loaded successfully")
    except Exception as e:
        print(f"Model load failed: {e}")
else:
    print("Model not found and download failed")


class LocationResponse(BaseModel):
    name: str
    lat: float
    lon: float
    country: str

class PredictionResponse(BaseModel):
    pm25: float
    aqi_category: str
    confidence: float
    weather: Optional[dict] = None
    factors: dict
    location: dict

class InsightRequest(BaseModel):
    pm25: float
    aqi_category: str
    weather: Optional[dict] = None
    language: str = "en"

class InsightResponse(BaseModel):
    insight: str

class TranslateRequest(BaseModel):
    strings: Dict[str, str]
    target_language: str

class TranslateResponse(BaseModel):
    translations: Dict[str, str]

class ReportRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    perceived_quality: str = Field(..., pattern="^(good|moderate|bad|very_bad)$")
    comment: Optional[str] = Field(None, max_length=500)

class ReportResponse(BaseModel):
    status: str
    report_id: int

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    satellite_api: str
    weather_api: str
    gemini_api: str
    report_count: int


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def get_aqi_category(pm25: float) -> str:
    if pm25 < 12: return "Good"
    elif pm25 < 35: return "Moderate"
    elif pm25 < 55: return "Unhealthy for Sensitive Groups"
    elif pm25 < 150: return "Unhealthy"
    elif pm25 < 250: return "Very Unhealthy"
    else: return "Hazardous"


@app.get("/")
def read_root():
    return {
        "status": "Mframapa AI Backend Online", 
        "region": "Africa", 
        "version": "2.0.0",
        "endpoints": [
            "/api/predict",
            "/api/resolve-location", 
            "/api/generate-insight",
            "/api/translate-ui",
            "/api/report",
            "/api/health"
        ]
    }


@app.get("/api/resolve-location", response_model=LocationResponse)
def resolve_location(city: str = Query(..., min_length=2)):
    try:
        location_data, error = get_african_location(city)
        if error:
            raise HTTPException(status_code=404, detail=error)
        return location_data
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/predict", response_model=PredictionResponse)
def predict_pollution(request: Request, lat: float, lon: float, name: str = "Unknown"):
    ip = get_client_ip(request)
    allowed, msg = check_rate_limit(ip, "predict")
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    if not model:
        raise HTTPException(status_code=503, detail="Model not ready")

    try:
        sat_data = get_live_satellite_features(lat, lon)
        features = sat_data['features']
        
        X = np.array([features])
        prediction = model.predict(X)[0]
        pm25 = float(prediction)
        
        try:
            weather = get_weather(lat, lon)
        except:
            weather = None
        
        return {
            "pm25": round(pm25, 1),
            "aqi_category": get_aqi_category(pm25),
            "confidence": 0.90,
            "weather": weather,
            "factors": {
                "satellite_no2": round(features[0], 2),
                "satellite_aod": round(features[1], 2),
                "pblh": round(features[2], 0),
                "humidity": round(features[3], 1)
            },
            "location": {"name": name, "lat": lat, "lon": lon}
        }

    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-insight", response_model=InsightResponse)
def api_generate_insight(request: Request, body: InsightRequest):
    ip = get_client_ip(request)
    allowed, msg = check_rate_limit(ip, "insight")
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    try:
        weather_data = body.weather or {}
        insight = generate_insight(
            pm25=body.pm25,
            aqi_category=body.aqi_category,
            weather=weather_data,
            language=body.language
        )
        return {"insight": insight}
    except ValueError as ve:
        raise HTTPException(status_code=500, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/translate-ui", response_model=TranslateResponse)
def api_translate_ui(request: Request, body: TranslateRequest):
    ip = get_client_ip(request)
    allowed, msg = check_rate_limit(ip, "translate")
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    try:
        translations = translate_strings(body.strings, body.target_language)
        return {"translations": translations}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/report", response_model=ReportResponse)
def api_submit_report(request: Request, body: ReportRequest):
    ip = get_client_ip(request)
    allowed, msg = check_rate_limit(ip, "report")
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    try:
        report_id = save_report(
            lat=body.lat,
            lon=body.lon,
            perceived_quality=body.perceived_quality,
            comment=body.comment,
            ip_address=ip
        )
        return {"status": "success", "report_id": report_id}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health", response_model=HealthResponse)
def api_health_check(request: Request):
    ip = get_client_ip(request)
    allowed, msg = check_rate_limit(ip, "health")
    if not allowed:
        raise HTTPException(status_code=429, detail=msg)
    
    return {
        "status": "online",
        "model_loaded": model is not None,
        "satellite_api": "ok",
        "weather_api": "ok" if check_weather_api() else "error",
        "gemini_api": "ok" if check_gemini_api() else "not_configured",
        "report_count": get_report_count()
    }


@app.get("/api/languages")
def api_get_languages():
    return {"languages": get_supported_languages()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
