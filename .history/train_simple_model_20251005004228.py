import os
import pandas as pd

def load_and_process_data():
    """Load and process all CSV data files from the training_data directory."""
    print("Loading CSV data files...")
    
    # Define paths to your data folders
    us_data_path = 'training_data/us'
    ghana_data_path = 'training_data/ghana'

    # Define the expected US files and their corresponding pollutants
    us_files_map = {
        'daily_88502_2025.csv': 'PM2.5',
        'daily_44201_2025.csv': 'O3',
        'daily_42602_2025.csv': 'NO2'
    }
    
    all_data = []

    # --- Load US Data ---
    print(f"\n--- Loading US Data from: {us_data_path} ---")
    for filename, pollutant in us_files_map.items():
        filepath = os.path.join(us_data_path, filename)
        
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} not found, skipping {pollutant}")
            continue
        
        print(f"Loading {pollutant} data from {filepath}...")
        df = pd.read_csv(filepath, on_bad_lines='skip')
        
        # Standardize columns
        df['pollutant'] = pollutant
        df['value'] = df['Arithmetic Mean']
        df['date'] = pd.to_datetime(df['Date Local'])
        df['lat'] = df['Latitude']
        df['lon'] = df['Longitude']
        
        df = df[['pollutant', 'value', 'date', 'lat', 'lon', 'State Name', 'County Name', 'City Name']]
        all_data.append(df)
        print(f"  Loaded {len(df)} records for {pollutant}")

    # --- Load Ghana Data ---
    print(f"\n--- Loading Ghana Data from: {ghana_data_path} ---")
    if os.path.exists(ghana_data_path):
        ghana_files = [f for f in os.listdir(ghana_data_path) if f.endswith('.csv')]
        for filename in ghana_files:
            filepath = os.path.join(ghana_data_path, filename)
            print(f"Loading PM2.5 data from {filepath}...")
            # Assuming Ghana data is PM2.5 and has a compatible format
            # You might need to adjust column names here if they are different
            try:
                df = pd.read_csv(filepath, on_bad_lines='skip')
                df['pollutant'] = 'PM2.5' # Manually assign the pollutant type
                
                # IMPORTANT: Adjust these column names if your Ghana CSV is different
                df['value'] = df['Arithmetic Mean'] 
                df['date'] = pd.to_datetime(df['Date Local'])
                df['lat'] = df['Latitude']
                df['lon'] = df['Longitude']
                df['State Name'] = 'Ashanti' # Example, add placeholder if needed
                df['County Name'] = 'Kumasi' # Example
                df['City Name'] = 'Accra' # Example
                
                df = df[['pollutant', 'value', 'date', 'lat', 'lon', 'State Name', 'County Name', 'City Name']]
                all_data.append(df)
                print(f"  Loaded {len(df)} records for PM2.5 from Ghana")
            except Exception as e:
                print(f"Warning: Could not process {filepath}. Check column names. Error: {e}")

    if not all_data:
        print("ERROR: No data files could be loaded! Check your file paths and names.")
        return None
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"\nTotal records combined: {len(combined_df)}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    
    return combined_df

if __name__ == "__main__":
    print("--- Script execution started. ---")
    try:
        main()
    except Exception as e:
        print("\n❌ AN UNEXPECTED ERROR OCCURRED:")
        print(f"   ERROR TYPE: {type(e).__name__}")
        print(f"   ERROR DETAILS: {e}")
        import traceback
        traceback.print_exc() # Prints the full traceback for detailed debugging

    print("\n--- Script execution finished. ---")