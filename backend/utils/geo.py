"""Location geocoding for Africa"""

import requests
from typing import Tuple, Optional, Dict

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

AFRICAN_COUNTRIES = [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    "Cameroon", "Cape Verde", "Central African Republic", "Chad", "Comoros",
    "Congo", "Democratic Republic of the Congo", "Djibouti", "Egypt",
    "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon", "Gambia",
    "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho",
    "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania",
    "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria",
    "Rwanda", "Sao Tome and Principe", "Senegal", "Seychelles", "Sierra Leone",
    "Somalia", "South Africa", "South Sudan", "Sudan", "Tanzania", "Togo",
    "Tunisia", "Uganda", "Zambia", "Zimbabwe"
]

def get_african_location(city: str) -> Tuple[Optional[Dict], Optional[str]]:
    """
    Resolve city name to coordinates. Africa only.
    Returns (location_dict, error_string)
    """
    params = {
        "q": city,
        "format": "json",
        "limit": 5,
        "addressdetails": 1
    }
    
    headers = {"User-Agent": "MframapaAI/1.0"}
    
    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        if resp.status_code != 200:
            return None, f"Geocoding API error: {resp.status_code}"
        
        results = resp.json()
        
        for r in results:
            address = r.get("address", {})
            country = address.get("country", "")
            
            if any(ac.lower() in country.lower() for ac in AFRICAN_COUNTRIES):
                return {
                    "name": r.get("display_name", city).split(",")[0],
                    "lat": float(r["lat"]),
                    "lon": float(r["lon"]),
                    "country": country
                }, None
        
        return None, f"'{city}' not found in Africa"
        
    except Exception as e:
        return None, f"Geocoding error: {e}"
