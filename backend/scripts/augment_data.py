import pandas as pd
import numpy as np
import os
from datetime import datetime

# Config
GROUND_DIR = "backend/data/ground_truth"
SPACE_DIR = "backend/data/space"
OUTPUT_FILE = "backend/data/training_dataset.csv"

def load_ground_data():
    print("📂 Loading Ground Truth CSVs...")
    all_files = [f for f in os.listdir(GROUND_DIR) if f.endswith('.csv')]
    if not all_files:
        print("⚠️ No Ground Truth files found.")
        return pd.DataFrame()
        
    df_list = []
    for f in all_files:
        path = os.path.join(GROUND_DIR, f)
        try:
            temp = pd.read_csv(path)
            if 'datetime' in temp.columns:
                temp['datetime'] = pd.to_datetime(temp['datetime'])
                temp['date_str'] = temp['datetime'].dt.strftime('%Y-%m-%d') # key for merging
                df_list.append(temp)
        except Exception as e:
            print(f"❌ Error reading {f}: {e}")
            
    if not df_list:
        return pd.DataFrame()
        
    full = pd.concat(df_list)
    print(f"✅ Loaded {len(full)} Ground Truth records.")
    return full

def load_space_data():
    print("🛰️ Loading NASA/Giovanni CSVs...")
    if not os.path.exists(SPACE_DIR):
        os.makedirs(SPACE_DIR)
        return pd.DataFrame()
        
    all_files = [f for f in os.listdir(SPACE_DIR) if f.endswith('.csv')]
    if not all_files:
        print("⚠️ No Satellite files found in 'backend/data/space'.")
        return pd.DataFrame()
    
    dfs = []
    for f in all_files:
        path = os.path.join(SPACE_DIR, f)
        try:
            # NASA CSVs often have comments at top. We search for the header.
            # Usually header starts with 'time', 'date', or similar.
            # We'll use a robust parser that skips lines until it finds a dataframe structure.
            
            # Robust Header Search
            header_line = 0
            with open(path, 'r') as file_obj:
                lines = file_obj.readlines()
                for i, line in enumerate(lines):
                    # Giovanni headers usually start with 'time,' or 'Time,'
                    if line.strip().lower().startswith('time,'):
                        header_line = i
                        break
                    # Fallback: check if 'time' is in the line but it's not the first line (metadata)
                    # and ensure it looks like a CSV header (has comma)
                    # Explicitly exclude metadata lines containing 'URL', 'http', 'Title', 'User', 'Fill Value'
                    if ('time' in line.lower() and ',' in line 
                        and 'Title' not in line 
                        and 'User' not in line 
                        and 'URL' not in line 
                        and 'http' not in line
                        and 'Fill Value' not in line):
                         header_line = i
                         break
            
            print(f"   Reading {f} (Header at line {header_line})...")
            # Giovanni uses -1.267651e+30 as fill value
            temp = pd.read_csv(path, skiprows=header_line, na_values=['-1.267651e+30', -1.267651e+30])
            
            # Normalize Time Column
            time_col = None
            for c in temp.columns:
                if 'time' in c.lower() or 'date' in c.lower():
                    time_col = c
                    break
            
            if time_col:
                temp['datetime'] = pd.to_datetime(temp[time_col])
                temp['date_str'] = temp['datetime'].dt.strftime('%Y-%m-%d')
                
                # Identify Variable columns
                # We expect NO2 or Dust/Aerosol
                # We rename them to generic 'sat_value' or specific if we can guess
                
                # Check for NO2
                if 'no2' in f.lower() or 'omno2' in f.lower() or 'giovanni' in f.lower():
                    # Find the value column (usually the 2nd column)
                    val_col = temp.columns[1] 
                    temp = temp.rename(columns={val_col: 'sat_no2'})
                    temp = temp[['date_str', 'sat_no2']]
                    dfs.append(temp)
                    print(f"   Mapped {f} as NO2 Data")
                    
                # Check for AOD/Dust/AOT
                elif 'aod' in f.lower() or 'aerosol' in f.lower() or 'm2t' in f.lower() or 'aot' in f.lower():
                    val_col = temp.columns[1] 
                    # User requested sat_aot
                    temp = temp.rename(columns={val_col: 'sat_aot'})
                    temp = temp[['date_str', 'sat_aot']]
                    dfs.append(temp)
                    print(f"   Mapped {f} as AOT/AOD Data")
                    
                # Check for PBLH
                elif 'pblh' in f.lower():
                    val_col = temp.columns[1]
                    temp = temp.rename(columns={val_col: 'sat_pblh'})
                    temp = temp[['date_str', 'sat_pblh']]
                    dfs.append(temp)
                    print(f"   Mapped {f} as PBLH Data")
                    
                # Check for RH
                elif 'rh' in f.lower() or 'humidity' in f.lower():
                    val_col = temp.columns[1]
                    temp = temp.rename(columns={val_col: 'sat_humidity'})
                    temp = temp[['date_str', 'sat_humidity']]
                    dfs.append(temp)
                    print(f"   Mapped {f} as Humidity Data")
                    
        except Exception as e:
            print(f"   Skipping {f} (Parse Error): {e}")

    if not dfs:
        return pd.DataFrame()
        
    # Merge all space DFs on date
    final_space = dfs[0]
    for d in dfs[1:]:
        final_space = final_space.merge(d, on='date_str', how='outer')
        
    print(f"✅ Loaded Satellite Data spanning {len(final_space)} days.")
    return final_space

def merge_datasets(ground_df, space_df):
    print("🔗 Merging Ground & Space Data...")
    
    if space_df.empty:
        print("⚠️ Warning: Merging without satellite data (Features will be NaN).")
        ground_df['sat_no2'] = np.nan
        ground_df['sat_aod'] = np.nan
        ground_df['pblh'] = 1000 # Default
        ground_df['humidity'] = 50 # Default
        return ground_df

    # Left Join: Keep all ground truth, add satellite data where dates match
    merged = pd.merge(ground_df, space_df, on='date_str', how='left')
    
    # Fill missing satellite days with interpolation or mean to save rows
    if 'sat_no2' in merged.columns:
        merged['sat_no2'] = merged['sat_no2'].interpolate(limit_direction='both')
    
    if 'sat_aod' in merged.columns:
        merged['sat_aod'] = merged['sat_aod'].interpolate(limit_direction='both')
        
    if 'sat_aot' in merged.columns:
        merged['sat_aot'] = merged['sat_aot'].interpolate(limit_direction='both')
        
    if 'sat_pblh' in merged.columns:
        merged['sat_pblh'] = merged['sat_pblh'].interpolate(limit_direction='both')
        
    if 'sat_humidity' in merged.columns:
        merged['sat_humidity'] = merged['sat_humidity'].interpolate(limit_direction='both')
    
    return merged

def main():
    ground = load_ground_data()
    if ground.empty:
        print("❌ Waiting for Ground Truth harvest to finish...")
        return

    space = load_space_data()
    
    merged = merge_datasets(ground, space)
    merged = merged.dropna(subset=['pm25'])
    
    merged.to_csv(OUTPUT_FILE, index=False)
    print(f"💾 Saved Merged Dataset to {OUTPUT_FILE}")
    print(f"📊 Rows: {len(merged)}")
    if len(merged) > 1000000:
        print("⚠️ NOTE: The dataset has over 1 million rows. Older Excel versions (and some editors) may truncate the view at 1,048,576 rows.")


if __name__ == "__main__":
    main()
