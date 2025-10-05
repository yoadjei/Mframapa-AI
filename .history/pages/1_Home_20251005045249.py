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
# Bold Visual Theme + Animations
# ---------------------------
st.markdown(
    """
<style>
:root{
  --bg-1:#021024;
  --bg-2:#003a6b;
  --accent-1:#00e5ff;
  --accent-2:#7ce7ff;
  --glass:#ffffff22;
  --card:#ffffffee;
  --muted:#c9eefb;
  --deep:#001a33;
  --success:#6ee7b7;
}

/* Full animated gradient background */
html, body, [data-testid="stAppViewContainer"] > .main {
  height: 100%;
  background: radial-gradient(1200px 600px at 10% 10%, rgba(0,150,200,0.08), transparent 8%),
              conic-gradient(from 180deg at 50% 50%, rgba(6,66,98,0.14), rgba(2,138,199,0.06), rgba(6,66,98,0.14));
  background-color: var(--bg-1);
  color: #e9f6ff;
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
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  box-shadow: 0 10px 50px rgba(2,20,40,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
  backdrop-filter: blur(8px) saturate(120%);
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
  background: linear-gradient(135deg, rgba(2,74,120,0.72), rgba(1,36,66,0.62));
  box-shadow: 0 12px 40px rgba(2,20,40,0.45);
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
  background: radial-gradient(circle at 10% 10%, rgba(124,231,255,0.14), transparent 12%),
              linear-gradient(120deg, rgba(0,229,255,0.06), rgba(124,231,255,0.03));
  transform: rotate(25deg);
  filter: blur(18px);
  opacity: 0.9;
  animation: slowRotate 18s linear infinite;
}
@keyframes slowRotate {
  from { transform: rotate(25deg) translateX(0); }
  to   { transform: rotate(385deg) translateX(0); }
}

/* hero text */
.hero .title {
  color: white;
  font-weight:700;
  font-size: clamp(1.25rem, 2.8vw, 2.6rem);
  letter-spacing: 0.6px;
  line-height: 1.02;
  text-shadow: 0 6px 18px rgba(0,0,0,0.45);
}
.hero .subtitle {
  color: var(--muted);
  margin-top:6px;
  font-weight:500;
  font-size: clamp(0.9rem, 1.6vw, 1.15rem);
}

/* neon CTA */
.cta {
  text-align:right;
  display:flex;
  gap:12px;
  align-items:center;
}
.cta .primary {
  background: linear-gradient(90deg, var(--accent-1), var(--accent-2));
  color: #012233;
  font-weight:700;
  padding: 12px 20px;
  border-radius: 999px;
  border: none;
  cursor:pointer;
  box-shadow: 0 8px 30px rgba(0,230,255,0.12), 0 0 18px rgba(0,230,255,0.06);
  transition: transform .18s ease, box-shadow .18s ease;
}
.cta .primary:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 18px 60px rgba(0,230,255,0.16); }

/* glass search area */
.search-wrap {
  display:flex;
  gap:12px;
  align-items:center;
  background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border-radius: 999px;
  padding: 10px;
  border: 1px solid rgba(255,255,255,0.04);
  width:100%;
  max-width:720px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
}
.search-wrap input {
  background: transparent !important;
  border: none !important;
  outline: none !important;
  color: #eafcff !important;
  font-size: 1rem;
  padding: 8px 12px;
  width: 100%;
}
.search-wrap .ghost-btn {
  background: rgba(255,255,255,0.06);
  color: var(--accent-2);
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.06);
  cursor:pointer;
  transition: all .18s ease;
}
.search-wrap .ghost-btn:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.35); }

/* Feature Grid - glass cards with strong contrast */
.features {
  display:grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 22px;
}
.feature {
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border-radius: 12px;
  padding: 18px;
  border-left: 4px solid rgba(124,231,255,0.12);
  min-height:110px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.45);
  transition: transform .18s ease, box-shadow .18s ease;
}
.feature:hover { transform: translateY(-8px); box-shadow: 0 18px 50px rgba(0,0,0,0.55); }
.feature h4 { color: var(--accent-2); margin: 0 0 8px 0; font-weight:700; }
.feature p { color: #dff6ff; margin:0; font-size:0.95rem; }

/* Large stats row */
.stats {
  margin-top: 22px;
  display:flex;
  gap:14px;
  align-items:stretch;
}
.stat-card {
  flex:1;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.03));
  border-radius: 12px;
  padding: 18px;
  text-align:center;
  color: #dff6ff;
  border: 1px solid rgba(255,255,255,0.03);
}
.stat-card .num { font-weight:800; font-size:1.5rem; color: var(--accent-1); margin-bottom:6px; }

/* Footer callout */
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
  .cta { width:100%; justify-content:space-between; }
}
@media (max-width: 640px) {
  .features { grid-template-columns: 1fr; }
  .stats { flex-direction: column; }
  .hero .title { font-size:1.4rem; }
}
</style>
""",
    unsafe_allow_html=True,
)

# ---------------------------
# Sidebar (keeps your items, but styled link labels)
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

# Hero area: left-rich text, right-CTA & search
st.markdown(
    """
<div class="hero">
  <div style="flex:1; min-width:220px;">
    <div class="title">🌬️ Mframapa AI — Intelligent Air Quality</div>
    <div class="subtitle">Judge-ready forecasts & health guidance using NASA satellite datasets + modern AI.</div>
    <div style="margin-top:12px; color:#bfeeff; font-size:0.92rem">
      Fast. Global. Scientific. Built to inform communities and policymakers.
    </div>
  </div>

  <div style="width:46%; min-width:280px;">
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div class="search-wrap" role="search" aria-label="City search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-left:8px; margin-right:6px;">
          <path d="M21 21l-4.35-4.35" stroke="rgba(255,255,255,0.8)" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="10.5" cy="10.5" r="5.2" stroke="rgba(255,255,255,0.8)" stroke-width="1.6"/>
        </svg>
        <!-- streamlit input sits here -->
        <div style="flex:1">
"""
    ,
    unsafe_allow_html=True,
)

# Streamlit input placed inside the hero search wrap
col1, col2 = st.columns([3, 1])
with col1:
    # Use a text_input here; CSS colors applied above
    city_input = st.text_input("", placeholder="Type a city (e.g., Accra, Lagos, Los Angeles)")
with col2:
    lookup_button = st.button("Search", key="hero_search")

# close the hero wrap divs
st.markdown(
    """
        </div>
        <button class="ghost-btn" onclick="document.querySelectorAll('input[type=text]')[0].focus()">Try keyboard</button>
      </div>
      <div style="display:flex; gap:10px; justify-content:flex-end; align-items:center; margin-top:6px;">
        <button class="primary" style="padding:10px 18px;" onclick="document.querySelectorAll('button')[document.querySelectorAll('button').length-1].click()">Get Forecast</button>
      </div>
    </div>
  </div>
</div>
""",
    unsafe_allow_html=True,
)

# ---------------------------
# Search logic & redirect (keeps your app logic)
# ---------------------------
if lookup_button and city_input:
    with st.spinner(f"🔎 Finding coordinates for {city_input}..."):
        time.sleep(0.9)
        coords = get_lat_lon(city_input)
        if coords:
            lat, lon = coords
            st.session_state.selected_city = city_input
            st.session_state.selected_coordinates = coords
            st.success(f"✅ Found {city_input} — {lat:.4f}, {lon:.4f}. Redirecting to Forecast...")
            time.sleep(1.1)
            # corrected directory you provided
            st.switch_page("pages/2_Forecast.py")
        else:
            st.error("❌ Could not find this city. Try a different spelling or add the country (e.g., 'Accra, Ghana').")

# ---------------------------
# Feature grid (flashy, judge-friendly)
# ---------------------------
st.markdown("<div class='features'>", unsafe_allow_html=True)

st.markdown(
    """
<div class="feature">
  <h4>🛰️ Satellite-grade Data</h4>
  <p>High-res TEMPO & global MERRA-2 inputs tuned and validated against ground sensors.</p>
</div>
""",
    unsafe_allow_html=True,
)

st.markdown(
    """
<div class="feature">
  <h4>🤖 AI + Explainability</h4>
  <p>XGBoost & explainable models that produce actionable alerts and model attribution for credibility.</p>
</div>
""",
    unsafe_allow_html=True,
)

st.markdown(
    """
<div class="feature">
  <h4>🏥 Health-first Recommendations</h4>
  <p>Activity-specific guidance and exposure risk summaries tailored for vulnerable groups.</p>
</div>
""",
    unsafe_allow_html=True,
)

st.markdown("</div>", unsafe_allow_html=True)

# ---------------------------
# Stats row
# ---------------------------
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

# ---------------------------
# Footer and call-to-action
# ---------------------------
st.markdown(
    """
<div class="footer-note">
  <strong>Judge-ready mode:</strong> crisp visuals, strong contrast, animated accents, and scientific credibility. 
  <span style="opacity:.9">Start by entering a city above — we auto-redirect to the Forecast page with your selection.</span>
</div>
""",
    unsafe_allow_html=True,
)

st.markdown("</div>", unsafe_allow_html=True)
