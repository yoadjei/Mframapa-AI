from geopy.geocoders import Nominatim
from functools import lru_cache

# List of African Country Codes (ISO 3166-1 alpha-2)
AFRICAN_COUNTRIES = {
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", "CI",
    "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR",
    "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN",
    "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW"
}

geolocator = Nominatim(user_agent="mframapa_ai_backend")

@lru_cache(maxsize=1000)
def get_african_location(city_name: str):
    """
    Resolves a city name to coordinates, enforcing valid African location.
    Throws ValueError if outside Africa.
    """
    try:
        location = geolocator.geocode(city_name, language='en')
        
        if not location:
            return None, "City not found."
            
        # Address usually contains country code in raw data, dependent on provider.
        # Nominatim returns detailed address in raw.
        address_details = location.raw.get('address', {})
        country_code = address_details.get('country_code', '').upper()
        
        # Fallback: Coordinate Bounding Box Check if country code fails
        # Africa Bounding Box (approx): Lat 37.5 to -35, Lon -18 to 52
        lat = location.latitude
        lon = location.longitude
        
        # Note: Nominatim is usually reliable with country codes.
        if country_code and country_code not in AFRICAN_COUNTRIES:
             # Double check bounding box just in case (e.g. Canary Islands might be ES but geographically Africa)
             # But strictly, user wants "Africa".
             
             # If strictly political map:
             raise ValueError(f"Location '{city_name}' is in {address_details.get('country', 'Unknown')} ({country_code}), which is outside our African coverage area.")

        if not country_code:
             # If code missing, use simple bounding box
             if not (-35 <= lat <= 38 and -20 <= lon <= 55):
                  raise ValueError(f"Location '{city_name}' appears to be outside Africa.")

        return {
            "name": location.address,
            "lat": lat,
            "lon": lon,
            "country": address_details.get('country', 'Africa')
        }, None

    except Exception as e:
        if "outside our African coverage area" in str(e):
            raise e
        return None, str(e)
