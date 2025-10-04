import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
import os
import sys
from utils import (
    process_training_data, 
    fetch_merra2_data, 
    fetch_tempo_data,
    get_lat_lon
)

class AirQualityModelTrainer:
    """
    Offline model training class for Mframapa AI air quality forecasting.
    """
    
    def __init__(self):
        self.models = {}
        self.label_encoders = {}
        self.feature_columns = []
        
    def load_ground_truth_data(self):
        """
        Load and preprocess ground truth air quality data from CSV files.
        
        Returns:
            pd.DataFrame: Processed ground truth data
        """
        print("Loading ground truth data...")
        
        # Load data using the utility function
        ground_truth_data = process_training_data()
        
        if ground_truth_data is None:
            print("ERROR: Failed to load ground truth data")
            return None
        
        print(f"Loaded {len(ground_truth_data)} ground truth records")
        
        # Filter data to recent years for better model performance
        cutoff_date = datetime.now() - timedelta(days=730)  # 2 years
        ground_truth_data = ground_truth_data[
            ground_truth_data['date'] >= cutoff_date
        ]
        
        print(f"Filtered to {len(ground_truth_data)} records from last 2 years")
        
        return ground_truth_data
    
    def fetch_satellite_features(self, ground_truth_data):
        """
        Fetch satellite and weather data features for each ground truth record.
        
        Args:
            ground_truth_data (pd.DataFrame): Ground truth air quality data
            
        Returns:
            pd.DataFrame: Data with satellite features added
        """
        print("Fetching satellite and weather features...")
        
        # Get unique locations and dates
        unique_locations = ground_truth_data[['Latitude', 'Longitude', 'date']].drop_duplicates()
        
        feature_data = []
        total_locations = len(unique_locations)
        
        for idx, row in unique_locations.iterrows():
            if idx % 10 == 0:  # Progress update every 10 locations
                print(f"Processing location {idx + 1}/{total_locations}")
            
            lat, lon, date = row['Latitude'], row['Longitude'], row['date']
            date_str = date.strftime('%Y-%m-%d')
            
            # Initialize feature dictionary
            features = {
                'Latitude': lat,
                'Longitude': lon,
                'date': date,
                'year': date.year,
                'month': date.month,
                'day': date.day,
                'dayofweek': date.dayofweek,
                'dayofyear': date.dayofyear
            }
            
            try:
                # Fetch MERRA-2 data (global coverage)
                merra_data = fetch_merra2_data(lat, lon, date_str, date_str)
                if merra_data:
                    for key, value in merra_data.items():
                        if isinstance(value, (np.ndarray, list)) and len(value) > 0:
                            features[f'merra2_{key}'] = np.mean(value)
                        elif isinstance(value, (int, float)):
                            features[f'merra2_{key}'] = value
                
                # Fetch TEMPO data for North American locations
                if -170 <= lon <= -50 and 15 <= lat <= 75:  # North America bounds
                    bounding_box = (lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5)
                    tempo_data = fetch_tempo_data(bounding_box, date_str, date_str)
                    if tempo_data:
                        for key, value in tempo_data.items():
                            features[f'tempo_{key}'] = value
                
                # Add seasonal features
                features['season'] = (date.month - 1) // 3  # 0=Winter, 1=Spring, 2=Summer, 3=Fall
                features['is_weekend'] = 1 if date.dayofweek >= 5 else 0
                
                feature_data.append(features)
                
            except Exception as e:
                print(f"Error fetching features for location {lat}, {lon}, {date}: {str(e)}")
                continue
        
        # Convert to DataFrame
        feature_df = pd.DataFrame(feature_data)
        
        print(f"Successfully fetched features for {len(feature_df)} location-date combinations")
        
        return feature_df
    
    def merge_and_engineer_features(self, ground_truth_data, feature_data):
        """
        Merge ground truth data with satellite features and create additional features.
        
        Args:
            ground_truth_data (pd.DataFrame): Ground truth air quality data
            feature_data (pd.DataFrame): Satellite feature data
            
        Returns:
            pd.DataFrame: Complete dataset with all features
        """
        print("Merging data and engineering features...")
        
        # Merge datasets
        merged_data = ground_truth_data.merge(
            feature_data,
            on=['Latitude', 'Longitude', 'date'],
            how='inner'
        )
        
        print(f"Merged dataset has {len(merged_data)} records")
        
        # Handle missing values
        numeric_columns = merged_data.select_dtypes(include=[np.number]).columns
        merged_data[numeric_columns] = merged_data[numeric_columns].fillna(
            merged_data[numeric_columns].median()
        )
        
        # Encode categorical variables
        categorical_columns = ['parameter', 'site_id']
        for col in categorical_columns:
            if col in merged_data.columns:
                le = LabelEncoder()
                merged_data[f'{col}_encoded'] = le.fit_transform(merged_data[col].astype(str))
                self.label_encoders[col] = le
        
        # Create interaction features
        if 'merra2_T2M' in merged_data.columns and 'merra2_RH2M' in merged_data.columns:
            merged_data['temp_humidity_interaction'] = (
                merged_data['merra2_T2M'] * merged_data['merra2_RH2M']
            )
        
        if 'merra2_U2M' in merged_data.columns and 'merra2_V2M' in merged_data.columns:
            merged_data['wind_speed'] = np.sqrt(
                merged_data['merra2_U2M']**2 + merged_data['merra2_V2M']**2
            )
        
        # Log transform for skewed features
        skewed_features = ['value']  # Target variable
        for feature in skewed_features:
            if feature in merged_data.columns:
                merged_data[f'{feature}_log'] = np.log1p(np.maximum(merged_data[feature], 0))
        
        return merged_data
    
    def train_models(self, data):
        """
        Train separate XGBoost models for each pollutant type.
        
        Args:
            data (pd.DataFrame): Complete training dataset
            
        Returns:
            dict: Trained models for each pollutant
        """
        print("Training XGBoost models...")
        
        # Define feature columns (exclude target and identifier columns)
        exclude_columns = ['value', 'value_log', 'parameter', 'date', 'site_id']
        self.feature_columns = [col for col in data.columns if col not in exclude_columns]
        
        print(f"Using {len(self.feature_columns)} features for training")
        
        # Train separate models for each pollutant
        pollutants = data['parameter'].unique()
        results = {}
        
        for pollutant in pollutants:
            print(f"\nTraining model for {pollutant}...")
            
            # Filter data for current pollutant
            pollutant_data = data[data['parameter'] == pollutant].copy()
            
            if len(pollutant_data) < 50:  # Minimum data requirement
                print(f"Insufficient data for {pollutant} ({len(pollutant_data)} records)")
                continue
            
            # Prepare features and target
            X = pollutant_data[self.feature_columns]
            y = pollutant_data['value']
            
            # Handle remaining NaN values
            X = X.fillna(0)
            y = y.fillna(y.median())
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=None
            )
            
            # Configure XGBoost
            model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                n_jobs=-1
            )
            
            # Train model
            model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
            
            # Evaluate model
            y_pred = model.predict(X_test)
            
            rmse = mean_squared_error(y_test, y_pred, squared=False)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            print(f"{pollutant} Model Performance:")
            print(f"  RMSE: {rmse:.3f}")
            print(f"  MAE: {mae:.3f}")
            print(f"  R²: {r2:.3f}")
            
            # Save model and results
            self.models[pollutant] = model
            results[pollutant] = {
                'model': model,
                'rmse': rmse,
                'mae': mae,
                'r2': r2,
                'n_train': len(X_train),
                'n_test': len(X_test)
            }
        
        return results
    
    def save_models(self):
        """
        Save trained models to disk.
        """
        print("\nSaving models...")
        
        if not self.models:
            print("No models to save!")
            return
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Save each model
        for pollutant, model in self.models.items():
            model_path = f'models/xgboost_model_{pollutant.lower().replace(".", "")}.json'
            model.save_model(model_path)
            print(f"Saved {pollutant} model to {model_path}")
        
        # Save feature columns and label encoders
        import pickle
        
        with open('models/feature_columns.pkl', 'wb') as f:
            pickle.dump(self.feature_columns, f)
        
        with open('models/label_encoders.pkl', 'wb') as f:
            pickle.dump(self.label_encoders, f)
        
        print("Saved feature columns and label encoders")
        print("Model training completed successfully!")

def main():
    """
    Main training pipeline execution.
    """
    print("Starting Mframapa AI model training pipeline...")
    print("=" * 60)
    
    trainer = AirQualityModelTrainer()
    
    # Step 1: Load ground truth data
    ground_truth_data = trainer.load_ground_truth_data()
    if ground_truth_data is None:
        print("FAILED: Could not load ground truth data")
        return
    
    # Step 2: Fetch satellite features (this will take a long time)
    print("\nWARNING: Feature fetching will take several hours due to satellite data downloads")
    print("Consider running this on a subset of data first for testing")
    
    response = input("Continue with full dataset? (y/N): ")
    if response.lower() != 'y':
        print("Training cancelled. Consider using a subset of data for testing.")
        return
    
    feature_data = trainer.fetch_satellite_features(ground_truth_data)
    
    if feature_data is None or len(feature_data) == 0:
        print("FAILED: Could not fetch satellite features")
        return
    
    # Step 3: Merge and engineer features
    complete_data = trainer.merge_and_engineer_features(ground_truth_data, feature_data)
    
    if complete_data is None or len(complete_data) == 0:
        print("FAILED: Could not create complete dataset")
        return
    
    # Step 4: Train models
    training_results = trainer.train_models(complete_data)
    
    if not training_results:
        print("FAILED: No models were trained successfully")
        return
    
    # Step 5: Save models
    trainer.save_models()
    
    print("\n" + "=" * 60)
    print("Training pipeline completed successfully!")
    print(f"Trained models for {len(training_results)} pollutants")
    print("Models saved in the 'models' directory")
    print("Ready to run the Streamlit application!")

if __name__ == "__main__":
    main()
