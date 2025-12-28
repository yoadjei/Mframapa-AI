import requests
import pandas as pd
import os
import time
from dotenv import load_dotenv

load_dotenv()

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "backend" / "data" / "ground_truth"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Full list of African ISO (Alpha-2) codes
TARGET_ISO = [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", 
    "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", 
    "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", 
    "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", 
    "ZM", "ZW"
]
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")

HEADERS = {
    "X-API-Key": OPENAQ_API_KEY,
    "Accept": "application/json"
}

def get_json(url, params=None):
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 429:
            print("   ⚠️ Rate Limited. Sleeping 10s...")
            time.sleep(10)
            return get_json(url, params)
        else:
            # print(f"   ❌ API Error {resp.status_code}") 
            return None
    except Exception as e:
        return None

def fetch_country_ids():
    print("🌍 Mapping Country Codes to V3 IDs...")
    url = "https://api.openaq.org/v3/countries"
    data = get_json(url, {"limit": 200})
    
    mapping = {}
    if data:
        for c in data.get("results", []):
            if c.get("code") in TARGET_ISO or c.get("iso") in TARGET_ISO:
                mapping[c['code']] = c['id']
                print(f"   ✅ {c['name']} = {c['id']}")
    return mapping

def fetch_locations(country_id):
    url = "https://api.openaq.org/v3/locations"
    params = {
        "countries_id": country_id,
        "limit": 1000
    }
    data = get_json(url, params)
    return data.get("results", []) if data else []

def fetch_sensors(location_id):
    url = f"https://api.openaq.org/v3/locations/{location_id}/sensors"
    data = get_json(url)
    return data.get("results", []) if data else []

def fetch_sensor_measurements(sensor_id, location_name, lat, lon):
    # Retrieve PM2.5 from specific sensor
    url = f"https://api.openaq.org/v3/sensors/{sensor_id}/measurements"
    
    all_rows = []
    page = 1
    limit = 1000
    
    # print(f"   📡 Fetching for Sensor {sensor_id}...")
    
    while True:
        params = {
            "limit": limit,
            "page": page,
            "date_from": "2020-01-01T00:00:00Z",
            "date_to": "2025-12-31T23:59:59Z"
        }
        
        data = get_json(url, params)
        if not data: break
        
        results = data.get("results", [])
        if not results: break
        
        for r in results:
            period = r.get("period", {})
            val = r.get("value")
            ts = period.get("datetimeFrom", {}).get("utc")
            
            if val is not None and ts:
                 all_rows.append({
                     "location": location_name,
                     "lat": lat,
                     "lon": lon,
                     "datetime": ts,
                     "pm25": val,
                     "sensor_id": sensor_id
                 })
        
        # print(f"      - Page {page}: {len(results)} records")
        page += 1
        time.sleep(0.1)
        
        if page > 15: break # Cap 
            
    return all_rows

import argparse

def main():
    parser = argparse.ArgumentParser(description="Harvest OpenAQ Data")
    parser.add_argument("--country", type=str, help="ISO code of specific country to harvest (e.g., GH)", default=None)
    args = parser.parse_args()

    print("🚀 Starting OpenAQ V3 Harvester (Corrected)...")
    
    country_map = fetch_country_ids()
    
    # Filter if argument provided
    if args.country:
        target = args.country.upper()
        # Search for key (ISO code) or value (ID)
        found = False
        for iso, cid in list(country_map.items()): # list() to copy keys
            if iso == target:
                country_map = {iso: cid}
                found = True
                break
        
        if not found:
            print(f"❌ Country code '{target}' not found in African list or OpenAQ mapping.")
            print("   (Ensure the country has data on OpenAQ V3)")
            return

    for iso, cid in country_map.items():
        print(f"\n📂 Processing Country: {iso} (ID: {cid})", flush=True)
        
        locs = fetch_locations(cid)
        if not locs:
            print(f"   ⚠️ Skipping {iso}: No monitoring sites found.", flush=True)
            continue

        print(f"   Found {len(locs)} monitoring sites. Scanning for PM2.5...", flush=True)
        
        country_data = []
        
        for loc in locs:
            lid = loc['id']
            name = loc['name']
            coords = loc.get("coordinates", {})
            lat = coords.get("latitude")
            lon = coords.get("longitude")
            
            if lat is None or lon is None: continue
            
            # Get Sensors
            sensors = fetch_sensors(lid)
            pm25_sensor = None
            
            for s in sensors:
                p_name = s.get("parameter", {}).get("name", "").lower()
                if "pm2.5" in p_name or "pm25" in p_name:
                    pm25_sensor = s
                    break
            
            if pm25_sensor:
                sid = pm25_sensor['id']
                print(f"   ✅ Found Sensor at {name} (ID: {sid}). Downloading...", flush=True)
                rows = fetch_sensor_measurements(sid, name, lat, lon)
                if rows:
                    country_data.extend(rows)
                    print(f"      -> Added {len(rows)} records. (Total: {len(country_data)})", flush=True)
            
        if country_data:
            df = pd.DataFrame(country_data)
            filename = f"{OUTPUT_DIR}/{iso}_PM25_V3.csv"
            df.to_csv(filename, index=False)
            
            # Check size
            size_mb = os.path.getsize(filename) / (1024 * 1024)
            print(f"   💾 SAVED {iso}: {len(country_data)} records to {filename}", flush=True)
            print(f"      📦 File Size: {size_mb:.2f} MB", flush=True)
        else:
            print(f"   ⚠️ Skipping {iso}: No PM2.5 data found after scanning sites.", flush=True)

    print("\n🏁 Harvest Complete.", flush=True)

if __name__ == "__main__":
    main()
