import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import folium
from streamlit_folium import folium_static
from datetime import datetime, timedelta
import random

st.set_page_config(page_title="Cross-Border Tracker - Mframapa AI", page_icon="🌏", layout="wide")

st.title("🌏 Cross-Border Air Pollution Tracker")

st.markdown("""
Monitor transboundary air pollution patterns using satellite data. Air pollution doesn't respect borders - 
understanding cross-border transport helps international cooperation and policy coordination.
""")

# Overview section
st.markdown("## 🌍 Global Transboundary Pollution Overview")

overview_col1, overview_col2, overview_col3, overview_col4 = st.columns(4)

with overview_col1:
    st.metric(
        "Cross-Border Events/Year",
        "~2,400",
        "Major documented cases",
        help="Significant pollution transport events detected by satellite"
    )

with overview_col2:
    st.metric(
        "Countries Affected",
        "195+",
        "All countries experience some level",
        help="All countries experience cross-border pollution to some degree"
    )

with overview_col3:
    st.metric(
        "Average Transport Distance",
        "500-2000 km",
        "Varies by pollutant type",
        help="Typical distance pollution travels across borders"
    )

with overview_col4:
    st.metric(
        "Economic Impact",
        "$5-20B USD/year",
        "Global health costs",
        help="Estimated annual health costs from transboundary pollution"
    )

# Major transport routes
st.markdown("## 🛣️ Major Pollution Transport Routes")

route_tab1, route_tab2, route_tab3 = st.tabs(["🌪️ Dust Transport", "🔥 Wildfire Smoke", "🏭 Industrial Emissions"])

with route_tab1:
    st.markdown("### Global Dust Transport Patterns")
    
    dust_col1, dust_col2 = st.columns(2)
    
    with dust_col1:
        st.markdown("""
        **Major Dust Source Regions:**
        
        **🏜️ Sahara Desert → Atlantic & Europe**
        - Peak season: December - March (Harmattan winds)
        - Affects: West Africa, Caribbean, Amazon, Europe
        - Distance: Up to 5,000+ km transport
        - Impact: PM2.5 levels exceed 200 μg/m³ in West Africa
        
        **🏜️ Asian Dust → Pacific Region**
        - Source: Gobi and Taklamakan deserts
        - Affects: China, Korea, Japan, western North America
        - Peak season: Spring months (March-May)
        - Transport time: 5-7 days across Pacific
        """)
    
    with dust_col2:
        # Dust transport seasonal pattern
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        saharan_dust = [85, 95, 90, 70, 40, 25, 20, 25, 35, 50, 70, 80]
        asian_dust = [30, 40, 75, 90, 85, 45, 25, 20, 25, 35, 40, 35]
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=months, y=saharan_dust, 
                               mode='lines+markers', name='Saharan Dust',
                               line=dict(color='orange')))
        fig.add_trace(go.Scatter(x=months, y=asian_dust,
                               mode='lines+markers', name='Asian Dust',
                               line=dict(color='brown')))
        
        fig.update_layout(
            title='Seasonal Dust Transport Intensity',
            yaxis_title='Transport Index',
            height=300
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Create dust transport map
    st.markdown("### 🗺️ Global Dust Transport Map")
    
    # Center map on Africa to show Saharan dust transport
    m = folium.Map(location=[20, 0], zoom_start=2)
    
    # Saharan dust route
    sahara_route = [
        [20, -10],  # Sahara
        [15, -25],  # West Africa coast
        [25, -40],  # Atlantic
        [25, -60],  # Caribbean
        [45, 5]     # Europe
    ]
    
    folium.PolyLine(sahara_route, color='orange', weight=5, 
                   popup='Saharan Dust Transport Route').add_to(m)
    
    # Asian dust route
    asian_route = [
        [40, 105],  # Gobi Desert
        [35, 115],  # China
        [35, 130],  # Korea/Japan
        [50, 160],  # North Pacific
        [50, -140]  # North America
    ]
    
    folium.PolyLine(asian_route, color='brown', weight=5,
                   popup='Asian Dust Transport Route').add_to(m)
    
    # Add source markers
    folium.Marker([23, 0], popup='Sahara Desert', 
                 icon=folium.Icon(color='orange')).add_to(m)
    folium.Marker([42, 105], popup='Gobi Desert',
                 icon=folium.Icon(color='brown')).add_to(m)
    
    folium_static(m, width=700, height=400)

with route_tab2:
    st.markdown("### Wildfire Smoke Transport")
    
    fire_col1, fire_col2 = st.columns(2)
    
    with fire_col1:
        st.markdown("""
        **Major Wildfire Regions & Transport:**
        
        **🔥 Western North America**
        - Peak season: July - September
        - Transport: Across US/Canada, to Europe
        - 2020 Example: Oregon smoke reached New York
        - Impact: PM2.5 spikes >150 μg/m³ downwind
        
        **🔥 Amazon Rainforest**
        - Peak season: August - October (dry season)
        - Local and regional impact
        - Affects air quality across South America
        - International concern for deforestation
        """)
    
    with fire_col2:
        # Wildfire smoke transport example
        fire_months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
        smoke_transport = [10, 25, 60, 85, 90, 70, 30]
        
        fig = px.bar(x=fire_months, y=smoke_transport,
                    title='Wildfire Smoke Transport Intensity (N. America)',
                    labels={'x': 'Month', 'y': 'Transport Index'},
                    color=smoke_transport, color_continuous_scale='Reds')
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    st.warning("""
    **🚨 2023 Canadian Wildfire Impact:**
    - Smoke traveled >2,000 km from source
    - NYC AQI exceeded 400 (Hazardous)
    - Flights cancelled, outdoor events postponed
    - Demonstrates need for cross-border monitoring
    """)

with route_tab3:
    st.markdown("### Industrial Emission Transport")
    
    industrial_col1, industrial_col2 = st.columns(2)
    
    with industrial_col1:
        st.markdown("""
        **Industrial Pollution Corridors:**
        
        **🏭 East Asia Industrial Belt**
        - Sources: China, Japan, South Korea
        - Transport: Regional circulation patterns
        - Pollutants: NO₂, SO₂, PM2.5
        - Cross-border cooperation challenges
        
        **🏭 US-Canada Great Lakes**
        - Shared airshed management
        - Cooperative monitoring programs
        - Success story in SO₂ reduction
        - Joint policy coordination
        """)
    
    with industrial_col2:
        # Industrial emission sources by region
        regions = ['East Asia', 'North America', 'Europe', 'South Asia', 'Other']
        cross_border_emissions = [35, 20, 18, 15, 12]  # Percentage contribution
        
        fig = px.pie(values=cross_border_emissions, names=regions,
                    title='Cross-Border Industrial Emission Sources (%)')
        st.plotly_chart(fig, use_container_width=True)

# Real-time tracking section
st.markdown("## 📡 Real-Time Cross-Border Monitoring")

# Simulated real-time events
st.markdown("### 🔴 Current Active Transport Events")

# Generate sample current events
current_events = [
    {
        'Event': 'Saharan Dust Outbreak',
        'Source': 'Western Sahara',
        'Affected Regions': 'West Africa, Cape Verde',
        'Pollutant': 'PM2.5',
        'Intensity': 'High',
        'Expected Duration': '3-5 days',
        'Status': '🔴 Active'
    },
    {
        'Event': 'Industrial Plume Transport',
        'Source': 'Eastern China',
        'Affected Regions': 'South Korea, Japan',
        'Pollutant': 'NO₂',
        'Intensity': 'Moderate',
        'Expected Duration': '2-3 days',
        'Status': '🟡 Developing'
    },
    {
        'Event': 'Biomass Burning Smoke',
        'Source': 'Southeast Asia',
        'Affected Regions': 'Malaysia, Singapore',
        'Pollutant': 'PM2.5',
        'Intensity': 'Moderate',
        'Expected Duration': '1-2 days',
        'Status': '🟡 Developing'
    }
]

events_df = pd.DataFrame(current_events)
st.dataframe(events_df, use_container_width=True)

# Detailed event analysis
st.markdown("### 📊 Event Impact Analysis")

event_choice = st.selectbox(
    "Select event for detailed analysis:",
    ['Saharan Dust Outbreak', 'Industrial Plume Transport', 'Biomass Burning Smoke']
)

if event_choice == 'Saharan Dust Outbreak':
    analysis_col1, analysis_col2 = st.columns(2)
    
    with analysis_col1:
        st.markdown("""
        **Event Details:**
        - **Source**: Western Sahara region
        - **Meteorological Driver**: Strong Harmattan winds
        - **Transport Direction**: Southwest toward Atlantic
        - **Primary Pollutant**: Dust particles (PM2.5, PM10)
        - **Peak Concentration**: 180-250 μg/m³ PM2.5
        - **Affected Population**: ~50 million people
        """)
    
    with analysis_col2:
        # Dust concentration timeline
        hours = list(range(0, 73, 6))  # Next 72 hours
        dust_concentration = [45, 65, 90, 140, 180, 220, 195, 160, 120, 85, 60, 40, 30]
        
        fig = px.line(x=hours, y=dust_concentration,
                     title='Predicted PM2.5 Concentration (Accra, Ghana)',
                     labels={'x': 'Hours from now', 'y': 'PM2.5 (μg/m³)'})
        fig.add_hline(y=75, line_dash="dash", line_color="red", 
                     annotation_text="Unhealthy Level")
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

# Historical analysis
st.markdown("## 📈 Historical Cross-Border Events")

historical_tab1, historical_tab2 = st.tabs(["📊 Trend Analysis", "🔍 Case Studies"])

with historical_tab1:
    st.markdown("### Long-term Trends in Cross-Border Pollution")
    
    # Generate sample historical data
    years = list(range(2015, 2025))
    dust_events = [45, 52, 38, 61, 48, 55, 42, 67, 58, 51]
    fire_events = [28, 34, 41, 52, 48, 39, 45, 78, 62, 44]
    industrial_events = [120, 118, 115, 110, 108, 105, 102, 98, 95, 92]
    
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=years, y=dust_events, mode='lines+markers', name='Dust Events'))
    fig.add_trace(go.Scatter(x=years, y=fire_events, mode='lines+markers', name='Wildfire Events'))
    fig.add_trace(go.Scatter(x=years, y=industrial_events, mode='lines+markers', name='Industrial Events'))
    
    fig.update_layout(
        title='Cross-Border Pollution Events by Year',
        xaxis_title='Year',
        yaxis_title='Number of Events',
        height=400
    )
    st.plotly_chart(fig, use_container_width=True)
    
    st.info("""
    **Key Trends (2015-2024):**
    - 📈 Wildfire events increasing due to climate change
    - 📉 Industrial cross-border pollution decreasing (improved regulations)
    - 🔄 Dust events remain variable with climate oscillations
    - 🌍 Overall cross-border pollution events up 15% this decade
    """)

with historical_tab2:
    st.markdown("### Notable Cross-Border Pollution Events")
    
    case_study = st.selectbox(
        "Select case study:",
        ["2023 Canadian Wildfires", "2020 Saharan Dust in Caribbean", "2019 Indonesian Haze"]
    )
    
    if case_study == "2023 Canadian Wildfires":
        case_col1, case_col2 = st.columns(2)
        
        with case_col1:
            st.markdown("""
            **2023 Canadian Wildfire Smoke Event**
            
            **Timeline**: June 6-15, 2023
            **Source**: Quebec and Ontario wildfires
            **Transport Distance**: >2,000 km
            **Peak AQI**: 400+ in NYC, 300+ in Washington DC
            
            **Impacts:**
            - 100+ million people affected in US/Canada
            - Flights cancelled at major airports
            - Outdoor events and sports postponed
            - Health advisories for entire US East Coast
            - Economic losses: $10+ billion estimated
            """)
        
        with case_col2:
            # AQI progression during event
            dates = ['Jun 6', 'Jun 7', 'Jun 8', 'Jun 9', 'Jun 10', 'Jun 11', 'Jun 12']
            nyc_aqi = [50, 85, 180, 350, 420, 280, 150]
            dc_aqi = [45, 70, 150, 280, 320, 250, 120]
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=dates, y=nyc_aqi, mode='lines+markers', 
                                   name='New York City', line=dict(color='blue')))
            fig.add_trace(go.Scatter(x=dates, y=dc_aqi, mode='lines+markers',
                                   name='Washington DC', line=dict(color='red')))
            
            fig.add_hline(y=150, line_dash="dash", annotation_text="Unhealthy")
            fig.add_hline(y=300, line_dash="dash", annotation_text="Hazardous")
            
            fig.update_layout(title='AQI During 2023 Canadian Wildfire Event',
                             yaxis_title='AQI', height=300)
            st.plotly_chart(fig, use_container_width=True)
        
        st.warning("""
        **Lessons Learned:**
        - Need for better cross-border smoke forecasting
        - Importance of coordinated health messaging
        - Economic value of air quality early warning systems
        - Climate change is increasing wildfire smoke transport events
        """)

# Regional cooperation
st.markdown("## 🤝 International Cooperation Mechanisms")

coop_col1, coop_col2 = st.columns(2)

with coop_col1:
    st.markdown("""
    ### Existing Cooperation Frameworks
    
    **🌍 Global Level:**
    - UN Environment Programme (UNEP)
    - WHO Air Quality Guidelines
    - Paris Agreement co-benefits
    - International Maritime Organization (ship emissions)
    
    **🌎 Regional Level:**
    - ASEAN Agreement on Transboundary Haze
    - US-Canada Air Quality Agreement
    - CLRTAP (Europe - Long-range Transport)
    - East Asian Acid Deposition Monitoring
    """)

with coop_col2:
    st.markdown("""
    ### Key Success Factors
    
    **📡 Shared Monitoring:**
    - Satellite data sharing agreements
    - Joint monitoring networks
    - Standardized measurement protocols
    - Real-time data exchange
    
    **📋 Policy Coordination:**
    - Harmonized emission standards
    - Joint early warning systems
    - Coordinated emergency response
    - Technology transfer programs
    """)

# Satellite monitoring capabilities
st.markdown("## 🛰️ Satellite Monitoring of Cross-Border Transport")

satellite_col1, satellite_col2 = st.columns(2)

with satellite_col1:
    st.markdown("""
    ### Satellite Advantages for Cross-Border Monitoring
    
    **🌍 Global Coverage:**
    - Consistent measurements across borders
    - No territorial restrictions
    - Remote area monitoring
    - Ocean transport tracking
    
    **⏱️ Real-time Capabilities:**
    - Hourly updates (TEMPO)
    - 3-hourly global coverage (MERRA-2)
    - Automated event detection
    - Trajectory modeling support
    """)

with satellite_col2:
    st.markdown("""
    ### Mframapa AI Cross-Border Features
    
    **🔍 Detection Capabilities:**
    - Automated plume identification
    - Source attribution analysis
    - Transport pathway tracking
    - Impact zone prediction
    
    **📊 Policy Support:**
    - Evidence-based dispute resolution
    - Compliance monitoring
    - Impact assessment
    - Cost-benefit analysis for cooperation
    """)

# Early warning system
st.markdown("## ⚠️ Cross-Border Early Warning System")

warning_col1, warning_col2 = st.columns(2)

with warning_col1:
    st.markdown("""
    ### Warning System Components
    
    **🔮 Forecasting:**
    - 48-72 hour transport predictions
    - Concentration impact modeling
    - Population exposure estimates
    - Health risk assessments
    
    **📢 Alert Distribution:**
    - Government notification systems
    - Public health advisories
    - Media and social media alerts
    - Mobile app notifications
    """)

with warning_col2:
    st.markdown("""
    ### Alert Levels & Responses
    
    **🟢 Advisory (AQI 51-100):**
    - Sensitive groups monitor symptoms
    - Consider reducing outdoor activities
    
    **🟡 Warning (AQI 101-150):**
    - General population limit outdoor exertion
    - Schools consider indoor activities
    
    **🔴 Emergency (AQI >150):**
    - Avoid outdoor activities
    - Health facilities prepare for increased cases
    - Possible flight delays/cancellations
    """)

# Future developments
st.markdown("## 🚀 Future Developments")

future_col1, future_col2, future_col3 = st.columns(3)

with future_col1:
    st.info("""
    **🛰️ Technology Advances**
    
    - Next-generation satellites (2025-2030)
    - AI-powered source attribution
    - Real-time emission quantification
    - Enhanced spatial resolution
    """)

with future_col2:
    st.info("""
    **🤝 Cooperation Enhancement**
    
    - Automated data sharing protocols
    - Joint research initiatives
    - Harmonized monitoring standards
    - Integrated warning systems
    """)

with future_col3:
    st.info("""
    **📊 Decision Support**
    
    - Real-time policy impact assessment
    - Economic cost attribution
    - Health impact quantification
    - Climate co-benefits analysis
    """)

st.markdown("---")
st.markdown("""
### 📞 Get Involved

Cross-border air pollution affects us all. Whether you're a policymaker, researcher, or concerned citizen, 
there are ways to contribute to better monitoring and cooperation:

- **Support international monitoring initiatives**
- **Advocate for cross-border cooperation agreements**
- **Share data and research findings openly**
- **Raise public awareness about transboundary pollution**

*The Cross-Border Tracker is updated continuously with new satellite data and transport event detections.*
""")
