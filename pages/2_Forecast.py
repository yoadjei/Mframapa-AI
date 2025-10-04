import streamlit as st
import xgboost as xgb
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import folium_static
import os
import pickle
from utils import (
    fetch_openweather_forecast,
    fetch_merra2_data,
    fetch_tempo_data,
    calculate_aqi_from_components,
    get_aqi_category,
    get_health_recommendation,
    fetch_air_quality_data
)

st.set_page_config(page_title="Forecast - Mframapa AI", page_icon="📈", layout="wide")

st.title("📈 Air Quality Forecast")

# Check if city is selected
if not st.session_state.get('selected_city') or not st.session_state.get('selected_coordinates'):
    st.warning("🏙️ Please select a city first from the Home page.")
    st.stop()

# Get selected location
city = st.session_state.selected_city
lat, lon = st.session_state.selected_coordinates

st.markdown(f"## 🌍 48-Hour Air Quality Forecast for {city}")
st.markdown(f"📍 **Coordinates:** {lat:.4f}, {lon:.4f}")

# Check for model files
model_dir = 'models'
if not os.path.exists(model_dir):
    st.error("❌ Model directory not found. Please run `python train_model.py` first.")
    st.stop()

# Load models and feature information
@st.cache_resource
def load_models():
    """Load trained XGBoost models and supporting data."""
    models = {}
    feature_columns = []
    label_encoders = {}
    
    try:
        # Load feature columns
        with open(os.path.join(model_dir, 'feature_columns.pkl'), 'rb') as f:
            feature_columns = pickle.load(f)
        
        # Load label encoders
        with open(os.path.join(model_dir, 'label_encoders.pkl'), 'rb') as f:
            label_encoders = pickle.load(f)
        
        # Load models for each pollutant
        model_files = [f for f in os.listdir(model_dir) if f.endswith('.json')]
        
        for model_file in model_files:
            pollutant = model_file.replace('xgboost_model_', '').replace('.json', '')
            model_path = os.path.join(model_dir, model_file)
            
            model = xgb.XGBRegressor()
            model.load_model(model_path)
            models[pollutant] = model
        
        return models, feature_columns, label_encoders
    
    except Exception as e:
        st.error(f"Error loading models: {str(e)}")
        return {}, [], {}

models, feature_columns, label_encoders = load_models()

if not models:
    st.error("❌ No models loaded. Please ensure model training completed successfully.")
    st.stop()

st.success(f"✅ Loaded models for: {', '.join(models.keys())}")

# Fetch real-time data
@st.cache_data(ttl=1800)  # Cache for 30 minutes
def fetch_forecast_features(lat, lon):
    """Fetch all required features for forecasting."""
    features_list = []
    
    # Get current date and forecast dates
    current_date = datetime.now()
    forecast_dates = [current_date + timedelta(hours=h) for h in range(0, 49, 3)]  # Every 3 hours for 48 hours
    
    # Fetch weather forecast
    weather_data = fetch_openweather_forecast(lat, lon)
    
    # Fetch satellite data for recent dates
    start_date = (current_date - timedelta(days=1)).strftime('%Y-%m-%d')
    end_date = current_date.strftime('%Y-%m-%d')
    
    merra_data = fetch_merra2_data(lat, lon, start_date, end_date)
    
    # Check if location is in North America for TEMPO data
    tempo_data = None
    if -170 <= lon <= -50 and 15 <= lat <= 75:
        bounding_box = (lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5)
        tempo_data = fetch_tempo_data(bounding_box, start_date, end_date)
    
    # Process weather forecast data
    weather_forecasts = {}
    if weather_data and 'list' in weather_data:
        for forecast in weather_data['list']:
            forecast_time = datetime.fromtimestamp(forecast['dt'])
            weather_forecasts[forecast_time] = {
                'temp': forecast['main']['temp'],
                'humidity': forecast['main']['humidity'],
                'pressure': forecast['main']['pressure'],
                'wind_speed': forecast['wind']['speed'],
                'wind_deg': forecast['wind'].get('deg', 0),
                'clouds': forecast['clouds']['all']
            }
    
    # Create feature vectors for each forecast time
    for forecast_date in forecast_dates:
        features = {
            'Latitude': lat,
            'Longitude': lon,
            'year': forecast_date.year,
            'month': forecast_date.month,
            'day': forecast_date.day,
            'dayofweek': forecast_date.dayofweek,
            'dayofyear': forecast_date.dayofyear,
            'season': (forecast_date.month - 1) // 3,
            'is_weekend': 1 if forecast_date.dayofweek >= 5 else 0,
        }
        
        # Add weather features (use closest forecast)
        closest_weather = None
        min_time_diff = float('inf')
        
        for weather_time, weather_info in weather_forecasts.items():
            time_diff = abs((weather_time - forecast_date).total_seconds())
            if time_diff < min_time_diff:
                min_time_diff = time_diff
                closest_weather = weather_info
        
        if closest_weather:
            features['weather_temp'] = closest_weather['temp']
            features['weather_humidity'] = closest_weather['humidity']
            features['weather_pressure'] = closest_weather['pressure']
            features['weather_wind_speed'] = closest_weather['wind_speed']
            features['weather_clouds'] = closest_weather['clouds']
        
        # Add MERRA-2 features (use latest available)
        if merra_data:
            for key, value in merra_data.items():
                if isinstance(value, (np.ndarray, list)) and len(value) > 0:
                    features[f'merra2_{key}'] = np.mean(value)
                elif isinstance(value, (int, float)):
                    features[f'merra2_{key}'] = value
        
        # Add TEMPO features for North America
        if tempo_data:
            for key, value in tempo_data.items():
                features[f'tempo_{key}'] = value
        
        # Create interaction features
        if 'weather_temp' in features and 'weather_humidity' in features:
            features['temp_humidity_interaction'] = features['weather_temp'] * features['weather_humidity']
        
        if 'merra2_U2M' in features and 'merra2_V2M' in features:
            features['wind_speed'] = np.sqrt(features['merra2_U2M']**2 + features['merra2_V2M']**2)
        
        features['forecast_time'] = forecast_date
        features_list.append(features)
    
    return features_list

# Main forecasting section
with st.spinner("🛰️ Fetching satellite data and generating forecast..."):
    forecast_features = fetch_forecast_features(lat, lon)

if not forecast_features:
    st.error("❌ Could not fetch required data for forecasting.")
    st.stop()

# Create feature DataFrame
forecast_df = pd.DataFrame(forecast_features)

# Ensure all required features are present
missing_features = []
for col in feature_columns:
    if col not in forecast_df.columns:
        missing_features.append(col)

if missing_features:
    st.warning(f"⚠️ Some features are missing: {missing_features[:5]}...")
    # Fill missing features with zeros or median values
    for col in missing_features:
        if col.startswith(('merra2_', 'tempo_', 'weather_')):
            forecast_df[col] = 0
        else:
            forecast_df[col] = 0

# Make predictions
predictions = {}
for pollutant, model in models.items():
    try:
        X_forecast = forecast_df[feature_columns].fillna(0)
        y_pred = model.predict(X_forecast)
        predictions[pollutant] = y_pred
    except Exception as e:
        st.warning(f"Could not predict for {pollutant}: {str(e)}")

# Display current conditions
if predictions:
    st.markdown("## 🌡️ Current Air Quality Conditions")
    
    current_values = {}
    for pollutant, pred_values in predictions.items():
        current_values[pollutant] = pred_values[0] if len(pred_values) > 0 else 0
    
    # Calculate AQI
    pm25_val = current_values.get('pm25', current_values.get('pm2.5', 0))
    o3_val = current_values.get('o3', current_values.get('ozone', 0))
    no2_val = current_values.get('no2', current_values.get('nitrogen dioxide (no2)', 0))
    
    aqi_data = calculate_aqi_from_components(pm25_val, o3_val, no2_val)
    overall_aqi = aqi_data.get('Overall', 0)
    category, color = get_aqi_category(overall_aqi)
    
    # Current AQI display
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric(
            label="Overall AQI",
            value=f"{overall_aqi}",
            help=f"Category: {category}"
        )
        st.markdown(f"<div style='background-color: {color}; height: 5px; border-radius: 3px;'></div>", 
                   unsafe_allow_html=True)
    
    with col2:
        if pm25_val > 0:
            st.metric("PM2.5", f"{pm25_val:.1f} μg/m³", help="Fine particulate matter")
    
    with col3:
        if o3_val > 0:
            st.metric("O₃", f"{o3_val:.0f} ppb", help="Ground-level ozone")
    
    with col4:
        if no2_val > 0:
            st.metric("NO₂", f"{no2_val:.0f} ppb", help="Nitrogen dioxide")

# Forecast visualization
st.markdown("## 📊 48-Hour Forecast")

if predictions and len(forecast_df) > 1:
    # Create forecast chart
    fig = go.Figure()
    
    forecast_times = forecast_df['forecast_time']
    
    for pollutant, pred_values in predictions.items():
        if len(pred_values) > 0:
            # Map pollutant names for display
            display_name = {
                'pm25': 'PM2.5',
                'pm2.5': 'PM2.5',
                'o3': 'O₃',
                'ozone': 'O₃',
                'no2': 'NO₂',
                'nitrogen dioxide (no2)': 'NO₂'
            }.get(pollutant.lower(), pollutant)
            
            fig.add_trace(go.Scatter(
                x=forecast_times,
                y=pred_values,
                mode='lines+markers',
                name=display_name,
                line=dict(width=2),
                marker=dict(size=4)
            ))
    
    fig.update_layout(
        title="Air Quality Forecast - Next 48 Hours",
        xaxis_title="Time",
        yaxis_title="Concentration",
        hovermode='x unified',
        height=400
    )
    
    st.plotly_chart(fig, use_container_width=True)

# Health recommendations
st.markdown("## 🏥 Health Recommendations")

user_profile = st.session_state.get('user_profile', {})
health_advice = get_health_recommendation(overall_aqi, user_profile)

col1, col2 = st.columns([1, 2])

with col1:
    st.markdown(f"""
    **Air Quality Category:** {health_advice['category']}
    
    **AQI Level:** {health_advice['aqi_value']}
    """)
    
    st.markdown(f"<div style='background-color: {health_advice['color']}; padding: 10px; border-radius: 5px; color: white; text-align: center; font-weight: bold;'>{health_advice['category']}</div>", 
               unsafe_allow_html=True)

with col2:
    recommendations = health_advice['recommendations']
    
    st.markdown("**General Advice:**")
    st.info(recommendations['general'])
    
    st.markdown("**Activities:**")
    st.info(recommendations['activities'])
    
    st.markdown("**Precautions:**")
    st.warning(recommendations['precautions'])

# Location map
st.markdown("## 🗺️ Location")

# Create map
map_center = [lat, lon]
m = folium.Map(location=map_center, zoom_start=10)

# Add marker with AQI information
popup_text = f"""
<b>{city}</b><br>
AQI: {overall_aqi} ({category})<br>
Coordinates: {lat:.4f}, {lon:.4f}
"""

folium.Marker(
    location=map_center,
    popup=popup_text,
    tooltip=f"{city} - AQI: {overall_aqi}",
    icon=folium.Icon(color='red' if overall_aqi > 100 else 'orange' if overall_aqi > 50 else 'green')
).add_to(m)

# Display map
folium_static(m, width=700, height=400)

# Data sources and accuracy
st.markdown("## 📡 Data Sources & Model Information")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    **Satellite Data Sources:**
    - 🛰️ NASA MERRA-2 (Global coverage)
    - 🛰️ NASA TEMPO (North America)
    - 🌦️ OpenWeatherMap (Meteorological data)
    """)

with col2:
    st.markdown("""
    **Model Details:**
    - 🤖 XGBoost Regression
    - ⏱️ 48-hour forecast horizon
    - 📊 Multi-pollutant prediction
    - 🎯 Location-specific training
    """)

region_info = "North America (TEMPO + MERRA-2)" if -170 <= lon <= -50 and 15 <= lat <= 75 else "Global (MERRA-2)"
st.info(f"📍 **Data Coverage for {city}:** {region_info}")

# Refresh options
st.markdown("---")
col1, col2, col3 = st.columns([1, 1, 2])

with col1:
    if st.button("🔄 Refresh Forecast"):
        st.cache_data.clear()
        st.rerun()

with col2:
    if st.button("🏠 Select Different City"):
        st.session_state.selected_city = None
        st.session_state.selected_coordinates = None
        st.switch_page("pages/1_Home.py")

with col3:
    st.markdown("*Forecast updates every 30 minutes with new satellite data*")
