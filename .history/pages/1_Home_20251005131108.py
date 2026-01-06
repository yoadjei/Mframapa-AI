# Modern, responsive, attractive home page CSS
st.markdown("""
<style>
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
# High-Contrast Accessible Theme (Light)
# ---------------------------

# ---------------------------
# DARK COLOR THEME (DIMMED / LEGIBLE)
# ---------------------------


# Modern, responsive, attractive home page CSS
st.markdown("""
<style>
:root {
  --bg-1: #f7fafd;
  --bg-2: #e3f2fd;
  --accent-1: #0077c2;
  --accent-2: #00bcd4;
  --accent-cta: #388e3c;
  --glass: #ffffffcc;
  --card: #ffffff;
  --muted: #2d3a4a;
  --deep: #e3f2fd;
  --text-main: #1a2636;
  --text-sub: #2d3a4a;
}
html, body, [data-testid="stAppViewContainer"] > .main {
  min-height: 100%;
  background: linear-gradient(135deg, #e3f2fd 0%, #f7fafd 100%);
  background-color: var(--bg-1);
  color: var(--text-main);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-size: 1.18rem;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
}
.main-container {
  width: 99%;
  max-width: 1400px;
  margin: 24px auto 40px;
  border-radius: 24px;
  padding: 48px 24px 32px 24px;
  background: var(--glass);
  box-shadow: 0 10px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.02);
  border: 2px solid #e3f2fd;
  animation: floatIn 0.9s cubic-bezier(.2,.9,.2,1);
}
@keyframes floatIn {
  from { transform: translateY(18px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
.hero {
  display:flex;
  flex-wrap:wrap;
  gap: 32px;
  align-items:center;
  justify-content:space-between;
  padding: 44px 32px 24px 32px;
  border-radius: 18px;
  background: linear-gradient(135deg, #e3f2fd 60%, #b5d9e8 100%);
  box-shadow: 0 10px 40px rgba(0,0,0,0.08);
  overflow:hidden;
  position:relative;
}
with col1:
    st.markdown(
    st.markdown("""
    <div class="feature">
      <h4>🛰️ Satellite-grade Data</h4>
      <p>High-res TEMPO & global MERRA-2 inputs tuned and validated against ground sensors.</p>
    </div>
    """, unsafe_allow_html=True)
    if st.button("Explore Insights", key="insights_btn"):
        st.switch_page("pages/5_Insights.py")

with col2:
    st.markdown(
    st.markdown("""
    <div class="feature">
      <h4>🤖 AI + Explainability</h4>
      <p>XGBoost & explainable models that produce actionable alerts and model attribution for credibility.</p>
    </div>
    """, unsafe_allow_html=True)
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
  justify-content:center;
}
.quick-nav a {
  background: var(--accent-2);
  color: #fff;
  font-weight:700;
  padding: 12px 24px;
  border-radius: 999px;
  text-decoration:none;
  font-size:1.08rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: background .18s, box-shadow .18s;
}
.quick-nav a:hover {
  background: var(--accent-1);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.features {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
  margin-top: 40px;
}
.feature {
  background: var(--card);
  border-radius: 16px;
  padding: 32px 26px;
  border-left: 8px solid var(--accent-2);
  min-height:180px;
  box-shadow: 0 6px 25px rgba(0,0,0,0.08);
  transition: transform .18s ease, box-shadow .18s ease;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}
.feature:hover { transform: translateY(-6px); box-shadow: 0 16px 45px rgba(0,0,0,0.12); }
.feature h4 { color: var(--accent-1); margin: 0 0 16px 0; font-weight:900; font-size:1.35rem; }
.feature p { color: var(--text-sub); margin:0; font-size:1.12rem; }
.stats {
  margin-top: 40px;
  display:flex;
  gap:32px;
  align-items:stretch;
}
.stat-card {
  flex:1;
  background: var(--card);
  border-radius: 16px;
  padding: 32px 22px;
  text-align:center;
  color: var(--text-main);
  border: 2px solid var(--accent-2);
  font-size:1.18rem;
}
.stat-card .num { font-weight:900; font-size:2.3rem; color: var(--accent-1); margin-bottom:14px; }
.footer-note {
  margin-top: 40px;
  text-align:center;
  color: var(--text-sub);
  font-size:1.12rem;
}
.footer {
  margin-top: 48px;
  padding: 24px 0 0 0;
  text-align:center;
  color: var(--text-sub);
  font-size:1.08rem;
  border-top: 1.5px solid #e3f2fd;
}
.footer .social {
  margin: 12px 0;
}
.footer .social a {
  display:inline-block;
  margin: 0 8px;
  color: var(--accent-1);
  font-size:1.3rem;
  text-decoration:none;
  transition: color .18s;
}
.footer .social a:hover {
  color: var(--accent-2);
}
@media (max-width: 980px) {
  .features { grid-template-columns: repeat(2, 1fr); }
  .hero { flex-direction:column; gap:22px; align-items:flex-start; padding:28px; }
  .quick-nav { flex-direction:column; gap:12px; }
}
@media (max-width: 640px) {
  .features { grid-template-columns: 1fr; }
  .stats { flex-direction: column; }
  .hero .title { font-size:1.6rem; }
  .search-box { padding:0 12px; }
}
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

# Main container
st.markdown('<div class="main-container">', unsafe_allow_html=True)

# Hero + Welcome + CTA
st.markdown(
    """
<div class="hero">
  <div style="flex:1; min-width:220px;">
    <div class="title">🌬️ Mframapa AI</div>
    <div class="desc">Welcome to your intelligent air quality companion. Get real-time forecasts, health guidance, and actionable insights for your city and beyond.</div>
    <div style="margin-top:28px;">
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;">
        <form>
          <button type="button" class="cta" onclick="document.getElementById('city_input').focus();">Get Started</button>
        </form>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:18px;">
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/2_Forecast.py'}, '*')">Forecast</button>
        </form>
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/5_Insights.py'}, '*')">Insights</button>
        </form>
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/6_Explain.py'}, '*')">Explain</button>
        </form>
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/9_Health_Integration.py'}, '*')">Health</button>
        </form>
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/7_Policy_Dashboard.py'}, '*')">Policy</button>
        </form>
        <form>
          <button type="button" class="quick-nav-btn" onclick="window.parent.postMessage({type: 'streamlit:customEvent', event: 'switch_page', page: 'pages/12_Crowdsourcing.py'}, '*')">Community</button>
        </form>
      </div>
    </div>
<style>
.quick-nav-btn {
  background: var(--accent-2);
  color: #fff;
  font-weight:700;
  padding: 12px 24px;
  border-radius: 999px;
  border: none;
  font-size:1.08rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 0 2px 8px 2px;
  cursor:pointer;
  transition: background .18s, box-shadow .18s;
}
.quick-nav-btn:hover {
  background: var(--accent-1);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
@media (max-width: 640px) {
  .quick-nav-btn {
    width: 100%;
    font-size:1.15rem;
    padding: 16px 0;
  }
}
</style>
  </div>
  <div style="width:46%; min-width:280px; display:flex; align-items:center; justify-content:flex-end;">
    <img src="https://img.icons8.com/ios-filled/120/66d9ef/cloud.png" alt="cloud" style="opacity:0.9;max-width:100%;height:auto;" />
  </div>
</div>
""",
    unsafe_allow_html=True,
)

# Search (sleek input/button)
col_center_left, col_center, col_center_right = st.columns([1, 2, 1])
with col_center:
  city_input = st.text_input("", placeholder="Type a city (e.g., Accra, Lagos, Los Angeles)", key="city_input")
  search_btn = st.button("🔎 Search City", key="home_search")

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

        st.markdown("""
        <div class="feature">
          <h4>🏥 Health-first Recommendations</h4>
          <p>Activity-specific guidance and exposure risk summaries tailored for vulnerable groups.</p>
        </div>
        """, unsafe_allow_html=True)
  border: none;
  font-size:1.08rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  margin: 0 2px 8px 2px;
  cursor:pointer;
  transition: background .18s, box-shadow .18s;
}
.quick-nav-btn:hover {
  background: var(--accent-1);
  box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}
.stTextInput > div > div > input#city_input {
    border-radius: 999px;
    border: 2px solid var(--accent-1);
    padding: 22px 26px;
    font-size: 1.18rem;
    background: var(--card);
    color: var(--text-main);
    font-weight:700;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: box-shadow .2s ease, border-color .2s ease;
}
.stTextInput > div > div > input#city_input:focus {
    border-color: var(--accent-2);
    box-shadow: 0 6px 22px rgba(0,0,0,0.10), 0 0 8px rgba(124,231,255,0.08);
}
.stButton > button#home_search {
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #fff;
  font-weight:900;
  font-size:1.18rem;
  padding: 16px 32px;
  border: none;
  box-shadow: 0 4px 16px rgba(0,0,0,0.10);
  transition: transform .16s ease, box-shadow .16s ease;
}
.stButton > button#home_search:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 22px rgba(0,0,0,0.18);
}
@media (max-width: 640px) {
  .quick-nav-btn {
    width: 100%;
    font-size:1.15rem;
    padding: 16px 0;
  }
  .stTextInput > div > div > input#city_input {
    font-size:1.15rem;
    padding: 18px 16px;
  }
  .stButton > button#home_search {
    font-size:1.15rem;
    padding: 14px 0;
    width:100%;
  }
}
</style>
""", unsafe_allow_html=True)
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

# End main container
st.markdown("</div>", unsafe_allow_html=True)

# Footer
st.markdown(
    """
<div class="footer">
  <div class="social">
    <a href="mailto:adjeiyawosei@gmail.com" title="Email"><span>📧 adjeiyawosei@gmail.com</span></a>
    <a href="https://x.com/yawoseii" target="_blank" title="X"><span>🐦 @yawoseii</span></a>
    <a href="https://github.com/yoadjei/Mframapa-AI/" target="_blank" title="GitHub"><span>💻 GitHub</span></a>
  </div>
  <div>Built for NASA Space Apps Challenge 2025 &mdash; Mframapa AI</div>
  <div style="margin-top:8px;font-size:0.98rem;">&copy; 2025 Mframapa AI. All rights reserved.</div>
</div>
""",
    unsafe_allow_html=True)
