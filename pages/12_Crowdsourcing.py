import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import folium
from streamlit_folium import folium_static
from datetime import datetime, timedelta
import random

st.set_page_config(page_title="Crowdsourcing - Mframapa AI", page_icon="👥", layout="wide")

st.title("👥 Community Air Quality Network")

st.markdown("""
Join the global community effort to monitor and improve air quality! Contribute observations, 
share local insights, and collaborate with citizens, researchers, and policymakers worldwide.
""")

# Community overview
st.markdown("## 🌍 Community Impact")

impact_col1, impact_col2, impact_col3, impact_col4 = st.columns(4)

with impact_col1:
    st.metric(
        "Active Contributors",
        "12,847",
        "↑ 23% this month",
        help="Community members actively contributing data"
    )

with impact_col2:
    st.metric(
        "Data Points Collected",
        "2.3M",
        "↑ 156K this week",
        help="Total observations from community sensors and reports"
    )

with impact_col3:
    st.metric(
        "Cities Covered",
        "1,247",
        "↑ 34 new cities",
        help="Cities with active community monitoring"
    )

with impact_col4:
    st.metric(
        "Policy Changes",
        "89",
        "Influenced by community data",
        help="Policy decisions supported by community evidence"
    )

# Main contribution sections
contribution_tab1, contribution_tab2, contribution_tab3, contribution_tab4 = st.tabs([
    "📊 Submit Data", "📱 Sensor Network", "📝 Local Reports", "🤝 Community Actions"
])

with contribution_tab1:
    st.markdown("### 📊 Contribute Air Quality Observations")
    
    st.markdown("""
    Help expand air quality monitoring by sharing your observations and measurements. 
    Every data point helps create a more complete picture of local air quality.
    """)
    
    # Data submission form
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("#### Location Information")
        
        # Use current location if available
        if st.session_state.get('selected_city') and st.session_state.get('selected_coordinates'):
            default_location = st.session_state.selected_city
            default_coords = st.session_state.selected_coordinates
        else:
            default_location = ""
            default_coords = None
        
        submission_location = st.text_input(
            "Location", 
            value=default_location,
            placeholder="Enter city, address, or landmark"
        )
        
        if default_coords:
            lat_input = st.number_input("Latitude", value=default_coords[0], format="%.6f")
            lon_input = st.number_input("Longitude", value=default_coords[1], format="%.6f")
        else:
            lat_input = st.number_input("Latitude", value=0.0, format="%.6f")
            lon_input = st.number_input("Longitude", value=0.0, format="%.6f")
        
        measurement_date = st.date_input("Measurement Date", datetime.now())
        measurement_time_val = st.time_input("Measurement Time", datetime.now().time())
        measurement_time = datetime.combine(measurement_date, measurement_time_val)
    
    with col2:
        st.markdown("#### Measurement Data")
        
        data_source = st.selectbox(
            "Data Source",
            ["Personal Air Quality Monitor", "Purple Air Sensor", "Government Monitor", 
             "Visual Observation", "Phone App", "Other"]
        )
        
        measurement_type = st.selectbox(
            "Measurement Type",
            ["PM2.5", "PM10", "AQI", "Visibility", "Odor", "Multiple Pollutants"]
        )
        
        if measurement_type == "PM2.5":
            value = st.number_input("PM2.5 (μg/m³)", min_value=0.0, max_value=500.0, value=25.0)
            unit = "μg/m³"
        elif measurement_type == "PM10":
            value = st.number_input("PM10 (μg/m³)", min_value=0.0, max_value=500.0, value=50.0)
            unit = "μg/m³"
        elif measurement_type == "AQI":
            value = st.number_input("AQI", min_value=0, max_value=500, value=50)
            unit = "AQI"
        elif measurement_type == "Visibility":
            value = st.selectbox("Visibility", ["Excellent (>10km)", "Good (5-10km)", 
                                              "Moderate (2-5km)", "Poor (<2km)", "Very Poor (<1km)"])
            unit = "visibility category"
        else:
            value = st.text_input("Value", placeholder="Enter measurement value")
            unit = st.text_input("Unit", placeholder="e.g., ppb, μg/m³")
    
    # Additional information
    st.markdown("#### Additional Information")
    
    col3, col4 = st.columns(2)
    
    with col3:
        weather_conditions = st.multiselect(
            "Weather Conditions",
            ["Clear/Sunny", "Cloudy", "Rainy", "Windy", "Foggy", "Hot", "Cold", "Humid"]
        )
        
        nearby_sources = st.multiselect(
            "Nearby Pollution Sources",
            ["Heavy Traffic", "Construction", "Industrial Activity", "Wildfire Smoke", 
             "Dust Storm", "Cooking/BBQ", "Vehicle Exhaust", "None Visible"]
        )
    
    with col4:
        quality_confidence = st.selectbox(
            "Confidence in Measurement",
            ["Very High", "High", "Medium", "Low", "Uncertain"]
        )
        
        additional_notes = st.text_area(
            "Additional Notes",
            placeholder="Any other relevant observations, conditions, or context..."
        )
    
    # Photo upload simulation
    st.markdown("#### Visual Documentation")
    uploaded_file = st.file_uploader(
        "Upload photo (optional)", 
        type=['png', 'jpg', 'jpeg'],
        help="Photos help validate observations and provide visual context"
    )
    
    if uploaded_file:
        st.success("📸 Photo uploaded successfully!")
    
    # Submission
    if st.button("🚀 Submit Observation", type="primary"):
        if submission_location and value:
            # Simulate data submission
            submission_data = {
                'location': submission_location,
                'lat': lat_input,
                'lon': lon_input,
                'time': measurement_time,
                'source': data_source,
                'measurement_type': measurement_type,
                'value': value,
                'unit': unit,
                'weather': weather_conditions,
                'sources': nearby_sources,
                'confidence': quality_confidence,
                'notes': additional_notes,
                'has_photo': uploaded_file is not None
            }
            
            # Add to session state (simulate database storage)
            if 'user_submissions' not in st.session_state:
                st.session_state.user_submissions = []
            
            st.session_state.user_submissions.append(submission_data)
            
            st.success("✅ Thank you for your contribution! Your data has been submitted for review.")
            st.balloons()
            
            # Show contribution points earned
            points_earned = 10 if quality_confidence in ['Very High', 'High'] else 5
            if uploaded_file:
                points_earned += 5
            
            st.info(f"🏆 You earned {points_earned} contribution points!")
            
        else:
            st.error("Please fill in location and measurement value.")

with contribution_tab2:
    st.markdown("### 📱 Personal Sensor Network")
    
    st.markdown("""
    Connect your personal air quality sensors to contribute continuous monitoring data. 
    We support various sensor types and provide integration guides.
    """)
    
    # Sensor registration
    st.markdown("#### Register Your Sensor")
    
    sensor_col1, sensor_col2 = st.columns(2)
    
    with sensor_col1:
        sensor_type = st.selectbox(
            "Sensor Type",
            ["PurpleAir", "AirBeam", "Clarity Node", "AirVisual Pro", 
             "DIY Arduino Sensor", "Other Commercial", "University Research"]
        )
        
        sensor_id = st.text_input("Sensor ID/Serial Number")
        
        sensor_location = st.text_input(
            "Sensor Location", 
            placeholder="Address or description of sensor placement"
        )
        
        installation_date = st.date_input("Installation Date")
    
    with sensor_col2:
        sensor_height = st.number_input("Height Above Ground (meters)", min_value=0.5, max_value=50.0, value=3.0)
        
        sensor_environment = st.selectbox(
            "Environment",
            ["Urban Residential", "Urban Commercial", "Suburban", "Rural", 
             "Industrial", "Roadside", "School/Public Building", "Other"]
        )
        
        data_sharing = st.selectbox(
            "Data Sharing Level",
            ["Public (Open Access)", "Research Only", "Community Only", "Private"]
        )
        
        maintenance_frequency = st.selectbox(
            "Maintenance Schedule",
            ["Weekly", "Monthly", "Quarterly", "As Needed", "Irregular"]
        )
    
    if st.button("📡 Register Sensor"):
        if sensor_type and sensor_id and sensor_location:
            sensor_data = {
                'type': sensor_type,
                'id': sensor_id,
                'location': sensor_location,
                'installation_date': installation_date,
                'height': sensor_height,
                'environment': sensor_environment,
                'sharing': data_sharing,
                'maintenance': maintenance_frequency,
                'registered_date': datetime.now()
            }
            
            # Add to session state
            if 'user_sensors' not in st.session_state:
                st.session_state.user_sensors = []
            
            st.session_state.user_sensors.append(sensor_data)
            st.success("🎉 Sensor registered successfully! Integration instructions will be sent via email.")
            
        else:
            st.error("Please fill in required sensor information.")
    
    # Sensor network map
    st.markdown("### 🗺️ Community Sensor Network")
    
    # Create map showing community sensors
    sensor_map = folium.Map(location=[40, -95], zoom_start=4)
    
    # Add sample sensor locations
    sample_sensors = [
        {"lat": 34.0522, "lon": -118.2437, "city": "Los Angeles", "type": "PurpleAir", "aqi": 67},
        {"lat": 40.7128, "lon": -74.0060, "city": "New York", "type": "AirBeam", "aqi": 52},
        {"lat": 41.8781, "lon": -87.6298, "city": "Chicago", "type": "Clarity Node", "aqi": 73},
        {"lat": 29.7604, "lon": -95.3698, "city": "Houston", "type": "DIY Arduino", "aqi": 89},
        {"lat": 39.7392, "lon": -104.9903, "city": "Denver", "type": "AirVisual Pro", "aqi": 45}
    ]
    
    for sensor in sample_sensors:
        color = 'green' if sensor['aqi'] <= 50 else 'yellow' if sensor['aqi'] <= 100 else 'red'
        
        folium.Marker(
            [sensor['lat'], sensor['lon']],
            popup=f"{sensor['city']}<br>Type: {sensor['type']}<br>AQI: {sensor['aqi']}",
            tooltip=f"{sensor['city']} - AQI: {sensor['aqi']}",
            icon=folium.Icon(color=color, icon='cloud')
        ).add_to(sensor_map)
    
    folium_static(sensor_map, width=700, height=400)
    
    # Network statistics
    st.markdown("#### Network Statistics")
    
    network_col1, network_col2, network_col3 = st.columns(3)
    
    with network_col1:
        st.metric("Active Sensors", "3,247", "↑ 127 this month")
    
    with network_col2:
        st.metric("Data Reliability", "94.2%", "↑ 1.3% improvement")
    
    with network_col3:
        st.metric("Geographic Coverage", "85%", "of urban areas")

with contribution_tab3:
    st.markdown("### 📝 Local Air Quality Reports")
    
    st.markdown("""
    Share detailed observations about local air quality conditions, events, and impacts. 
    Your reports help the community understand air quality patterns and health effects.
    """)
    
    # Report submission form
    report_type = st.selectbox(
        "Report Type",
        ["Daily Observation", "Pollution Event", "Health Impact", "Source Identification", 
         "Improvement Suggestion", "Policy Feedback", "Research Finding"]
    )
    
    report_location = st.text_input(
        "Location",
        placeholder="Neighborhood, landmark, or general area"
    )
    
    report_title = st.text_input(
        "Report Title",
        placeholder="Brief descriptive title for your report"
    )
    
    report_content = st.text_area(
        "Detailed Report",
        placeholder="Describe what you observed, when it occurred, potential causes, impacts, and any other relevant details...",
        height=200
    )
    
    # Report metadata
    report_col1, report_col2 = st.columns(2)
    
    with report_col1:
        report_date = st.date_input("Observation Date")
        report_severity = st.selectbox(
            "Severity Level",
            ["Low", "Moderate", "High", "Very High", "Emergency"]
        )
    
    with report_col2:
        affected_population = st.selectbox(
            "Affected Population",
            ["Just Me", "My Household", "Neighborhood", "City District", "Entire City", "Regional"]
        )
        
        duration = st.selectbox(
            "Duration",
            ["< 1 hour", "1-6 hours", "6-24 hours", "1-3 days", "3-7 days", "> 1 week", "Ongoing"]
        )
    
    # Tags and categories
    report_tags = st.multiselect(
        "Tags",
        ["Traffic", "Industrial", "Construction", "Wildfire", "Dust", "Odor", 
         "Visibility", "Health", "Government", "Community", "Research"]
    )
    
    # Report submission
    if st.button("📤 Submit Report", type="primary"):
        if report_title and report_content and report_location:
            report_data = {
                'type': report_type,
                'location': report_location,
                'title': report_title,
                'content': report_content,
                'date': report_date,
                'severity': report_severity,
                'affected_population': affected_population,
                'duration': duration,
                'tags': report_tags,
                'submitted_at': datetime.now(),
                'author': 'Anonymous User'  # In real app, would use user account
            }
            
            # Add to session state
            if 'community_reports' not in st.session_state:
                st.session_state.community_reports = []
            
            st.session_state.community_reports.append(report_data)
            st.success("✅ Your report has been submitted! Thank you for contributing to community awareness.")
            
        else:
            st.error("Please fill in title, content, and location fields.")
    
    # Recent community reports
    st.markdown("### 📰 Recent Community Reports")
    
    # Sample recent reports
    sample_reports = [
        {
            'title': 'Heavy smoke from construction site affecting downtown area',
            'location': 'Downtown Business District',
            'type': 'Pollution Event',
            'severity': 'High',
            'date': '2024-01-15',
            'tags': ['Construction', 'Dust', 'Health'],
            'summary': 'Large construction project creating significant dust and smoke, affecting visibility and air quality...'
        },
        {
            'title': 'Improved air quality after traffic reduction measures',
            'location': 'Central Park Area',
            'type': 'Improvement Suggestion',
            'severity': 'Low',
            'date': '2024-01-14',
            'tags': ['Traffic', 'Government', 'Community'],
            'summary': 'New bike lanes and reduced car access have noticeably improved air quality in the area...'
        },
        {
            'title': 'Strong odor and eye irritation near industrial zone',
            'location': 'Industrial District East',
            'type': 'Health Impact',
            'severity': 'High',
            'date': '2024-01-13',
            'tags': ['Industrial', 'Odor', 'Health'],
            'summary': 'Multiple residents reporting eye irritation and chemical odors, particularly in evening hours...'
        }
    ]
    
    for report in sample_reports:
        with st.expander(f"🔍 {report['title']} - {report['location']}"):
            col1, col2 = st.columns([2, 1])
            
            with col1:
                st.write(f"**Type**: {report['type']}")
                st.write(f"**Summary**: {report['summary']}")
                st.write(f"**Tags**: {', '.join(report['tags'])}")
            
            with col2:
                st.write(f"**Date**: {report['date']}")
                st.write(f"**Severity**: {report['severity']}")
                
                severity_color = {
                    'Low': 'green', 'Moderate': 'yellow', 
                    'High': 'orange', 'Very High': 'red'
                }
                color = severity_color.get(report['severity'], 'gray')
                st.markdown(f"<div style='background-color: {color}; height: 10px; border-radius: 5px;'></div>", 
                           unsafe_allow_html=True)

with contribution_tab4:
    st.markdown("### 🤝 Community Actions & Initiatives")
    
    st.markdown("""
    Join or organize community actions to improve local air quality. 
    Collective action can drive policy changes and create healthier environments.
    """)
    
    # Action types
    action_tab1, action_tab2, action_tab3 = st.tabs(["🚀 Join Actions", "📅 Organize Event", "🏛️ Policy Advocacy"])
    
    with action_tab1:
        st.markdown("#### 🚀 Join Ongoing Community Actions")
        
        # Sample ongoing actions
        active_actions = [
            {
                'title': 'Car-Free Sunday Initiative',
                'organizer': 'Clean Air Coalition',
                'location': 'City Center',
                'date': '2024-02-04',
                'participants': 234,
                'description': 'Monthly car-free day to reduce traffic emissions and promote alternative transportation.',
                'how_to_join': 'Sign up online and participate by walking, cycling, or using public transport.',
                'impact': 'Previous events reduced NO₂ levels by 30% in downtown area.'
            },
            {
                'title': 'Community Air Quality Monitoring',
                'organizer': 'Neighborhood Environmental Group',
                'location': 'Riverside District',
                'date': 'Ongoing',
                'participants': 67,
                'description': 'Volunteer network measuring air quality with portable sensors throughout the neighborhood.',
                'how_to_join': 'Attend monthly meeting and receive sensor training.',
                'impact': 'Data contributed to successful campaign for industrial emission controls.'
            },
            {
                'title': 'School Air Quality Improvement Campaign',
                'organizer': 'Parents for Clean Air',
                'location': 'Lincoln Elementary School',
                'date': '2024-01-20 - 2024-03-20',
                'participants': 145,
                'description': 'Campaign to install air purifiers and improve ventilation in local schools.',
                'how_to_join': 'Volunteer for fundraising, advocacy, or installation assistance.',
                'impact': 'Target: Install HEPA filters in 12 classrooms by March.'
            }
        ]
        
        for action in active_actions:
            with st.expander(f"🌟 {action['title']} - {action['location']}"):
                action_col1, action_col2 = st.columns([2, 1])
                
                with action_col1:
                    st.write(f"**Organizer**: {action['organizer']}")
                    st.write(f"**Description**: {action['description']}")
                    st.write(f"**How to Join**: {action['how_to_join']}")
                    st.write(f"**Expected Impact**: {action['impact']}")
                
                with action_col2:
                    st.metric("Participants", action['participants'])
                    st.write(f"**Date**: {action['date']}")
                    
                    if st.button(f"✋ Join This Action", key=f"join_{action['title']}"):
                        st.success(f"🎉 You've joined '{action['title']}'! Contact information will be sent to you.")
    
    with action_tab2:
        st.markdown("#### 📅 Organize a Community Event")
        
        st.markdown("Create your own community action to address local air quality issues.")
        
        event_col1, event_col2 = st.columns(2)
        
        with event_col1:
            event_title = st.text_input("Event Title")
            event_type = st.selectbox(
                "Event Type",
                ["Awareness Campaign", "Monitoring Action", "Policy Advocacy", 
                 "Community Clean-up", "Educational Workshop", "Protest/Rally", "Other"]
            )
            event_location = st.text_input("Location")
            event_date = st.date_input("Event Date")
            event_time = st.time_input("Event Time")
        
        with event_col2:
            target_participants = st.number_input("Target Participants", min_value=1, value=20)
            event_duration = st.selectbox("Duration", ["1 hour", "2 hours", "Half day", "Full day", "Multi-day"])
            required_resources = st.multiselect(
                "Required Resources",
                ["Venue", "Permits", "Equipment", "Volunteers", "Funding", "Media Coverage", "Expert Speakers"]
            )
        
        event_description = st.text_area(
            "Event Description",
            placeholder="Describe the purpose, activities, and goals of your event...",
            height=150
        )
        
        event_goals = st.text_area(
            "Specific Goals",
            placeholder="What do you hope to accomplish? (e.g., raise awareness, collect data, influence policy...)",
            height=100
        )
        
        if st.button("🚀 Submit Event Proposal"):
            if event_title and event_description and event_location:
                event_data = {
                    'title': event_title,
                    'type': event_type,
                    'location': event_location,
                    'date': event_date,
                    'time': event_time,
                    'target_participants': target_participants,
                    'duration': event_duration,
                    'resources': required_resources,
                    'description': event_description,
                    'goals': event_goals,
                    'organizer': 'You',
                    'status': 'Pending Review',
                    'submitted_at': datetime.now()
                }
                
                st.success("✅ Your event proposal has been submitted for review! We'll contact you within 48 hours.")
                st.info("🤝 We'll help you connect with other community members and provide organizational support.")
                
            else:
                st.error("Please fill in title, description, and location fields.")
    
    with action_tab3:
        st.markdown("#### 🏛️ Policy Advocacy & Government Engagement")
        
        st.markdown("""
        Use community data and collective voice to influence policy decisions and 
        advocate for stronger air quality regulations.
        """)
        
        # Policy campaign tracker
        st.markdown("##### 📊 Active Policy Campaigns")
        
        policy_campaigns = [
            {
                'campaign': 'Stricter Industrial Emission Standards',
                'target': 'State Environmental Agency',
                'supporters': 2847,
                'goal': 5000,
                'deadline': '2024-03-01',
                'status': 'In Progress',
                'description': 'Petition for 50% reduction in industrial NO₂ emissions by 2026'
            },
            {
                'campaign': 'School Air Quality Standards',
                'target': 'School District Board',
                'supporters': 1234,
                'goal': 2000,
                'deadline': '2024-02-15',
                'status': 'Critical Phase',
                'description': 'Mandate air quality monitoring and improvement in all schools'
            },
            {
                'campaign': 'Low Emission Zone Implementation',
                'target': 'City Council',
                'supporters': 4562,
                'goal': 3000,
                'deadline': '2024-04-01',
                'status': 'Successful',
                'description': 'Establish low emission zones in downtown core'
            }
        ]
        
        for campaign in policy_campaigns:
            with st.expander(f"📢 {campaign['campaign']} - {campaign['target']}"):
                campaign_col1, campaign_col2 = st.columns([2, 1])
                
                with campaign_col1:
                    st.write(f"**Description**: {campaign['description']}")
                    st.write(f"**Target**: {campaign['target']}")
                    st.write(f"**Deadline**: {campaign['deadline']}")
                    
                    # Progress bar
                    progress = min(campaign['supporters'] / campaign['goal'], 1.0)
                    st.progress(progress, text=f"Supporters: {campaign['supporters']}/{campaign['goal']}")
                
                with campaign_col2:
                    status_color = {
                        'In Progress': 'blue',
                        'Critical Phase': 'orange', 
                        'Successful': 'green',
                        'Failed': 'red'
                    }
                    color = status_color.get(campaign['status'], 'gray')
                    st.markdown(f"**Status**: <span style='color: {color}'>{campaign['status']}</span>", 
                               unsafe_allow_html=True)
                    
                    if campaign['status'] not in ['Successful', 'Failed']:
                        if st.button(f"✋ Support", key=f"support_{campaign['campaign']}"):
                            st.success("✅ Thank you for your support! You'll receive campaign updates.")
        
        # Policy proposal form
        st.markdown("##### 📝 Propose New Policy Initiative")
        
        proposal_col1, proposal_col2 = st.columns(2)
        
        with proposal_col1:
            proposal_title = st.text_input("Policy Proposal Title")
            target_authority = st.selectbox(
                "Target Authority",
                ["Local City Council", "County Government", "State Legislature", 
                 "Federal EPA", "School District", "Transportation Authority", "Other"]
            )
            policy_type = st.selectbox(
                "Policy Type",
                ["Emission Standards", "Monitoring Requirements", "Public Health Protection",
                 "Transportation Policy", "Industrial Regulation", "Building Standards", "Other"]
            )
        
        with proposal_col2:
            urgency_level = st.selectbox(
                "Urgency Level",
                ["Low", "Medium", "High", "Critical"]
            )
            estimated_support = st.selectbox(
                "Estimated Community Support",
                ["Low (<100 people)", "Medium (100-1000)", "High (1000-5000)", "Very High (>5000)"]
            )
            timeline = st.selectbox(
                "Proposed Timeline",
                ["Immediate (< 3 months)", "Short-term (3-12 months)", 
                 "Medium-term (1-3 years)", "Long-term (> 3 years)"]
            )
        
        proposal_description = st.text_area(
            "Detailed Proposal",
            placeholder="Describe the proposed policy, its benefits, implementation plan, and expected impact...",
            height=200
        )
        
        supporting_evidence = st.text_area(
            "Supporting Evidence",
            placeholder="Include data, research, examples from other locations, or other evidence supporting your proposal...",
            height=150
        )
        
        if st.button("📤 Submit Policy Proposal"):
            if proposal_title and proposal_description and target_authority:
                proposal_data = {
                    'title': proposal_title,
                    'target_authority': target_authority,
                    'policy_type': policy_type,
                    'urgency': urgency_level,
                    'estimated_support': estimated_support,
                    'timeline': timeline,
                    'description': proposal_description,
                    'evidence': supporting_evidence,
                    'submitted_by': 'Community Member',
                    'submitted_at': datetime.now(),
                    'status': 'Under Review'
                }
                
                st.success("🎉 Your policy proposal has been submitted! We'll review it and help build community support.")
                st.info("💡 We'll connect you with policy experts and help organize community backing for viable proposals.")
            
            else:
                st.error("Please fill in title, description, and target authority.")

# Community recognition and gamification
st.markdown("## 🏆 Community Recognition")

recognition_col1, recognition_col2 = st.columns(2)

with recognition_col1:
    st.markdown("### 🌟 Top Contributors This Month")
    
    top_contributors = [
        {"name": "EcoActivist2024", "contributions": 47, "type": "Data + Reports", "points": 1250},
        {"name": "CleanAirChampion", "contributions": 33, "type": "Sensor Network", "points": 980},
        {"name": "CommunityScientist", "contributions": 29, "type": "Policy Advocacy", "points": 890},
        {"name": "NeighborhoodWatcher", "contributions": 25, "type": "Local Reports", "points": 750},
        {"name": "DataDetective", "contributions": 22, "type": "Analysis", "points": 650}
    ]
    
    for i, contributor in enumerate(top_contributors, 1):
        if i <= 3:
            medal = ["🥇", "🥈", "🥉"][i-1]
        else:
            medal = f"{i}."
        
        st.write(f"{medal} **{contributor['name']}** - {contributor['contributions']} contributions ({contributor['points']} points)")
        st.caption(f"Specialty: {contributor['type']}")

with recognition_col2:
    st.markdown("### 🏅 Achievement Badges")
    
    community_badges = [
        ("Data Pioneer", "🔬", "Contributed 100+ data points"),
        ("Community Leader", "👨‍👩‍👧‍👦", "Organized 5+ community events"),
        ("Policy Champion", "🏛️", "Supported 10+ policy initiatives"),
        ("Sensor Guardian", "📡", "Maintained sensor for 6+ months"),
        ("Report Expert", "📝", "Submitted 25+ detailed reports"),
        ("Advocate", "📢", "Influenced 1+ policy change")
    ]
    
    for name, emoji, description in community_badges:
        st.write(f"{emoji} **{name}**")
        st.caption(description)

# Community impact stories
st.markdown("## 📈 Community Success Stories")

success_story = st.selectbox(
    "Select success story:",
    [
        "Denver School Air Quality Campaign - 89% improvement in classroom air",
        "Los Angeles Traffic Reduction - 35% decrease in neighborhood NO₂",
        "Ghana Rural Monitoring Network - First air quality data for 50+ villages",
        "Beijing Community Sensors - Early warning system prevents health emergencies"
    ]
)

if "Denver School" in success_story:
    st.markdown("""
    ### 🏫 Denver School Air Quality Campaign
    
    **Challenge**: Parents noticed children having more respiratory issues during school hours.
    
    **Community Action**: 
    - 67 parents joined monitoring campaign
    - Installed 15 low-cost sensors around school
    - Documented poor indoor air quality (PM2.5 consistently >50 μg/m³)
    - Organized petition with 500+ signatures
    
    **Result**: 
    - School district approved $200,000 for HVAC upgrades
    - Installation of HEPA filtration systems
    - Indoor PM2.5 reduced to <10 μg/m³ (89% improvement)
    - 40% reduction in student absenteeism due to respiratory illness
    
    **Timeline**: 8 months from initial concern to full implementation
    """)

# Resources and support
st.markdown("---")
st.markdown("## 📚 Resources & Support")

resource_col1, resource_col2 = st.columns(2)

with resource_col1:
    st.markdown("""
    ### 🛠️ Tools & Guides
    
    **Getting Started**
    - [Air Quality Monitoring Guide](https://example.com)
    - [Community Organization Handbook](https://example.com)
    - [Sensor Selection and Setup](https://example.com)
    - [Data Quality Best Practices](https://example.com)
    
    **Advanced Resources**
    - [Policy Advocacy Toolkit](https://example.com)
    - [Research Collaboration Opportunities](https://example.com)
    - [Grant Writing for Environmental Projects](https://example.com)
    - [Legal Resources for Environmental Justice](https://example.com)
    """)

with resource_col2:
    st.markdown("""
    ### 🤝 Community Support
    
    **Connect with Others**
    - Local environmental groups directory
    - Mentor matching for new contributors
    - Expert consultations (scientists, policy experts)
    - Monthly virtual community meetings
    
    **Technical Support**
    - Sensor troubleshooting helpline
    - Data analysis assistance
    - Website and app training
    - Equipment lending library
    """)

# Call to action
st.markdown("---")
st.markdown("## 🚀 Ready to Make a Difference?")

cta_col1, cta_col2, cta_col3 = st.columns(3)

with cta_col1:
    st.info("""
    **🔬 Start with Data**
    
    Begin by contributing observations and measurements from your area. Every data point helps!
    """)

with cta_col2:
    st.info("""
    **👥 Join the Network**
    
    Connect with local groups and participate in community monitoring initiatives.
    """)

with cta_col3:
    st.info("""
    **📢 Advocate for Change**
    
    Use community data to advocate for policies that improve air quality for everyone.
    """)

st.markdown("""
### 💪 Your Voice Matters

Air quality affects everyone, and community action is one of the most effective ways to drive positive change. 
Whether you contribute a single observation or organize a major campaign, your participation makes a difference.

**Together, we can create cleaner, healthier communities for everyone.**

*Join thousands of community members worldwide who are already making a difference through citizen science and collective action.*
""")
