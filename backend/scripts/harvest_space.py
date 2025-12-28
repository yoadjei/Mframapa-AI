import earthaccess
import os
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


# Anchor Cities (Same as Ground Truth)
ANCHOR_CITIES = {
    "Accra": {"lat": 5.6037, "lon": -0.1870},
    "Lagos": {"lat": 6.5244, "lon": 3.3792},
    "Dakar": {"lat": 14.7167, "lon": -17.4677},
    "Nairobi": {"lat": -1.2921, "lon": 36.8219},
    "Johannesburg": {"lat": -26.2041, "lon": 28.0473},
    "Cairo": {"lat": 30.0444, "lon": 31.2357},
}

OUTPUT_DIR = "backend/data/space"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def harvest_satellite_data(city_name, lat, lon, start_date="2024-01-01", end_date="2025-12-31"):
    print(f"🛰️ Harvesting Space Data for {city_name}...")
    
    # 1. Search for Sentinel-5P NO2 (High Res)
    # Shortname: SNDR_NO2_L2 or similar in NASA CMR
    # We'll use a generic search here to demonstrate structure.
    # In reality, TROPOMI NO2 is often accessed via GES DISC or Sentinel Hub.
    
    # For this script, we'll try to find MERRA-2 (Reanalysis) as it's the most stable historical training source.
    # Collection: M2I3NPASM (Assimilation) or M2T1NXAER (Aerosols)
    
    try:
        results = earthaccess.search_data(
            short_name="M2T1NXAER", # MERRA-2 Time-Averaged 1-Hourly Aerosol
            temporal=(start_date, end_date),
            bounding_box=(lon-0.1, lat-0.1, lon+0.1, lat+0.1),
            count=100 # Limit for demo
        )
        
        print(f"   - Found {len(results)} Granules for M2T1NXAER")
        
        # In a real run, we would download:
        # earthaccess.download(results, OUTPUT_DIR)
        
        # For now, we log the metadata to a CSV to prove availability
        meta_records = []
        for r in results:
            meta = r.get_umm()
            meta_records.append({
                "granule_id": meta.get("GranuleUR"),
                "start_time": meta["TemporalExtent"]["RangeDateTime"]["BeginningDateTime"],
                "url": earthaccess.get_s3_urls(r)[0] if earthaccess.get_s3_urls(r) else "N/A"
            })
            
        if meta_records:
            df = pd.DataFrame(meta_records)
            filename = f"{OUTPUT_DIR}/{city_name}_satellite_meta.csv"
            df.to_csv(filename, index=False)
            print(f"✅ Saved metadata to {filename}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting NASA/Sentinel Data Harvest...")
    
    # Authenticate (Interactive or via ENV)
    # os.environ["EARTHDATA_USERNAME"] = "..."
    # os.environ["EARTHDATA_PASSWORD"] = "..."
    
    # earthaccess.login() # Will prompt if env vars missing
    
    for city, coords in ANCHOR_CITIES.items():
        harvest_satellite_data(city, coords["lat"], coords["lon"])
        
    print("🏁 Space Harvest Complete.")
