import streamlit as st
import requests
import datetime

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="Home - Mframapa AI",
    page_icon="🌬️",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- API KEYS ---
# API Keys are fetched from Streamlit's secrets management.
# Ensure you have a secrets.toml file in a .streamlit folder
# with the keys you provided (e.g., OPENWEATHER_KEY = "your_key").
OPENWEATHER_KEY = st.secrets.get("OPENWEATHER_KEY")
AIRNOW_KEY = st.secrets.get("AIRNOW_KEY")
AQICN_TOKEN = st.secrets.get("AQICN_TOKEN")
EARTHDATA_USER = st.secrets.get("EARTHDATA_USER")
EARTHDATA_PASS = st.secrets.get("EARTHDATA_PASS")
PURPLEAIR_KEY = st.secrets.get("PURPLEAIR_KEY")


# --- STYLING ---
st.markdown("""
<style>
    /* Hide Streamlit's default elements */
    .stApp header, .stApp footer, #MainMenu {
        visibility: hidden;
    }
    
    /* Clean Blue & White Gradient Background */
    .stApp {
        background: linear-gradient(135deg, #e0f7fa 0%, #ffffff 100%);
        color: #2c3e50; /* Dark text for readability */
    }

    /* General text color */
    .stApp, .stApp .stMarkdown, .stApp .stButton>button p, .stApp .stTextInput>div>div>input {
        color: #2c3e50;
    }
    
    /* Custom Card Style */
    .card {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        padding: 2rem;
        border-radius: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .feature-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        text-align: left;
    }
    .feature-card:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    /* Input Box */
    .stTextInput>div>div>input {
        background-color: #f0f4f8;
        border: 2px solid #d1d9e6;
        border-radius: 9999px;
        color: #2c3e50;
        transition: border-color 0.3s;
    }
    .stTextInput>div>div>input:focus {
        border-color: #0288d1;
        background-color: #ffffff;
        color: #2c3e50;
    }
    
    /* Button */
    .stButton>button {
        border-radius: 9999px;
        background-color: #0288d1;
        color: white;
        border: none;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #03a9f4;
        transform: scale(1.05);
    }
    .stButton>button:focus {
        box-shadow: 0 0 0 4px rgba(3, 169, 244, 0.3);
    }
    
    /* Back Button */
    .stButton.back-button>button {
        background-color: transparent;
        color: #587a9a;
    }
    .stButton.back-button>button:hover {
        color: #2c3e50;
        background-color: transparent;
    }

</style>
""", unsafe_allow_html=True)


# --- API CALL & HELPER FUNCTIONS ---

def get_weather_data(city):
    """Fetches weather, forecast, and AQI data for a city."""
    if not OPENWEATHER_KEY:
        return None, "API key not found. Please add OPENWEATHER_KEY to your Streamlit secrets."

    try:
        # 1. Get coordinates from city name
        geo_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_KEY}&units=metric"
        geo_res = requests.get(geo_url)
        geo_res.raise_for_status()
        geo_data = geo_res.json()
        lat, lon = geo_data['coord']['lat'], geo_data['coord']['lon']
        
        # 2. Get forecast and AQI data
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}&units=metric"
        aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={OPENWEATHER_KEY}"
        
        forecast_res = requests.get(forecast_url)
        forecast_res.raise_for_status()
        aqi_res = requests.get(aqi_url)
        aqi_res.raise_for_status()
        
        return {
            "weather": geo_data,
            "forecast": forecast_res.json(),
            "aqi": aqi_res.json()
        }, None
    
    except requests.exceptions.HTTPError as err:
        if err.response.status_code == 401:
             return None, "Authentication error. Your OpenWeatherMap API key seems to be invalid."
        if err.response.status_code == 404:
            return None, f"City '{city}' not found. Please check the spelling."
        return None, f"An HTTP error occurred: {err}"
    except Exception as err:
        return None, f"An unexpected error occurred: {err}"

def get_weather_icon(icon_code):
    """Maps OpenWeatherMap icon codes to emojis."""
    icon_map = {'01d': '☀️', '01n': '🌙', '02d': '⛅️', '02n': '☁️', '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️', '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️'}
    return icon_map.get(icon_code, '❓')

def get_aqi_label(aqi):
    """Returns a readable label for the AQI value."""
    labels = {1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor'}
    return labels.get(aqi, 'Unknown')


# --- SESSION STATE INITIALIZATION ---
if 'view' not in st.session_state:
    st.session_state.view = 'main'
if 'weather_data' not in st.session_state:
    st.session_state.weather_data = None
if 'error' not in st.session_state:
    st.session_state.error = None
if 'city_input' not in st.session_state:
    st.session_state.city_input = ""


# --- SEARCH LOGIC ---
def search_city():
    """Callback function to fetch data when city is entered."""
    city = st.session_state.city_input
    if city:
        with st.spinner(f"Fetching data for {city}..."):
            data, error = get_weather_data(city)
            if data:
                st.session_state.weather_data = data
                st.session_state.view = 'forecast'
                st.session_state.error = None
            else:
                st.session_state.error = error
    else:
        st.session_state.error = "Please enter a city name."


# --- UI RENDERING ---

# Header
st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
        <div style="font-size: 1.5rem; font-weight: bold; letter-spacing: 0.1em;">🌬️ Mframapa AI</div>
        <nav style="display: none; md:display: flex; gap: 1.5rem;">
            <a href="#" style="color: #2c3e50; text-decoration: none;">Forecast</a>
            <a href="#" style="color: #2c3e50; text-decoration: none;">Insights</a>
            <a href="#" style="color: #2c3e50; text-decoration: none;">Policy</a>
            <a href="#" style="color: #2c3e50; text-decoration: none;">Community</a>
        </nav>
    </div>
""", unsafe_allow_html=True)

# API Key Check
if not OPENWEATHER_KEY:
    st.warning("OpenWeatherMap API Key is not configured. Please add `OPENWEATHER_KEY = 'your_key'` to your `.streamlit/secrets.toml` file.", icon="⚠️")

# View Controller: Switches between Main and Forecast views
if st.session_state.view == 'main':
    # --- MAIN VIEW ---
    st.markdown("<h1 style='text-align: center; font-size: 3.5rem; line-height: 1.1;'>Your Intelligent Air Quality Companion</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; font-size: 1.25rem; color: #555; max-width: 48rem; margin: auto;'>Empowering communities with accurate, AI-driven air quality forecasts using NASA satellite data.</p>", unsafe_allow_html=True)
    st.write("---")

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.text_input("Enter your city", placeholder="e.g., Accra, Ghana", label_visibility="collapsed", key="city_input", on_change=search_city)
        if st.button("Search", use_container_width=True, type="primary"):
            search_city()
    
    if st.session_state.error:
        st.error(st.session_state.error)

    st.write("---")
    
    cols = st.columns(3)
    card_content = [
        ("🛰️", "Satellite-Powered", "Utilizing high-resolution data from NASA's TEMPO and MERRA-2 for global coverage."),
        ("🤖", "AI-Driven Forecasts", "Advanced XGBoost models predict PM2.5, O₃, and NO₂ up to 48 hours in advance."),
        ("❤️", "Health Recommendations", "Get personalized, activity-based guidance to protect your health from air pollution.")
    ]
    for col, (icon, title, text) in zip(cols, card_content):
        with col:
            st.markdown(f"""
            <div class="card feature-card">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">{icon}</div>
                <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">{title}</h3>
                <p style="color: #6c757d;">{text}</p>
            </div>
            """, unsafe_allow_html=True)

elif st.session_state.view == 'forecast' and st.session_state.weather_data:
    # --- FORECAST VIEW ---
    data = st.session_state.weather_data
    weather = data['weather']
    forecast = data['forecast']
    aqi_data = data['aqi']

    if st.button("← Search for another city"):
        st.session_state.view = 'main'
        st.session_state.weather_data = None
        st.session_state.error = None
        st.session_state.city_input = ""
        st.rerun()

    st.markdown(f"<h2 style='text-align: center; font-size: 2.5rem;'>{weather['name']}, {weather['sys']['country']}</h2>", unsafe_allow_html=True)
    st.markdown(f"<p style='text-align: center; font-size: 1.25rem; color: #555;'>{weather['weather'][0]['description'].title()}</p>", unsafe_allow_html=True)
    
    # Current Weather Card
    st.markdown('<div class="card">', unsafe_allow_html=True)
    cols = st.columns([2,1,2])
    with cols[0]:
        st.write("Now")
        st.markdown(f"<p style='font-size: 4rem; font-weight: bold;'>{round(weather['main']['temp'])}°C</p>", unsafe_allow_html=True)
    with cols[1]:
        st.markdown(f"<div style='font-size: 4rem; text-align: center;'>{get_weather_icon(weather['weather'][0]['icon'])}</div>", unsafe_allow_html=True)
    with cols[2]:
        aqi_val = aqi_data['list'][0]['main']['aqi']
        st.metric("Air Quality", f"{get_aqi_label(aqi_val)} ({aqi_val})")
        st.metric("Humidity", f"{weather['main']['humidity']}%")
        st.metric("Wind", f"{weather['wind']['speed']:.1f} m/s")
    st.markdown('</div>', unsafe_allow_html=True)

    # 5-Day Forecast Card
    st.markdown('<div class="card">', unsafe_allow_html=True)
    st.markdown("<h3 style='font-size: 1.25rem; font-weight: bold; text-align: center; margin-bottom: 1rem;'>5-Day Forecast</h3>", unsafe_allow_html=True)
    
    daily_forecasts = {}
    for item in forecast['list']:
        date = datetime.datetime.fromtimestamp(item['dt']).strftime('%a')
        if date not in daily_forecasts:
            daily_forecasts[date] = {'temps': [], 'icons': {}}
        daily_forecasts[date]['temps'].append(item['main']['temp'])
        icon = item['weather'][0]['icon']
        daily_forecasts[date]['icons'][icon] = daily_forecasts[date]['icons'].get(icon, 0) + 1

    forecast_days = list(daily_forecasts.items())
    num_cols = min(len(forecast_days), 5)
    cols = st.columns(num_cols)

    for i in range(num_cols):
        day, day_data = forecast_days[i]
        with cols[i]:
            max_temp = round(max(day_data['temps']))
            min_temp = round(min(day_data['temps']))
            most_common_icon = max(day_data['icons'], key=day_data['icons'].get)
            
            st.markdown(f"""
            <div style="text-align: center;">
                <p style="font-weight: bold;">{day}</p>
                <p style="font-size: 2rem;">{get_weather_icon(most_common_icon)}</p>
                <p style="font-size: 1.1rem;">{max_temp}°</p>
                <p style="color: #6c757d;">{min_temp}°</p>
            </div>
            """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

