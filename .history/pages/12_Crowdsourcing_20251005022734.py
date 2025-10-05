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
        "25,000+",
        "Based on PurpleAir network",
        help="Community members actively contributing data (source: PurpleAir)"
    )

with impact_col2:
    st.metric(
        "Data Points Collected",
        "324M+",
        "From OpenAQ",
        help="Total observations from community sensors and reports (source: OpenAQ)"
    )

with impact_col3:
    st.metric(
        "Locations Covered",
        "10,000+",
        "In 68 countries",
        help="Locations with active community monitoring (source: OpenAQ)"
    )

with impact_col4:
    st.metric(
        "Policy Changes",
        "50+",
        "Influenced by community data",
        help="Policy decisions supported by community evidence (estimated from various initiatives like California's AB617)"
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
    
    # Add sample sensor locations with real AQI approximations
    sample_sensors = [
        {"lat": 34.0522, "lon": -118.2437, "city": "Los Angeles", "type": "PurpleAir", "aqi": 50},
        {"lat": 40.7128, "lon": -74.0060, "city": "New York", "type": "AirBeam", "aqi": 40},
        {"lat": 41.8781, "lon": -87.6298, "city": "Chicago", "type": "Clarity Node", "aqi": 55},
        {"lat": 29.7604, "lon": -95.3698, "city": "Houston", "type": "DIY Arduino", "aqi": 60},
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
        st.metric("Active Sensors", "25,000+", "From PurpleAir network")
    
    with network_col2:
        st.metric("Data Reliability", "High", "Calibrated low-cost sensors")
    
    with network_col3:
        st.metric("Geographic Coverage", "Global", "68+ countries via OpenAQ")

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
    
    # Real-inspired recent reports
    sample_reports = [
        {
            'title': 'Air pollution reduction in six mega-cities',
            'location': 'Various Global Cities',
            'type': 'Improvement Suggestion',
            'severity': 'Moderate',
            'date': '2023-12-03',
            'tags': ['Traffic', 'Government', 'Community'],
            'summary': 'Six cities successfully reduced toxic air pollution by as much as 50% through health sector engagement (source: Vital Strategies).'
        },
        {
            'title': "California's Community Air Protection Program",
            'location': 'California, USA',
            'type': 'Policy Feedback',
            'severity': 'High',
            'date': '2024-11-15',
            'tags': ['Industrial', 'Health', 'Government'],
            'summary': 'AB 617 addresses air quality in disadvantaged communities, hailed as transformative (source: UC Davis Environmental Health).'
        },
        {
            'title': 'Community-led air quality improvements in UK',
            'location': 'United Kingdom',
            'type': 'Health Impact',
            'severity': 'High',
            'date': 'Recent',
            'tags': ['Community', 'Policy', 'Health'],
            'summary': 'Activists raised awareness and influenced policy changes to improve air quality (source: Clean Air Fund).'
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
        
        # Real-inspired ongoing actions
        active_actions = [
            {
                'title': 'Detroit Anti-Idling Campaign',
                'organizer': 'Local Neighbors Group',
                'location': 'Detroit, USA',
                'date': 'Ongoing',
                'participants': 500,
                'description': 'Campaign to reduce vehicle idling and improve air quality at community level (source: TriplePundit).',
                'how_to_join': 'Pledge to shut off engines when parked and spread awareness.',
                'impact': 'Aims to reduce local emissions significantly.'
            },
            {
                'title': 'Clean Air Action Call',
                'organizer': 'WHO and Partners',
                'location': 'Global',
                'date': '2025-03-17',
                'participants': 50000000,
                'description': 'Nearly 50 million people signed up for clean air action for better health (source: WHO).',
                'how_to_join': 'Sign the petition and participate in local events.',
                'impact': 'Pushes for global air quality improvements.'
            },
            {
                'title': 'Air Quality Awareness Week',
                'organizer': 'US EPA',
                'location': 'USA',
                'date': 'Annual',
                'participants': 10000,
                'description': 'Highlights resources to increase air quality awareness (source: EPA).',
                'how_to_join': 'Participate in events and stay aware of air quality.',
                'impact': 'Encourages public engagement in monitoring.'
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
                'campaign': 'Clean Air 2025 Action Plan',
                'target': 'Global Governments',
                'supporters': 50000000,
                'goal': 100000000,
                'deadline': '2025-12-31',
                'status': 'In Progress',
                'description': 'Action plan for air quality management to reduce urban and industrial pollution (source: CCAC).'
            },
            {
                'campaign': 'New Year Cleaner Air To-Do List',
                'target': 'Governments and Businesses',
                'supporters': 10000,
                'goal': 50000,
                'deadline': '2025-12-31',
                'status': 'In Progress',
                'description': 'Six actions to tackle air pollution in 2025 (source: Clean Air Fund).'
            },
            {
                'campaign': 'State of the Air 2025 Advocacy',
                'target': 'US Policymakers',
                'supporters': 200000,
                'goal': 500000,
                'deadline': 'Ongoing',
                'status': 'In Progress',
                'description': 'Addressing exposure to unhealthy air for half of US population (source: American Lung Association).'
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
    st.markdown("### 🌟 Top Contributors/Projects")
    
    top_contributors = [
        {"name": "West Oakland Environmental Indicators Project", "contributions": "Established Program", "type": "Community Monitoring", "points": "High Impact"},
        {"name": "Citizen Science in Nairobi/Addis Ababa", "contributions": "Health-Focused", "type": "Air Pollution Projects", "points": "Community Driven"},
        {"name": "EPA Participatory Science Projects", "contributions": "Multiple Grants", "type": "Air Quality Monitoring", "points": "National Scale"},
        {"name": "EPIC Awards Recipients", "contributions": "12 Projects", "type": "Data Access Improvement", "points": "Innovative"},
        {"name": "Ports Primer Citizen Science", "contributions": "Public Engagement", "type": "Research Efforts", "points": "Collaborative"}
    ]
    
    for i, contributor in enumerate(top_contributors, 1):
        if i <= 3:
            medal = ["🥇", "🥈", "🥉"][i-1]
        else:
            medal = f"{i}."
        
        st.write(f"{medal} **{contributor['name']}** - {contributor['contributions']} ({contributor['points']})")
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
        "Six Cities Reduce Pollution by 50% - Global Mega-Cities",
        "California's AB617 - Community Air Protection",
        "UK Community-Led Policy Changes - Clean Air Fund",
        "EPA Clean Air Act Accomplishments - USA"
    ]
)

if "Six Cities" in success_story:
    st.markdown("""
    ### 🌍 Six Cities Successfully Reduce Toxic Air Pollution By As Much As 50%
    
    **Challenge**: High levels of air pollution in mega-cities affecting public health.
    
    **Community Action**: 
    - Health sector engagement in climate crisis response
    - Replicable solutions implemented across cities
    
    **Result**: 
    - Up to 50% reduction in toxic air pollution
    - Highlighted in COP28 publication
    
    **Timeline**: Recent years (source: Vital Strategies)
    """)
elif "California" in success_story:
    st.markdown("""
    ### 🇺🇸 California's Community Air Protection Policy
    
    **Challenge**: Disadvantaged communities facing poor air quality.
    
    **Community Action**: 
    - Assembly Bill 617 implementation
    - Community monitoring and protection efforts
    
    **Result**: 
    - Transformative effort to protect health
    - Improved air quality in vulnerable areas
    
    **Timeline**: Since 2017 (source: UC Davis)
    """)
elif "UK Community" in success_story:
    st.markdown("""
    ### 🇬🇧 UK Community-Led Air Quality Improvements
    
    **Challenge**: Public awareness and policy gaps in air pollution.
    
    **Community Action**: 
    - Activists raising awareness
    - Influencing policy changes
    
    **Result**: 
    - Improved air quality through new policies
    - Better public health outcomes
    
    **Timeline**: Ongoing (source: Clean Air Fund)
    """)
elif "EPA Clean Air" in success_story:
    st.markdown("""
    ### 🇺🇸 EPA Accomplishments in Reducing Air Pollution
    
    **Challenge**: Nationwide air pollution since 1970.
    
    **Community Action**: 
    - Over 40 years of clean air policies
    - Community and regulatory efforts
    
    **Result**: 
    - Significant improvements in air quality
    - Better health for Americans and environment
    
    **Timeline**: 1970-Present (source: EPA)
    """)

# Resources and support
st.markdown("---")
st.markdown("## 📚 Resources & Support")

resource_col1, resource_col2 = st.columns(2)

with resource_col1:
    st.markdown("""
    ### 🛠️ Tools & Guides
    
    **Getting Started**
    - [Resource Guide for Air Sensors (EPA)](https://www.epa.gov/air-sensor-toolbox/resource-guide-air-sensors-and-related-educational-activities)
    - [Air Quality Monitoring Guidebook (CCAC)](https://www.ccacoalition.org/resources/air-quality-monitoring-and-data-management-guidebook-states-gulf-cooperation-council)
    - [Quality Assurance Handbook (EPA)](https://www.epa.gov/sites/default/files/2020-10/documents/final_handbook_document_1_17.pdf)
    - [WHO Air Quality Guidelines](https://www.c40knowledgehub.org/s/topic/0TO1Q0000001lRTWAY/monitoring-and-assessment-of-air-quality?language=en_US)
    
    **Advanced Resources**
    - [Community-Based Air Quality Monitoring Framework (Georgetown Climate)](https://www.georgetownclimate.org/adaptation/toolkits/community-based-air-quality-monitoring-toolkit/2-6-equipment-needed.html)
    - [Air Quality Monitoring Resources Hub (Clarity)](https://www.clarity.io/air-quality-monitoring-resources)
    - [Air Sensor Toolbox (EPA)](https://www.epa.gov/air-sensor-toolbox)
    - [NASA Air Quality Data](https://www.earthdata.nasa.gov/topics/atmosphere/air-quality)
    """)

with resource_col2:
    st.markdown("""
    ### 🤝 Community Support
    
    **Connect with Others**
    - Participatory Science Air Projects (EPA)
    - Citizen Science Projects (NASA)
    - Local environmental groups directory
    - Monthly virtual community meetings
    
    **Technical Support**
    - Sensor troubleshooting resources (PurpleAir Community)
    - Data analysis assistance (OpenAQ Docs)
    - Equipment lending programs (EPA)
    - Expert consultations via forums
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