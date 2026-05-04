"""Map PM2.5 (µg/m³) to AQI category labels used by the PWA."""


def aqi_category_from_pm25(pm25: float) -> str:
    v = float(pm25)
    if v <= 12:
        return "Good"
    if v <= 35:
        return "Moderate"
    if v <= 55:
        return "Unhealthy for Sensitive Groups"
    if v <= 150:
        return "Unhealthy"
    return "Hazardous"
