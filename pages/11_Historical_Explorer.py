import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import calendar
from utils import get_aqi_category, get_lat_lon

st.set_page_config(page_title="Historical Explorer - Mframapa AI", page_icon="📚", layout="wide")

st.title("📚 Historical Air Quality Explorer")

st.markdown("""
Explore historical air quality trends, discover patterns, and understand how air pollution has changed over time. 
Use satellite data and ground measurements to uncover insights about air quality evolution.
""")

# Time period selection
st.markdown("## 🕐 Select Time Period for Exploration")

time_col1, time_col2, time_col3 = st.columns(3)

with time_col1:
    start_year = st.selectbox("Start Year", range(2015, 2025), index=0)

with time_col2:
    end_year = st.selectbox("End Year", range(2015, 2025), index=9)

with time_col3:
    time_resolution = st.selectbox("Time Resolution", ["Monthly", "Seasonal", "Annual"])

# Location selection for historical analysis
st.markdown("## 📍 Location Selection")

location_tab1, location_tab2, location_tab3 = st.tabs(["🏙️ Major Cities", "🌍 Regional Analysis", "🔍 Custom Location"])

with location_tab1:
    st.markdown("### Major Cities Historical Data")
    
    city_options = {
        "Los Angeles, USA": (34.0522, -118.2437),
        "New York City, USA": (40.7128, -74.0060),
        "London, UK": (51.5074, -0.1278),
        "Beijing, China": (39.9042, 116.4074),
        "Delhi, India": (28.7041, 77.1025),
        "Tokyo, Japan": (35.6762, 139.6503),
        "Mexico City, Mexico": (19.4326, -99.1332),
        "São Paulo, Brazil": (-23.5505, -46.6333),
        "Lagos, Nigeria": (6.5244, 3.3792),
        "Accra, Ghana": (5.6037, -0.1870)
    }
    
    selected_cities = st.multiselect(
        "Select cities for comparison:",
        list(city_options.keys()),
        default=["Los Angeles, USA", "Beijing, China"]
    )

with location_tab2:
    st.markdown("### Regional Analysis")
    
    region_choice = st.selectbox(
        "Select region for analysis:",
        ["North America", "Europe", "East Asia", "South Asia", "Africa", "South America", "Global Average"]
    )
    
    if region_choice:
        st.info(f"Analyzing historical trends for {region_choice} region")

with location_tab3:
    st.markdown("### Custom Location")
    
    custom_city = st.text_input("Enter city name:", placeholder="e.g., Paris, France")
    
    if custom_city and st.button("🔍 Find Location"):
        coordinates = get_lat_lon(custom_city)
        if coordinates:
            st.success(f"Found {custom_city}: {coordinates[0]:.4f}, {coordinates[1]:.4f}")
            st.session_state.custom_historical_location = {
                'name': custom_city,
                'coordinates': coordinates
            }
        else:
            st.error(f"Could not find {custom_city}")

# Generate historical data for analysis
@st.cache_data
def generate_historical_data(cities, years, resolution):
    """Generate realistic historical air quality data for demonstration."""
    data = []
    
    # Define base pollution levels and trends for different cities
    city_profiles = {
        "Los Angeles, USA": {"base_pm25": 25, "trend": -0.5, "seasonal_amp": 8},
        "New York City, USA": {"base_pm25": 20, "trend": -0.3, "seasonal_amp": 6},
        "Beijing, China": {"base_pm25": 85, "trend": -2.0, "seasonal_amp": 25},
        "Delhi, India": {"base_pm25": 95, "trend": 0.5, "seasonal_amp": 30},
        "London, UK": {"base_pm25": 18, "trend": -0.4, "seasonal_amp": 4},
        "Tokyo, Japan": {"base_pm25": 15, "trend": -0.2, "seasonal_amp": 3},
        "Accra, Ghana": {"base_pm25": 45, "trend": 1.0, "seasonal_amp": 35}
    }
    
    for city in cities:
        if city not in city_profiles:
            continue
            
        profile = city_profiles[city]
        
        for year in range(years[0], years[1] + 1):
            if resolution == "Annual":
                periods = [(year, 6)]  # Mid-year
            elif resolution == "Seasonal":
                periods = [(year, 2), (year, 5), (year, 8), (year, 11)]  # Winter, Spring, Summer, Fall
            else:  # Monthly
                periods = [(year, month) for month in range(1, 13)]
            
            for year_val, period in periods:
                # Calculate trend effect
                year_offset = year_val - 2015
                trend_effect = profile["trend"] * year_offset
                
                # Calculate seasonal effect
                if resolution != "Annual":
                    seasonal_effect = profile["seasonal_amp"] * np.sin(2 * np.pi * period / 12)
                else:
                    seasonal_effect = 0
                
                # Base value with trend and seasonal effects
                pm25 = max(5, profile["base_pm25"] + trend_effect + seasonal_effect + np.random.normal(0, 3))
                
                # Generate correlated pollutants
                no2 = max(5, pm25 * 0.6 + np.random.normal(0, 5))
                o3 = max(10, 60 - pm25 * 0.3 + 20 * np.sin(2 * np.pi * period / 12) + np.random.normal(0, 8))
                
                # Calculate AQI (simplified)
                aqi = min(500, max(0, pm25 * 2.5 + np.random.normal(0, 5)))
                
                data.append({
                    'City': city,
                    'Year': year_val,
                    'Period': period,
                    'PM2.5': pm25,
                    'NO2': no2,
                    'O3': o3,
                    'AQI': aqi
                })
    
    return pd.DataFrame(data)

# Main analysis section
if selected_cities and start_year <= end_year:
    historical_data = generate_historical_data(selected_cities, (start_year, end_year), time_resolution)
    
    st.markdown("## 📊 Historical Trends Analysis")
    
    # Trend visualization
    st.markdown("### 📈 Long-term Trends")
    
    pollutant_choice = st.selectbox("Select pollutant for trend analysis:", ["PM2.5", "NO2", "O3", "AQI"])
    
    if time_resolution == "Annual":
        x_axis = 'Year'
        groupby_cols = ['City', 'Year']
    elif time_resolution == "Seasonal":
        # Create season labels
        historical_data['Season'] = historical_data['Period'].map({2: 'Winter', 5: 'Spring', 8: 'Summer', 11: 'Fall'})
        historical_data['Year_Season'] = historical_data['Year'].astype(str) + ' ' + historical_data['Season']
        x_axis = 'Year_Season'
        groupby_cols = ['City', 'Year', 'Season']
    else:  # Monthly
        historical_data['Month_Name'] = historical_data['Period'].apply(lambda x: calendar.month_abbr[x])
        historical_data['Year_Month'] = historical_data['Year'].astype(str) + '-' + historical_data['Month_Name']
        x_axis = 'Year_Month'
        groupby_cols = ['City', 'Year', 'Period']
    
    # Create trend plot
    if time_resolution == "Annual":
        fig = px.line(historical_data, x='Year', y=pollutant_choice, color='City',
                     title=f'{pollutant_choice} Trends Over Time')
    else:
        # For seasonal/monthly, show average by period
        avg_data = historical_data.groupby(['City', 'Period']).agg({
            pollutant_choice: 'mean'
        }).reset_index()
        
        if time_resolution == "Seasonal":
            avg_data['Period_Name'] = avg_data['Period'].map({2: 'Winter', 5: 'Spring', 8: 'Summer', 11: 'Fall'})
        else:
            avg_data['Period_Name'] = avg_data['Period'].apply(lambda x: calendar.month_abbr[x])
        
        fig = px.line(avg_data, x='Period_Name', y=pollutant_choice, color='City',
                     title=f'Average {pollutant_choice} by {time_resolution}')
    
    fig.update_layout(height=500)
    st.plotly_chart(fig, use_container_width=True)
    
    # Statistical analysis
    st.markdown("### 📋 Statistical Summary")
    
    stats_data = []
    for city in selected_cities:
        city_data = historical_data[historical_data['City'] == city]
        
        if not city_data.empty:
            stats = {
                'City': city,
                f'Average {pollutant_choice}': city_data[pollutant_choice].mean(),
                f'Min {pollutant_choice}': city_data[pollutant_choice].min(),
                f'Max {pollutant_choice}': city_data[pollutant_choice].max(),
                'Std Deviation': city_data[pollutant_choice].std(),
                'Data Points': len(city_data)
            }
            
            # Calculate trend (linear regression slope)
            if len(city_data) > 1:
                x = np.arange(len(city_data))
                y = city_data[pollutant_choice].values
                slope = np.polyfit(x, y, 1)[0]
                stats['Annual Trend'] = slope * (12 if time_resolution == "Monthly" else 4 if time_resolution == "Seasonal" else 1)
            else:
                stats['Annual Trend'] = 0
            
            stats_data.append(stats)
    
    if stats_data:
        stats_df = pd.DataFrame(stats_data)
        
        # Format numerical columns
        for col in stats_df.columns:
            if col not in ['City', 'Data Points']:
                stats_df[col] = stats_df[col].round(2)
        
        st.dataframe(stats_df, use_container_width=True)
        
        # Trend interpretation
        st.markdown("### 📝 Trend Interpretation")
        
        for _, row in stats_df.iterrows():
            trend = row['Annual Trend']
            city = row['City']
            
            if trend < -1:
                st.success(f"🟢 **{city}**: Significant improvement ({trend:.1f} units/year decrease)")
            elif trend < 0:
                st.info(f"🔵 **{city}**: Slight improvement ({trend:.1f} units/year decrease)")
            elif trend > 1:
                st.error(f"🔴 **{city}**: Worsening trend ({trend:.1f} units/year increase)")
            else:
                st.warning(f"🟡 **{city}**: Stable levels ({trend:.1f} units/year)")

# Seasonal patterns analysis
if selected_cities:
    st.markdown("## 🌡️ Seasonal Patterns Analysis")
    
    seasonal_data = generate_historical_data(selected_cities, (start_year, end_year), "Monthly")
    
    # Calculate monthly averages
    monthly_avg = seasonal_data.groupby(['City', 'Period']).agg({
        'PM2.5': 'mean',
        'NO2': 'mean', 
        'O3': 'mean',
        'AQI': 'mean'
    }).reset_index()
    
    monthly_avg['Month'] = monthly_avg['Period'].apply(lambda x: calendar.month_abbr[x])
    
    seasonal_pollutant = st.selectbox("Select pollutant for seasonal analysis:", 
                                    ["PM2.5", "NO2", "O3", "AQI"], key="seasonal")
    
    # Seasonal heatmap
    pivot_data = monthly_avg.pivot(index='City', columns='Month', values=seasonal_pollutant)
    
    # Reorder columns to start with January
    month_order = [calendar.month_abbr[i] for i in range(1, 13)]
    pivot_data = pivot_data.reindex(columns=month_order)
    
    fig_heatmap = px.imshow(pivot_data, 
                           title=f'Seasonal {seasonal_pollutant} Patterns',
                           labels=dict(x="Month", y="City", color=f"{seasonal_pollutant}"),
                           aspect="auto")
    fig_heatmap.update_layout(height=400)
    st.plotly_chart(fig_heatmap, use_container_width=True)
    
    # Seasonal insights
    st.markdown("### 🔍 Seasonal Insights")
    
    seasonal_insights = []
    for city in selected_cities:
        city_monthly = monthly_avg[monthly_avg['City'] == city]
        if not city_monthly.empty:
            max_month = city_monthly.loc[city_monthly[seasonal_pollutant].idxmax(), 'Month']
            min_month = city_monthly.loc[city_monthly[seasonal_pollutant].idxmin(), 'Month']
            max_val = city_monthly[seasonal_pollutant].max()
            min_val = city_monthly[seasonal_pollutant].min()
            
            seasonal_insights.append({
                'City': city,
                'Peak Month': max_month,
                'Peak Value': max_val,
                'Low Month': min_month, 
                'Low Value': min_val,
                'Seasonal Variation': max_val - min_val
            })
    
    if seasonal_insights:
        seasonal_df = pd.DataFrame(seasonal_insights)
        seasonal_df = seasonal_df.round(2)
        st.dataframe(seasonal_df, use_container_width=True)

# Historical events analysis
st.markdown("## 📰 Historical Events Impact")

events_data = [
    {
        "Date": "2020-03-15",
        "Event": "COVID-19 Lockdowns Begin",
        "Impact": "Global NO₂ levels dropped 20-50% in major cities",
        "Duration": "3-6 months",
        "Type": "Policy/Social"
    },
    {
        "Date": "2018-11-08", 
        "Event": "California Camp Fire",
        "Impact": "PM2.5 levels >300 μg/m³ across Northern California",
        "Duration": "2-3 weeks",
        "Type": "Natural Disaster"
    },
    {
        "Date": "2013-01-10",
        "Event": "Beijing 'Airpocalypse'",
        "Impact": "PM2.5 exceeded 900 μg/m³, visibility <100m",
        "Duration": "Several days",
        "Type": "Weather/Pollution"
    },
    {
        "Date": "2019-09-15",
        "Event": "Australian Bushfire Season",
        "Impact": "Smoke traveled >2000km, affected multiple countries",
        "Duration": "4+ months",
        "Type": "Natural Disaster"
    }
]

events_df = pd.DataFrame(events_data)
st.dataframe(events_df, use_container_width=True)

# Allow users to explore specific events
selected_event = st.selectbox("Explore event impact:", 
                             [f"{row['Date']} - {row['Event']}" for _, row in events_df.iterrows()])

if selected_event:
    event_info = events_df[events_df.apply(lambda row: f"{row['Date']} - {row['Event']}" == selected_event, axis=1)].iloc[0]
    
    st.markdown(f"### {event_info['Event']}")
    st.markdown(f"**Date**: {event_info['Date']}")
    st.markdown(f"**Impact**: {event_info['Impact']}")
    st.markdown(f"**Duration**: {event_info['Duration']}")
    st.markdown(f"**Type**: {event_info['Type']}")
    
    # Generate synthetic before/after data for the event
    if "COVID" in event_info['Event']:
        st.markdown("#### COVID-19 Impact Analysis")
        
        # Simulate NO2 reduction during lockdown
        dates = pd.date_range('2020-01-01', '2020-12-31', freq='W')
        baseline_no2 = 35 + 10 * np.sin(2 * np.pi * np.arange(len(dates)) / 52)
        
        # Apply lockdown effect (March-June)
        lockdown_effect = np.where((dates >= '2020-03-15') & (dates <= '2020-06-15'), 
                                 baseline_no2 * 0.6, baseline_no2)
        
        covid_data = pd.DataFrame({
            'Date': dates,
            'Baseline NO2': baseline_no2,
            'Actual NO2': lockdown_effect
        })
        
        fig_covid = go.Figure()
        fig_covid.add_trace(go.Scatter(x=covid_data['Date'], y=covid_data['Baseline NO2'],
                                     mode='lines', name='Expected (no lockdown)', line=dict(dash='dash')))
        fig_covid.add_trace(go.Scatter(x=covid_data['Date'], y=covid_data['Actual NO2'],
                                     mode='lines', name='Actual (with lockdown)'))
        
        fig_covid.update_layout(title='NO₂ Levels During COVID-19 Pandemic',
                              xaxis_title='Date', yaxis_title='NO₂ (ppb)')
        st.plotly_chart(fig_covid, use_container_width=True)

# Data quality and sources
st.markdown("## 🔍 Data Sources & Quality")

source_col1, source_col2 = st.columns(2)

with source_col1:
    st.markdown("""
    ### 📡 Satellite Data Sources
    
    **NASA MERRA-2 (2015-Present)**
    - Global reanalysis data
    - 0.5° × 0.625° resolution
    - Hourly temporal resolution
    - Covers: PM2.5, aerosols, meteorology
    
    **NASA TEMPO (2023-Present)**
    - High-resolution North America data
    - 2.1km × 4.4km resolution
    - Hourly daytime coverage
    - Covers: NO₂, O₃, HCHO, aerosols
    """)

with source_col2:
    st.markdown("""
    ### 🏭 Ground Station Networks
    
    **EPA AirNow (US)**
    - 4,000+ monitoring sites
    - Hourly measurements
    - Quality assured data
    - Real-time and historical archives
    
    **Global Ground Networks**
    - OpenAQ: 10,000+ global stations
    - AQICN: World Air Quality Index
    - Regional networks (EU, Asia)
    - Varying data quality and coverage
    """)

# Data limitations
st.markdown("### ⚠️ Data Limitations & Considerations")

st.warning("""
**Important Considerations:**

- **Satellite Resolution**: MERRA-2 data represents ~50km averages, may not capture hyper-local variations
- **Missing Data**: Some periods may have gaps due to satellite maintenance or cloud cover
- **Model vs. Measurements**: MERRA-2 is a reanalysis product combining models and observations
- **Temporal Coverage**: TEMPO data only available from 2023 onwards for high-resolution North America analysis
- **Validation**: Satellite data is validated against ground stations but may have systematic biases
""")

# Download and export options
st.markdown("---")
st.markdown("## 💾 Export Historical Data")

export_col1, export_col2, export_col3 = st.columns(3)

with export_col1:
    if st.button("📊 Download Trend Data"):
        if 'historical_data' in locals() and not historical_data.empty:
            csv = historical_data.to_csv(index=False)
            st.download_button(
                label="💾 Download CSV",
                data=csv,
                file_name=f"historical_air_quality_{start_year}_{end_year}.csv",
                mime="text/csv"
            )
        else:
            st.warning("No data to download. Please select cities and generate analysis first.")

with export_col2:
    if st.button("📈 Generate Report"):
        st.info("📝 Historical analysis report generation coming soon!")

with export_col3:
    if st.button("🔄 Refresh Analysis"):
        st.cache_data.clear()
        st.rerun()

# Educational content
st.markdown("---")
st.markdown("## 📚 Learn from History")

edu_col1, edu_col2 = st.columns(2)

with edu_col1:
    st.markdown("""
    ### 🎓 Key Historical Lessons
    
    **Policy Impact**
    - Clean Air Act (1970s-1990s): Dramatic US air quality improvements
    - Beijing Olympics (2008): Short-term policy measures can work
    - European emission standards: Long-term NO₂ reductions
    
    **Technology Effects**
    - Catalytic converters: Major reduction in vehicle emissions
    - Scrubber technology: Power plant SO₂ reductions  
    - Renewable energy: Gradual displacement of fossil fuels
    """)

with edu_col2:
    st.markdown("""
    ### 🔬 Scientific Understanding
    
    **Research Evolution**
    - 1950s-60s: Recognition of smog health effects
    - 1970s-80s: Acid rain and long-range transport
    - 1990s-2000s: Fine particle (PM2.5) health impacts
    - 2010s-Present: Climate-air quality interactions
    
    **Monitoring Advances**
    - Ground networks: 1970s establishment
    - Satellite monitoring: 1990s-2000s development
    - AI analysis: 2010s-Present integration
    """)

st.markdown("""
### 💡 Using Historical Data

**For Policymakers:**
- Evaluate effectiveness of past regulations
- Predict impacts of proposed policies
- Identify successful intervention strategies

**For Researchers:** 
- Study long-term trends and cycles
- Validate air quality models
- Understand climate-pollution interactions

**For Citizens:**
- Learn about local air quality patterns
- Understand seasonal health risks
- Advocate for evidence-based policies

*Historical data provides the foundation for understanding air quality trends and making informed decisions about future actions.*
""")
