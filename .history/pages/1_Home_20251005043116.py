import streamlit as st
from utils import get_lat_lon
import time

# Set up page
st.set_page_config(
    page_title="Mframapa AI - Home",
    page_icon="🌬️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS + animations
st.markdown("""
<style>
/* Animated gradient background */
body {
    background: linear-gradient(-45deg, #d9f7ff, #a6e3ff, #b3e5fc, #e1f5fe);
    background-size: 400% 400%;
    animation: gradientMove 12s ease infinite;
    font-family: "Poppins", sans-serif;
    color: #333;
}
@keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* Page container */
.main-container {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 18px;
    padding: 3rem;
    margin: 2rem auto;
    max-width: 1100px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    animation: fadeIn 1s ease-in-out;
}

/* Smooth fade in */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Input styling */
.stTextInput > div > div > input {
    border-radius: 25px;
    padding: 12px 20px;
    border: 2px solid #0288d1;
    transition: all 0.3s ease;
}
.stTextInput > div > div > input:focus {
    border-color: #4fc3f7;
    box-shadow: 0 0 10px rgba(79, 195, 247, 0.4);
}

/* Buttons */
.stButton > button {
    border-radius: 25px;
    padding: 10px 25px;
    background: linear-gradient(90deg, #0288d1, #4fc3f7);
    color: white;
    border: none;
    font-weight: 600;
    transition: all 0.3s ease;
}
.stButton > button:hover {
    transform: scale(1.05);
    background: linear-gradient(90deg, #4fc3f7, #0288d1);
    box-shadow: 0 0 12px rgba(2, 136, 209, 0.4);
}

/* Feature grid */
.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

/* Feature card */
.feature-card {
    background: white;
    border-radius: 15px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}
.feature-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

/* Icons glow */
.glow {
    color: #0288d1;
    text-shadow: 0 0 10px rgba(2,136,209,0.5);
}

/* Responsive text */
h1, h2, h3 { color: #0288d1; }
p { font-size: 1.05rem; }
</style>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.markdown("### 🌬️ Mframapa AI")
    st.markdown("#### Navigation")
    st.page_link("home.py", label="🏠 Home")
    st.page_link("pages/forecast.py", label="📈 Forecast")
    st.page_link("pages/explain.py", label="🔬 Explain")
    st.page_link("pages/insights.py", label="💡 Insights")
    st.page_link("pages/policy.py", label="🏛️ Policy")
    st.page_link("pages/community.py", label="👥 Community")
    st.markdown("---")
    st.markdown("Built for **NASA Space Apps Challenge 2025** 🌍")
    st.markdown("[📧 Contact Us](mailto:adjeiyawosei@gmail.com)")

# Main layout
st.markdown('<div class="main-container">', unsafe_allow_html=True)

# Hero section
st.markdown("""
<h1 class="glow">🌬️ Mframapa AI</h1>
<h3>Your Intelligent Air Quality Companion</h3>
<p>Empowering everyone with NASA-driven AI forecasts for cleaner air and healthier communities.</p>
""", unsafe_allow_html=True)

st.markdown("### 🌍 Find Your City's Air Quality")

col1, col2 = st.columns([3, 1])
with col1:
    city_input = st.text_input("Enter your city:", placeholder="e.g., Accra, Ghana")
with col2:
    st.markdown("<br>", unsafe_allow_html=True)
    search = st.button("🔍 Search")

if search and city_input.strip():
    with st.spinner(f"🌎 Locating {city_input}..."):
        coordinates = get_lat_lon(city_input)
        time.sleep(1.2)  # simulate delay
        if coordinates:
            st.session_state.selected_city = city_input
            st.session_state.selected_coordinates = coordinates
            st.success(f"✅ Found {city_input}! Redirecting to forecast page...")
            time.sleep(1.5)
            st.switch_page("pages/2_Forecast.py")
        else:
            st.error("❌ Could not find that city. Please try again.")

# Features
st.markdown("## ✨ Highlights")
st.markdown('<div class="feature-grid">', unsafe_allow_html=True)

features = [
    ("🛰️", "Satellite-Powered Insights", "Real-time NASA data (TEMPO & MERRA-2) for global monitoring."),
    ("🤖", "AI-Driven Forecasts", "XGBoost models predict PM2.5, O₃, and NO₂ with precision."),
    ("🏥", "Health Guidance", "Personalized activity & health-based recommendations."),
    ("🌐", "Global Reach", "Accessible even in data-sparse regions without ground stations."),
    ("📊", "Interactive Visuals", "Engage with air quality maps and historical insights."),
    ("🚀", "Community Empowered", "Crowdsourced air monitoring with citizen data."),
]

for icon, title, desc in features:
    st.markdown(f"""
    <div class="feature-card">
        <h2>{icon}</h2>
        <h4>{title}</h4>
        <p>{desc}</p>
    </div>
    """, unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# Mission
st.markdown("---")
st.markdown("""
## 🎯 Our Mission  
Air pollution silently affects billions. Mframapa AI transforms NASA’s satellite data into meaningful, localized forecasts — helping governments, researchers, and citizens take action.
""")

# CTA
st.markdown("---")
st.markdown("""
<h2>🚀 Ready to Breathe Smarter?</h2>
<p>Enter your city above and explore your personalized air quality forecast.</p>
""", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)
