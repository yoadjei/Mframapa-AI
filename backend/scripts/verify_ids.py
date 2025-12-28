import requests
import json
import os

def check_ids():
    url = "https://api.openaq.org/v3/countries"
    headers = {"X-API-Key": os.getenv("OPENAQ_API_KEY")}
    
    # pagination
    all_countries = []
    page = 1
    while True:
        resp = requests.get(url, params={"limit": 200, "page": page}, headers=headers)
        if resp.status_code != 200: break
        data = resp.json()
        results = data.get("results", [])
        if not results: break
        all_countries.extend(results)
        page += 1
        
    print(f"Total Countries: {len(all_countries)}")
    
    # Check GH, NG
    targets = ["GH", "NG", "ZA", "KE", "EG", "SN"]
    for c in all_countries:
        code = c.get('code')
        iso = c.get('iso')
        if code in targets or iso in targets:
            print(f"🎯 {c.get('name')} | Code: {code} | ISO: {iso} | ID: {c['id']}")

if __name__ ==("__main__"):
    from dotenv import load_dotenv
    load_dotenv()
    check_ids()
