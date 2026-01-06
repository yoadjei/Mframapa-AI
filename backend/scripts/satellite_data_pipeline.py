import os
import gc
import time
import json
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from pathlib import Path

# =============================================================================
# CONFIGURATION
# =============================================================================

# Paths
BASE_DIR = Path(__file__).parent.parent
GROUND_TRUTH_DIR = BASE_DIR / "data" / "ground_truth"
OUTPUT_DIR = BASE_DIR / "data"
PROGRESS_FILE = OUTPUT_DIR / "pipeline_progress.json"
SATELLITE_RAW_FILE = OUTPUT_DIR / "satellite_data_raw.csv"

# API Configuration
OPENMETEO_URL = "https://archive-api.open-meteo.com/v1/archive"

REQUEST_DELAY = 10.0         # 10 seconds between requests = 6/minute (limit is 600)
REST_AFTER_REQUESTS = 30     # Take a break after 30 requests
REST_DURATION = 600          # Rest for 10 MINUTES
MAX_RETRIES = 20             # Lots of retries

# Date range
DATE_CHUNK_DAYS = 180        # 6 months per request

# Resume settings
RESUME_FROM_STATION = None   

# =============================================================================
# PROGRESS TRACKING
# =============================================================================

def load_progress():
    """Load progress from disk."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {
        "completed_stations": [],
        "failed_stations": [],
        "total_requests": 0,
        "last_station_idx": -1
    }

def save_progress(progress):
    """Save progress to disk."""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)

def save_satellite_data(df, append=True):
    """Save satellite data, optionally appending to existing file."""
    if append and SATELLITE_RAW_FILE.exists():
        existing = pd.read_csv(SATELLITE_RAW_FILE)
        df = pd.concat([existing, df], ignore_index=True)
    df.to_csv(SATELLITE_RAW_FILE, index=False)

# =============================================================================
# STATION EXTRACTION
# =============================================================================

def extract_stations():
    """Extract all unique station locations from ground truth files."""
    
    print("=" * 70)
    print("STEP 1: EXTRACTING UNIQUE STATIONS")
    print("=" * 70)
    
    csv_files = list(GROUND_TRUTH_DIR.glob("*.csv"))
    print(f"Found {len(csv_files)} ground truth files")
    
    all_stations = []
    all_pm25_data = []
    
    for f in csv_files:
        try:
            df = pd.read_csv(f)
            required = ['location', 'lat', 'lon', 'datetime', 'pm25']
            if not all(c in df.columns for c in required):
                continue
            
            stations = df[['location', 'lat', 'lon']].drop_duplicates()
            all_stations.append(stations)
            all_pm25_data.append(df)
            
            country = f.stem.split('_')[0]
            print(f"  {country}: {len(stations)} stations, {len(df):,} readings")
            
        except Exception as e:
            print(f"  Error reading {f.name}: {e}")
    
    stations_df = pd.concat(all_stations, ignore_index=True).drop_duplicates()
    stations_df = stations_df.reset_index(drop=True)
    
    pm25_df = pd.concat(all_pm25_data, ignore_index=True)
    pm25_df['datetime'] = pd.to_datetime(pm25_df['datetime'])
    
    print(f"\nTotal unique stations: {len(stations_df)}")
    print(f"Total PM2.5 readings: {len(pm25_df):,}")
    
    # Save station list
    stations_df.to_csv(OUTPUT_DIR / "station_locations.csv", index=False)
    
    return stations_df, pm25_df

# =============================================================================
# API FETCHING (WITH STRICT RATE LIMITING)
# =============================================================================

def fetch_openmeteo_data(lat, lon, start_date, end_date, location_name, request_counter):
    """
    Fetch ERA5 reanalysis data from Open-Meteo.
    Returns (dataframe, updated_request_counter) or (None, counter) on failure.
    """
    
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m", 
            "surface_pressure",
            "cloud_cover",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation"
        ],
        "timezone": "UTC"
    }
    
    for attempt in range(MAX_RETRIES):
        try:
            # Enforce mandatory rest period
            time.sleep(REQUEST_DELAY)
            
            response = requests.get(OPENMETEO_URL, params=params, timeout=120)
            request_counter += 1
            
            # Check if we need to rest
            if request_counter % REST_AFTER_REQUESTS == 0:
                print(f"\n    [REST] {request_counter} requests made. Resting {REST_DURATION}s...")
                time.sleep(REST_DURATION)
            
            if response.status_code == 200:
                data = response.json()
                
                if "hourly" in data:
                    hourly = data["hourly"]
                    df = pd.DataFrame({
                        "datetime": pd.to_datetime(hourly["time"]),
                        "temperature_2m": hourly.get("temperature_2m"),
                        "relative_humidity": hourly.get("relative_humidity_2m"),
                        "surface_pressure": hourly.get("surface_pressure"),
                        "cloud_cover": hourly.get("cloud_cover"),
                        "wind_speed_10m": hourly.get("wind_speed_10m"),
                        "wind_direction_10m": hourly.get("wind_direction_10m"),
                        "precipitation": hourly.get("precipitation"),
                    })
                    df["lat"] = lat
                    df["lon"] = lon
                    df["location"] = location_name
                    return df, request_counter
                    
            elif response.status_code == 429:
                # Rate limited - wait progressively longer
                wait_time = 60 * (attempt + 1)  # 60s, 120s, 180s, etc.
                print(f"    RATE LIMITED! Waiting {wait_time}s (attempt {attempt+1}/{MAX_RETRIES})")
                time.sleep(wait_time)
                
            else:
                print(f"    Error {response.status_code}")
                time.sleep(30)
                
        except requests.exceptions.Timeout:
            print(f"    Timeout, retrying...")
            time.sleep(60)
            
        except Exception as e:
            print(f"    Error: {e}")
            time.sleep(30)
    
    return None, request_counter


def fetch_station_data(station_row, station_idx, total_stations, start_date, end_date, request_counter):
    """
    Fetch all satellite data for a single station.
    Returns (dataframe, updated_request_counter).
    """
    
    lat, lon = station_row['lat'], station_row['lon']
    location = station_row.get('location', f"Station_{station_idx}")
    
    print(f"\n[{station_idx+1}/{total_stations}] {location} ({lat:.4f}, {lon:.4f})")
    
    station_data = []
    current_start = pd.to_datetime(start_date)
    end = pd.to_datetime(end_date)
    
    while current_start < end:
        current_end = min(current_start + timedelta(days=DATE_CHUNK_DAYS), end)
        
        start_str = current_start.strftime("%Y-%m-%d")
        end_str = current_end.strftime("%Y-%m-%d")
        
        df, request_counter = fetch_openmeteo_data(
            lat=lat, lon=lon,
            start_date=start_str,
            end_date=end_str,
            location_name=location,
            request_counter=request_counter
        )
        
        if df is not None:
            station_data.append(df)
            print(f"  {current_start.strftime('%Y-%m')}: {len(df):,} hours ✓")
        else:
            print(f"  {current_start.strftime('%Y-%m')}: FAILED ✗")
        
        current_start = current_end + timedelta(days=1)
    
    if station_data:
        return pd.concat(station_data, ignore_index=True), request_counter
    return None, request_counter

# =============================================================================
# MAIN PIPELINE
# =============================================================================

def run_pipeline(resume_from=None):
    """
    Run the satellite data pipeline with resume capability.
    
    Args:
        resume_from: Station index to resume from (0-based), or None for fresh start
    """
    
    print("=" * 70)
    print("MFRAMAPA AI - SATELLITE DATA PIPELINE v2.0")
    print("=" * 70)
    print(f"Started: {datetime.now()}")
    print(f"Rate limiting: 1 request every {REQUEST_DELAY}s, rest {REST_DURATION}s every {REST_AFTER_REQUESTS} requests")
    
    # Load or create progress
    progress = load_progress()
    
    # Extract stations
    stations_df, pm25_df = extract_stations()
    
    # Get date range from data
    data_start = pm25_df['datetime'].min().strftime("%Y-%m-%d")
    data_end = pm25_df['datetime'].max().strftime("%Y-%m-%d")
    print(f"\nDate range: {data_start} to {data_end}")
    
    # Determine starting point
    if resume_from is not None:
        start_idx = resume_from
        print(f"\n*** RESUMING FROM STATION {start_idx} ***")
    else:
        start_idx = progress.get("last_station_idx", -1) + 1
        if start_idx > 0:
            print(f"\n*** RESUMING FROM STATION {start_idx} (from saved progress) ***")
    
    total_stations = len(stations_df)
    request_counter = progress.get("total_requests", 0)
    
    # Process each station
    for idx in range(start_idx, total_stations):
        row = stations_df.iloc[idx]
        location = row['location']
        
        # Skip if already completed
        if location in progress["completed_stations"]:
            print(f"\n[{idx+1}/{total_stations}] {location} - ALREADY DONE, SKIPPING")
            continue
        
        # Fetch data for this station
        station_df, request_counter = fetch_station_data(
            station_row=row,
            station_idx=idx,
            total_stations=total_stations,
            start_date=data_start,
            end_date=data_end,
            request_counter=request_counter
        )
        
        # Save progress after each station
        if station_df is not None and len(station_df) > 0:
            save_satellite_data(station_df, append=True)
            progress["completed_stations"].append(location)
            print(f"  Saved {len(station_df):,} rows")
        else:
            progress["failed_stations"].append(location)
            print(f"  WARNING: No data for this station")
        
        progress["last_station_idx"] = idx
        progress["total_requests"] = request_counter
        save_progress(progress)
        
        # Force garbage collection
        gc.collect()
    
    print("\n" + "=" * 70)
    print("PIPELINE COMPLETE")
    print("=" * 70)
    print(f"Completed stations: {len(progress['completed_stations'])}")
    print(f"Failed stations: {len(progress['failed_stations'])}")
    print(f"Total API requests: {request_counter}")
    print(f"Output: {SATELLITE_RAW_FILE}")
    print(f"Finished: {datetime.now()}")
    
    return progress

# =============================================================================
# MERGE AND VALIDATE (Run after pipeline completes)
# =============================================================================

def merge_and_validate():
    """Merge satellite data with PM2.5 ground truth."""
    
    print("=" * 70)
    print("MERGING AND VALIDATING DATA")
    print("=" * 70)
    
    # Load data
    _, pm25_df = extract_stations()
    satellite_df = pd.read_csv(SATELLITE_RAW_FILE)
    satellite_df['datetime'] = pd.to_datetime(satellite_df['datetime'])
    
    # Round to hour for matching
    pm25_df['datetime_hour'] = pm25_df['datetime'].dt.floor('h')
    satellite_df['datetime_hour'] = satellite_df['datetime'].dt.floor('h')
    
    # Merge
    print(f"PM2.5 rows: {len(pm25_df):,}")
    print(f"Satellite rows: {len(satellite_df):,}")
    
    merged = pm25_df.merge(
        satellite_df,
        on=['datetime_hour', 'lat', 'lon'],
        how='left',
        suffixes=('', '_sat')
    )
    
    # Rename columns
    column_mapping = {
        'wind_speed_10m': 'sat_wind_speed',
        'wind_direction_10m': 'sat_wind_dir',
        'relative_humidity': 'sat_rh',
        'surface_pressure': 'sat_pressure',
        'temperature_2m': 'sat_temp',
        'cloud_cover': 'sat_clouds',
        'precipitation': 'sat_precip'
    }
    merged = merged.rename(columns=column_mapping)
    
    # Select columns
    final_columns = [
        'datetime', 'lat', 'lon', 'location', 'pm25',
        'sat_wind_speed', 'sat_wind_dir', 'sat_rh', 'sat_pressure',
        'sat_temp', 'sat_clouds', 'sat_precip'
    ]
    final_columns = [c for c in final_columns if c in merged.columns]
    merged = merged[final_columns]
    
    # Drop missing
    before = len(merged)
    sat_cols = [c for c in final_columns if c.startswith('sat_')]
    merged = merged.dropna(subset=sat_cols)
    after = len(merged)
    print(f"Dropped {before - after:,} rows with missing satellite data")
    
    # Check correlations
    numeric_cols = merged.select_dtypes(include=[np.number]).columns.tolist()
    if 'pm25' in numeric_cols:
        correlations = merged[numeric_cols].corr()['pm25'].drop('pm25').sort_values()
        print("\nCorrelations with PM2.5:")
        print("-" * 40)
        for col, corr in correlations.items():
            bar = "+" * int(abs(corr) * 20) if corr > 0 else "-" * int(abs(corr) * 20)
            print(f"  {col:20s} {corr:+.3f} {bar}")
    
    # Save
    output_path = OUTPUT_DIR / "training_dataset_v2.csv"
    merged.to_csv(output_path, index=False)
    
    print(f"\nSaved: {output_path}")
    print(f"Rows: {len(merged):,}")
    
    return merged

# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import sys
    
    # Check for resume argument
    if len(sys.argv) > 1:
        if sys.argv[1] == "--merge":
            merge_and_validate()
        elif sys.argv[1].isdigit():
            run_pipeline(resume_from=int(sys.argv[1]))
        else:
            print("Usage:")
            print("  python satellite_data_pipeline.py           # Fresh start or auto-resume")
            print("  python satellite_data_pipeline.py 52        # Resume from station 52")
            print("  python satellite_data_pipeline.py --merge   # Merge after completion")
    else:
        run_pipeline()
