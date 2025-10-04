"""
Simplified model training script for Mframapa AI.
Trains XGBoost models using only the available CSV ground truth data.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import os
import pickle

def load_and_process_data():
    """Load and process all CSV data files."""
    print("Loading CSV data files...")
    
    data_files = {
        'PM2.5': 'attached_assets/daily_88502_2025_1759618101295.csv',
        'O3': 'attached_assets/daily_44201_2025_1759618101294.csv',
        'NO2': 'attached_assets/daily_42602_2025_1759618101294.csv'
    }
    
    all_data = []
    
    for pollutant, filepath in data_files.items():
        if not os.path.exists(filepath):
            print(f"Warning: {filepath} not found, skipping {pollutant}")
            continue
        
        print(f"Loading {pollutant} data from {filepath}...")
        df = pd.read_csv(filepath)
        
        # Standardize column names
        df['pollutant'] = pollutant
        df['value'] = df['Arithmetic Mean']
        df['date'] = pd.to_datetime(df['Date Local'])
        df['lat'] = df['Latitude']
        df['lon'] = df['Longitude']
        
        # Select relevant columns
        df = df[['pollutant', 'value', 'date', 'lat', 'lon', 'State Name', 'County Name', 'City Name']]
        
        all_data.append(df)
        print(f"  Loaded {len(df)} records for {pollutant}")
    
    if not all_data:
        print("ERROR: No data files found!")
        return None
    
    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"\nTotal records: {len(combined_df)}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    
    return combined_df

def engineer_features(df):
    """Create temporal and spatial features."""
    print("\nEngineering features...")
    
    # Temporal features
    df['year'] = df['date'].dt.year
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    df['dayofweek'] = df['date'].dt.dayofweek
    df['dayofyear'] = df['date'].dt.dayofyear
    df['week'] = df['date'].dt.isocalendar().week
    df['season'] = (df['month'] - 1) // 3  # 0=Winter, 1=Spring, 2=Summer, 3=Fall
    df['is_weekend'] = (df['dayofweek'] >= 5).astype(int)
    
    # Cyclical encoding for temporal features
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    df['day_sin'] = np.sin(2 * np.pi * df['day'] / 31)
    df['day_cos'] = np.cos(2 * np.pi * df['day'] / 31)
    df['dayofweek_sin'] = np.sin(2 * np.pi * df['dayofweek'] / 7)
    df['dayofweek_cos'] = np.cos(2 * np.pi * df['dayofweek'] / 7)
    
    # Spatial features - save normalization params
    lat_mean = df['lat'].mean()
    lat_std = df['lat'].std()
    lon_mean = df['lon'].mean()
    lon_std = df['lon'].std()
    
    df['lat_norm'] = (df['lat'] - lat_mean) / lat_std
    df['lon_norm'] = (df['lon'] - lon_mean) / lon_std
    
    # Store normalization params for inference
    df.attrs['lat_mean'] = lat_mean
    df.attrs['lat_std'] = lat_std
    df.attrs['lon_mean'] = lon_mean
    df.attrs['lon_std'] = lon_std
    
    # Interaction features
    df['lat_month'] = df['lat_norm'] * df['month']
    df['lon_month'] = df['lon_norm'] * df['month']
    df['lat_lon'] = df['lat_norm'] * df['lon_norm']
    
    # Remove rows with missing values
    df = df.dropna(subset=['value'])
    
    print(f"Feature engineering complete. Dataset shape: {df.shape}")
    
    return df

def train_models(df):
    """Train separate XGBoost models for each pollutant."""
    print("\nTraining models...")
    
    # Define feature columns
    feature_columns = [
        'lat', 'lon', 'lat_norm', 'lon_norm',
        'year', 'month', 'day', 'dayofweek', 'dayofyear', 'week', 'season', 'is_weekend',
        'month_sin', 'month_cos', 'day_sin', 'day_cos', 'dayofweek_sin', 'dayofweek_cos',
        'lat_month', 'lon_month', 'lat_lon'
    ]
    
    models = {}
    results = {}
    
    # Train model for each pollutant
    for pollutant in df['pollutant'].unique():
        print(f"\n{'='*60}")
        print(f"Training model for {pollutant}")
        print(f"{'='*60}")
        
        # Filter data for current pollutant
        pollutant_df = df[df['pollutant'] == pollutant].copy()
        
        if len(pollutant_df) < 100:
            print(f"Insufficient data for {pollutant} ({len(pollutant_df)} records). Skipping...")
            continue
        
        # Prepare features and target
        X = pollutant_df[feature_columns]
        y = pollutant_df['value']
        
        # Handle any remaining NaN values
        X = X.fillna(X.median())
        y = y.fillna(y.median())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        print(f"Training set: {len(X_train)} samples")
        print(f"Test set: {len(X_test)} samples")
        
        # Configure and train XGBoost model
        model = xgb.XGBRegressor(
            n_estimators=150,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=3,
            gamma=0.1,
            reg_alpha=0.05,
            reg_lambda=1.0,
            random_state=42,
            n_jobs=-1
        )
        
        print("Training model...")
        model.fit(
            X_train, y_train,
            eval_set=[(X_test, y_test)],
            verbose=False
        )
        
        # Evaluate model
        y_pred_train = model.predict(X_train)
        y_pred_test = model.predict(X_test)
        
        train_rmse = np.sqrt(mean_squared_error(y_train, y_pred_train))
        test_rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
        test_mae = mean_absolute_error(y_test, y_pred_test)
        test_r2 = r2_score(y_test, y_pred_test)
        
        print(f"\nModel Performance:")
        print(f"  Training RMSE: {train_rmse:.3f}")
        print(f"  Test RMSE: {test_rmse:.3f}")
        print(f"  Test MAE: {test_mae:.3f}")
        print(f"  Test R²: {test_r2:.3f}")
        
        # Store model and results
        models[pollutant] = model
        results[pollutant] = {
            'train_rmse': train_rmse,
            'test_rmse': test_rmse,
            'test_mae': test_mae,
            'test_r2': test_r2,
            'n_train': len(X_train),
            'n_test': len(X_test)
        }
    
    return models, feature_columns, results

def save_models(models, feature_columns, normalization_params=None):
    """Save trained models and metadata."""
    print("\n" + "="*60)
    print("Saving models...")
    print("="*60)
    
    # Create models directory
    os.makedirs('models', exist_ok=True)
    
    # Save each model
    for pollutant, model in models.items():
        # Clean pollutant name for filename
        clean_name = pollutant.lower().replace('.', '').replace(' ', '_')
        model_path = f'models/xgboost_model_{clean_name}.json'
        model.save_model(model_path)
        print(f"✓ Saved {pollutant} model to {model_path}")
    
    # Save feature columns
    with open('models/feature_columns.pkl', 'wb') as f:
        pickle.dump(feature_columns, f)
    print(f"✓ Saved feature columns")
    
    # Save empty label encoders (for compatibility with forecast code)
    with open('models/label_encoders.pkl', 'wb') as f:
        pickle.dump({}, f)
    print(f"✓ Saved label encoders")
    
    # Save normalization parameters
    if normalization_params:
        with open('models/normalization_params.pkl', 'wb') as f:
            pickle.dump(normalization_params, f)
        print(f"✓ Saved normalization parameters")
    
    print("\n✅ All models saved successfully!")

def main():
    """Main training pipeline."""
    print("="*60)
    print("Mframapa AI - Simplified Model Training")
    print("="*60)
    print()
    
    # Load data
    df = load_and_process_data()
    if df is None:
        print("ERROR: Failed to load data. Exiting.")
        return
    
    # Engineer features
    df = engineer_features(df)
    
    # Extract normalization parameters
    normalization_params = {
        'lat_mean': df.attrs.get('lat_mean'),
        'lat_std': df.attrs.get('lat_std'),
        'lon_mean': df.attrs.get('lon_mean'),
        'lon_std': df.attrs.get('lon_std')
    }
    
    # Train models
    models, feature_columns, results = train_models(df)
    
    if not models:
        print("ERROR: No models were trained successfully. Exiting.")
        return
    
    # Save models
    save_models(models, feature_columns, normalization_params)
    
    # Print summary
    print("\n" + "="*60)
    print("TRAINING SUMMARY")
    print("="*60)
    print(f"Trained {len(models)} models: {', '.join(models.keys())}")
    print("\nPerformance Metrics:")
    for pollutant, metrics in results.items():
        print(f"\n{pollutant}:")
        print(f"  Test RMSE: {metrics['test_rmse']:.3f}")
        print(f"  Test MAE: {metrics['test_mae']:.3f}")
        print(f"  Test R²: {metrics['test_r2']:.3f}")
        print(f"  Training samples: {metrics['n_train']}")
        print(f"  Test samples: {metrics['n_test']}")
    
    print("\n" + "="*60)
    print("✅ Training completed successfully!")
    print("You can now run the Streamlit app to see predictions.")
    print("="*60)

if __name__ == "__main__":
    main()
