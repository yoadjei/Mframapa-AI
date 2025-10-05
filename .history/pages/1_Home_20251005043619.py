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

# --- API KEY ---
# The API key is fetched from Streamlit's secrets management.
# Ensure you have a secrets.toml file in a .streamlit folder
# with: OPENWEATHERMAP_API_KEY = "your_key_here"
API_KEY = st.secrets.get("OPENWEATHERMAP_API_KEY")

# --- STYLING (Adapted from the HTML version) ---
st.markdown("""
<style>
    /* Hide Streamlit's default elements */
    .stApp header, .stApp footer, #MainMenu {
        visibility: hidden;
    }
    
    /* Animated Gradient Background */
    .stApp {
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
        color: white;
    }

    @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* General text color */
    .stApp, .stApp .stMarkdown, .stApp .stButton>button p, .stApp .stTextInput>div>div>input {
        color: white;
    }
    
    /* Custom Card Style */
    .card {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
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
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    }
    
    /* Input Box */
    .stTextInput>div>div>input {
        background-color: rgba(255, 255, 255, 0.2);
        border: 2px solid transparent;
        border-radius: 9999px;
        transition: border-color 0.3s;
    }
    .stTextInput>div>div>input:focus {
        border-color: #23d5ab;
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
    }
    
    /* Button */
    .stButton>button {
        border-radius: 9999px;
        background-color: #23a6d5;
        color: white;
        border: none;
        transition: all 0.3s ease;
    }
    .stButton>button:hover {
        background-color: #23d5ab;
        transform: scale(1.05);
    }
    .stButton>button:focus {
        box-shadow: 0 0 0 4px rgba(35, 213, 171, 0.5);
    }
    
    /* Back Button */
    .stButton.back-button>button {
        background-color: transparent;
        color: #e0f2fe;
    }
    .stButton.back-button>button:hover {
        color: white;
        background-color: transparent;
    }

</style>
""", unsafe_allow_html=True)


# --- API CALL FUNCTIONS ---
def get_weather_data(city):
    """Fetches weather, forecast, and AQI data for a city."""
    if not API_KEY:
        return None, "API key not found. Please add OPENWEATHERMAP_API_KEY to your Streamlit secrets."

    try:
        # 1. Get coordinates from city name
        geo_url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric"
        geo_res = requests.get(geo_url)
        geo_res.raise_for_status()
        geo_data = geo_res.json()
        lat, lon = geo_data['coord']['lat'], geo_data['coord']['lon']
        
        # 2. Get forecast and AQI data
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
        aqi_url = f"https://api.openweathermap.org/data/2.5/air_pollution?lat={lat}&lon={lon}&appid={API_KEY}"
        
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
        if err.response.status_code == 404:
            return None, "City not found. Please check the spelling."
        return None, f"An HTTP error occurred: {err}"
    except Exception as err:
        return None, f"An unexpected error occurred: {err}"


# --- UI HELPER FUNCTIONS ---
def get_weather_icon(icon_code):
    """Maps OpenWeatherMap icon codes to emojis."""
    icon_map = {
        '01d': '☀️', '01n': '🌙', '02d': '⛅️', '02n': '☁️', '03d': '☁️', '03n': '☁️',
        '04d': '☁️', '04n': '☁️', '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
        '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️', '50n': '🌫️'
    }
    return icon_map.get(icon_code, '❓')

def get_aqi_label(aqi):
    """Returns a readable label for the AQI value."""
    if aqi == 1: return 'Good'
    if aqi == 2: return 'Fair'
    if aqi == 3: return 'Moderate'
    if aqi == 4: return 'Poor'
    if aqi == 5: return 'Very Poor'
    return 'Unknown'


# --- SESSION STATE INITIALIZATION ---
if 'view' not in st.session_state:
    st.session_state.view = 'main'
if 'weather_data' not in st.session_state:
    st.session_state.weather_data = None
if 'error' not in st.session_state:
    st.session_state.error = None

# --- UI RENDERING ---

# Header
st.markdown("""
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0;">
        <div style="font-size: 1.5rem; font-weight: bold; letter-spacing: 0.1em;">
            🌬️ Mframapa AI
        </div>
        <nav style="display: none; md:display: flex; gap: 1.5rem;">
            <a href="#" style="color: white; text-decoration: none;">Forecast</a>
            <a href="#" style="color: white; text-decoration: none;">Insights</a>
            <a href="#" style="color: white; text-decoration: none;">Policy</a>
            <a href="#" style="color: white; text-decoration: none;">Community</a>
        </nav>
    </div>
""", unsafe_allow_html=True)


# View Controller: Switches between Main and Forecast views
if st.session_state.view == 'main':
    # --- MAIN VIEW ---
    st.markdown("<h1 style='text-align: center; font-size: 3.5rem; line-height: 1.1;'>Your Intelligent Air Quality Companion</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; font-size: 1.25rem; color: #e5e7eb; max-width: 48rem; margin: auto;'>Empowering communities with accurate, AI-driven air quality forecasts using NASA satellite data.</p>", unsafe_allow_html=True)
    st.write("") # Spacer
    st.write("") # Spacer

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        city = st.text_input("Enter your city", placeholder="e.g., Accra, Ghana", label_visibility="collapsed")
        if st.button("Search", use_container_width=True, type="primary"):
            if city:
                with st.spinner("Fetching data..."):
                    data, error = get_weather_data(city)
                    if data:
                        st.session_state.weather_data = data
                        st.session_state.view = 'forecast'
                        st.session_state.error = None
                        st.rerun()
                    else:
                        st.session_state.error = error
            else:
                st.session_state.error = "Please enter a city name."
    
    if st.session_state.error:
        st.error(st.session_state.error)

    st.write("---")
    
    cols = st.columns(3)
    with cols[0]:
        st.markdown("""
        <div class="card feature-card">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛰️</div>
            <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">Satellite-Powered</h3>
            <p style="color: #d1d5db;">Utilizing high-resolution data from NASA's TEMPO and MERRA-2 for global coverage.</p>
        </div>
        """, unsafe_allow_html=True)
    with cols[1]:
        st.markdown("""
        <div class="card feature-card">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
            <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">AI-Driven Forecasts</h3>
            <p style="color: #d1d5db;">Advanced XGBoost models predict PM2.5, O₃, and NO₂ up to 48 hours in advance.</p>
        </div>
        """, unsafe_allow_html=True)
    with cols[2]:
        st.markdown("""
        <div class="card feature-card">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">❤️</div>
            <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">Health Recommendations</h3>
            <p style="color: #d1d5db;">Get personalized, activity-based guidance to protect your health from air pollution.</p>
        </div>
        """, unsafe_allow_html=True)


elif st.session_state.view == 'forecast' and st.session_state.weather_data:
    # --- FORECAST VIEW ---
    data = st.session_state.weather_data
    weather = data['weather']
    forecast = data['forecast']
    aqi_data = data['aqi']

    # Back button
    if st.button("← Search for another city"):
        st.session_state.view = 'main'
        st.session_state.weather_data = None
        st.session_state.error = None
        st.rerun()

    st.markdown(f"<h2 style='text-align: center; font-size: 2.5rem;'>{weather['name']}, {weather['sys']['country']}</h2>", unsafe_allow_html=True)
    st.markdown(f"<p style='text-align: center; font-size: 1.25rem; color: #e5e7eb;'>{weather['weather'][0]['description'].title()}</p>", unsafe_allow_html=True)
    
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
    
    # Process forecast data
    daily_forecasts = {}
    for item in forecast['list']:
        date = datetime.datetime.fromtimestamp(item['dt']).strftime('%a')
        if date not in daily_forecasts:
            daily_forecasts[date] = {'temps': [], 'icons': {}}
        daily_forecasts[date]['temps'].append(item['main']['temp'])
        icon = item['weather'][0]['icon']
        daily_forecasts[date]['icons'][icon] = daily_forecasts[date]['icons'].get(icon, 0) + 1

    cols = st.columns(len(daily_forecasts))
    for i, (day, data) in enumerate(daily_forecasts.items()):
        with cols[i]:
            max_temp = round(max(data['temps']))
            min_temp = round(min(data['temps']))
            most_common_icon = max(data['icons'], key=data['icons'].get)
            
            st.markdown(f"""
            <div style="text-align: center;">
                <p style="font-weight: bold;">{day}</p>
                <p style="font-size: 2rem;">{get_weather_icon(most_common_icon)}</p>
                <p style="font-size: 1.1rem;">{max_temp}°</p>
                <p style="color: #d1d5db;">{min_temp}°</p>
            </div>
            """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

