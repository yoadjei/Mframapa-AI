import streamlit as st
from utils import get_lat_lon
import time

st.set_page_config(
    page_title="Home - Mframapa AI",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 💅 Enhanced CSS with balanced colors
st.markdown("""
<style>
body {
    background: linear-gradient(135deg, #b3e5fc 0%, #0288d1 100%);
    font-family: 'Poppins', sans-serif;
    color: #222;
}

/* Fade-in animation */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Main content container */
.main-container {
    animation: fadeInUp 0.8s ease forwards;
    background: rgba(255, 255, 255, 0.92);
    border-radius: 20px;
    padding: 40px;
    margin: 40px auto;
    width: 95%;
    max-width: 1200px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

/* Hero section */
.hero {
    text-align: center;
    padding: 70px 20px;
    background: linear-gradient(135deg, #01579b, #039be5);
    border-radius: 20px;
    color: #fff;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}
.hero h1 {
    font-size: 3em;
    margin-bottom: 15px;
    letter-spacing: 1px;
}
.hero p {
    font-size: 1.2em;
    opacity: 0.95;
}

/* Input styling */
.stTextInput > div > div > input {
    border-radius: 25px;
    border: 2px solid #0288d1;
    padding: 12px 18px;
    font-size: 1em;
    transition: all 0.3s ease;
    background: #f7faff;
    color: #222;
}
.stTextInput > div > div > input:focus {
    border-color: #4fc3f7;
    box-shadow: 0 0 10px rgba(79,195,247,0.4);
}

/* Button styling */
.stButton > button {
    border-radius: 25px;
    background: linear-gradient(135deg, #0288d1, #4fc3f7);
    color: white;
    padding: 12px 24px;
    font-weight: 600;
    border: none;
    transition: all 0.3s ease;
}
.stButton > button:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
}

/* Feature cards */
.feature-card {
    background: #fdfdfd;
    border-radius: 15px;
    padding: 25px;
    margin: 15px 0;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    animation: fadeInUp 0.8s ease forwards;
    border-left: 4px solid #0288d1;
}
.feature-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
}

/* Section titles */
h2, h3 {
    color: #01579b !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .hero h1 { font-size: 2.2em; }
    .main-container { padding: 25px; margin: 15px; }
    .stButton > button { width: 100%; }
}
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 🌬️ Mframapa AI")
    st.markdown("""
    - [🏠 Home](#)
    - [📈 Forecast](2_Forecast)
    - [🔬 Explain](explain)
    - [💡 Insights](insights)
    - [🏛️ Policy](policy)
    - [👥 Community](community)
    """)
    st.markdown("---")
    st.markdown("**📞 Support & Feedback**  \nBuilt for NASA Space Apps Challenge 2025")
    st.markdown("[Contact Us](mailto:adjeiyawosei@gmail.com)")

# Main content
st.markdown('<div class="main-container">', unsafe_allow_html=True)

# Hero section
st.markdown("""
<div class="hero">
  <h1>🌬️ Mframapa AI</h1>
  <p>Your intelligent, AI-powered air quality companion 🌍</p>
</div>
""", unsafe_allow_html=True)

# Search section
st.markdown("## 🔎 Check Air Quality in Your City")
col1, col2 = st.columns([3, 1])
with col1:
    city_input = st.text_input("Enter your city", placeholder="e.g., Accra, Los Angeles, New York...")
with col2:
    st.markdown("<br>", unsafe_allow_html=True)
    lookup_button = st.button("Search City", use_container_width=True)

# Search logic + redirect
if lookup_button and city_input:
    with st.spinner(f"🌍 Finding {city_input}..."):
        time.sleep(1)
        coordinates = get_lat_lon(city_input)
        if coordinates:
            lat, lon = coordinates
            st.session_state.selected_city = city_input
            st.session_state.selected_coordinates = coordinates
            st.success(f"✅ {city_input} found! Redirecting to Forecast page...")
            time.sleep(1.3)
            st.switch_page("pages/2_Forecast.py")
        else:
            st.error("❌ City not found. Please check spelling or try another location.")

# Highlights
st.markdown("---")
st.markdown("## ✨ Why You'll Love Mframapa AI")

col1, col2 = st.columns(2)
with col1:
    st.markdown("""
    <div class='feature-card'>
    <h3>🛰️ Satellite Intelligence</h3>
    <p>Powered by NASA TEMPO and MERRA-2 data for accurate, global coverage.</p>
    </div>
    <div class='feature-card'>
    <h3>🤖 Smart Forecasts</h3>
    <p>AI models predict PM2.5, NO₂, and O₃ levels up to 48 hours ahead.</p>
    </div>
    """, unsafe_allow_html=True)
with col2:
    st.markdown("""
    <div class='feature-card'>
    <h3>💡 Personalized Insights</h3>
    <p>Health and activity recommendations tailored to your environment.</p>
    </div>
    <div class='feature-card'>
    <h3>🌐 Global Access</h3>
    <p>Available anywhere — no ground station required, free for everyone.</p>
    </div>
    """, unsafe_allow_html=True)

# Call to Action
st.markdown("---")
st.markdown("## 🚀 Get Started")
cta_col1, cta_col2, cta_col3 = st.columns(3)
cta_col1.markdown("<div class='feature-card'><h3>1️⃣ Enter City</h3><p>Start above with your preferred city.</p></div>", unsafe_allow_html=True)
cta_col2.markdown("<div class='feature-card'><h3>2️⃣ View Forecasts</h3><p>Explore detailed air quality predictions.</p></div>", unsafe_allow_html=True)
cta_col3.markdown("<div class='feature-card'><h3>3️⃣ Personalize</h3><p>Receive health-based tips and alerts.</p></div>", unsafe_allow_html=True)

if not st.session_state.get("selected_city"):
    st.info("💡 Start by entering your city above to explore live forecasts!")
else:
    st.success(f"🎉 You're ready! Explore forecasts for **{st.session_state.selected_city}**.")

# Footer
st.markdown("---")
st.markdown("""
<center>
<p><strong>🌍 Mframapa AI</strong> — Cleaner air for a healthier planet</p>
</center>
""", unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
