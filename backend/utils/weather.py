"""Open-Meteo Weather API Integration - Free, no key required"""

import requests

OPENMETEO_URL = "https://api.open-meteo.com/v1/forecast"

def get_weather(lat: float, lon: float) -> dict:
    """Get current weather from Open-Meteo."""
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": ["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m"],
        "timezone": "auto"
    }
    
    try:
        response = requests.get(OPENMETEO_URL, params=params, timeout=10)
        
        if response.status_code != 200:
            raise ValueError(f"Weather API returned {response.status_code}")
        
        data = response.json()
        current = data.get("current", {})
        
        return {
            "temperature": current.get("temperature_2m"),
            "humidity": current.get("relative_humidity_2m"),
            "pressure": current.get("surface_pressure"),
            "wind_speed": current.get("wind_speed_10m")
        }
        
    except requests.exceptions.Timeout:
        raise ValueError("Weather API timeout")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Weather API error: {e}")


def check_weather_api() -> bool:
    """Check if weather API is accessible."""
    try:
        result = get_weather(5.6037, -0.1870)
        return result.get("temperature") is not None
    except:
        return False
