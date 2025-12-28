from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.utils.geo import get_african_location
from backend.utils.satellite import get_live_satellite_features
from pydantic import BaseModel
import xgboost as xgb
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Mframapa AI API", description="Pan-African Virtual Air Quality Station")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "backend/models/universal_african_model.json"
model = None

# Try to load model, but don't crash if missing (just disable predict)
if os.path.exists(MODEL_PATH):
    try:
        model = xgb.XGBRegressor()
        model.load_model(MODEL_PATH)
        print("✅ XGBoost Model Loaded")
    except Exception as e:
        print(f"⚠️ Model load failed: {e}")
else:
    print("⚠️ Model not found. Predictions will be unavailable until training completes.")

class LocationResponse(BaseModel):
    name: str
    lat: float
    lon: float
    country: str

class PredictionResponse(BaseModel):
    pm25: float
    aqi_category: str
    confidence: float
    factors: dict
    location: dict

@app.get("/")
def read_root():
    return {"status": "Mframapa AI Backend Online", "region": "Africa", "mode": "REAL DATA ONLY"}

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
def predict_pollution(lat: float, lon: float, name: str = "Unknown"):
    
    if not model:
        raise HTTPException(status_code=503, detail="AI Model is not ready. Please run 'backend/models/train_model.py' first.")

    try:
        # 1. Get REAL Satellite Features
        # This will fail if .env keys are missing
        sat_data = get_live_satellite_features(lat, lon)
        features = sat_data['features'] 
        
        # 2. Predict
        X = np.array([features])
        prediction = model.predict(X)[0]
        pm25 = float(prediction)
        
        if pm25 < 12: cat = "Good"
        elif pm25 < 35: cat = "Moderate"
        elif pm25 < 55: cat = "Unhealthy for Sensitive Groups"
        elif pm25 < 150: cat = "Unhealthy"
        elif pm25 < 250: cat = "Very Unhealthy"
        else: cat = "Hazardous"
        
        return {
            "pm25": round(pm25, 1),
            "aqi_category": cat,
            "confidence": 0.90, # Higher confidence with real data
            "factors": {
                "satellite_no2": round(features[0], 2),
                "satellite_aod": round(features[1], 2),
                "pblh": round(features[2], 0),
                "humidity": round(features[3], 1)
            },
            "location": {"name": name, "lat": lat, "lon": lon}
        }

    except ValueError as ve:
        # User Friendly Error for Missing Keys
        raise HTTPException(status_code=500, detail=f"Configuration Error: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction Error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
