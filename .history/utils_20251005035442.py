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
        return None

@st.cache_data(ttl=3600)
def fetch_openweather_forecast(lat: float, lon: float):
    """
    Fetch weather forecast data from OpenWeatherMap API (Free Plan).

    Args:
        lat (float): Latitude
        lon (float): Longitude

    Returns:
        dict | None: JSON forecast data if successful, otherwise None.
    """
    api_key = st.secrets.get("OPENWEATHER_KEY")
    if not api_key:
        return None

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if str(data.get("cod")) != "200":
            return None

        return data

    except requests.exceptions.RequestException:
        return None

@st.cache_data(ttl=3600)
def fetch_merra2_data(lat: float, lon: float, start_date: str, end_date: str):
    """
    Download and process NASA MERRA-2 collections for air quality modeling.

    Args:
        lat (float): Latitude
        lon (float): Longitude
        start_date (str): Start date in YYYY-MM-DD
        end_date (str): End date in YYYY-MM-DD

    Returns:
        dict | None: Processed MERRA-2 data (keyed by variable name) or fallback values
    """
    try:
        # Authenticate with NASA Earthdata using secrets.toml
        username = st.secrets.get("EARTHDATA_USERNAME")
        password = st.secrets.get("EARTHDATA_PASSWORD")

        if not username or not password:
            return {
                "BCSMASS": 0.0,
                "OCSMASS": 0.0,
                "DUSMASS": 0.0,
                "SSSMASS": 0.0,
                "SO4SMASS": 0.0,
                "T2M": 20.0,
                "QV2M": 0.01,
                "U2M": 0.0,
                "V2M": 0.0,
                "PBLH": 1000.0,
                "CLDTOT": 0.5
            }

        # Set environment variables for earthaccess
        os.environ["EARTHDATA_USERNAME"] = username
        os.environ["EARTHDATA_PASSWORD"] = password

        # Authenticate using environment strategy
        auth = earthaccess.login(strategy="environment")
        if not auth.authenticated:
            return {
                "BCSMASS": 0.0,
                "OCSMASS": 0.0,
                "DUSMASS": 0.0,
                "SSSMASS": 0.0,
                "SO4SMASS": 0.0,
                "T2M": 20.0,
                "QV2M": 0.01,
                "U2M": 0.0,
                "V2M": 0.0,
                "PBLH": 1000.0,
                "CLDTOT": 0.5
            }

        # Define collections
        collections = ["M2T1NXAER", "M2T1NXSLV"]
        data_dict = {}

        # Loop through MERRA-2 collections
        for collection in collections:
            try:
                granules = earthaccess.search_data(
                    short_name=collection,
                    temporal=(start_date, end_date),
                    bounding_box=(lon - 0.5, lat - 0.5, lon + 0.5, lat + 0.5)
                )

                if not granules:
                    continue

                files = earthaccess.download(granules, local_path="./temp_data")

                for file in files:
                    if not file.endswith(".nc4"):
                        continue

                    ds = xr.open_dataset(file)

                    if collection == "M2T1NXAER":
                        variables = ["BCSMASS", "OCSMASS", "DUSMASS", "SSSMASS", "SO4SMASS"]
                    else:
                        variables = ["T2M", "QV2M", "U2M", "V2M", "PBLH", "CLDTOT"]

                    for var in variables:
                        if var in ds.variables:
                            var_data = ds[var].sel(lat=lat, lon=lon, method="nearest")
                            data_dict[var] = float(var_data.mean().values)

                    ds.close()
                    try:
                        os.remove(file)
                    except OSError:
                        pass

            except Exception:
                continue

        # Return data if available, otherwise provide fallback values
        if data_dict:
            return data_dict

        # Fallback values for MERRA-2 variables
        return {
            "BCSMASS": 0.0,
            "OCSMASS": 0.0,
            "DUSMASS": 0.0,
            "SSSMASS": 0.0,
            "SO4SMASS": 0.0,
            "T2M": 20.0,
            "QV2M": 0.01,
            "U2M": 0.0,
            "V2M": 0.0,
            "PBLH": 1000.0,
            "CLDTOT": 0.5
        }

    except Exception:
        # Return fallback values on any error
        return {
            "BCSMASS": 0.0,
            "OCSMASS": 0.0,
            "DUSMASS": 0.0,
            "SSSMASS": 0.0,
            "SO4SMASS": 0.0,
            "T2M": 20.0,
            "QV2M": 0.01,
            "U2M": 0.0,
            "V2M": 0.0,
            "PBLH": 1000.0,
            "CLDTOT": 0.5
        }

@st.cache_data(ttl=3600)
def fetch_tempo_data(bounding_box, start_date, end_date):
    """
    Download data from NASA TEMPO satellite for North America.
    
    Args:
        bounding_box (tuple): (min_lon, min_lat, max_lon, max_lat)
        start_date (str): Start date in YYYY-MM-DD format
        end_date (str): End date in YYYY-MM-DD format
        
    Returns:
        dict: Processed TEMPO data or fallback values
    """
    try:
        # Check if location is in North America
        min_lon, min_lat, max_lon, max_lat = bounding_box
        na_bounds = (-170, 15, -50, 75)
        
        if not (na_bounds[0] <= min_lon <= na_bounds[2] and 
                na_bounds[1] <= min_lat <= na_bounds[3]):
            return {
                "NO2_vertical_column_troposphere": 0.0,
                "NO2_column_uncertainty": 0.0
            }

        # Authenticate with NASA Earthdata using secrets.toml
        username = st.secrets.get("EARTHDATA_USERNAME")
        password = st.secrets.get("EARTHDATA_PASSWORD")

        if not username or not password:
            return {
                "NO2_vertical_column_troposphere": 0.0,
                "NO2_column_uncertainty": 0.0
            }

        # Set environment variables for earthaccess
        os.environ["EARTHDATA_USERNAME"] = username
        os.environ["EARTHDATA_PASSWORD"] = password

        # Authenticate using environment strategy
        auth = earthaccess.login(strategy="environment")
        if not auth.authenticated:
            return {
                "NO2_vertical_column_troposphere": 0.0,
                "NO2_column_uncertainty": 0.0
            }
        
        data_dict = {}
        
        granules = earthaccess.search_data(
            short_name="TEMPO_NO2_L2",
            temporal=(start_date, end_date),
            bounding_box=bounding_box
        )
        
        if granules:
            files = earthaccess.download(granules[:5], local_path="./temp_data")
            
            for file in files:
                if file.endswith('.nc'):
                    try:
                        ds = xr.open_dataset(file)
                        
                        variables = ['vertical_column_troposphere', 'column_uncertainty']
                        
                        for var in variables:
                            if var in ds.variables:
                                var_data = ds[var].sel(
                                    latitude=slice(min_lat, max_lat),
                                    longitude=slice(min_lon, max_lon)
                                ).mean()
                                data_dict[f"NO2_{var}"] = float(var_data.values)
                        
                        ds.close()
                        try:
                            os.remove(file)
                        except OSError:
                            pass
                    except Exception:
                        continue
        
        # Return data if available, otherwise provide fallback values
        if data_dict:
            return data_dict
        
        return {
            "NO2_vertical_column_troposphere": 0.0,
            "NO2_column_uncertainty": 0.0
        }
        
    except Exception:
        return {
            "NO2_vertical_column_troposphere": 0.0,
            "NO2_column_uncertainty": 0.0
        }

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
        
        if concentration > breakpoints[-1][0]:
            return 500
        return 0
    
    pm25_breakpoints = [
        (0, 0), (12, 50), (35.4, 100), (55.4, 150),
        (150.4, 200), (250.4, 300), (500.4, 500)
    ]
    
    o3_breakpoints = [
        (0, 0), (54, 50), (70, 100), (85, 150),
        (105, 200), (200, 300), (300, 500)
    ]
    
    no2_breakpoints = [
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
    
    if user_profile:
        age = user_profile.get('age', 30)
        conditions = user_profile.get('conditions', [])
        activity_level = user_profile.get('activity_level', 'moderate')
        
        if age < 18 or age > 65:
            if aqi_value > 100:
                recommendations["precautions"] += " Extra caution recommended for your age group."
        
        sensitive_conditions = ['asthma', 'copd', 'heart_disease', 'diabetes']
        if any(condition in conditions for condition in sensitive_conditions):
            if aqi_value > 50:
                recommendations["precautions"] += " Your health conditions require extra caution."
                if aqi_value > 100:
                    recommendations["activities"] = "Avoid all outdoor activities. Consult your healthcare provider."
        
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
    except Exception:
        pass
    
    try:
        aqicn_token = st.secrets.get("AQICN_TOKEN")
        if aqicn_token:
            url = f"https://api.waqi.info/feed/geo:{lat};{lon}/"
            params = {'token': aqicn_token}
            response = requests.get(url, params=params)
            if response.status_code == 200:
                aqicn_data = response.json()
                data['aqicn'] = aqicn_data
    except Exception:
        pass
    
    return data

def process_training_data():
    """
    Process training data from CSV files for model training.
    
    Returns:
        pd.DataFrame: Processed training data
    """
    try:
        us_data_files = [
            'training_data/us/daily_44201_2025.csv',
            'training_data/us/daily_42602_2025.csv',
            'training_data/us/daily_88502_2025.csv'
        ]
        
        ghana_data_files = [
            'training_data/ghana/accra-us embassy-air-quality.csv'
        ]
        
        target_sites = ['060371103', '080310027', '360810124']
        
        all_data = []
        
        for file_path in us_data_files:
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                
                if 'Site Num' in df.columns:
                    site_id_col = 'State Code' + 'County Code' + 'Site Num'
                    df['site_id'] = df['State Code'].astype(str).str.zfill(2) + \
                                   df['County Code'].astype(str).str.zfill(3) + \
                                   df['Site Num'].astype(str).str.zfill(4)
                    df = df[df['site_id'].isin(target_sites)]
                
                if 'Date Local' in df.columns:
                    df['date'] = pd.to_datetime(df['Date Local'])
                if 'Arithmetic Mean' in df.columns:
                    df['value'] = df['Arithmetic Mean']
                if 'Parameter Name' in df.columns:
                    df['parameter'] = df['Parameter Name']
                
                all_data.append(df)
        
        for file_path in ghana_data_files:
            if os.path.exists(file_path):
                df = pd.read_csv(file_path)
                
                if 'date' in df.columns and 'pm25' in df.columns:
                    df['date'] = pd.to_datetime(df['date'])
                    df['value'] = df['pm25']
                    df['parameter'] = 'PM2.5'
                    df['site_id'] = 'ghana_accra'
                    df['Latitude'] = 5.6037
                    df['Longitude'] = -0.1870
                
                all_data.append(df)
        
        if all_data:
            combined_data = pd.concat(all_data, ignore_index=True)
            required_columns = ['date', 'value', 'parameter', 'Latitude', 'Longitude']
            combined_data = combined_data.dropna(subset=required_columns)
            return combined_data
        else:
            return None
            
    except Exception:
        return None
