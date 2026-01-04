"""Harvest PM2.5 Ground Truth Data from OpenAQ API"""

import requests
import pandas as pd
import os
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = BASE_DIR / "backend" / "data" / "ground_truth"
os.makedirs(OUTPUT_DIR, exist_ok=True)

TARGET_ISO = [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", 
    "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE", 
    "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", 
    "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", 
    "ZM", "ZW"
]

OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")
HEADERS = {"X-API-Key": OPENAQ_API_KEY, "Accept": "application/json"}


def get_json(url, params=None):
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=30)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 429:
            print("   Rate limited. Sleeping 10s...")
            time.sleep(10)
            return get_json(url, params)
        return None
    except:
        return None


def fetch_country_ids():
    print("Mapping country codes...")
    data = get_json("https://api.openaq.org/v3/countries", {"limit": 200})
    mapping = {}
    if data:
        for c in data.get("results", []):
            if c.get("code") in TARGET_ISO:
                mapping[c['code']] = c['id']
    return mapping


def fetch_locations(country_id):
    data = get_json("https://api.openaq.org/v3/locations", {"countries_id": country_id, "limit": 1000})
    return data.get("results", []) if data else []


def fetch_sensors(location_id):
    data = get_json(f"https://api.openaq.org/v3/locations/{location_id}/sensors")
    return data.get("results", []) if data else []


def fetch_sensor_measurements(sensor_id, location_name, lat, lon):
    url = f"https://api.openaq.org/v3/sensors/{sensor_id}/measurements"
    all_rows = []
    page = 1
    
    while page <= 15:
        params = {"limit": 1000, "page": page, "date_from": "2020-01-01", "date_to": "2025-12-31"}
        data = get_json(url, params)
        if not data: break
        
        results = data.get("results", [])
        if not results: break
        
        for r in results:
            val = r.get("value")
            ts = r.get("period", {}).get("datetimeFrom", {}).get("utc")
            if val is not None and ts:
                all_rows.append({"location": location_name, "lat": lat, "lon": lon, "datetime": ts, "pm25": val, "sensor_id": sensor_id})
        
        page += 1
        time.sleep(0.1)
    
    return all_rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--country", type=str)
    args = parser.parse_args()

    country_map = fetch_country_ids()
    
    if args.country:
        target = args.country.upper()
        if target in country_map:
            country_map = {target: country_map[target]}
        else:
            print(f"Country '{target}' not found")
            return

    for iso, cid in country_map.items():
        print(f"Processing: {iso}")
        locs = fetch_locations(cid)
        if not locs: continue
        
        country_data = []
        for loc in locs:
            lat = loc.get("coordinates", {}).get("latitude")
            lon = loc.get("coordinates", {}).get("longitude")
            if not lat or not lon: continue
            
            sensors = fetch_sensors(loc['id'])
            for s in sensors:
                if "pm2.5" in s.get("parameter", {}).get("name", "").lower():
                    rows = fetch_sensor_measurements(s['id'], loc['name'], lat, lon)
                    country_data.extend(rows)
                    break
        
        if country_data:
            df = pd.DataFrame(country_data)
            df.to_csv(f"{OUTPUT_DIR}/{iso}_PM25_V3.csv", index=False)
            print(f"   Saved {len(country_data)} records")

    print("Harvest complete.")


if __name__ == "__main__":
    main()
