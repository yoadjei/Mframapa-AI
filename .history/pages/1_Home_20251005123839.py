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
# Light/Dark Mode Toggle
# ---------------------------
if "theme_mode" not in st.session_state:
  st.session_state.theme_mode = "dark"

theme_mode = st.radio("Theme Mode", ["Dark", "Light"], index=0 if st.session_state.theme_mode=="dark" else 1, horizontal=True)
st.session_state.theme_mode = theme_mode.lower()

is_dark = st.session_state.theme_mode == "dark"

# ---------------------------
# DARK COLOR THEME (DIMMED / LEGIBLE)
# ---------------------------

# Enhanced CSS for accessibility and visibility
st.markdown(f"""
<style>
:root {{
  --bg-1: {'#010a14' if is_dark else '#f7fafd'};
  --bg-2: {'#002744' if is_dark else '#e3f2fd'};
  --accent-1: #00bcd4;
  --accent-2: #66d9ef;
  --glass: {'#ffffff1a' if is_dark else '#e3f2fdcc'};
  --card: {'#ffffff10' if is_dark else '#e3f2fd99'};
  --muted: {'#c9eefb' if is_dark else '#2d3a4a'};
  --deep: {'#00111f' if is_dark else '#e3f2fd'};
  --success: #6ee7b7;
  --text-main: {'#e4f6ff' if is_dark else '#1a2636'};
  --text-sub: {'#b5d9e8' if is_dark else '#2d3a4a'};
}}

html, body, [data-testid="stAppViewContainer"] > .main {{
  min-height: 100%;
  background: {'radial-gradient(1200px 600px at 10% 10%, rgba(0,150,200,0.06), transparent 8%), conic-gradient(from 180deg at 50% 50%, rgba(6,66,98,0.1), rgba(2,138,199,0.05), rgba(6,66,98,0.1))' if is_dark else 'linear-gradient(135deg, #e3f2fd 0%, #f7fafd 100%)'};
  background-color: var(--bg-1);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-size: 1.15rem;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}}

.main-container {{
  width: 98%;
  max-width: 1400px;
  margin: 32px auto 60px;
  border-radius: 22px;
  padding: 38px 32px;
  background: var(--glass);
  box-shadow: 0 10px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.02);
  backdrop-filter: blur(10px) saturate(120%);
  border: 1.5px solid rgba(255,255,255,0.08);
  animation: floatIn 0.9s cubic-bezier(.2,.9,.2,1);
}}

@keyframes floatIn {{
  from {{ transform: translateY(18px); opacity: 0; }}
  to   {{ transform: translateY(0); opacity: 1; }}
}}

.hero {{
  display:flex;
  gap: 32px;
  align-items:center;
  justify-content:space-between;
  padding: 38px 28px;
  border-radius: 18px;
  background: {'linear-gradient(135deg, rgba(2,60,100,0.7), rgba(1,25,44,0.6))' if is_dark else 'linear-gradient(135deg, #e3f2fd 60%, #b5d9e8 100%)'};
  box-shadow: 0 10px 40px rgba(0,0,0,0.10);
  overflow:hidden;
  position:relative;
}}
.hero .title {{
  color: var(--text-main);
  font-weight:800;
  font-size: clamp(1.6rem, 3vw, 3.2rem);
  letter-spacing: 0.8px;
  line-height: 1.08;
  text-shadow: 0 6px 18px rgba(0,0,0,0.10);
}}
.hero .subtitle {{
  color: var(--text-sub);
  margin-top:10px;
  font-weight:600;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
}}

.search-section {{
  display:flex;
  justify-content:center;
  margin-top:22px;
  margin-bottom:12px;
}}
.search-box {{
  width:100%;
  max-width:920px;
  display:flex;
  gap:14px;
  align-items:center;
}}
.stTextInput > div > div > input {{
    border-radius: 999px;
    border: 2px solid var(--accent-2);
    padding: 18px 22px;
    font-size: 1.15rem;
    background: var(--card);
    color: var(--text-main);
    font-weight:600;
    transition: box-shadow .2s ease, border-color .2s ease;
}}
.stTextInput > div > div > input:focus {{
    border-color: var(--accent-1);
    box-shadow: 0 6px 22px rgba(0,0,0,0.10), 0 0 8px rgba(124,231,255,0.08);
}}

.stButton > button {{
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #011b26;
  font-weight:800;
  font-size:1.15rem;
  padding: 14px 28px;
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  transition: transform .16s ease, box-shadow .16s ease;
}}
.stButton > button:hover {{
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.18);
}}

.features {{
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 32px;
}}
.feature {{
  background: var(--card);
  border-radius: 16px;
  padding: 28px 22px;
  border-left: 6px solid var(--accent-2);
  min-height:160px;
  box-shadow: 0 6px 25px rgba(0,0,0,0.10);
  transition: transform .18s ease, box-shadow .18s ease;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}}
.feature:hover {{ transform: translateY(-6px); box-shadow: 0 16px 45px rgba(0,0,0,0.18); }}
.feature h4 {{ color: var(--accent-2); margin: 0 0 12px 0; font-weight:800; font-size:1.25rem; }}
.feature p {{ color: var(--text-sub); margin:0; font-size:1.05rem; }}

.stats {{
  margin-top: 32px;
  display:flex;
  gap:22px;
  align-items:stretch;
}}
.stat-card {{
  flex:1;
  background: var(--card);
  border-radius: 16px;
  padding: 28px 18px;
  text-align:center;
  color: var(--text-main);
  border: 2px solid var(--accent-2);
  font-size:1.15rem;
}}
.stat-card .num {{ font-weight:900; font-size:2.1rem; color: var(--accent-1); margin-bottom:10px; }}

.footer-note {{
  margin-top: 32px;
  text-align:center;
  color: var(--text-sub);
  font-size:1.05rem;
}}

@media (max-width: 980px) {{
  .features {{ grid-template-columns: repeat(2, 1fr); }}
  .hero {{ flex-direction:column; gap:18px; align-items:flex-start; padding:22px; }}
}}
@media (max-width: 640px) {{
  .features {{ grid-template-columns: 1fr; }}
  .stats {{ flex-direction: column; }}
  .hero .title {{ font-size:1.4rem; }}
  .search-box {{ padding:0 12px; }}
}}
</style>
""", unsafe_allow_html=True)

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
