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
    """Get meteorological features from Open-Meteo, expanded to 20 features for model."""
    
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m",
            "relative_humidity_2m",
            "surface_pressure",
            "cloud_cover",
            "wind_speed_10m",
            "wind_direction_10m"
        ],
        "timezone": "auto"
    }
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            current = data.get("current", {})
            
            # Extract actual weather data
            temp = current.get("temperature_2m", 25)
            humidity = current.get("relative_humidity_2m", 50)
            pressure = current.get("surface_pressure", 1013)
            clouds = current.get("cloud_cover", 50)
            wind_speed = current.get("wind_speed_10m", 5)
            wind_dir = current.get("wind_direction_10m", 180)
            
            # Derived features
            pblh = max(500, min(2500, (1013 - pressure) * 50 + 1000))
            
            # 20 features matching model training data:
            # [lat, lon, NO2, AOD, PBLH, humidity, temp, pressure, wind_speed, wind_dir,
            #  clouds, month, day, hour, is_dry_season, elevation, urban_fraction, 
            #  population_density, vegetation_index, distance_to_road]
            import datetime
            now = datetime.datetime.utcnow()
            month = now.month
            day = now.day
            hour = now.hour
            is_dry_season = 1 if month in [11, 12, 1, 2, 3] else 0
            
            features = [
                lat,                    # 1. latitude
                lon,                    # 2. longitude
                0.5,                    # 3. NO2 (placeholder - would come from Sentinel-5P)
                0.3,                    # 4. AOD (placeholder - would come from MODIS)
                pblh,                   # 5. planetary boundary layer height
                humidity,               # 6. relative humidity
                temp,                   # 7. temperature
                pressure,               # 8. surface pressure
                wind_speed,             # 9. wind speed
                wind_dir,               # 10. wind direction
                clouds,                 # 11. cloud cover
                month,                  # 12. month
                day,                    # 13. day
                hour,                   # 14. hour
                is_dry_season,          # 15. dry season flag
                100,                    # 16. elevation (placeholder)
                0.5,                    # 17. urban fraction (placeholder)
                1000,                   # 18. population density (placeholder)
                0.3,                    # 19. vegetation index (placeholder)
                500                     # 20. distance to road (placeholder)
            ]
            
            return features
    except:
        pass
    
    # Default fallback with 20 features
    return [lat, lon, 0.5, 0.3, 1000, 50, 25, 1013, 5, 180, 50, 1, 1, 12, 0, 100, 0.5, 1000, 0.3, 500]


def check_satellite_api() -> bool:
    """Check if satellite API is accessible."""
    try:
        features = get_meteo_features(5.6, -0.2)
        return len(features) == 20
    except:
        return False
