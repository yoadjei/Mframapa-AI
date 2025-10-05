import streamlit as st
import pandas as pd
import numpy as np
import requests
import earthaccess
import xarray as xr
from datetime import datetime, timedelta
from geopy.geocoders import Nominatim
import pytz
import math
import os

# Initialize geopy geocoder
geolocator = Nominatim(user_agent="mframapa_ai")

@st.cache_data(ttl=3600)
def get_lat_lon(city_name):
    """
    Get latitude and longitude coordinates for a city using Geopy Nominatim.
    
    Args:
        city_name (str): Name of the city
        
    Returns:
        tuple: (latitude, longitude) or None if not found
    """
    try:
        location = geolocator.geocode(city_name)
        if location:
            return (location.latitude, location.longitude)
        else:
            return None
    except Exception as e:
        st.error(f"Error geocoding {city_name}: {str(e)}")
        return None

@st.cache_data(ttl=3600)
def fetch_openweather_forecast(lat, lon):
    """
    Fetch weather forecast data from OpenWeatherMap API.
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        
    Returns:
        dict: Weather forecast data
    """
    try:
        api_key = st.secrets.get("OPENWEATHER_KEY")
        if not api_key:
            st.error("OpenWeatherMap API key not found in secrets")
            return None
            
        url = f"https://api.openweathermap.org/data/2.5/forecast"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params)
        response.raise_for_status()
        
        return response.json()
    except requests.exceptions.RequestException as e:
        st.error(f"Error fetching OpenWeather forecast: {str(e)}")
        return None
    except Exception as e:
        st.error(f"Unexpected error in OpenWeather fetch: {str(e)}")
        return None

@st.cache_data(ttl=3600)
def fetch_merra2_data(lat, lon, start_date, end_date):
    """
    Download data from NASA MERRA-2 collections for air quality modeling.
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        
    Returns:
        dict: Processed MERRA-2 data
    """
    try:
        # Authenticate with NASA Earthdata
        username = st.secrets.get("EARTHDATA_USER")
        password = st.secrets.get("EARTHDATA_PASS")
        
        if not username or not password:
            st.error("NASA Earthdata credentials not found in secrets")
            return None
            
        auth = earthaccess.login(username=username, password=password)
        if not auth:
            st.error("Failed to authenticate with NASA Earthdata")
            return None
        
        # Search for MERRA-2 collections
        collections = ['M2T1NXAER', 'M2T1NXSLV']
        data_dict = {}
        
        for collection in collections:
            try:
                # Search for granules
                granules = earthaccess.search_data(
                    short_name=collection,
                    temporal=(start_date, end_date),
                    bounding_box=(lon-0.5, lat-0.5, lon+0.5, lat+0.5)
                )
                
                if granules:
                    # Download and process the data
                    files = earthaccess.download(granules, local_path="./temp_data")
                    
                    for file in files:
                        if file.endswith('.nc4'):
                            ds = xr.open_dataset(file)
                            
                            # Extract relevant variables
                            if collection == 'M2T1NXAER':
                                # Aerosol variables for PM2.5 proxy
                                variables = ['BCSMASS', 'OCSMASS', 'DUSMASS', 'SSSMASS', 'SO4SMASS']
                            else:
                                # Meteorological variables
                                variables = ['T2M', 'RH2M', 'U2M', 'V2M', 'PBLH', 'CLDFRC']
                            
                            for var in variables:
                                if var in ds.variables:
                                    # Extract data at the specific location
                                    var_data = ds[var].sel(
                                        lat=lat, lon=lon, method='nearest'
                                    )
                                    data_dict[var] = var_data.values
                            
                            ds.close()
                            # Clean up temporary file
                            os.remove(file)
                
            except Exception as e:
                st.warning(f"Error processing {collection}: {str(e)}")
                continue
        
        return data_dict
        
    except Exception as e:
        st.error(f"Error fetching MERRA-2 data: {str(e)}")
        return None

@st.cache_data(ttl=3600)
def fetch_tempo_data(bounding_box, start_date, end_date):
    """
    Download data from NASA TEMPO satellite for North America.
    
    Args:
        bounding_box (tuple): (min_lon, min_lat, max_lon, max_lat)
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        
    Returns:
        dict: Processed TEMPO data
    """
    try:
        # Check if location is in North America
        min_lon, min_lat, max_lon, max_lat = bounding_box
        
        # North America bounds (approximate)
        na_bounds = (-170, 15, -50, 75)  # (min_lon, min_lat, max_lon, max_lat)
        
        if not (na_bounds[0] <= min_lon <= na_bounds[2] and 
                na_bounds[1] <= min_lat <= na_bounds[3]):
            return None  # Outside North America coverage
        
        # Authenticate with NASA Earthdata
        username = st.secrets.get("EARTHDATA_USER")
        password = st.secrets.get("EARTHDATA_PASS")
        
        if not username or not password:
            st.error("NASA Earthdata credentials not found in secrets")
            return None
            
        auth = earthaccess.login(username=username, password=password)
        if not auth:
            st.error("Failed to authenticate with NASA Earthdata")
            return None
        
        data_dict = {}
        
        try:
            # Search for TEMPO NO2 data
            granules = earthaccess.search_data(
                short_name="TEMPO_NO2_L2",
                temporal=(start_date, end_date),
                bounding_box=bounding_box
            )
            
            if granules:
                files = earthaccess.download(granules[:5], local_path="./temp_data")  # Limit to 5 files
                
                for file in files:
                    if file.endswith('.nc'):
                        try:
                            ds = xr.open_dataset(file)
                            
                            # Extract TEMPO variables
                            variables = ['vertical_column_troposphere', 'column_uncertainty']
                            
                            for var in variables:
                                if var in ds.variables:
                                    # Get mean value within bounding box
                                    var_data = ds[var].sel(
                                        latitude=slice(min_lat, max_lat),
                                        longitude=slice(min_lon, max_lon)
                                    ).mean()
                                    data_dict[f"NO2_{var}"] = float(var_data.values)
                            
                            ds.close()
                            os.remove(file)
                        except Exception as e:
                            st.warning(f"Error processing TEMPO file: {str(e)}")
                            continue
                            
        except Exception as e:
            st.warning(f"TEMPO data not available for this location/time: {str(e)}")
        
        return data_dict if data_dict else None
        
    except Exception as e:
        st.error(f"Error fetching TEMPO data: {str(e)}")
        return None

def calculate_aqi_from_components(pm25=None, o3=None, no2=None):
    """
    Convert pollutant concentrations to US EPA AQI scale.
    
    Args:
        pm25 (float): PM2.5 concentration in μg/m³
        o3 (float): O3 concentration in ppb
        no2 (float): NO2 concentration in ppb
        
    Returns:
        dict: AQI values and overall AQI
    """
    def linear_interpolate(concentration, breakpoints):
        """Linear interpolation for AQI calculation."""
        for i in range(len(breakpoints) - 1):
            if breakpoints[i][0] <= concentration <= breakpoints[i+1][0]:
                c_lo, aqi_lo = breakpoints[i]
                c_hi, aqi_hi = breakpoints[i+1]
                
                aqi = ((aqi_hi - aqi_lo) / (c_hi - c_lo)) * (concentration - c_lo) + aqi_lo
                return round(aqi)
        
        # Handle values above the highest breakpoint
        if concentration > breakpoints[-1][0]:
            return 500  # Hazardous
        return 0  # Below lowest breakpoint
    
    # EPA AQI breakpoints [concentration, AQI]
    pm25_breakpoints = [
        (0, 0), (12, 50), (35.4, 100), (55.4, 150),
        (150.4, 200), (250.4, 300), (500.4, 500)
    ]
    
    o3_breakpoints = [  # 8-hour average in ppm, converted to ppb
        (0, 0), (54, 50), (70, 100), (85, 150),
        (105, 200), (200, 300), (300, 500)
    ]
    
    no2_breakpoints = [  # 1-hour average in ppb
        (0, 0), (53, 50), (100, 100), (360, 150),
        (649, 200), (1249, 300), (2049, 500)
    ]
    
    aqi_values = {}
    
    if pm25 is not None:
        aqi_values['PM2.5'] = linear_interpolate(pm25, pm25_breakpoints)
    
    if o3 is not None:
        aqi_values['O3'] = linear_interpolate(o3, o3_breakpoints)
    
    if no2 is not None:
        aqi_values['NO2'] = linear_interpolate(no2, no2_breakpoints)
    
    # Overall AQI is the maximum of individual AQIs
    if aqi_values:
        overall_aqi = max(aqi_values.values())
        aqi_values['Overall'] = overall_aqi
    else:
        aqi_values['Overall'] = 0
    
    return aqi_values

def get_aqi_category(aqi_value):
    """Get AQI category and color based on AQI value."""
    if aqi_value <= 50:
        return "Good", "#00E400"
    elif aqi_value <= 100:
        return "Moderate", "#FFFF00"
    elif aqi_value <= 150:
        return "Unhealthy for Sensitive Groups", "#FF7E00"
    elif aqi_value <= 200:
        return "Unhealthy", "#FF0000"
    elif aqi_value <= 300:
        return "Very Unhealthy", "#8F3F97"
    else:
        return "Hazardous", "#7E0023"

def get_health_recommendation(aqi_value, user_profile=None):
    """
    Get personalized health recommendations based on AQI and user profile.
    
    Args:
        aqi_value (int): Current AQI value
        user_profile (dict): User health profile with age, conditions, activity level
        
    Returns:
        dict: Health recommendations and advice
    """
    category, color = get_aqi_category(aqi_value)
    
    # Base recommendations for each AQI category
    base_recommendations = {
        "Good": {
            "general": "Air quality is satisfactory. Perfect day for outdoor activities!",
            "activities": "All outdoor activities recommended",
            "precautions": "None needed"
        },
        "Moderate": {
            "general": "Air quality is acceptable. Sensitive individuals should limit prolonged outdoor exertion.",
            "activities": "Most outdoor activities are fine. Consider shorter durations for intense exercise.",
            "precautions": "Sensitive individuals should monitor symptoms"
        },
        "Unhealthy for Sensitive Groups": {
            "general": "Sensitive groups should reduce outdoor activities.",
            "activities": "Limit outdoor exercise. Choose indoor alternatives when possible.",
            "precautions": "Sensitive individuals should stay indoors during peak hours"
        },
        "Unhealthy": {
            "general": "Everyone should limit outdoor activities.",
            "activities": "Avoid outdoor exercise. Stay indoors with windows closed.",
            "precautions": "Use air purifiers indoors. Wear masks when going outside."
        },
        "Very Unhealthy": {
            "general": "Everyone should avoid outdoor activities.",
            "activities": "Stay indoors. Avoid all outdoor exercise.",
            "precautions": "Keep windows closed. Use air purifiers. Wear N95 masks outdoors."
        },
        "Hazardous": {
            "general": "Emergency conditions. Everyone should remain indoors.",
            "activities": "No outdoor activities. Stay indoors with air purification.",
            "precautions": "Seal windows and doors. Use multiple air purifiers. Avoid going outside."
        }
    }
    
    recommendations = base_recommendations.get(category, base_recommendations["Moderate"])
    
    # Personalize based on user profile
    if user_profile:
        age = user_profile.get('age', 30)
        conditions = user_profile.get('conditions', [])
        activity_level = user_profile.get('activity_level', 'moderate')
        
        # Adjust for age
        if age < 18 or age > 65:
            if aqi_value > 100:
                recommendations["precautions"] += " Extra caution recommended for your age group."
        
        # Adjust for health conditions
        sensitive_conditions = ['asthma', 'copd', 'heart_disease', 'diabetes']
        if any(condition in conditions for condition in sensitive_conditions):
            if aqi_value > 50:
                recommendations["precautions"] += " Your health conditions require extra caution."
                if aqi_value > 100:
                    recommendations["activities"] = "Avoid all outdoor activities. Consult your healthcare provider."
        
        # Adjust for activity level
        if activity_level == 'high' and aqi_value > 100:
            recommendations["activities"] = "Consider indoor training alternatives. High-intensity exercise not recommended outdoors."
    
    return {
        "category": category,
        "color": color,
        "recommendations": recommendations,
        "aqi_value": aqi_value
    }

@st.cache_data(ttl=3600)
def fetch_air_quality_data(lat, lon):
    """
    Fetch current air quality data from multiple sources.
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        
    Returns:
        dict: Air quality data from various sources
    """
    data = {}
    
    # Try AirNow API (US only)
    try:
        airnow_key = st.secrets.get("AIRNOW_KEY")
        if airnow_key:
            url = "http://www.airnowapi.org/aq/observation/latLong/current/"
            params = {
                'format': 'application/json',
                'latitude': lat,
                'longitude': lon,
                'distance': 25,
                'API_KEY': airnow_key
            }
            response = requests.get(url, params=params)
            if response.status_code == 200:
                airnow_data = response.json()
                data['airnow'] = airnow_data
    except Exception as e:
        st.warning(f"AirNow API error: {str(e)}")
    
    # Try AQICN API (Global)
    try:
        aqicn_token = st.secrets.get("AQICN_TOKEN")
        if aqicn_token:
            url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
            params = {'token': aqicn_token}
            response = requests.get(url, params=params)
            if response.status_code == 200:
                aqicn_data = response.json()
                data['aqicn'] = aqicn_data
    except Exception as e:
        st.warning(f"AQICN API error: {str(e)}")
    
    return data

def process_training_data():
    """
    Process training data from CSV files for model training.
    This function is used by the train_model.py script.
    
    Returns:
        pd.DataFrame: Processed training data
    """
    try:
        # Define paths for training data
        us_data_files = [
            'training_data/us/daily_44201_2025.csv',  # Ozone
            'training_data/us/daily_42602_2025.csv',  # NO2
            'training_data/us/daily_88502_2025.csv'   # PM2.5
        ]
        
        ghana_data_files = [
            'training_data/ghana/accra-us embassy-air-quality.csv'
        ]
        
        # Target site IDs for US data filtering
        target_sites = ['060371103', '080310027', '360810124']
        
        all_data = []
        
        # Process US data files
        for file_path in us_data_files:
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                
                # Filter for target sites
                if 'Site Num' in df.columns:
                    site_id_col = 'State Code' + 'County Code' + 'Site Num'
                    df['site_id'] = df['State Code'].astype(str).str.zfill(2) + \
                                   df['County Code'].astype(str).str.zfill(3) + \
                                   df['Site Num'].astype(str).str.zfill(4)
                    df = df[df['site_id'].isin(target_sites)]
                
                # Standardize columns
                if 'Date Local' in df.columns:
                    df['date'] = pd.to_datetime(df['Date Local'])
                if 'Arithmetic Mean' in df.columns:
                    df['value'] = df['Arithmetic Mean']
                if 'Parameter Name' in df.columns:
                    df['parameter'] = df['Parameter Name']
                
                all_data.append(df)
        
        # Process Ghana data
        for file_path in ghana_data_files:
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                
                # Standardize Ghana data format
                if 'date' in df.columns and 'pm25' in df.columns:
                    df['date'] = pd.to_datetime(df['date'])
                    df['value'] = df['pm25']
                    df['parameter'] = 'PM2.5'
                    df['site_id'] = 'ghana_accra'
                    df['Latitude'] = 5.6037  # Accra coordinates
                    df['Longitude'] = -0.1870
                
                all_data.append(df)
        
        # Combine all data
        if all_data:
            combined_data = pd.concat(all_data, ignore_index=True)
            
            # Clean and prepare data
            required_columns = ['date', 'value', 'parameter', 'Latitude', 'Longitude']
            combined_data = combined_data.dropna(subset=required_columns)
            
            return combined_data
        else:
            st.error("No training data files found")
            return None
            
    except Exception as e:
        st.error(f"Error processing training data: {str(e)}")
        return None
