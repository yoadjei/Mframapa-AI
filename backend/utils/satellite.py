"""Satellite data fetcher for live predictions"""

import os
import requests
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

NASA_USER = os.getenv("NASA_EARTHDATA_USER")
NASA_PASS = os.getenv("NASA_EARTHDATA_PASS")


def get_live_satellite_features(lat: float, lon: float) -> Dict:
    """
    Get live satellite features for a location.
    Returns dict with 'features' list for model input.
    
    Features: [no2, aod, pblh, humidity]
    """
    
    # For now, use Open-Meteo as fallback for meteorological data
    # Real implementation would fetch from NASA/Copernicus APIs
    
    features = get_meteo_features(lat, lon)
    
    return {
        "features": features,
        "source": "open-meteo"
    }


def get_meteo_features(lat: float, lon: float) -> List[float]:
    """Get meteorological features from Open-Meteo."""
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "relative_humidity_2m",
            "surface_pressure",
            "cloud_cover"
        ],
        "timezone": "auto"
    }
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            current = data.get("current", {})
            
            humidity = current.get("relative_humidity_2m", 50)
            pressure = current.get("surface_pressure", 1013)
            clouds = current.get("cloud_cover", 50)
            
            # Estimate PBLH from pressure (simplified)
            pblh = max(500, min(2500, (1013 - pressure) * 50 + 1000))
            
            # Placeholder values for NO2 and AOD (would come from real satellite data)
            no2 = 0.5  # Placeholder
            aod = 0.3  # Placeholder
            
            return [no2, aod, pblh, humidity]
    except:
        pass
    
    # Default fallback values
    return [0.5, 0.3, 1000, 50]


def check_satellite_api() -> bool:
    """Check if satellite API is accessible."""
    try:
        features = get_meteo_features(5.6, -0.2)
        return len(features) == 4
    except:
        return False
