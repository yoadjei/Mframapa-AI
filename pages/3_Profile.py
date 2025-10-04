import streamlit as st
from datetime import datetime

st.set_page_config(page_title="Profile - Mframapa AI", page_icon="👤", layout="wide")

st.title("👤 Health Profile")

st.markdown("""
Create your personalized health profile to receive customized air quality recommendations and health advice.
Your profile helps us provide more accurate guidance based on your individual risk factors.
""")

# Initialize user profile in session state if not exists
if 'user_profile' not in st.session_state:
    st.session_state.user_profile = {}

# Main profile form
st.markdown("## 📝 Personal Information")

col1, col2 = st.columns(2)

with col1:
    # Age input
    age = st.number_input(
        "Age",
        min_value=1,
        max_value=120,
        value=st.session_state.user_profile.get('age', 30),
        help="Age affects sensitivity to air pollution"
    )
    
    # Gender selection
    gender = st.selectbox(
        "Gender",
        ["Prefer not to say", "Female", "Male", "Other"],
        index=0 if 'gender' not in st.session_state.user_profile else 
              ["Prefer not to say", "Female", "Male", "Other"].index(st.session_state.user_profile.get('gender', "Prefer not to say"))
    )

with col2:
    # Activity level
    activity_options = ["Low", "Moderate", "High", "Very High"]
    saved_activity = st.session_state.user_profile.get('activity_level', "Moderate")
    # Case-insensitive matching
    try:
        activity_index = next(i for i, opt in enumerate(activity_options) if opt.lower() == saved_activity.lower())
    except (StopIteration, AttributeError):
        activity_index = 1  # Default to Moderate
    
    activity_level = st.selectbox(
        "Activity Level",
        activity_options,
        index=activity_index,
        help="Higher activity levels increase exposure to air pollution"
    )
    
    # Occupation type
    occupation = st.selectbox(
        "Work Environment",
        ["Indoor office", "Indoor retail/service", "Outdoor work", "Industrial", "Healthcare", "Education", "Other"],
        index=0 if 'occupation' not in st.session_state.user_profile else
              ["Indoor office", "Indoor retail/service", "Outdoor work", "Industrial", "Healthcare", "Education", "Other"].index(st.session_state.user_profile.get('occupation', "Indoor office")),
        help="Work environment affects daily air quality exposure"
    )

# Health conditions
st.markdown("## 🏥 Health Information")

st.markdown("""
Select any health conditions that apply to you. People with certain conditions are more sensitive to air pollution:
""")

# Health conditions checkboxes
health_conditions = {
    'asthma': 'Asthma',
    'copd': 'COPD (Chronic Obstructive Pulmonary Disease)',
    'heart_disease': 'Heart Disease',
    'diabetes': 'Diabetes',
    'lung_disease': 'Other Lung Disease',
    'pregnancy': 'Pregnancy',
    'immunocompromised': 'Immunocompromised',
    'allergies': 'Severe Allergies',
    'sleep_apnea': 'Sleep Apnea'
}

selected_conditions = []
current_conditions = st.session_state.user_profile.get('conditions', [])

col1, col2, col3 = st.columns(3)

for i, (key, label) in enumerate(health_conditions.items()):
    with [col1, col2, col3][i % 3]:
        if st.checkbox(label, value=key in current_conditions, key=f"condition_{key}"):
            selected_conditions.append(key)

# Medication and sensitivity
st.markdown("## 💊 Additional Health Factors")

col1, col2 = st.columns(2)

with col1:
    takes_medication = st.selectbox(
        "Do you take regular medications?",
        ["No", "Yes - respiratory medications", "Yes - heart medications", "Yes - other medications"],
        index=0 if 'medication' not in st.session_state.user_profile else
              ["No", "Yes - respiratory medications", "Yes - heart medications", "Yes - other medications"].index(st.session_state.user_profile.get('medication', "No"))
    )
    
    pollution_sensitivity = st.select_slider(
        "Air Pollution Sensitivity",
        options=["Not sensitive", "Slightly sensitive", "Moderately sensitive", "Very sensitive", "Extremely sensitive"],
        value=st.session_state.user_profile.get('pollution_sensitivity', "Moderately sensitive"),
        help="How do you typically react to poor air quality days?"
    )

with col2:
    exercise_frequency = st.selectbox(
        "Exercise Frequency",
        ["Never", "Rarely", "1-2 times/week", "3-4 times/week", "5+ times/week", "Daily"],
        index=2 if 'exercise_frequency' not in st.session_state.user_profile else
              ["Never", "Rarely", "1-2 times/week", "3-4 times/week", "5+ times/week", "Daily"].index(st.session_state.user_profile.get('exercise_frequency', "1-2 times/week"))
    )
    
    outdoor_time = st.select_slider(
        "Daily Outdoor Time",
        options=["<1 hour", "1-2 hours", "2-4 hours", "4-6 hours", "6+ hours"],
        value=st.session_state.user_profile.get('outdoor_time', "2-4 hours"),
        help="How much time do you typically spend outdoors per day?"
    )

# Lifestyle factors
st.markdown("## 🏠 Lifestyle & Environment")

col1, col2 = st.columns(2)

with col1:
    home_location = st.selectbox(
        "Home Location Type",
        ["Urban center", "Suburban", "Rural", "Industrial area", "Near highway", "Coastal"],
        index=0 if 'home_location' not in st.session_state.user_profile else
              ["Urban center", "Suburban", "Rural", "Industrial area", "Near highway", "Coastal"].index(st.session_state.user_profile.get('home_location', "Urban center"))
    )
    
    air_purifier = st.selectbox(
        "Air Purifier at Home",
        ["No", "Yes - basic filter", "Yes - HEPA filter", "Yes - multiple units"],
        index=0 if 'air_purifier' not in st.session_state.user_profile else
              ["No", "Yes - basic filter", "Yes - HEPA filter", "Yes - multiple units"].index(st.session_state.user_profile.get('air_purifier', "No"))
    )

with col2:
    smoking_status = st.selectbox(
        "Smoking Status",
        ["Never smoked", "Former smoker", "Occasional smoker", "Regular smoker", "Exposed to secondhand smoke"],
        index=0 if 'smoking' not in st.session_state.user_profile else
              ["Never smoked", "Former smoker", "Occasional smoker", "Regular smoker", "Exposed to secondhand smoke"].index(st.session_state.user_profile.get('smoking', "Never smoked"))
    )
    
    commute_method = st.multiselect(
        "Primary Commute Methods",
        ["Walking", "Cycling", "Car", "Public transit", "Motorcycle", "Work from home"],
        default=st.session_state.user_profile.get('commute_method', ["Car"]),
        help="Select all methods you regularly use"
    )

# Notification preferences
st.markdown("## 🔔 Alert Preferences")

col1, col2 = st.columns(2)

with col1:
    alert_threshold = st.select_slider(
        "Alert Threshold (AQI Level)",
        options=[50, 100, 150, 200, 300],
        value=st.session_state.user_profile.get('alert_threshold', 100),
        help="Get alerts when AQI exceeds this level"
    )
    
    alert_types = st.multiselect(
        "Alert Types",
        ["Health recommendations", "Activity suggestions", "Medication reminders", "Exercise warnings"],
        default=st.session_state.user_profile.get('alert_types', ["Health recommendations", "Activity suggestions"]),
        help="Types of personalized alerts you'd like to receive"
    )

with col2:
    forecast_interest = st.multiselect(
        "Forecast Interests",
        ["Next 6 hours", "Next 24 hours", "Next 48 hours", "Weekly trends", "Seasonal patterns"],
        default=st.session_state.user_profile.get('forecast_interest', ["Next 24 hours", "Next 48 hours"]),
        help="Which forecast periods are most useful for you?"
    )

# Save profile
st.markdown("---")

col1, col2, col3 = st.columns([1, 2, 1])

with col2:
    if st.button("💾 Save Profile", type="primary", use_container_width=True):
        # Update session state with all profile information
        st.session_state.user_profile.update({
            'age': age,
            'gender': gender,
            'activity_level': activity_level.lower(),
            'occupation': occupation,
            'conditions': selected_conditions,
            'medication': takes_medication,
            'pollution_sensitivity': pollution_sensitivity,
            'exercise_frequency': exercise_frequency,
            'outdoor_time': outdoor_time,
            'home_location': home_location,
            'air_purifier': air_purifier,
            'smoking': smoking_status,
            'commute_method': commute_method,
            'alert_threshold': alert_threshold,
            'alert_types': alert_types,
            'forecast_interest': forecast_interest,
            'last_updated': datetime.now().isoformat()
        })
        
        st.success("✅ Profile saved successfully!")
        
        # Show risk assessment
        st.balloons()

# Display current profile summary
if st.session_state.user_profile:
    st.markdown("## 📋 Profile Summary")
    
    profile = st.session_state.user_profile
    
    # Risk assessment
    risk_factors = 0
    
    # Age risk
    if profile.get('age', 30) < 18 or profile.get('age', 30) > 65:
        risk_factors += 1
    
    # Health condition risk
    sensitive_conditions = ['asthma', 'copd', 'heart_disease', 'lung_disease', 'immunocompromised']
    if any(condition in profile.get('conditions', []) for condition in sensitive_conditions):
        risk_factors += 2
    
    # Activity risk
    if profile.get('activity_level') in ['high', 'very high']:
        risk_factors += 1
    
    # Environment risk
    if profile.get('home_location') in ['Urban center', 'Industrial area', 'Near highway']:
        risk_factors += 1
    
    # Smoking risk
    if profile.get('smoking') in ['Occasional smoker', 'Regular smoker', 'Exposed to secondhand smoke']:
        risk_factors += 2
    
    # Determine risk level
    if risk_factors <= 1:
        risk_level = "Low"
        risk_color = "green"
    elif risk_factors <= 3:
        risk_level = "Moderate"
        risk_color = "orange"
    else:
        risk_level = "High"
        risk_color = "red"
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("### 👤 Demographics")
        st.write(f"**Age:** {profile.get('age', 'Not specified')}")
        st.write(f"**Activity Level:** {profile.get('activity_level', 'Not specified').title()}")
        st.write(f"**Work Environment:** {profile.get('occupation', 'Not specified')}")
    
    with col2:
        st.markdown("### 🏥 Health Status")
        conditions = profile.get('conditions', [])
        if conditions:
            condition_names = [health_conditions.get(c, c) for c in conditions]
            st.write(f"**Conditions:** {', '.join(condition_names)}")
        else:
            st.write("**Conditions:** None reported")
        
        st.write(f"**Pollution Sensitivity:** {profile.get('pollution_sensitivity', 'Not specified')}")
    
    with col3:
        st.markdown("### 🎯 Risk Assessment")
        st.markdown(f"**Risk Level:** <span style='color:{risk_color}; font-weight:bold'>{risk_level}</span>", unsafe_allow_html=True)
        st.write(f"**Alert Threshold:** AQI {profile.get('alert_threshold', 100)}")
    
    # Personalized recommendations based on profile
    st.markdown("### 💡 Personalized Recommendations")
    
    recommendations = []
    
    if risk_factors >= 3:
        recommendations.append("🚨 High sensitivity group - monitor air quality daily and limit outdoor activities during poor air quality days")
    
    if 'asthma' in profile.get('conditions', []):
        recommendations.append("💨 Keep rescue inhaler accessible and consider pre-medication before outdoor activities on poor AQI days")
    
    if profile.get('activity_level') in ['high', 'very high']:
        recommendations.append("🏃‍♀️ Plan high-intensity workouts during good air quality periods (morning hours often better)")
    
    if profile.get('age', 30) > 65:
        recommendations.append("👴 Senior-specific care: Pay extra attention to AQI levels above 100 and consult healthcare provider about air quality precautions")
    
    if profile.get('smoking') != 'Never smoked':
        recommendations.append("🚭 Consider smoking cessation resources to reduce cumulative respiratory risk from air pollution")
    
    if not recommendations:
        recommendations.append("✅ Your profile shows low sensitivity to air pollution, but still monitor forecasts for very poor air quality days")
    
    for rec in recommendations:
        st.info(rec)
    
    # Profile actions
    st.markdown("---")
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("🔄 Reset Profile"):
            st.session_state.user_profile = {}
            st.rerun()
    
    with col2:
        last_updated = profile.get('last_updated', 'Never')
        if last_updated != 'Never':
            try:
                update_date = datetime.fromisoformat(last_updated)
                st.caption(f"Last updated: {update_date.strftime('%Y-%m-%d %H:%M')}")
            except:
                st.caption("Last updated: Recently")

else:
    st.info("💡 Complete your profile above to get personalized air quality recommendations!")

# Footer tips
st.markdown("---")
st.markdown("""
### 💡 Profile Tips

- **Be accurate**: More accurate information leads to better personalized recommendations
- **Update regularly**: Health conditions and lifestyle can change over time
- **Privacy**: Your profile is stored locally and never shared
- **Sensitivity**: If you notice symptoms during poor air quality days, consider updating your sensitivity level

**Need help?** Air pollution sensitivity varies greatly between individuals. When in doubt, consult with your healthcare provider about your personal risk factors.
""")
