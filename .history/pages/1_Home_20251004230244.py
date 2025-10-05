import streamlit as st
from utils import get_lat_lon

st.set_page_config(page_title="Home - Mframapa AI", page_icon="🏠", layout="wide")

st.title("🏠 Mframapa AI - Home")

st.markdown("""
Welcome to **Mframapa AI**, your intelligent air quality forecasting companion!

Our mission is to make air quality data accessible and actionable for everyone, everywhere.
""")

# City selection section
st.markdown("## 🌍 Get Started - Select Your City")

st.markdown("""
Enter your city name below to get started with air quality forecasting and personalized health recommendations.
""")

col1, col2 = st.columns([3, 1])

with col1:
    city_input = st.text_input(
        "Enter city name",
        placeholder="e.g., Los Angeles, New York, Accra, Denver",
        help="Enter any city name. We support locations worldwide!"
    )

with col2:
    st.markdown("<br>", unsafe_allow_html=True)  # Add some spacing
    lookup_button = st.button("🔍 Find Location", type="primary")

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
            
            st.info("📈 Your city has been selected! Go to the **Forecast** page to get air quality predictions.")
            
        else:
            st.error(f"❌ Could not find coordinates for '{city_input}'. Please try a different city name or check the spelling.")

# Display current selection
if st.session_state.get('selected_city'):
    st.markdown("---")
    st.markdown("### ✅ Currently Selected Location")
    
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

# Mission and features
st.markdown("---")
st.markdown("## 🎯 Our Mission")

st.markdown("""
Air pollution affects billions of people worldwide, yet access to reliable air quality forecasts remains limited, 
especially in data-sparse regions. **Mframapa AI** bridges this gap by leveraging NASA satellite data and 
advanced machine learning to provide accurate, actionable air quality forecasts for everyone.
""")

# Feature highlights
st.markdown("## ✨ What Makes Mframapa AI Special")

feature_col1, feature_col2 = st.columns(2)

with feature_col1:
    st.markdown("""
    ### 🛰️ Satellite-Powered Intelligence
    - **TEMPO** high-resolution data for North America
    - **MERRA-2** global reanalysis for worldwide coverage
    - Real-time atmospheric monitoring
    
    ### 🤖 Advanced AI Forecasting
    - XGBoost machine learning models
    - 48-hour prediction horizon
    - Multi-pollutant tracking (PM2.5, O₃, NO₂)
    """)

with feature_col2:
    st.markdown("""
    ### 🏥 Personalized Health Insights
    - Age and condition-specific recommendations
    - Activity-based guidance
    - Real-time health risk assessment
    
    ### 🌐 Global Accessibility
    - Works in data-sparse regions
    - No ground station dependency
    - Free and open access
    """)

# Regional focus
st.markdown("## 🌍 Regional Focus")

region_col1, region_col2 = st.columns(2)

with region_col1:
    st.markdown("""
    ### North America 🇺🇸 🇨🇦 🇲🇽
    
    **High-Resolution Coverage**
    - TEMPO satellite provides hourly NO₂ and O₃ data
    - Ground station validation
    - City-level accuracy
    - Real-time updates
    
    **Supported Cities Include:**
    - Los Angeles, California
    - New York City, New York  
    - Denver, Colorado
    - Toronto, Canada
    - Mexico City, Mexico
    """)

with region_col2:
    st.markdown("""
    ### Ghana & West Africa 🇬🇭
    
    **Data-Sparse Region Support**
    - MERRA-2 reanalysis data
    - Climate-adapted modeling
    - Regional pattern recognition
    - Dust storm tracking
    
    **Focus Areas:**
    - Accra, Ghana
    - Lagos, Nigeria
    - Abidjan, Côte d'Ivoire
    - Dakar, Senegal
    - Regional dust transport
    """)

# Call to action
st.markdown("---")
st.markdown("## 🚀 Ready to Get Started?")

action_col1, action_col2, action_col3 = st.columns(3)

with action_col1:
    st.markdown("""
    ### 1️⃣ Select Your City
    Use the search box above to find your location
    """)

with action_col2:
    st.markdown("""
    ### 2️⃣ Get Your Forecast
    Visit the Forecast page for 48-hour predictions
    """)

with action_col3:
    st.markdown("""
    ### 3️⃣ Create Your Profile
    Set up personalized health recommendations
    """)

if not st.session_state.get('selected_city'):
    st.info("💡 **Tip:** Start by entering your city name above to unlock all features!")
else:
    st.success(f"🎉 Great! You've selected **{st.session_state.selected_city}**. Ready to explore air quality forecasts!")

# Footer information
st.markdown("---")
st.markdown("""
### 📚 Learn More

- **🔬 How It Works:** Visit the "Explain" page to understand our AI models
- **💡 Insights:** Discover air quality patterns and trends
- **🏛️ Policy Impact:** Learn about air quality regulations
- **👥 Community:** Join our crowdsourcing efforts

### 📞 Support & Feedback

Have questions or feedback? We'd love to hear from you! This project was built for the NASA Space Apps Challenge 2025.

---

*🌍 Mframapa AI - Democratizing air quality data for a healthier planet*
""")
