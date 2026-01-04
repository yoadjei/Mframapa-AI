"""Merge Ground Truth with Satellite Data"""

import pandas as pd
import numpy as np
from pathlib import Path

GROUND_DIR = Path("backend/data/ground_truth")
SPACE_DIR = Path("backend/data/space")
OUTPUT_FILE = Path("backend/data/training_dataset.csv")


def load_ground_data():
    print("Loading ground truth...")
    if not GROUND_DIR.exists(): return pd.DataFrame()
    
    df_list = []
    for f in GROUND_DIR.glob("*.csv"):
        try:
            temp = pd.read_csv(f)
            if 'datetime' in temp.columns:
                temp['datetime'] = pd.to_datetime(temp['datetime'])
                temp['date_str'] = temp['datetime'].dt.strftime('%Y-%m-%d')
                df_list.append(temp)
        except Exception as e:
            print(f"Error reading {f.name}: {e}")
    
    if not df_list: return pd.DataFrame()
    full = pd.concat(df_list)
    print(f"Loaded {len(full)} records")
    return full


def load_space_data():
    print("Loading satellite data...")
    if not SPACE_DIR.exists(): return pd.DataFrame()
    
    dfs = []
    for f in SPACE_DIR.glob("*.csv"):
        try:
            temp = pd.read_csv(f, skiprows=0)
            time_col = next((c for c in temp.columns if 'time' in c.lower()), None)
            if time_col:
                temp['datetime'] = pd.to_datetime(temp[time_col])
                temp['date_str'] = temp['datetime'].dt.strftime('%Y-%m-%d')
                val_col = temp.columns[1]
                
                if 'no2' in f.name.lower():
                    temp = temp.rename(columns={val_col: 'sat_no2'})[['date_str', 'sat_no2']]
                elif 'aot' in f.name.lower():
                    temp = temp.rename(columns={val_col: 'sat_aot'})[['date_str', 'sat_aot']]
                elif 'pblh' in f.name.lower():
                    temp = temp.rename(columns={val_col: 'sat_pblh'})[['date_str', 'sat_pblh']]
                elif 'rh' in f.name.lower():
                    temp = temp.rename(columns={val_col: 'sat_humidity'})[['date_str', 'sat_humidity']]
                dfs.append(temp)
        except:
            pass
    
    if not dfs: return pd.DataFrame()
    
    final = dfs[0]
    for d in dfs[1:]:
        final = final.merge(d, on='date_str', how='outer')
    return final


def main():
    ground = load_ground_data()
    if ground.empty:
        print("No ground truth data")
        return

    space = load_space_data()
    
    if space.empty:
        ground['sat_no2'] = np.nan
        ground['sat_aot'] = np.nan
        merged = ground
    else:
        merged = pd.merge(ground, space, on='date_str', how='left')
        for col in ['sat_no2', 'sat_aot', 'sat_pblh', 'sat_humidity']:
            if col in merged.columns:
                merged[col] = merged[col].interpolate(limit_direction='both')
    
    merged = merged.dropna(subset=['pm25'])
    merged.to_csv(OUTPUT_FILE, index=False)
    print(f"Saved {len(merged)} rows to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
