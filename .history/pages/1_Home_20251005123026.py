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
# Bold Visual Theme + Animations (dimmed & high-contrast color palette)
# ---------------------------
st.markdown(
    """
<style>
:root{
  --bg-1:#010b16;
  --bg-2:#02203a;
  --accent-1:#00c0e8;
  --accent-2:#59d6ff;
  --glass:#ffffff18;
  --card:#ffffff15;
  --muted:#b7dcee;
  --deep:#00111f;
  --success:#5cd6aa;
}

/* Full animated gradient background */
html, body, [data-testid="stAppViewContainer"] > .main {
  min-height: 100%;
  background: radial-gradient(1200px 600px at 10% 10%, rgba(0,140,190,0.09), transparent 8%),
              conic-gradient(from 180deg at 50% 50%, rgba(4,60,88,0.15), rgba(1,100,160,0.06), rgba(4,60,88,0.15));
  background-color: var(--bg-1);
  color: #e2f3fb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}

/* Main card */
.main-container {
  width: 96%;
  max-width: 1300px;
  margin: 28px auto 60px;
  border-radius: 18px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
  box-shadow: 0 10px 50px rgba(0,10,20,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
  backdrop-filter: blur(10px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.03);
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
  background: linear-gradient(135deg, rgba(2,74,120,0.6), rgba(0,36,66,0.6));
  box-shadow: 0 12px 40px rgba(0,0,0,0.55);
  overflow:hidden;
  position:relative;
}

/* wave accent */
.hero:before{
  content: "";
  position: absolute;
  right: -10%;
  top: -30%;
  width: 60%;
  height: 220%;
  background: radial-gradient(circle at 10% 10%, rgba(124,231,255,0.12), transparent 12%),
              linear-gradient(120deg, rgba(0,229,255,0.05), rgba(124,231,255,0.02));
  transform: rotate(25deg);
  filter: blur(20px);
  opacity: 0.8;
  animation: slowRotate 18s linear infinite;
}
@keyframes slowRotate {
  from { transform: rotate(25deg); }
  to   { transform: rotate(385deg); }
}

/* hero text */
.hero .title {
  color: #e8faff;
  font-weight:700;
  font-size: clamp(1.25rem, 2.8vw, 2.6rem);
  letter-spacing: 0.6px;
  line-height: 1.05;
  text-shadow: 0 6px 18px rgba(0,0,0,0.55);
}
.hero .subtitle {
  color: var(--muted);
  margin-top:6px;
  font-weight:500;
  font-size: clamp(0.9rem, 1.6vw, 1.15rem);
}

/* Search section */
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
    border: 2px solid rgba(255,255,255,0.07);
    padding: 14px 18px;
    font-size: 1rem;
    background: rgba(255,255,255,0.04);
    color: #e8faff;
    transition: box-shadow .2s ease, border-color .2s ease;
}
.stTextInput > div > div > input::placeholder {
    color: #9dd0e3 !important;
    opacity: 0.8;
}
.stTextInput > div > div > input:focus {
    border-color: rgba(124,231,255,0.8);
    box-shadow: 0 6px 26px rgba(0,0,0,0.3), 0 0 12px rgba(124,231,255,0.08);
}

/* Buttons */
.stButton > button {
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #012233;
  font-weight:700;
  padding: 10px 18px;
  border: none;
  transition: transform .16s ease, box-shadow .16s ease;
}
.stButton > button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.22);
}

/* Features */
.features {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 22px;
}
.feature {
  background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(0,0,0,0.05));
  border-radius: 12px;
  padding: 18px;
  border-left: 4px solid rgba(124,231,255,0.15);
  min-height:140px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
  transition: transform .18s ease, box-shadow .18s ease;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.feature:hover { transform: translateY(-8px); box-shadow: 0 18px 50px rgba(0,0,0,0.6); }
.feature h4 { color: var(--accent-2); margin: 0 0 8px 0; font-weight:700; }
.feature p { color: #dff6ff; margin:0; font-size:0.95rem; }

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
  color: #dff6ff;
  border: 1px solid rgba(255,255,255,0.03);
}
.stat-card .num { font-weight:800; font-size:1.5rem; color: var(--accent-1); margin-bottom:6px; }

/* Footer */
.footer-note {
  margin-top: 24px;
  text-align:center;
  color: #bfeeff;
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

st.markdown(
    """
<div class="hero" role="banner" aria-label="Mframapa AI hero">
  <div style="flex:1; min-width:220px;">
    <div class="title">🌬️ Mframapa AI — Intelligent Air Quality</div>
    <div class="subtitle">Judge-ready forecasts & health guidance using NASA satellite datasets + modern AI.</div>
    <div style="margin-top:12px; color:#bfeeff; font-size:0.92rem">
      Fast. Global. Scientific. Built to inform communities and policymakers.
    </div>
  </div>
  <div style="width:46%; min-width:280px; display:flex; align-items:center; justify-content:flex-end;">
    <img src="https://img.icons8.com/ios-filled/80/00e5ff/cloud.png" alt="cloud" style="opacity:0.9" />
  </div>
</div>
""",
    unsafe_allow_html=True,
)

# ---------------------------
# Search
# ---------------------------
st.markdown(
    """
<div class="search-section" aria-label="Search for city">
  <div class="search-box">
  </div>
</div>
""",
    unsafe_allow_html=True,
)

col_center_left, col_center, col_center_right = st.columns([1, 2, 1])
with col_center:
    city_input = st.text_input("", placeholder="Type a city (e.g., Accra, Lagos, Los Angeles)")
    search_btn = st.button("Search City", key="home_search")

# ---------------------------
# Search logic
# ---------------------------
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

# ---------------------------
# Features
# ---------------------------
st.markdown("<div class='features'>", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3, gap="small")

with col1:
    st.markdown(
        """
        <div class="feature" role="region" aria-label="Satellite-grade Data">
          <div>
            <h4>🛰️ Satellite-grade Data</h4>
            <p>High-res TEMPO & global MERRA-2 inputs tuned and validated against ground sensors.</p>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Explore Insights", key="insights_btn"):
        st.switch_page("pages/5_Insights.py")

with col2:
    st.markdown(
        """
        <div class="feature" role="region" aria-label="AI and Explainability">
          <div>
            <h4>🤖 AI + Explainability</h4>
            <p>XGBoost & explainable models that produce actionable alerts and model attribution for credibility.</p>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Explore Explain", key="explain_btn"):
        st.switch_page("pages/6_Explain.py")

with col3:
    st.markdown(
        """
        <div class="feature" role="region" aria-label="Health-first Recommendations">
          <div>
            <h4>🏥 Health-first Recommendations</h4>
            <p>Activity-specific guidance and exposure risk summaries tailored for vulnerable groups.</p>
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )
    if st.button("Health Recommendations", key="health_btn"):
        st.switch_page("pages/9_Health_Integration.py")

st.markdown("</div>", unsafe_allow_html=True)

# ---------------------------
# Stats
# ---------------------------
st.markdown(
    """
<div class="stats" role="contentinfo" aria-label="Key stats">
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
