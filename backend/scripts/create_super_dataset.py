"""
Mframapa AI - Super Dataset Merge (with Auto-Resume)
Combines:
1. Ground Truth (PM2.5) - 410 stations
2. Satellite Data Raw (Weather) - 409 stations  
3. Training Dataset V1 (NASA features) - 55 stations

Features:
- Error handling with retries
- Auto-resume from checkpoint
- Progress tracking
"""

import pandas as pd
import numpy as np
from pathlib import Path
import gc
import sys
import json
import time
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
GROUND_TRUTH_DIR = DATA_DIR / "ground_truth"

SATELLITE_FILE = DATA_DIR / "satellite_data_raw.csv"
TRAINING_V1_FILE = DATA_DIR / "training_dataset.csv"
OUTPUT_FILE = DATA_DIR / "super_training_dataset.csv"
CHECKPOINT_FILE = DATA_DIR / "merge_checkpoint.json"

CHUNK_SIZE = 100000


def save_checkpoint(step, data=None):
    """Save progress checkpoint."""
    checkpoint = {
        'step': step,
        'timestamp': datetime.now().isoformat(),
        'data': data or {}
    }
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f, indent=2)
    print(f"  [Checkpoint saved: {step}]")


def load_checkpoint():
    """Load checkpoint if exists."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, 'r') as f:
                return json.load(f)
        except:
            return None
    return None


def clear_checkpoint():
    """Clear checkpoint after completion."""
    if CHECKPOINT_FILE.exists():
        CHECKPOINT_FILE.unlink()


def load_ground_truth():
    """Load all PM2.5 ground truth files."""
    print("\n[1/4] Loading ground truth PM2.5 data...")
    
    all_data = []
    files = list(GROUND_TRUTH_DIR.glob("*.csv"))
    
    for i, f in enumerate(files):
        try:
            df = pd.read_csv(f)
            if all(c in df.columns for c in ['location', 'lat', 'lon', 'datetime', 'pm25']):
                all_data.append(df[['location', 'lat', 'lon', 'datetime', 'pm25']])
            print(f"  [{i+1}/{len(files)}] {f.name}: {len(df):,} rows")
        except Exception as e:
            print(f"  [ERROR] {f.name}: {e}")
            continue
    
    if not all_data:
        raise ValueError("No ground truth data loaded!")
    
    pm25_df = pd.concat(all_data, ignore_index=True)
    
    # Parse datetime
    print("  Parsing datetimes...")
    pm25_df['datetime'] = pd.to_datetime(pm25_df['datetime'], utc=True, errors='coerce')
    pm25_df = pm25_df.dropna(subset=['datetime'])
    pm25_df['datetime'] = pm25_df['datetime'].dt.tz_localize(None)
    pm25_df['datetime_hour'] = pm25_df['datetime'].dt.floor('h')
    
    # Create match key
    pm25_df['match_key'] = pm25_df['location'].astype(str) + '_' + pm25_df['datetime_hour'].astype(str)
    
    print(f"  ✓ Loaded {len(pm25_df):,} PM2.5 readings from {pm25_df['location'].nunique()} stations")
    return pm25_df


def load_satellite_chunked(checkpoint_chunks=0):
    """Load satellite data in chunks with resume support."""
    print(f"\n[2/4] Loading satellite data (weather)...")
    
    if checkpoint_chunks > 0:
        print(f"  Resuming from chunk {checkpoint_chunks}...")
    
    sat_cols = ['datetime', 'location', 'temperature_2m', 'relative_humidity', 
                'surface_pressure', 'cloud_cover', 'wind_speed_10m', 'precipitation']
    
    all_records = {}
    chunk_num = 0
    
    try:
        for chunk in pd.read_csv(SATELLITE_FILE, usecols=sat_cols, chunksize=500000):
            chunk_num += 1
            
            # Skip already processed chunks
            if chunk_num <= checkpoint_chunks:
                continue
            
            try:
                chunk['datetime'] = pd.to_datetime(chunk['datetime'], errors='coerce')
                chunk = chunk.dropna(subset=['datetime'])
                chunk['datetime_hour'] = chunk['datetime'].dt.floor('h')
                chunk['match_key'] = chunk['location'].astype(str) + '_' + chunk['datetime_hour'].astype(str)
                
                # Keep only weather columns
                for _, row in chunk.iterrows():
                    key = row['match_key']
                    if key not in all_records:
                        all_records[key] = {
                            'temperature_2m': row['temperature_2m'],
                            'relative_humidity': row['relative_humidity'],
                            'surface_pressure': row['surface_pressure'],
                            'cloud_cover': row['cloud_cover'],
                            'wind_speed_10m': row['wind_speed_10m'],
                            'precipitation': row['precipitation']
                        }
                
                if chunk_num % 10 == 0:
                    print(f"  Chunk {chunk_num}: {len(all_records):,} unique records")
                    save_checkpoint('satellite', {'chunks_processed': chunk_num})
                
                gc.collect()
                
            except Exception as e:
                print(f"  [ERROR] Chunk {chunk_num}: {e}")
                continue
                
    except Exception as e:
        print(f"  [ERROR] Reading satellite file: {e}")
        save_checkpoint('satellite_error', {'chunks_processed': chunk_num, 'error': str(e)})
        raise
    
    # Convert to DataFrame
    print(f"  Converting {len(all_records):,} records to DataFrame...")
    sat_df = pd.DataFrame([
        {'match_key': k, **v} for k, v in all_records.items()
    ])
    
    print(f"  ✓ Loaded {len(sat_df):,} satellite records")
    return sat_df


def load_training_v1_chunked():
    """Load training V1 for NASA features."""
    print("\n[3/4] Loading training V1 (NASA features)...")
    
    if not TRAINING_V1_FILE.exists():
        print("  [SKIP] training_dataset.csv not found")
        return None
    
    try:
        # Check available columns
        sample = pd.read_csv(TRAINING_V1_FILE, nrows=5)
        nasa_cols = ['sat_aot', 'sat_no2', 'sat_pblh', 'pop_density']
        available = [c for c in nasa_cols if c in sample.columns]
        
        if not available:
            print("  [SKIP] No NASA columns found")
            return None
        
        print(f"  Found NASA columns: {available}")
        
        # Load with chunking
        all_records = {}
        chunk_num = 0
        
        for chunk in pd.read_csv(TRAINING_V1_FILE, usecols=['location', 'datetime'] + available, chunksize=500000):
            chunk_num += 1
            
            try:
                chunk['datetime'] = pd.to_datetime(chunk['datetime'], utc=True, errors='coerce')
                chunk = chunk.dropna(subset=['datetime'])
                chunk['datetime'] = chunk['datetime'].dt.tz_localize(None)
                chunk['datetime_hour'] = chunk['datetime'].dt.floor('h')
                chunk['match_key'] = chunk['location'].astype(str) + '_' + chunk['datetime_hour'].astype(str)
                
                for _, row in chunk.iterrows():
                    key = row['match_key']
                    if key not in all_records:
                        record = {}
                        for col in available:
                            record[col] = row[col]
                        all_records[key] = record
                
                if chunk_num % 5 == 0:
                    print(f"  Chunk {chunk_num}: {len(all_records):,} records")
                
                gc.collect()
                
            except Exception as e:
                print(f"  [ERROR] V1 Chunk {chunk_num}: {e}")
                continue
        
        v1_df = pd.DataFrame([
            {'match_key': k, **v} for k, v in all_records.items()
        ])
        
        print(f"  ✓ Loaded {len(v1_df):,} V1 records")
        return v1_df
        
    except Exception as e:
        print(f"  [ERROR] Loading V1: {e}")
        return None


def merge_and_save(pm25_df, sat_df, v1_df):
    """Merge all datasets and save."""
    print("\n[4/4] Merging datasets...")
    
    # Merge PM2.5 with satellite
    print("  Joining PM2.5 + Satellite...")
    merged = pm25_df.merge(sat_df, on='match_key', how='left')
    matched = merged['temperature_2m'].notna().sum()
    print(f"    Weather matched: {matched:,} / {len(merged):,} ({100*matched/len(merged):.1f}%)")
    
    # Merge with V1 if available
    if v1_df is not None and len(v1_df) > 0:
        print("  Joining with NASA features...")
        merged = merged.merge(v1_df, on='match_key', how='left')
        if 'sat_aot' in merged.columns:
            nasa_matched = merged['sat_aot'].notna().sum()
            print(f"    NASA matched: {nasa_matched:,} / {len(merged):,}")
    
    # Add derived features
    print("  Adding derived features...")
    merged['hour'] = merged['datetime_hour'].dt.hour
    merged['month'] = merged['datetime_hour'].dt.month
    merged['day_of_week'] = merged['datetime_hour'].dt.dayofweek
    
    # Rename columns
    merged = merged.rename(columns={
        'temperature_2m': 'temp',
        'relative_humidity': 'humidity',
        'surface_pressure': 'pressure',
        'cloud_cover': 'clouds',
        'wind_speed_10m': 'wind_speed',
        'precipitation': 'precip'
    })
    
    # Select final columns
    final_cols = ['datetime', 'location', 'lat', 'lon', 'pm25',
                  'hour', 'month', 'day_of_week',
                  'temp', 'humidity', 'pressure', 'wind_speed', 'clouds', 'precip']
    
    for col in ['sat_aot', 'sat_no2', 'sat_pblh', 'pop_density']:
        if col in merged.columns:
            final_cols.append(col)
    
    final_cols = [c for c in final_cols if c in merged.columns]
    merged = merged[final_cols]
    
    # Drop rows without weather
    before = len(merged)
    merged = merged.dropna(subset=['temp'])
    print(f"  Dropped {before - len(merged):,} rows without weather data")
    
    # Save
    print(f"  Saving to {OUTPUT_FILE}...")
    merged.to_csv(OUTPUT_FILE, index=False)
    
    return merged


def validate(df):
    """Validate output."""
    print("\n" + "=" * 60)
    print("VALIDATION")
    print("=" * 60)
    
    print(f"Rows: {len(df):,}")
    print(f"Stations: {df['location'].nunique()}")
    print(f"Columns: {df.columns.tolist()}")
    
    print("\nCorrelations with PM2.5:")
    numeric = df.select_dtypes(include=[np.number]).columns.tolist()
    if 'pm25' in numeric:
        corr = df[numeric].corr()['pm25'].drop('pm25').sort_values()
        for col, val in corr.items():
            bar = '+' * int(abs(val) * 20) if val > 0 else '-' * int(abs(val) * 20)
            print(f"  {col:15s}: {val:+.3f} {bar}")


def main():
    start = time.time()
    
    print("=" * 60)
    print("SUPER DATASET MERGE")
    print("=" * 60)
    
    # Check for resume
    checkpoint = load_checkpoint()
    if checkpoint:
        print(f"\n[RESUME] Found checkpoint from {checkpoint['timestamp']}")
        print(f"         Step: {checkpoint['step']}")
    
    try:
        # Step 1: Ground Truth
        pm25_df = load_ground_truth()
        save_checkpoint('ground_truth_done')
        
        # Step 2: Satellite (with resume)
        sat_chunks = 0
        if checkpoint and checkpoint['step'] == 'satellite':
            sat_chunks = checkpoint['data'].get('chunks_processed', 0)
        sat_df = load_satellite_chunked(sat_chunks)
        save_checkpoint('satellite_done')
        
        # Step 3: Training V1
        v1_df = load_training_v1_chunked()
        save_checkpoint('v1_done')
        
        # Step 4: Merge
        final_df = merge_and_save(pm25_df, sat_df, v1_df)
        
        # Validate
        validate(final_df)
        
        # Clear checkpoint on success
        clear_checkpoint()
        
        elapsed = time.time() - start
        print("\n" + "=" * 60)
        print(f"✓ COMPLETE in {elapsed/60:.1f} minutes")
        print("=" * 60)
        print(f"Output: {OUTPUT_FILE}")
        print(f"Size: {OUTPUT_FILE.stat().st_size / 1024 / 1024:.1f} MB")
        
    except Exception as e:
        print(f"\n[FATAL ERROR] {e}")
        print("Run again to resume from checkpoint.")
        raise


if __name__ == "__main__":
    main()
