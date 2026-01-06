import streamlit as st
from utils import get_lat_lon
import time

st.set_page_config(
    page_title="Home - Mframapa AI",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ---------------------------
# DARK COLOR THEME (DIMMED / LEGIBLE)
# ---------------------------
st.markdown(
    """
<style>
:root{
  --bg-1:#010a14;
  --bg-2:#002744;
  --accent-1:#00bcd4;
  --accent-2:#66d9ef;
  --glass:#ffffff1a;
  --card:#ffffff10;
  --muted:#c9eefb;
  --deep:#00111f;
  --success:#6ee7b7;
  --text-main:#e4f6ff;
  --text-sub:#b5d9e8;
}

/* Full animated gradient background */
html, body, [data-testid="stAppViewContainer"] > .main {
  min-height: 100%;
  background: radial-gradient(1200px 600px at 10% 10%, rgba(0,150,200,0.06), transparent 8%),
              conic-gradient(from 180deg at 50% 50%, rgba(6,66,98,0.1), rgba(2,138,199,0.05), rgba(6,66,98,0.1));
  background-color: var(--bg-1);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* Centered main card (glass) */
.main-container {
  width: 96%;
  max-width: 1300px;
  margin: 28px auto 60px;
  border-radius: 18px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
  box-shadow: 0 10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
  backdrop-filter: blur(10px) saturate(120%);
  border: 1px solid rgba(255,255,255,0.04);
  animation: floatIn 0.9s cubic-bezier(.2,.9,.2,1);
}

/* subtle entrance */
@keyframes floatIn {
  from { transform: translateY(18px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* Hero */
.hero {
  display:flex;
  gap: 24px;
  align-items:center;
  justify-content:space-between;
  padding: 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(2,60,100,0.7), rgba(1,25,44,0.6));
  box-shadow: 0 10px 40px rgba(0,0,0,0.6);
  overflow:hidden;
  position:relative;
}

/* animated wave accent */
.hero:before{
  content: "";
  position: absolute;
  right: -10%;
  top: -30%;
  width: 60%;
  height: 220%;
  background: radial-gradient(circle at 10% 10%, rgba(102,217,239,0.1), transparent 12%),
              linear-gradient(120deg, rgba(0,188,212,0.05), rgba(102,217,239,0.03));
  transform: rotate(25deg);
  filter: blur(18px);
  opacity: 0.8;
  animation: slowRotate 18s linear infinite;
}
@keyframes slowRotate {
  from { transform: rotate(25deg) translateX(0); }
  to   { transform: rotate(385deg) translateX(0); }
}

/* hero text */
.hero .title {
  color: var(--text-main);
  font-weight:700;
  font-size: clamp(1.25rem, 2.8vw, 2.6rem);
  letter-spacing: 0.6px;
  line-height: 1.02;
  text-shadow: 0 6px 18px rgba(0,0,0,0.5);
}
.hero .subtitle {
  color: var(--text-sub);
  margin-top:6px;
  font-weight:500;
  font-size: clamp(0.9rem, 1.6vw, 1.15rem);
}

/* Search area */
.search-section {
  display:flex;
  justify-content:center;
  margin-top:18px;
  margin-bottom:8px;
}
.search-box {
  width:100%;
  max-width:920px;
  display:flex;
  gap:10px;
  align-items:center;
}
.stTextInput > div > div > input {
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
    padding: 14px 18px;
    font-size: 1rem;
    background: rgba(255,255,255,0.04);
    color: var(--text-main);
    transition: box-shadow .2s ease, border-color .2s ease;
}
.stTextInput > div > div > input:focus {
    border-color: var(--accent-2);
    box-shadow: 0 6px 22px rgba(0,0,0,0.25), 0 0 8px rgba(124,231,255,0.08);
}

/* Buttons */
.stButton > button {
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #011b26;
  font-weight:700;
  padding: 10px 18px;
  border: none;
  transition: transform .16s ease, box-shadow .16s ease;
}
.stButton > button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.3);
}

/* Feature Grid */
.features {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 22px;
}
.feature {
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(0,0,0,0.04));
  border-radius: 12px;
  padding: 18px;
  border-left: 4px solid rgba(124,231,255,0.12);
  min-height:140px;
  box-shadow: 0 6px 25px rgba(0,0,0,0.5);
  transition: transform .18s ease, box-shadow .18s ease;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.feature:hover { transform: translateY(-6px); box-shadow: 0 16px 45px rgba(0,0,0,0.55); }
.feature h4 { color: var(--accent-2); margin: 0 0 8px 0; font-weight:700; }
.feature p { color: var(--text-sub); margin:0; font-size:0.95rem; }

/* Stats */
.stats {
  margin-top: 22px;
  display:flex;
  gap:14px;
  align-items:stretch;
}
.stat-card {
  flex:1;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04));
  border-radius: 12px;
  padding: 18px;
  text-align:center;
  color: var(--text-main);
  border: 1px solid rgba(255,255,255,0.05);
}
.stat-card .num { font-weight:800; font-size:1.5rem; color: var(--accent-1); margin-bottom:6px; }

/* Footer */
.footer-note {
  margin-top: 24px;
  text-align:center;
  color: var(--text-sub);
  font-size:0.95rem;
}

/* Responsive */
@media (max-width: 980px) {
  .features { grid-template-columns: repeat(2, 1fr); }
  .hero { flex-direction:column; gap:14px; align-items:flex-start; padding:18px; }
}
@media (max-width: 640px) {
  .features { grid-template-columns: 1fr; }
  .stats { flex-direction: column; }
  .hero .title { font-size:1.4rem; }
  .search-box { padding:0 12px; }
}
</style>
""",
    unsafe_allow_html=True,
)

# ---------------------------
# Sidebar
# ---------------------------
with st.sidebar:
    st.markdown("### 🌬️ **Mframapa AI**")
    st.markdown(
        """
- 🏠 **Home**
- 📈 **Forecast**
- 🔬 **Explain**
- 💡 **Insights**
- 🏛️ **Policy**
- 👥 **Community**
"""
    )
    st.markdown("---")
    st.markdown("**📞 Support & Feedback**  \nBuilt for NASA Space Apps Challenge 2025")
    st.markdown("[Contact Us](mailto:adjeiyawosei@gmail.com)")

# ---------------------------
# Main container
# ---------------------------
st.markdown('<div class="main-container">', unsafe_allow_html=True)

# Hero
st.markdown(
    """
<div class="hero">
  <div style="flex:1; min-width:220px;">
    <div class="title">🌬️ Mframapa AI — Intelligent Air Quality</div>
    <div class="subtitle">Judge-ready forecasts & health guidance using NASA satellite datasets + modern AI.</div>
    <div style="margin-top:12px; color:var(--text-sub); font-size:0.92rem">
      Fast. Global. Scientific. Built to inform communities and policymakers.
    </div>
  </div>

  <div style="width:46%; min-width:280px; display:flex; align-items:center; justify-content:flex-end;">
    <img src="https://img.icons8.com/ios-filled/80/66d9ef/cloud.png" alt="cloud" style="opacity:0.9" />
  </div>
</div>
""",
    unsafe_allow_html=True,
)

# Search
col_center_left, col_center, col_center_right = st.columns([1, 2, 1])
with col_center:
    city_input = st.text_input("", placeholder="Type a city (e.g., Accra, Lagos, Los Angeles)")
    search_btn = st.button("Search City", key="home_search")

if search_btn and city_input:
    with st.spinner(f"🔎 Finding coordinates for {city_input}..."):
        time.sleep(0.9)
        coords = get_lat_lon(city_input)
        if coords:
            lat, lon = coords
            st.session_state.selected_city = city_input
            st.session_state.selected_coordinates = coords
            st.success(f"✅ Found {city_input} — {lat:.4f}, {lon:.4f}. Redirecting to Forecast...")
            time.sleep(1.1)
            st.switch_page("pages/2_Forecast.py")
        else:
            st.error("❌ Could not find this city. Try a different spelling or add the country (e.g., 'Accra, Ghana').")

# Features
st.markdown("<div class='features'>", unsafe_allow_html=True)
col1, col2, col3 = st.columns(3, gap="small")

with col1:
    st.markdown(
        """
        <div class="feature">
          <h4>🛰️ Satellite-grade Data</h4>
          <p>High-res TEMPO & global MERRA-2 inputs tuned and validated against ground sensors.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Explore Insights", key="insights_btn"):
        st.switch_page("pages/5_Insights.py")

with col2:
    st.markdown(
        """
        <div class="feature">
          <h4>🤖 AI + Explainability</h4>
          <p>XGBoost & explainable models that produce actionable alerts and model attribution for credibility.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Explore Explain", key="explain_btn"):
        st.switch_page("pages/6_Explain.py")

with col3:
    st.markdown(
        """
        <div class="feature">
          <h4>🏥 Health-first Recommendations</h4>
          <p>Activity-specific guidance and exposure risk summaries tailored for vulnerable groups.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Health Recommendations", key="health_btn"):
        st.switch_page("pages/9_Health_Integration.py")

st.markdown("</div>", unsafe_allow_html=True)

# Stats
st.markdown(
    """
<div class="stats">
  <div class="stat-card">
    <div class="num">48h</div>
    <div>Forecast Horizon</div>
  </div>
  <div class="stat-card">
    <div class="num">PM2.5 • O₃ • NO₂</div>
    <div>Key Pollutants Tracked</div>
  </div>
  <div class="stat-card">
    <div class="num">Global</div>
    <div>Works where ground sensors are scarce</div>
  </div>
</div>
""",
    unsafe_allow_html=True,
)

st.markdown("</div>", unsafe_allow_html=True)
