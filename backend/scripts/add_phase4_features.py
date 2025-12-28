import pandas as pd
import numpy as np
import os
import sys

# Config
INPUT_FILE = "backend/data/training_dataset.csv"
OUTPUT_FILE = "backend/data/training_dataset_final.csv"
SPACE_DIR = "backend/data/space"

def load_wind_data():
    """
    Loads u10m.csv and v10m.csv.
    Since they are monthly, we prepare them for merging by Month-Year key.
    """
    print("🌬️ Loading Wind Data (Monthly)...")
    
    wind_files = {
        'sat_wind_u': 'u10m.csv',
        'sat_wind_v': 'v10m.csv'
    }
    
    merged_wind = None
    
    for col_name, filename in wind_files.items():
        path = os.path.join(SPACE_DIR, filename)
        if not os.path.exists(path):
            print(f"⚠️ Warning: {filename} not found. Skipping {col_name}.")
            continue
            
        try:
             # Robust Header Search
            header_line = 0
            with open(path, 'r') as file_obj:
                lines = file_obj.readlines()
                for i, line in enumerate(lines):
                    if line.strip().lower().startswith('time,'):
                        header_line = i
                        break
            
            temp = pd.read_csv(path, skiprows=header_line)
            
            # Normalize Time
            time_col = [c for c in temp.columns if 'time' in c.lower()][0]
            val_col = temp.columns[1]
            
            temp['datetime'] = pd.to_datetime(temp[time_col])
            # Create Merge Key (YYYY-MM)
            temp['month_key'] = temp['datetime'].dt.to_period('M').astype(str)
            
            temp = temp.rename(columns={val_col: col_name})
            temp = temp[['month_key', col_name]]
            
            if merged_wind is None:
                merged_wind = temp
            else:
                merged_wind = merged_wind.merge(temp, on='month_key', how='outer')
                
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            
    return merged_wind

def load_population_density(df):
    """
    Loads pd.tif and samples it for unique lat/lon pairs in the dataframe.
    """
    print("👥 Loading Population Density (GeoTIFF)...")
    tif_path = os.path.join(SPACE_DIR, "pd.tif")
    
    if not os.path.exists(tif_path):
        print("⚠️ pd.tif not found. Skipping Population Density.")
        df['pop_density'] = np.nan
        return df

    try:
        import rasterio
    except ImportError:
        print("❌ Critical: 'rasterio' library not installed.")
        print("   Please run: pip install rasterio")
        print("   Skipping Population Density for now.")
        df['pop_density'] = np.nan
        return df

    try:
        # Optimization: Sample only unique locations
        unique_locs = df[['lat', 'lon']].drop_duplicates()
        coordinates = list(zip(unique_locs['lon'], unique_locs['lat'])) # Note: X=lon, Y=lat
        
        print(f"   Sampling raster for {len(unique_locs)} unique locations...")
        
        with rasterio.open(tif_path) as src:
            # sample() expects list of (x, y)
            sampled_values = list(src.sample(coordinates))
            
        # Extract single value from the list (since sample returns array per point)
        # Handle potential nodata
        values = [x[0] for x in sampled_values]
        
        # Map back to main DF
        unique_locs['pop_density'] = values
        
        # Replace large negative nodata with NaN (GPW uses -9999 or similar)
        unique_locs['pop_density'] = unique_locs['pop_density'].replace(-9999, np.nan)
        unique_locs['pop_density'] = unique_locs['pop_density'].replace(to_replace=r'^.*-3\.4e\+38.*$', value=np.nan, regex=True) # Common float nodata

        print("   Merging population data back to main dataset...")
        df = df.merge(unique_locs, on=['lat', 'lon'], how='left')
        
    except Exception as e:
        print(f"❌ Error processing raster: {e}")
        df['pop_density'] = np.nan
        
    return df

def main():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ Input file {INPUT_FILE} not found. Did previous steps run?")
        return
        
    print(f"📂 Loading Dataset: {INPUT_FILE}...")
    df = pd.read_csv(INPUT_FILE)
    
    # 1. Add Wind
    wind_df = load_wind_data()
    if wind_df is not None:
        # Ensure DF has month_key
        if 'datetime' in df.columns:
            df['datetime'] = pd.to_datetime(df['datetime'], utc=True) # Ensure UTC aware/naive consistency?
            # It's safer to convert to string YYYY-MM
            df['month_key'] = df['datetime'].dt.to_period('M').astype(str)
            
            print("🔗 Merging Wind Data via Month-Key...")
            rows_before = len(df)
            df = df.merge(wind_df, on='month_key', how='left')
            if len(df) > rows_before:
                print("⚠️ Warning: Row count increased after merge! Check duplicates in wind data.")
                
            # interpolation shouldn't be needed for monthly fill, but let's check NaNs
            print(f"   Wind coverage: {df['sat_wind_u'].notna().sum()} / {len(df)}")
            
            # Clean up key
            df.drop(columns=['month_key'], inplace=True)
            
    # 2. Add Population (Requires Rasterio)
    df = load_population_density(df)
    
    # Save
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"💾 Saved Final Dataset to {OUTPUT_FILE}")
    print(f"📊 Final Shape: {df.shape}")
    
    print("\n🔎 Inspecting first 10 rows:")
    cols_to_show = ['date_str', 'location', 'sat_no2', 'sat_wind_u', 'sat_wind_v', 'pop_density']
    # filter cols that actually exist
    cols_to_show = [c for c in cols_to_show if c in df.columns]
    print(df[cols_to_show].head(10).to_string())

if __name__ == "__main__":
    main()
