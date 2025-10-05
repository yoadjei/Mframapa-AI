import streamlit as st
import os

# Set page configuration
st.set_page_config(
    page_title="Mframapa AI", 
    page_icon="🌍", 
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        text-align: center;
        padding: 2rem 0;
        background: linear-gradient(90deg, #1f77b4, #17a2b8);
        color: white;
        margin: -1rem -1rem 2rem -1rem;
        border-radius: 10px;
    }
    
    .feature-card {
        background: #f8f9fa;
        padding: 1.5rem;
        border-radius: 10px;
        border-left: 4px solid #1f77b4;
        margin: 1rem 0;
    }
    
    .metric-container {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        text-align: center;
        margin: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Main header
st.markdown("""
<div class="main-header">
    <h1>🌍 Mframapa AI</h1>
    <h3>Advanced Air Quality Forecasting with NASA Satellite Data</h3>
    <p>Powered by XGBoost ML • Real-time Global Coverage • Personalized Health Insights</p>
</div>
""", unsafe_allow_html=True)

# Welcome message
st.markdown("## Welcome to Mframapa AI")

st.markdown("""
**Mframapa AI** is an advanced air quality forecasting system that combines cutting-edge satellite data 
from NASA with machine learning to provide accurate 48-hour predictions for PM2.5, O₃, and NO₂ levels.

### 🚀 Key Features

""")

# Feature columns
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class="feature-card">
        <h4>🛰️ Satellite Data Integration</h4>
        <p>Real-time data from NASA MERRA-2 and TEMPO satellites for global and regional coverage</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="feature-card">
        <h4>🤖 AI-Powered Forecasting</h4>
        <p>XGBoost machine learning models trained on historical air quality and meteorological data</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="feature-card">
        <h4>🏥 Health Recommendations</h4>
        <p>Personalized health advice based on your profile and current air quality conditions</p>
    </div>
    """, unsafe_allow_html=True)

# Region coverage
st.markdown("### 🌐 Regional Coverage")

col1, col2 = st.columns(2)

with col1:
    st.markdown("""
    **North America** 🇺🇸 🇨🇦 🇲🇽
    - High-resolution TEMPO satellite data
    - Real-time ground station integration
    - City-level accuracy
    """)

with col2:
    st.markdown("""
    **Ghana & West Africa** 🇬🇭
    - MERRA-2 reanalysis data
    - Supporting data-sparse regions
    - Climate-adapted modeling
    """)

# Quick stats
st.markdown("### 📊 System Statistics")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown("""
    <div class="metric-container">
        <h2>48hr</h2>
        <p>Forecast Horizon</p>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class="metric-container">
        <h2>3</h2>
        <p>Pollutants Tracked</p>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class="metric-container">
        <h2>2+</h2>
        <p>Regions Covered</p>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown("""
    <div class="metric-container">
        <h2>24/7</h2>
        <p>Real-time Updates</p>
    </div>
    """, unsafe_allow_html=True)

# Navigation guide
st.markdown("### 🗺️ Navigation Guide")

st.markdown("""
Use the sidebar to navigate through different features of Mframapa AI:

1. **🏠 Home** - Welcome page and overview
2. **📈 Forecast** - Get 48-hour air quality predictions for any city
3. **👤 Profile** - Set up your health profile for personalized recommendations
4. **🔄 Compare** - Compare air quality between different locations
5. **💡 Insights** - Learn about air quality patterns and trends
6. **🔬 Explain** - Understand how our AI models work
7. **🏛️ Policy Dashboard** - Air quality policy and regulation information
8. **🌏 Cross-Border Tracker** - Monitor transboundary pollution patterns
9. **🏥 Health Integration** - Detailed health impact analysis
10. **🎮 Gamified Learning** - Interactive air quality education
11. **📚 Historical Explorer** - Explore historical air quality data
12. **👥 Crowdsourcing** - Community-driven data collection

**Get started by clicking on "📈 Forecast" in the sidebar to make your first prediction!**
""")

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: #666; padding: 1rem;">
    <p>🌍 Mframapa AI - Making air quality data accessible to everyone</p>
    <p>Built for NASA Space Apps Challenge 2025</p>
</div>
""", unsafe_allow_html=True)

# Initialize session state
if 'selected_city' not in st.session_state:
    st.session_state.selected_city = None

if 'selected_coordinates' not in st.session_state:
    st.session_state.selected_coordinates = None

if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}

# Check for model files
model_files_exist = False
model_formats = (".json", ".pkl")

if os.path.exists("models"):
    model_files_exist = any(
        f.endswith(model_formats)
        for f in os.listdir("models")
        if os.path.isfile(os.path.join("models", f))
    )

if not model_files_exist:
    st.warning("""
    ⚠️ **Model files not found!**
    Please make sure your trained model files (.json or .pkl) are inside the `/models` folder.

    **Expected structure:**
    ```
    models/
    ├── xgboost_model_pm25.json
    ├── xgboost_model_o3.json
    ├── xgboost_model_no2.json
    ├── feature_columns.pkl
    ├── normalization_params.pkl
    ├── label_encoders.pkl
    ```
    """)

# --- SIDEBAR STATUS PANEL ---
with st.sidebar:
    st.markdown("### System Status")

    if model_files_exist:
        st.success("✅ Models detected (.json / .pkl)")
    else:
        st.error("❌ Models missing — run `train_model.py` to generate them")

    # --- Check API keys from Streamlit secrets ---
    required_keys = ["OPENWEATHER_KEY", "EARTHDATA_USER", "EARTHDATA_PASS"]
    missing_keys = []

    for key in required_keys:
        try:
            if key not in st.secrets or not st.secrets[key]:
                missing_keys.append(key)
        except Exception:
            missing_keys.append(key)

    if missing_keys:
        st.warning(f"⚠️ Missing secrets: {', '.join(missing_keys)}")
    else:
        st.success("✅ API keys configured")

    st.markdown("### Quick Access")
    if st.button("🏠 Reset to Home"):
        st.session_state.selected_city = None
        st.session_state.selected_coordinates = None
        st.rerun()
