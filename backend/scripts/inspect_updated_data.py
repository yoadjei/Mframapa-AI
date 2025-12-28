import pandas as pd
import os

def inspect_updated_dataset():
    file_path = "backend/data/training_dataset_updated.csv"
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        print("   Did augment_data.py or add_meteo_data.py finish running?")
        return

    print(f"🔍 Inspecting: {file_path}")
    
    try:
        # Read the first 10 rows
        df = pd.read_csv(file_path, nrows=10)
        
        print("\n📋 Columns found:")
        print(df.columns.tolist())
        
        print("\n👀 First 10 rows:")
        print(df.to_string())
        
        print("\n💡 Checking for expected features:")
        expected = ['sat_no2', 'sat_aot', 'sat_pblh', 'sat_humidity', 'pm25']
        for feat in expected:
            if feat in df.columns:
                print(f"   ✅ {feat} exists")
            else:
                print(f"   ⚠️ {feat} MISSING")

    except Exception as e:
        print(f"❌ Error reading file: {e}")

if __name__ == "__main__":
    inspect_updated_dataset()
