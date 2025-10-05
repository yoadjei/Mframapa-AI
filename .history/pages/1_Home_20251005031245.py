import streamlit as st
from utils import get_lat_lon
import pandas as pd

# Set page configuration
st.set_page_config(
    page_title="Home - Mframapa AI",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for styling, responsiveness, and animations
st.markdown("""
<style>
/* Global styles */
body {
    background: linear-gradient(135deg, #e0f7fa 0%, #80deea 100%);
    font-family: 'Arial', sans-serif;
}

/* Container for main content */
.main-container {
    background: white;
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    margin: 20px;
}

/* Sidebar styling */
.stSidebar {
    background: linear-gradient(180deg, #0288d1 0%, #4fc3f7 100%);
    color: white;
}

/* Sidebar menu items */
.stSidebar a {
    color: white !important;
    font-weight: 500;
    padding: 10px;
    border-radius: 8px;
    transition: background 0.3s ease;
}
.stSidebar a:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* City input styling */
.stTextInput > div > div > input {
    border-radius: 25px;
    padding: 10px 20px;
    border: 2px solid #0288d1;
    transition: border-color 0.3s ease;
}
.stTextInput > div > div > input:focus {
    border-color: #4fc3f7;
}

/* Button styling */
.stButton > button {
    border-radius: 25px;
    background: #0288d1;
    color: white;
    padding: 10px 20px;
    transition: transform 0.2s ease, background 0.3s ease;
}
.stButton > button:hover {
    background: #4fc3f7;
    transform: scale(1.05);
}

/* Feature cards */
.feature-card {
    background: #f5f5f5;
    border-radius: 10px;
    padding: 20px;
    margin: 10px 0;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .main-container {
        margin: 10px;
        padding: 15px;
    }
    .stButton > button {
        width: 100%;
    }
    .feature-card {
        margin: 5px 0;
    }
}
</style>
""", unsafe_allow_html=True)

# Sidebar navigation
with st.sidebar:
    st.markdown("### 🌬️ Mframapa AI")
    st.markdown("""
    Navigate to explore air quality insights and tools:
    - [🏠 Home](#)
    - [📈 Forecast](forecast)
    - [🔬 Explain](explain)
    - [💡 Insights](insights)
    - [🏛️ Policy](policy)
    - [👥 Community](community)
    """)
    st.markdown("---")
    st.markdown("**📞 Support & Feedback**")
    st.markdown("Built for NASA Space Apps Challenge 2025")
    st.markdown("[Contact Us](mailto:support@mframapa.ai)")

# Main content container
with st.container():
    st.markdown('<div class="main-container">', unsafe_allow_html=True)
    
    # Header section
    st.title("🌬️ Mframapa AI")
    st.markdown("""
    <h3 style='color: #0288d1;'>Your Intelligent Air Quality Companion</h3>
    <p style='font-size: 1.1em;'>Empowering everyone with accurate air quality forecasts using NASA satellite data and AI.</p>
    """, unsafe_allow_html=True)
    
    # City selection section
    st.markdown("### 🌍 Find Your City's Air Quality")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        city_input = st.text_input(
            "Enter your city",
            placeholder="e.g., Los Angeles, Accra, or any city worldwide",
            help="Type any city name to get started with air quality forecasts."
        )
    
    with col2:
        st.markdown("<br>", unsafe_allow_html=True)
        lookup_button = st.button("🔍 Search", type="primary")
    
    # Process city lookup
    if lookup_button and city_input:
        with st.spinner(f"Looking up coordinates for {city_input}..."):
            coordinates = get_lat_lon(city_input)
            
            if coordinates:
                lat, lon = coordinates
                st.session_state.selected_city = city_input
                st.session_state.selected_coordinates = coordinates
                
                st.success(f"✅ Found {city_input}!")
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Latitude", f"{lat:.4f}")
                with col2:
                    st.metric("Longitude", f"{lon:.4f}")
                
                st.info("📈 Your city is set! Redirecting to Forecast page...")
                st.switch_page("pages/forecast.py")
                
            else:
                st.error(f"❌ Could not find '{city_input}'. Try another city or check spelling.")
    
    # Display current selection
    if st.session_state.get('selected_city'):
        st.markdown("---")
        st.markdown("### ✅ Your Location")
        
        col1, col2, col3 = st.columns([2, 1, 1])
        with col1:
            st.markdown(f"**🏙️ {st.session_state.selected_city}**")
        
        with col2:
            if st.session_state.selected_coordinates:
                lat, lon = st.session_state.selected_coordinates
                st.markdown(f"**📍 {lat:.2f}, {lon:.2f}**")
        
        with col3:
            if st.button("🗑️ Clear Selection"):
                st.session_state.selected_city = None
                st.session_state.selected_coordinates = None
                st.rerun()
    
    # Mission section
    st.markdown("---")
    st.markdown("## 🎯 Our Mission")
    st.markdown("""
    Air pollution impacts billions, yet reliable forecasts are scarce in many regions. 
    **Mframapa AI** uses NASA satellite data and advanced AI to deliver accurate, 
    accessible air quality forecasts globally, empowering healthier communities.
    """)
    
    # Feature highlights
    st.markdown("## ✨ Why Choose Mframapa AI?")
    
    feature_col1, feature_col2 = st.columns(2)
    with feature_col1:
        st.markdown("""
        <div class='feature-card'>
        <h3>🛰️ Satellite-Powered Insights</h3>
        <ul>
            <li>TEMPO high-resolution data for North America</li>
            <li>MERRA-2 global coverage</li>
            <li>Real-time atmospheric monitoring</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class='feature-card'>
        <h3>🤖 AI-Driven Forecasts</h3>
        <ul>
            <li>XGBoost machine learning models</li>
            <li>48-hour prediction horizon</li>
            <li>Tracks PM2.5, O₃, NO₂</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with feature_col2:
        st.markdown("""
        <div class='feature-card'>
        <h3>🏥 Health Recommendations</h3>
        <ul>
            <li>Personalized for age and conditions</li>
            <li>Activity-based guidance</li>
            <li>Real-time risk assessments</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("""
        <div class='feature-card'>
        <h3>🌐 Global Reach</h3>
        <ul>
            <li>Works in data-sparse regions</li>
            <li>No ground station dependency</li>
            <li>Free and open access</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    # Regional focus
    st.markdown("## 🌍 Regional Coverage")
    
    region_col1, region_col2 = st.columns(2)
    with region_col1:
        st.markdown("""
        <div class='feature-card'>
        <h3>North America 🇺🇸 🇨🇦 🇲🇽</h3>
        <p><strong>High-Resolution Data</strong></p>
        <ul>
            <li>TEMPO satellite: hourly NO₂, O₃</li>
            <li>Ground station validation</li>
            <li>City-level accuracy</li>
            <li>Key cities: Los Angeles, New York, Toronto</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    with region_col2:
        st.markdown("""
        <div class='feature-card'>
        <h3>West Africa 🇬🇭</h3>
        <p><strong>Data-Sparse Solutions</strong></p>
        <ul>
            <li>MERRA-2 reanalysis data</li>
            <li>Climate-adapted modeling</li>
            <li>Dust storm tracking</li>
            <li>Key cities: Accra, Lagos, Abidjan</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)
    
    # Call to action
    st.markdown("---")
    st.markdown("## 🚀 Get Started Now")
    
    action_col1, action_col2, action_col3 = st.columns(3)
    with action_col1:
        st.markdown("""
        <div class='feature-card'>
        <h3>1️⃣ Select Your City</h3>
        <p>Use the search above to pick your location.</p>
        </div>
        """, unsafe_allow_html=True)
    
    with action_col2:
        st.markdown("""
        <div class='feature-card'>
        <h3>2️⃣ View Forecasts</h3>
        <p>Check 48-hour air quality predictions.</p>
        </div>
        """, unsafe_allow_html=True)
    
    with action_col3:
        st.markdown("""
        <div class='feature-card'>
        <h3>3️⃣ Personalize</h3>
        <p>Create a profile for tailored health tips.</p>
        </div>
        """, unsafe_allow_html=True)
    
    if not st.session_state.get('selected_city'):
        st.info("💡 **Tip:** Start by selecting your city above to unlock all features!")
    else:
        st.success(f"🎉 You're ready! Explore forecasts for **{st.session_state.selected_city}**.")
    
    # Footer
    st.markdown("---")
    st.markdown("""
    ### 📚 Explore More
    
    - **🔬 How It Works**: Learn about our AI models
    - **💡 Insights**: Discover air quality trends
    - **🏛️ Policy**: Understand regulations
    - **👥 Community**: Join our crowdsourcing efforts
    
    *🌍 Mframapa AI - Cleaner air for a healthier planet*
    """)
    
    st.markdown('</div>', unsafe_allow_html=True)