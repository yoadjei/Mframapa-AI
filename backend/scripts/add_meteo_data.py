import pandas as pd
import os

# Config
# We try to load the latest available dataset
EXISTING_DATASET = "backend/data/training_dataset.csv" 
SPACE_DIR = "backend/data/space"
OUTPUT_FILE = "backend/data/training_dataset_updated.csv"

def load_meteo_data():
    print("RT Loading Meteorological Data (PBLH & RH) from space folder...")
    if not os.path.exists(SPACE_DIR):
        print("❌ Space directory not found.")
        return pd.DataFrame()
        
    all_files = [f for f in os.listdir(SPACE_DIR) if f.endswith('.csv')]
    dfs = []
    
    for f in all_files:
        # Only interest in PBLH or RH
        is_pblh = 'pblh' in f.lower()
        is_rh = 'rh' in f.lower() or 'humidity' in f.lower()
        
        if not (is_pblh or is_rh):
            continue
            
        path = os.path.join(SPACE_DIR, f)
        try:
            # Robust Header Search (Reuse logic from augment_data)
            header_line = 0
            with open(path, 'r') as file_obj:
                lines = file_obj.readlines()
                for i, line in enumerate(lines):
                    if line.strip().lower().startswith('time,'):
                        header_line = i
                        break
                    if ('time' in line.lower() and ',' in line 
                        and 'Title' not in line and 'User' not in line and 'URL' not in line):
                         header_line = i
                         break
            
            print(f"   Reading {f} (Header at line {header_line})...")
            # Giovanni uses -1.267651e+30 as fill value
            temp = pd.read_csv(path, skiprows=header_line, na_values=['-1.267651e+30', -1.267651e+30])
            
            # Normalize Time
            time_col = None
            for c in temp.columns:
                if 'time' in c.lower() or 'date' in c.lower():
                    time_col = c
                    break
            
            if time_col:
                temp['datetime'] = pd.to_datetime(temp[time_col])
                temp['date_str'] = temp['datetime'].dt.strftime('%Y-%m-%d')
                
                # Identify Variable columns
                val_col = temp.columns[1] 
                
                if is_pblh:
                    temp = temp.rename(columns={val_col: 'sat_pblh'})
                    temp = temp[['date_str', 'sat_pblh']]
                    print(f"   Mapped {f} as PBLH Data")
                    dfs.append(temp)
                elif is_rh:
                    temp = temp.rename(columns={val_col: 'sat_humidity'})
                    temp = temp[['date_str', 'sat_humidity']]
                    print(f"   Mapped {f} as Humidity Data")
                    dfs.append(temp)

        except Exception as e:
            print(f"   Skipping {f} (Parse Error): {e}")

    if not dfs:
        return pd.DataFrame()
        
    # Merge meteo DFs
    final_meteo = dfs[0]
    for d in dfs[1:]:
        final_meteo = final_meteo.merge(d, on='date_str', how='outer')
        
    print(f"✅ Loaded Meteorological Data.")
    return final_meteo

def main():
    if not os.path.exists(EXISTING_DATASET):
        # Fallback to v2 if main doesn't exist
        fallback = "backend/data/training_dataset_merged_v2.csv"
        if os.path.exists(fallback):
             print(f"⚠️ {EXISTING_DATASET} not found, using {fallback} instead.")
             existing_path = fallback
        else:
            print(f"❌ Critical: No existing training dataset found at {EXISTING_DATASET}")
            return
    else:
        existing_path = EXISTING_DATASET

    print(f"📂 Loading Existing Dataset: {existing_path}...")
    df = pd.read_csv(existing_path)
    print(f"   Rows: {len(df)}")
    
    meteo_df = load_meteo_data()
    
    if meteo_df.empty:
        print("⚠️ No new meteorological data found to merge.")
        return

    print("🔗 Merging...")
    # Left join to append columns to existing rows
    merged = pd.merge(df, meteo_df, on='date_str', how='left')
    
    # Interpolate new columns
    if 'sat_pblh' in merged.columns:
        merged['sat_pblh'] = merged['sat_pblh'].interpolate(limit_direction='both')
        print("   Interpolated PBLH")
        
    if 'sat_humidity' in merged.columns:
        merged['sat_humidity'] = merged['sat_humidity'].interpolate(limit_direction='both')
        print("   Interpolated Humidity")

    merged.to_csv(OUTPUT_FILE, index=False)
    print(f"💾 Saved updated dataset to {OUTPUT_FILE}")
    print(f"📊 New Column Count: {len(merged.columns)}")
    print(f"   Columns: {list(merged.columns)}")

if __name__ == "__main__":
    main()
