import pandas as pd
import os

def inspect_dataset():
    # Priority list of files to check
    files = [
        "backend/data/training_dataset.csv"
    ]
    
    target_file = None
    for f in files:
        if os.path.exists(f):
            target_file = f
            break
            
    if not target_file:
        print("❌ No training dataset found in backend/data/")
        print(f"Checked: {files}")
        return

    print(f"🔍 Inspecting: {target_file}")
    
    try:
        # Read just the header first
        df_head = pd.read_csv(target_file, nrows=5)
        print("\n📋 Columns found:")
        print(df_head.columns.tolist())
        
        print("\n👀 First 5 rows:")
        print(df_head)
        
        # Read a random sample (requires reading more, but efficiently)
        # We'll just read the first chunk to show types and values
        print("\n📊 Data Types:")
        print(df_head.dtypes)
        
        print("\n💡 Checking specific satellite features:")
        for feat in ['sat_no2', 'sat_aod', 'sat_aot', 'pm25']:
            if feat in df_head.columns:
                print(f"   ✅ {feat} exists")
            else:
                print(f"   ⚠️ {feat} MISSING")

    except Exception as e:
        print(f"❌ Error reading file: {e}")

if __name__ == "__main__":
    inspect_dataset()
