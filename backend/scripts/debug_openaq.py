import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

def debug_chain():
    api_key = os.getenv("OPENAQ_API_KEY")
    headers = { "X-API-Key": api_key }
    
    # 1. Get Location
    print("1. Fetching Location...")
    resp = requests.get("https://api.openaq.org/v3/locations", params={"limit":1, "countries_id":162}, headers=headers)
    loc = resp.json()['results'][0]
    loc_id = loc['id']
    print(f"   Location: {loc['name']} (ID: {loc_id})")
    
    # 2. Get Sensors
    print("2. Fetching Sensors for Location...")
    url_s = f"https://api.openaq.org/v3/locations/{loc_id}/sensors"
    resp_s = requests.get(url_s, headers=headers)
    sensors = resp_s.json().get('results', [])
    print(f"   Found {len(sensors)} sensors.")
    
    target_sensor = None
    for s in sensors:
        p = s.get('parameter', {})
        print(f"      - Sensor ID {s['id']}: {p.get('name')} ({p.get('units')})")
        if p.get('name') == 'pm25' or 'pm2.5' in p.get('name', '').lower():
            target_sensor = s
            break
            
    if target_sensor:
        sid = target_sensor['id']
        print(f"3. Fetching Measurements for Sensor ID {sid}...")
        url_m = f"https://api.openaq.org/v3/sensors/{sid}/measurements"
        resp_m = requests.get(url_m, params={"limit":5}, headers=headers)
        print(f"   Status: {resp_m.status_code}")
        print(f"   Data: {str(resp_m.json())[:500]}")
    else:
        print("❌ No PM2.5 sensor found at this location.")

if __name__ == "__main__":
    debug_chain()
