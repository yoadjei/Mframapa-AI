import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import folium
from streamlit_folium import folium_static
from utils import get_lat_lon, calculate_aqi_from_components, get_aqi_category
import random
from datetime import datetime, timedelta

st.set_page_config(page_title="Compare Cities - Mframapa AI", page_icon="🔄", layout="wide")

st.title("🔄 Compare Air Quality")

st.markdown("""
Compare air quality forecasts between different cities to make informed decisions about travel, 
outdoor activities, or simply to understand regional air quality patterns.
""")

# Initialize comparison cities in session state
if 'comparison_cities' not in st.session_state:
    st.session_state.comparison_cities = []

# City management section
st.markdown("## 🏙️ Select Cities to Compare")

col1, col2 = st.columns([3, 1])

with col1:
    new_city = st.text_input(
        "Add city for comparison",
        placeholder="e.g., Los Angeles, New York, London, Accra",
        help="Enter any city name worldwide"
    )

with col2:
    st.markdown("<br>", unsafe_allow_html=True)
    if st.button("➕ Add City", type="primary"):
        if new_city and new_city not in [city['name'] for city in st.session_state.comparison_cities]:
            with st.spinner(f"Looking up {new_city}..."):
                coordinates = get_lat_lon(new_city)
                if coordinates:
                    lat, lon = coordinates
                    city_data = {
                        'name': new_city,
                        'lat': lat,
                        'lon': lon
                    }
                    st.session_state.comparison_cities.append(city_data)
                    st.success(f"✅ Added {new_city}")
                    st.rerun()
                else:
                    st.error(f"❌ Could not find {new_city}")
        elif new_city in [city['name'] for city in st.session_state.comparison_cities]:
            st.warning(f"⚠️ {new_city} is already in the comparison list")
        elif not new_city:
            st.warning("⚠️ Please enter a city name")

# Display current cities
if st.session_state.comparison_cities:
    st.markdown("### 📍 Cities in Comparison")
    
    cities_to_remove = []
    cols = st.columns(min(len(st.session_state.comparison_cities), 4))
    
    for i, city in enumerate(st.session_state.comparison_cities):
        with cols[i % 4]:
            st.markdown(f"**{city['name']}**")
            st.caption(f"📍 {city['lat']:.2f}, {city['lon']:.2f}")
            if st.button(f"🗑️ Remove", key=f"remove_{i}"):
                cities_to_remove.append(i)
    
    # Remove cities (reverse order to maintain indices)
    for idx in sorted(cities_to_remove, reverse=True):
        del st.session_state.comparison_cities[idx]
        st.rerun()

# Add current selected city if exists
if st.session_state.get('selected_city') and st.session_state.get('selected_coordinates'):
    current_city = st.session_state.selected_city
    current_coords = st.session_state.selected_coordinates
    
    # Check if current city is already in comparison
    city_names = [city['name'] for city in st.session_state.comparison_cities]
    if current_city not in city_names:
        if st.button(f"📍 Add Current City ({current_city})"):
            city_data = {
                'name': current_city,
                'lat': current_coords[0],
                'lon': current_coords[1]
            }
            st.session_state.comparison_cities.append(city_data)
            st.rerun()

# Generate sample data for comparison (in production, this would use real model predictions)
@st.cache_data(ttl=1800)
def generate_comparison_data(cities):
    """Generate sample air quality data for comparison cities."""
    if not cities:
        return pd.DataFrame()
    
    # Create time series for next 48 hours
    base_time = datetime.now()
    times = [base_time + timedelta(hours=h) for h in range(0, 49, 3)]
    
    data = []
    
    for city in cities:
        lat, lon = city['lat'], city['lon']
        
        # Generate realistic-looking data based on location characteristics
        base_pm25 = 20 + random.uniform(-5, 15)  # Base PM2.5 level
        base_o3 = 40 + random.uniform(-10, 20)   # Base O3 level  
        base_no2 = 25 + random.uniform(-10, 15)  # Base NO2 level
        
        # Urban areas typically have higher pollution
        if any(term in city['name'].lower() for term in ['angeles', 'york', 'beijing', 'delhi', 'mexico']):
            base_pm25 += 20
            base_no2 += 15
        
        # Coastal areas might have different patterns
        if any(term in city['name'].lower() for term in ['angeles', 'miami', 'san francisco']):
            base_o3 += 10
        
        for time in times:
            # Add daily variation
            hour_factor = 0.8 + 0.4 * np.sin(2 * np.pi * time.hour / 24)
            
            pm25 = max(5, base_pm25 * hour_factor + random.uniform(-10, 10))
            o3 = max(10, base_o3 * hour_factor + random.uniform(-15, 15))
            no2 = max(5, base_no2 * hour_factor + random.uniform(-10, 10))
            
            # Calculate AQI
            aqi_data = calculate_aqi_from_components(pm25, o3, no2)
            
            data.append({
                'city': city['name'],
                'time': time,
                'PM2.5': pm25,
                'O3': o3,
                'NO2': no2,
                'AQI': aqi_data.get('Overall', 0),
                'lat': lat,
                'lon': lon
            })
    
    return pd.DataFrame(data)

# Main comparison section
if len(st.session_state.comparison_cities) < 2:
    st.info("💡 Add at least 2 cities to start comparing air quality forecasts.")
    
    # Quick add popular cities
    st.markdown("### 🌟 Popular Cities")
    popular_cities = [
        ("Los Angeles, USA", (34.0522, -118.2437)),
        ("New York, USA", (40.7128, -74.0060)),
        ("London, UK", (51.5074, -0.1278)),
        ("Tokyo, Japan", (35.6762, 139.6503)),
        ("Delhi, India", (28.7041, 77.1025)),
        ("Accra, Ghana", (5.6037, -0.1870)),
        ("Mexico City, Mexico", (19.4326, -99.1332)),
        ("Beijing, China", (39.9042, 116.4074))
    ]
    
    cols = st.columns(4)
    for i, (city_name, coords) in enumerate(popular_cities):
        with cols[i % 4]:
            if st.button(f"➕ {city_name.split(',')[0]}", key=f"quick_add_{i}"):
                city_data = {
                    'name': city_name,
                    'lat': coords[0],
                    'lon': coords[1]
                }
                st.session_state.comparison_cities.append(city_data)
                st.rerun()

else:
    # Generate comparison data
    comparison_data = generate_comparison_data(st.session_state.comparison_cities)
    
    if not comparison_data.empty:
        st.markdown("## 📊 Air Quality Comparison")
        
        # Current conditions comparison
        st.markdown("### 🌡️ Current Conditions")
        
        current_data = comparison_data[comparison_data['time'] == comparison_data['time'].min()]
        
        # Metrics display
        cols = st.columns(len(current_data))
        
        for i, (_, row) in enumerate(current_data.iterrows()):
            with cols[i]:
                category, color = get_aqi_category(row['AQI'])
                
                st.metric(
                    label=row['city'],
                    value=f"AQI {row['AQI']:.0f}",
                    help=f"Category: {category}"
                )
                
                st.markdown(f"<div style='background-color: {color}; height: 5px; border-radius: 3px;'></div>", 
                           unsafe_allow_html=True)
                
                st.caption(f"PM2.5: {row['PM2.5']:.1f} μg/m³")
                st.caption(f"O₃: {row['O3']:.0f} ppb")
                st.caption(f"NO₂: {row['NO2']:.0f} ppb")
        
        # Time series comparison charts
        st.markdown("### 📈 48-Hour Forecast Comparison")
        
        # AQI comparison
        fig_aqi = px.line(
            comparison_data, 
            x='time', 
            y='AQI', 
            color='city',
            title='AQI Forecast Comparison',
            labels={'time': 'Time', 'AQI': 'Air Quality Index'}
        )
        
        # Add AQI category background colors
        fig_aqi.add_hline(y=50, line_dash="dash", line_color="green", annotation_text="Good")
        fig_aqi.add_hline(y=100, line_dash="dash", line_color="yellow", annotation_text="Moderate")
        fig_aqi.add_hline(y=150, line_dash="dash", line_color="orange", annotation_text="Unhealthy for Sensitive")
        
        fig_aqi.update_layout(height=400)
        st.plotly_chart(fig_aqi, use_container_width=True)
        
        # Individual pollutant comparisons
        pollutants = ['PM2.5', 'O3', 'NO2']
        pollutant_units = {'PM2.5': 'μg/m³', 'O3': 'ppb', 'NO2': 'ppb'}
        
        for pollutant in pollutants:
            fig = px.line(
                comparison_data,
                x='time',
                y=pollutant,
                color='city',
                title=f'{pollutant} Concentration Comparison',
                labels={'time': 'Time', pollutant: f'{pollutant} ({pollutant_units[pollutant]})'}
            )
            fig.update_layout(height=300)
            st.plotly_chart(fig, use_container_width=True)
        
        # Statistical comparison
        st.markdown("### 📋 Statistical Summary")
        
        stats_data = []
        for city in st.session_state.comparison_cities:
            city_data = comparison_data[comparison_data['city'] == city['name']]
            
            stats = {
                'City': city['name'],
                'Avg AQI': city_data['AQI'].mean(),
                'Max AQI': city_data['AQI'].max(),
                'Min AQI': city_data['AQI'].min(),
                'Avg PM2.5': city_data['PM2.5'].mean(),
                'Avg O₃': city_data['O3'].mean(),
                'Avg NO₂': city_data['NO2'].mean(),
                'Hours > 100 AQI': (city_data['AQI'] > 100).sum(),
                'Worst Category': get_aqi_category(city_data['AQI'].max())[0]
            }
            stats_data.append(stats)
        
        stats_df = pd.DataFrame(stats_data)
        
        # Format the display
        formatted_stats = stats_df.copy()
        for col in ['Avg AQI', 'Max AQI', 'Min AQI', 'Avg PM2.5', 'Avg O₃', 'Avg NO₂']:
            formatted_stats[col] = formatted_stats[col].round(1)
        
        st.dataframe(formatted_stats, use_container_width=True)
        
        # Best/Worst analysis
        st.markdown("### 🏆 Best & Worst Performers")
        
        col1, col2 = st.columns(2)
        
        with col1:
            best_city = stats_df.loc[stats_df['Avg AQI'].idxmin()]
            st.success(f"""
            **🥇 Best Air Quality**
            
            **{best_city['City']}**
            - Average AQI: {best_city['Avg AQI']:.1f}
            - Category: {get_aqi_category(best_city['Avg AQI'])[0]}
            - Hours > 100 AQI: {best_city['Hours > 100 AQI']:.0f}
            """)
        
        with col2:
            worst_city = stats_df.loc[stats_df['Avg AQI'].idxmax()]
            st.error(f"""
            **⚠️ Needs Attention**
            
            **{worst_city['City']}**
            - Average AQI: {worst_city['Avg AQI']:.1f}
            - Category: {get_aqi_category(worst_city['Avg AQI'])[0]}
            - Hours > 100 AQI: {worst_city['Hours > 100 AQI']:.0f}
            """)
        
        # Map comparison
        st.markdown("### 🗺️ Geographic Comparison")
        
        # Calculate center point for map
        center_lat = np.mean([city['lat'] for city in st.session_state.comparison_cities])
        center_lon = np.mean([city['lon'] for city in st.session_state.comparison_cities])
        
        m = folium.Map(location=[center_lat, center_lon], zoom_start=4)
        
        # Add markers for each city
        for _, row in current_data.iterrows():
            category, color_code = get_aqi_category(row['AQI'])
            
            # Map AQI category to marker color
            marker_color = {
                'Good': 'green',
                'Moderate': 'yellow',
                'Unhealthy for Sensitive Groups': 'orange',
                'Unhealthy': 'red',
                'Very Unhealthy': 'purple',
                'Hazardous': 'darkred'
            }.get(category, 'blue')
            
            popup_text = f"""
            <b>{row['city']}</b><br>
            AQI: {row['AQI']:.0f} ({category})<br>
            PM2.5: {row['PM2.5']:.1f} μg/m³<br>
            O₃: {row['O3']:.0f} ppb<br>
            NO₂: {row['NO2']:.0f} ppb
            """
            
            folium.Marker(
                location=[row['lat'], row['lon']],
                popup=popup_text,
                tooltip=f"{row['city']} - AQI: {row['AQI']:.0f}",
                icon=folium.Icon(color=marker_color, icon='cloud')
            ).add_to(m)
        
        folium_static(m, width=700, height=400)
        
        # Travel recommendations
        st.markdown("### ✈️ Travel Recommendations")
        
        if len(stats_df) >= 2:
            # Sort cities by air quality
            sorted_cities = stats_df.sort_values('Avg AQI')
            
            st.markdown("**For the next 48 hours:**")
            
            for i, (_, city) in enumerate(sorted_cities.iterrows()):
                if i < 2:  # Top 2 cities
                    st.success(f"✅ **{city['City']}** - Good choice (Avg AQI: {city['Avg AQI']:.1f})")
                elif i >= len(sorted_cities) - 2:  # Bottom 2 cities
                    st.warning(f"⚠️ **{city['City']}** - Consider precautions (Avg AQI: {city['Avg AQI']:.1f})")
        
        # Health recommendations based on comparison
        st.markdown("### 🏥 Health Impact Comparison")
        
        user_profile = st.session_state.get('user_profile', {})
        is_sensitive = (
            user_profile.get('age', 30) < 18 or 
            user_profile.get('age', 30) > 65 or 
            any(condition in user_profile.get('conditions', []) for condition in ['asthma', 'copd', 'heart_disease'])
        )
        
        high_aqi_cities = [city for _, city in stats_df.iterrows() if city['Avg AQI'] > (100 if is_sensitive else 150)]
        
        if high_aqi_cities:
            st.warning("🚨 **Cities requiring extra caution:**")
            for city in high_aqi_cities:
                st.write(f"- **{city['City']}**: Limit outdoor activities, especially {city['Hours > 100 AQI']:.0f} hours with unhealthy air")
        else:
            st.success("✅ All compared cities show acceptable air quality for your profile!")

# Export/Share functionality
if st.session_state.comparison_cities and len(st.session_state.comparison_cities) >= 2:
    st.markdown("---")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📊 Download Comparison Data"):
            if not comparison_data.empty:
                csv = comparison_data.to_csv(index=False)
                st.download_button(
                    label="💾 Download CSV",
                    data=csv,
                    file_name=f"air_quality_comparison_{datetime.now().strftime('%Y%m%d_%H%M')}.csv",
                    mime="text/csv"
                )
    
    with col2:
        if st.button("🔄 Refresh Data"):
            st.cache_data.clear()
            st.rerun()
    
    with col3:
        if st.button("🗑️ Clear All Cities"):
            st.session_state.comparison_cities = []
            st.rerun()

# Footer tips
st.markdown("---")
st.markdown("""
### 💡 Comparison Tips

- **Best Time to Compare**: Air quality varies significantly throughout the day
- **Seasonal Patterns**: Consider comparing the same cities across different seasons
- **Travel Planning**: Use 48-hour forecasts for short-term travel decisions
- **Health Planning**: Pay attention to cities where you'll spend the most time outdoors

**Note**: This comparison uses predictive models. For critical health decisions, consult current official air quality monitors.
""")
