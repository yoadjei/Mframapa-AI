"""
Mframapa AI - Memory-Efficient Merge Script
Merges satellite_data_raw.csv with PM2.5 ground truth files
Uses chunked processing and timezone-safe datetime handling
"""

import gc
import pandas as pd
import numpy as np
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
GROUND_TRUTH_DIR = DATA_DIR / "ground_truth"

SATELLITE_FILE = DATA_DIR / "satellite_data_raw.csv"
OUTPUT_FILE = DATA_DIR / "training_dataset_v2.csv"

CHUNK_SIZE = 50000

def load_ground_truth():
    """Load all PM2.5 ground truth files."""
    print("Loading ground truth PM2.5 data...")
    
    all_data = []
    for f in GROUND_TRUTH_DIR.glob("*.csv"):
        try:
            df = pd.read_csv(f)
            if all(c in df.columns for c in ['location', 'lat', 'lon', 'datetime', 'pm25']):
                all_data.append(df[['location', 'lat', 'lon', 'datetime', 'pm25']])
        except Exception as e:
            print(f"  Error reading {f.name}: {e}")
    
    pm25_df = pd.concat(all_data, ignore_index=True)
    
    # Parse datetime - handle both UTC and non-UTC
    pm25_df['datetime'] = pd.to_datetime(pm25_df['datetime'], utc=True)
    pm25_df['datetime'] = pm25_df['datetime'].dt.tz_localize(None)  # Remove timezone to make naive
    pm25_df['datetime_hour'] = pm25_df['datetime'].dt.floor('h')
    
    # Round lat/lon for matching (3 decimal places = ~100m precision)
    pm25_df['lat_round'] = pm25_df['lat'].round(3)
    pm25_df['lon_round'] = pm25_df['lon'].round(3)
    
    print(f"  Loaded {len(pm25_df):,} PM2.5 readings")
    return pm25_df

def merge_chunked():
    """Merge satellite data with PM2.5 in chunks."""
    print("\n" + "=" * 70)
    print("MERGING SATELLITE DATA WITH PM2.5 GROUND TRUTH")
    print("=" * 70)
    
    # Load ground truth
    pm25_df = load_ground_truth()
    
    # Create lookup dict for faster matching
    print("\nCreating PM2.5 lookup index...")
    pm25_df['match_key'] = (
        pm25_df['datetime_hour'].astype(str) + '_' + 
        pm25_df['lat_round'].astype(str) + '_' + 
        pm25_df['lon_round'].astype(str)
    )
    
    # Average PM2.5 for duplicate keys (same location + hour)
    pm25_grouped = pm25_df.groupby('match_key').agg({
        'pm25': 'mean',
        'location': 'first',
        'lat': 'first',
        'lon': 'first',
        'datetime': 'first'
    }).reset_index()
    
    pm25_lookup = dict(zip(pm25_grouped['match_key'], pm25_grouped['pm25']))
    
    print(f"  {len(pm25_lookup):,} unique PM2.5 measurements indexed")
    
    # Process satellite data in chunks
    print("\nProcessing satellite data...")
    
    first_chunk = True
    total_matched = 0
    total_processed = 0
    
    for chunk in pd.read_csv(SATELLITE_FILE, chunksize=CHUNK_SIZE):
        total_processed += len(chunk)
        
        # Parse datetime and make timezone-naive
        chunk['datetime'] = pd.to_datetime(chunk['datetime'])
        if chunk['datetime'].dt.tz is not None:
            chunk['datetime'] = chunk['datetime'].dt.tz_localize(None)
        chunk['datetime_hour'] = chunk['datetime'].dt.floor('h')
        chunk['lat_round'] = chunk['lat'].round(3)
        chunk['lon_round'] = chunk['lon'].round(3)
        
        chunk['match_key'] = (
            chunk['datetime_hour'].astype(str) + '_' + 
            chunk['lat_round'].astype(str) + '_' + 
            chunk['lon_round'].astype(str)
        )
        
        # Match with PM2.5
        chunk['pm25'] = chunk['match_key'].map(pm25_lookup)
        
        # Keep only matched rows
        matched = chunk[chunk['pm25'].notna()].copy()
        
        if len(matched) > 0:
            total_matched += len(matched)
            
            # Rename columns
            matched = matched.rename(columns={
                'temperature_2m': 'sat_temp',
                'relative_humidity': 'sat_rh',
                'surface_pressure': 'sat_pressure',
                'cloud_cover': 'sat_clouds',
                'wind_speed_10m': 'sat_wind_speed',
                'wind_direction_10m': 'sat_wind_dir',
                'precipitation': 'sat_precip'
            })
            
            # Select final columns
            final_cols = [
                'datetime', 'lat', 'lon', 'location', 'pm25',
                'sat_temp', 'sat_rh', 'sat_pressure', 'sat_clouds',
                'sat_wind_speed', 'sat_wind_dir', 'sat_precip'
            ]
            final_cols = [c for c in final_cols if c in matched.columns]
            matched = matched[final_cols]
            
            # Save to file
            if first_chunk:
                matched.to_csv(OUTPUT_FILE, index=False, mode='w')
                first_chunk = False
            else:
                matched.to_csv(OUTPUT_FILE, index=False, mode='a', header=False)
        
        # Progress
        if total_processed % 500000 == 0:
            print(f"  Processed {total_processed:,} rows, matched {total_matched:,}")
        
        gc.collect()
    
    print(f"\n  Total processed: {total_processed:,}")
    print(f"  Total matched: {total_matched:,}")
    
    return total_matched

def validate_output():
    """Check correlations in output file."""
    print("\n" + "=" * 70)
    print("VALIDATING OUTPUT")
    print("=" * 70)
    
    # Read sample
    df = pd.read_csv(OUTPUT_FILE, nrows=100000)
    
    print(f"\nOutput file: {OUTPUT_FILE}")
    print(f"Columns: {df.columns.tolist()}")
    print(f"Sample rows: {len(df):,}")
    
    # Correlations
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'pm25' in numeric_cols:
        correlations = df[numeric_cols].corr()['pm25'].drop('pm25').sort_values()
        
        print("\nCorrelations with PM2.5:")
        print("-" * 40)
        for col, corr in correlations.items():
            bar = "+" * int(abs(corr) * 20) if corr > 0 else "-" * int(abs(corr) * 20)
            print(f"  {col:20s} {corr:+.3f} {bar}")
        
        max_corr = correlations.abs().max()
        if max_corr > 0.2:
            print(f"\n✓ GOOD: Best correlation is {max_corr:.2f}")
        elif max_corr > 0.1:
            print(f"\n⚠ WARNING: Best correlation is {max_corr:.2f}")
        else:
            print(f"\n✗ LOW: Best correlation is {max_corr:.2f}")
    
    # Count total rows
    total = sum(1 for _ in open(OUTPUT_FILE)) - 1
    print(f"\nTotal rows in final dataset: {total:,}")

def main():
    total = merge_chunked()
    
    if total > 0:
        validate_output()
        print("\n" + "=" * 70)
        print("MERGE COMPLETE!")
        print("=" * 70)
        print(f"Output: {OUTPUT_FILE}")
        print("\nNext steps:")
        print("1. Upload training_dataset_v2.csv to Google Drive")
        print("2. Update the Colab training notebook to use this dataset")
        print("3. Train the model!")
    else:
        print("\nERROR: No data was matched. Check datetime/lat/lon alignment.")

if __name__ == "__main__":
    main()
