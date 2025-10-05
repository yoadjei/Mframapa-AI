# Mframapa AI - Final Training Script
# This script loads ground truth data, engineers features, trains a model for each
# pollutant, and saves the final model files.

import os
import pickle
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def load_and_process_data():
    """Load and process all CSV data files from the training_data directory."""
    print("Loading CSV data files...")
    
    # Define paths to your data folders
    us_data_path = 'training data/us'
    ghana_data_path = 'training data/ghana'

    # Define the expected US files and their corresponding pollutants
    us_files_map = {
        'daily_88101_2025.csv': 'PM2.5', # Official PM2.5
        'daily_44201_2025.csv': 'O3',
        'daily_42602_2025.csv': 'NO2'
    }
    
    all_data = []

    # --- Load US Data ---
    print(f"\n--- Loading US Data from: {us_data_path} ---")
    if os.path.exists(us_data_path):
        for filename, pollutant in us_files_map.items():
            filepath = os.path.join(us_data_path, filename)
            
            if not os.path.exists(filepath):
                print(f"Warning: {filepath} not found, skipping {pollutant}")
                continue
            
            print(f"Loading {pollutant} data from {filepath}...")
            df = pd.read_csv(filepath, on_bad_lines='skip', low_memory=False)
            
            # Standardize columns
            df['pollutant'] = pollutant
            df['value'] = df['Arithmetic Mean']
            df['date'] = pd.to_datetime(df['Date Local'])
            df['lat'] = df['Latitude']
            df['lon'] = df['Longitude']
            
            df = df[['pollutant', 'value', 'date', 'lat', 'lon', 'State Name', 'County Name', 'City Name']]
            all_data.append(df)
            print(f"  Loaded {len(df)} records for {pollutant}")
    else:
        print(f"Warning: US data directory not found at {us_data_path}")

    # --- Load Ghana Data ---
    print(f"\n--- Loading Ghana Data from: {ghana_data_path} ---")
    if os.path.exists(ghana_data_path):
        ghana_files = [f for f in os.listdir(ghana_data_path) if f.endswith('.csv')]
        for filename in ghana_files:
            filepath = os.path.join(ghana_data_path, filename)
            print(f"Loading PM2.5 data from {filepath}...")
            try:
                df = pd.read_csv(filepath, on_bad_lines='skip')
                df['pollutant'] = 'PM2.5'
                
                # IMPORTANT: Assumes Ghana CSV has compatible column names.
                # If these names are different, the script will throw an error here.
                df['value'] = df['Arithmetic Mean'] 
                df['date'] = pd.to_datetime(df['Date Local'])
                df['lat'] = df['Latitude']
                df['lon'] = df['Longitude']
                df['State Name'] = 'Ashanti' # Placeholder
                df['County Name'] = 'Accra' # Placeholder
                df['City Name'] = 'Accra' # Placeholder
                
                df = df[['pollutant', 'value', 'date', 'lat', 'lon', 'State Name', 'County Name', 'City Name']]
                all_data.append(df)
                print(f"  Loaded {len(df)} records for PM2.5 from Ghana")
            except Exception as e:
                print(f"Warning: Could not process {filepath}. Check column names. Error: {e}")

    if not all_data:
        print("ERROR: No data files could be loaded! Check your file paths and names.")
        return None
    
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"\nTotal records combined: {len(combined_df)}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    
    return combined_df

def engineer_features(df):
    """Create temporal and spatial features."""
    print("\nEngineering features...")
    df = df.dropna(subset=['date', 'lat', 'lon', 'value'])
    
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    df['dayofweek'] = df['date'].dt.dayofweek
    df['dayofyear'] = df['date'].dt.dayofyear
    
    lat_mean, lat_std = df['lat'].mean(), df['lat'].std()
    lon_mean, lon_std = df['lon'].mean(), df['lon'].std()
    
    df['lat_norm'] = (df['lat'] - lat_mean) / lat_std
    df['lon_norm'] = (df['lon'] - lon_mean) / lon_std
    
    # Store normalization params for inference
    df.attrs['normalization_params'] = {
        'lat_mean': lat_mean, 'lat_std': lat_std,
        'lon_mean': lon_mean, 'lon_std': lon_std
    }
    
    print(f"Feature engineering complete. Dataset shape: {df.shape}")
    return df

def train_models(df):
    """Train separate XGBoost models for each pollutant."""
    print("\nTraining models...")
    feature_columns = ['lat', 'lon', 'lat_norm', 'lon_norm', 'year', 'month', 'day', 'dayofweek', 'dayofyear']
    models = {}
    results = {}
    
    for pollutant in df['pollutant'].unique():
        print(f"\n{'='*60}\nTraining model for {pollutant}\n{'='*60}")
        pollutant_df = df[df['pollutant'] == pollutant].copy()
        
        if len(pollutant_df) < 100:
            print(f"Insufficient data for {pollutant} ({len(pollutant_df)} records). Skipping...")
            continue
            
        X = pollutant_df[feature_columns]
        y = pollutant_df['value']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        print(f"Training set: {len(X_train)} samples, Test set: {len(X_test)} samples")
        
        model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1
        )
        
        print("Fitting XGBoost model...")
        model.fit(X_train, y_train, eval_set=[(X_test, y_test)], early_stopping_rounds=10, verbose=False)
        
        y_pred = model.predict(X_test)
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        test_r2 = r2_score(y_test, y_pred)
        
        print(f"\nModel Performance:\n  Test RMSE: {test_rmse:.3f}\n  Test R²: {test_r2:.3f}")
        models[pollutant] = model
        results[pollutant] = {'test_rmse': test_rmse, 'test_r2': test_r2}
        
    return models, feature_columns, results

def save_models(models, feature_columns, normalization_params):
    """Save trained models and metadata."""
    print("\n" + "="*60 + "\nSaving models...\n" + "="*60)
    os.makedirs('models', exist_ok=True)
    
    for pollutant, model in models.items():
        clean_name = pollutant.lower().replace('.', '')
        model_path = f'models/xgboost_model_{clean_name}.json'
        model.save_model(model_path)
        print(f"✓ Saved {pollutant} model to {model_path}")
        
    with open('models/feature_columns.pkl', 'wb') as f:
        pickle.dump(feature_columns, f)
    print("✓ Saved feature columns")
    
    with open('models/normalization_params.pkl', 'wb') as f:
        pickle.dump(normalization_params, f)
    print("✓ Saved normalization parameters")
    
    print("\n✅ All models and metadata saved successfully!")

def main():
    """Main training pipeline."""
    print("="*60 + "\nMframapa AI - Model Training Pipeline\n" + "="*60 + "\n")
    
    df = load_and_process_data()
    if df is None:
        print("ERROR: Failed to load data. Exiting.")
        return
    
    df = engineer_features(df)
    
    models, feature_columns, results = train_models(df)
    
    if not models:
        print("ERROR: No models were trained successfully. Exiting.")
        return
        
    normalization_params = df.attrs.get('normalization_params')
    save_models(models, feature_columns, normalization_params)
    
    print("\n" + "="*60 + "\nTRAINING SUMMARY\n" + "="*60)
    print(f"Trained {len(models)} models: {', '.join(models.keys())}")
    for pollutant, metrics in results.items():
        print(f"\n{pollutant} Performance:\n  Test RMSE: {metrics['test_rmse']:.3f}\n  Test R²: {metrics['test_r2']:.3f}")
    
    print("\n" + "="*60 + "\n✅ Training completed successfully!\n" + "="*60)

if __name__ == "__main__":
    print("--- Script execution started. ---")
    try:
        main()
    except Exception as e:
        print("\n❌ AN UNEXPECTED ERROR OCCURRED:")
        print(f"   ERROR TYPE: {type(e).__name__}")
        print(f"   ERROR DETAILS: {e}")
        import traceback
        traceback.print_exc() 
    
    print("\n--- Script execution finished. ---")