import pandas as pd
import numpy as np
import xgboost as xgb
import os
import json
from sklearn.model_selection import RandomizedSearchCV, GroupKFold
from sklearn.metrics import mean_squared_error, r2_score
from scipy.stats import uniform, randint
import warnings

# Suppress warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

# Configuration
MODEL_DIR = "backend/models"
MODEL_PATH = f"{MODEL_DIR}/universal_african_model.json"
METRICS_PATH = f"{MODEL_DIR}/model_metrics.json"

os.makedirs(MODEL_DIR, exist_ok=True)

def load_best_dataset():
    """
    Tries to load the most "complete" dataset available.
    """
    candidates = [
        "backend/data/training_dataset_final.csv",      # Phase 4 (Wind+Pop)
        "backend/data/training_dataset_updated.csv",    # Phase 2 (PBLH+RH)
        "backend/data/training_dataset_merged_v2.csv",  # Phase 1b (NO2+AOT corrected)
        "backend/data/training_dataset.csv",            # Raw merge
        # Colab / Flat structure fallbacks
        "training_dataset_final.csv",
        "training_dataset_updated.csv",
        "training_dataset.csv"
    ]
    
    for path in candidates:
        if os.path.exists(path):
            print(f"📂 Loading Best Available Dataset: {path}")
            return pd.read_csv(path)
            
    raise FileNotFoundError("CRITICAL: No training dataset found. Run data augmentation pipeline first.")

def feature_engineering(df):
    """
    Adds temporal and cyclical features for better generalization.
    """
    print("🛠️ Engineering Temporal Features...")
    
    # Ensure datetime
    if 'datetime' in df.columns:
        df['dt'] = pd.to_datetime(df['datetime'], utc=True)
    elif 'date_str' in df.columns:
        df['dt'] = pd.to_datetime(df['date_str'])
    else:
        print("⚠️ Warning: No date column found. Skipping temporal features.")
        return df

    # Extract components
    df['month'] = df['dt'].dt.month
    df['day_of_year'] = df['dt'].dt.dayofyear
    
    # Cyclical Encoding: Maps Month 12 (Dec) close to Month 1 (Jan)
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
    
    return df

def train_superb_model():
    print("\n" + "="*50)
    print("Starting")
    print("="*50 + "\n")
    
    # 1. Load Data
    try:
        df = load_best_dataset()
    except Exception as e:
        print(f"❌ Error Loading Data: {e}")
        return

    df = feature_engineering(df)
    
    # 2. Define Features covering all phases
    potential_features = [
        # Core Satellite
        'sat_no2', 'sat_aod', 'sat_aot',
        # Meteo (Phase 2)
        'sat_pblh', 'sat_humidity', 'sat_rh',
        # Advanced (Phase 4)
        'sat_wind_u', 'sat_wind_v', 'pop_density',
        # Engineered
        'month_sin', 'month_cos',
        # Geographic
        'lat', 'lon'
    ]
    
    features = [f for f in potential_features if f in df.columns]
    target = 'pm25'
    
    if len(features) < 2:
        print("❌ Critical: Not enough features found to train.")
        print(f"   Available columns: {df.columns.tolist()}")
        return

    print(f"🧠 Training Features ({len(features)}): {features}")
    
    # Clean Infinites and NaNs
    print("🧹 Cleaning Data (Inf -> NaN, Drop NaNs)...")
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    
    clean_subset = features + [target]
    if 'location' in df.columns:
        clean_subset.append('location')
        
    len_before = len(df)
    df = df.dropna(subset=clean_subset)
    dropped_count = len_before - len(df)
    print(f"   Dropped {dropped_count} rows. Final Count: {len(df)} rows.")

    if len(df) == 0:
        print("❌ Critical: No data left after dropping NaNs. Check your input data.")
        return

    # Optimize Types
    try:
        df[features] = df[features].astype('float32')
        df[target] = df[target].astype('float32')
    except Exception as e:
        print(f"⚠️ Warning: Could not convert data to float32: {e}")

    X = df[features]
    y = df[target]
    
    # 3. Validation Strategy
    # Using 'location' guarantees we validate on stations the model has NOT seen.
    if 'location' in df.columns:
        groups = df['location']
        unique_locs = df['location'].nunique()
        print(f"🌍 Using Spatial Cross-Validation across {unique_locs} unique locations.")
        cv = GroupKFold(n_splits=5)
    else:
        print("⚠️ 'location' column missing. Using standard 5-Fold CV.")
        groups = None
        cv = 5

    # 4. Hyperparameter Tuning
    print("\n🧪 Tuner Configured: RandomizedSearchCV (100 Iterations)")
    print("   Target: Minimize RMSE (Root Mean Squared Error)")
    print("   HARDWARE: GPU Acceleration Enabled (Colab mode)")
    print("   Please wait, finding the best model architecture...\n")
    
    param_dist = {
        'max_depth': randint(3, 10),
        'learning_rate': uniform(0.01, 0.3),
        'n_estimators': randint(100, 500),
        'subsample': uniform(0.6, 0.4),
        'colsample_bytree': uniform(0.6, 0.4)
    }
    
    xgb_model = xgb.XGBRegressor(
        objective='reg:squarederror', 
        n_jobs=-1, 
        random_state=42,
        tree_method='hist',
        device='cuda' 
    )
    
    search = RandomizedSearchCV(
        xgb_model, 
        param_distributions=param_dist, 
        n_iter=100, 
        cv=cv, 
        scoring='neg_root_mean_squared_error',
        verbose=1, # Print progress for each fit
        random_state=42
    )
    
    try:
        # Note: RandomizedSearchCV(refit=True) is default.
        # This means 'search.best_estimator_' is automatically 
        # retrained on the ENTIRE X, y dataset after finding best params.
        if groups is not None:
            search.fit(X, y, groups=groups)
        else:
            search.fit(X, y)
    except KeyboardInterrupt:
        print("\n\n⚠️ Training Interrupted by User.")
        return
    except Exception as e:
        print(f"\n❌ Tuning Failed: {e}")
        return
        
    print("      TUNING COMPLETE      ")
    print("="*30)
    print(f"Best Params: {search.best_params_}")
    print(f"Best CV RMSE: {-search.best_score_:.4f}")
    
    # 5. Final Model Saving
    best_model = search.best_estimator_
    
    # Generate Metrics on Full Data
    preds = best_model.predict(X)
    final_rmse = np.sqrt(mean_squared_error(y, preds))
    final_r2 = r2_score(y, preds)
    
    print(f"\n📊 Final Performance on Full Dataset:")
    print(f"   RMSE: {final_rmse:.2f} µg/m³")
    print(f"   R²: {final_r2:.2f}")
    
    # Robust Save: Try XGBoost specific save, then Joblib pickle if needed
    try:
        best_model.save_model(MODEL_PATH)
        print(f"📦 Model saved to JSON: {MODEL_PATH}")
    except Exception as e:
        print(f"⚠️ specific save_model failed ({e}), falling back to joblib pickle.")
        pickle_path = MODEL_PATH.replace('.json', '.pkl')
        joblib.dump(best_model, pickle_path)
        print(f"📦 Model saved to Pickle: {pickle_path}")
    
    metrics = {
        "features": features,
        "rmse": final_rmse,
        "r2": final_r2,
        "best_params": search.best_params_,
        "training_rows": len(df)
    }
    
    with open(METRICS_PATH, 'w') as f:
        json.dump(metrics, f, indent=4)
        
    print(f"📄 Metrics saved to: {METRICS_PATH}")
    print("\n✅ READY FOR DEPLOYMENT")

if __name__ == "__main__":
    train_superb_model()
