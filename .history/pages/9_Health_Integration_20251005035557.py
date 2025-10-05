import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
from utils import get_aqi_category, get_health_recommendation

st.set_page_config(page_title="Health Integration - Mframapa AI", page_icon="🏥", layout="wide")

st.title("🏥 Health Impact & Medical Integration")

st.markdown("""
Comprehensive health impact analysis linking air quality forecasts to health outcomes, 
medical research, and healthcare system integration. Understanding the health implications 
of air pollution helps individuals and healthcare providers make informed decisions.
""")

# Health dashboard overview
st.markdown("## 🩺 Health Impact Dashboard")

health_col1, health_col2, health_col3, health_col4 = st.columns(4)

with health_col1:
    st.metric(
        "Daily Preventable Deaths",
        "19,000",
        "↓ 12% vs 2019",
        help="WHO estimate of daily deaths from air pollution worldwide"
    )

with health_col2:
    st.metric(
        "Healthcare Costs",
        "$2.9T USD/year",
        "Global economic burden",
        help="Annual global healthcare costs attributable to air pollution"
    )

with health_col3:
    st.metric(
        "Life Years Lost",
        "147M years",
        "Annual global impact",
        help="Disability-adjusted life years lost to air pollution annually"
    )

with health_col4:
    st.metric(
        "Children at Risk",
        "1.7B",
        "Worldwide exposure",
        help="Children living in areas exceeding WHO air quality guidelines"
    )

# Health conditions and air quality
st.markdown("## 🫁 Health Conditions & Air Quality Impacts")

condition_tab1, condition_tab2, condition_tab3, condition_tab4 = st.tabs(["🫁 Respiratory", "❤️ Cardiovascular", "🧠 Neurological", "🤰 Pregnancy & Children"])

with condition_tab1:
    st.markdown("### Respiratory Health Impacts")
    
    resp_col1, resp_col2 = st.columns(2)
    
    with resp_col1:
        st.markdown("""
        **🫁 Asthma:**
        - 25M Americans affected by air pollution triggers
        - PM2.5 increases attack risk by 19% per 10 μg/m³
        - O₃ triggers afternoon attacks in summer
        - Emergency department visits spike on high AQI days
        
        **🦠 COPD (Chronic Obstructive Pulmonary Disease):**
        - 15.7M diagnosed cases in US alone
        - NO₂ exposure accelerates lung function decline
        - Exacerbations increase 2.5x on high pollution days
        - Long-term PM2.5 exposure increases COPD risk 20%
        
        **🫀 Lung Cancer:**
        - PM2.5 classified as Group 1 carcinogen by WHO
        - 10 μg/m³ increase = 9% higher lung cancer risk
        - NO₂ associated with adenocarcinoma subtype
        - Radon + air pollution shows synergistic effects
        """)
    
    with resp_col2:
        # Respiratory condition risk by AQI
        aqi_ranges = ['0-50', '51-100', '101-150', '151-200', '201+']
        asthma_risk = [1.0, 1.2, 1.5, 2.1, 2.8]  # Relative risk multipliers
        copd_risk = [1.0, 1.3, 1.8, 2.4, 3.2]
        
        fig = go.Figure()
        fig.add_trace(go.Bar(x=aqi_ranges, y=asthma_risk, name='Asthma Attack Risk', 
                           marker_color='lightblue'))
        fig.add_trace(go.Bar(x=aqi_ranges, y=copd_risk, name='COPD Exacerbation Risk',
                           marker_color='darkblue'))
        
        fig.update_layout(
            title='Respiratory Risk by AQI Level (Relative Risk)',
            xaxis_title='AQI Range',
            yaxis_title='Risk Multiplier',
            height=400,
            barmode='group'
        )
        st.plotly_chart(fig, use_container_width=True)
    
    st.info("""
    **🔬 Latest Research Findings:**
    - Long-COVID symptoms worsen with air pollution exposure
    - PM2.5 reduces lung function development in children
    - Ultrafine particles (<0.1μm) show strongest respiratory effects
    - Indoor air pollution from cooking affects 2.6 billion people globally
    """)

with condition_tab2:
    st.markdown("### Cardiovascular Health Impacts")
    
    cardio_col1, cardio_col2 = st.columns(2)
    
    with cardio_col1:
        st.markdown("""
        **💔 Heart Disease:**
        - Leading cause of air pollution deaths (58%)
        - PM2.5 triggers heart attacks within hours
        - 10 μg/m³ PM2.5 increase = 10% higher heart attack risk
        - Vulnerable: elderly, diabetes, hypertension
        
        **🧠 Stroke:**
        - 2nd leading cause of air pollution deaths (18%)
        - NO₂ associated with ischemic stroke
        - Long-term exposure increases stroke risk 14%
        - Hemorrhagic stroke linked to coarse particles
        
        **🩸 Blood Pressure & Circulation:**
        - PM2.5 increases systolic BP by 1-3 mmHg
        - Endothelial dysfunction from ultrafine particles
        - Accelerated atherosclerosis in polluted areas
        - Arrhythmias triggered by air pollution spikes
        """)
    
    with cardio_col2:
        # Cardiovascular risk timeline after pollution exposure
        hours_after = [1, 6, 12, 24, 48, 72, 168]  # 1 hour to 1 week
        heart_attack_risk = [1.8, 1.5, 1.3, 1.2, 1.1, 1.05, 1.0]
        stroke_risk = [1.2, 1.4, 1.3, 1.2, 1.15, 1.1, 1.0]
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=hours_after, y=heart_attack_risk, mode='lines+markers',
                               name='Heart Attack Risk', line=dict(color='red')))
        fig.add_trace(go.Scatter(x=hours_after, y=stroke_risk, mode='lines+markers',
                               name='Stroke Risk', line=dict(color='purple')))
        
        fig.update_layout(
            title='Cardiovascular Risk Timeline After Pollution Exposure',
            xaxis_title='Hours After Exposure',
            yaxis_title='Relative Risk',
            xaxis_type='log',
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)

with condition_tab3:
    st.markdown("### Neurological Health Impacts")
    
    neuro_col1, neuro_col2 = st.columns(2)
    
    with neuro_col1:
        st.markdown("""
        **🧠 Cognitive Function:**
        - PM2.5 linked to faster cognitive decline
        - Children: reduced IQ and academic performance
        - Adults: memory and attention deficits
        - Alzheimer's risk increases 92% with high PM2.5
        
        **🧒 Neurodevelopment:**
        - Prenatal exposure affects brain development
        - Autism spectrum disorder risk increased
        - ADHD diagnosis higher in polluted areas
        - Learning disabilities more common
        
        **😔 Mental Health:**
        - Depression rates 27% higher in polluted cities
        - Anxiety disorders linked to NO₂ exposure
        - Suicide rates correlate with PM2.5 levels
        - Stress hormone elevation from air pollution
        """)
    
    with neuro_col2:
        # Age-specific cognitive impact
        age_groups = ['Children\n(5-17)', 'Young Adults\n(18-39)', 'Middle Age\n(40-64)', 'Seniors\n(65+)']
        cognitive_impact = [2.5, 1.2, 1.8, 3.2]  # Relative impact scores
        colors = ['lightgreen', 'yellow', 'orange', 'red']
        
        fig = px.bar(x=age_groups, y=cognitive_impact, 
                    title='Cognitive Impact of Air Pollution by Age Group',
                    labels={'x': 'Age Group', 'y': 'Impact Score'},
                    color=cognitive_impact, color_continuous_scale='Reds')
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

with condition_tab4:
    st.markdown("### Pregnancy & Children's Health")
    
    preg_col1, preg_col2 = st.columns(2)
    
    with preg_col1:
        st.markdown("""
        **🤰 Pregnancy Outcomes:**
        - Low birth weight: 10% increase per 10 μg/m³ PM2.5
        - Preterm birth: 16% higher risk with NO₂ exposure
        - Stillbirth risk doubled with high pollution
        - Gestational diabetes increases with air pollution
        
        **👶 Infant & Child Health:**
        - Sudden infant death syndrome (SIDS) risk increased
        - Childhood asthma: 40% higher in polluted areas
        - Growth retardation and reduced lung development
        - Immune system dysfunction
        
        **🧬 Long-term Development:**
        - Epigenetic changes from early exposure
        - Lifelong increased disease susceptibility
        - Reduced life expectancy from childhood exposure
        - Intergenerational health effects documented
        """)
    
    with preg_col2:
        # Pregnancy outcomes by trimester exposure
        trimesters = ['1st Trimester', '2nd Trimester', '3rd Trimester']
        low_birth_weight = [15, 12, 18]  # % increase in risk
        preterm_birth = [12, 8, 22]
        
        fig = go.Figure()
        fig.add_trace(go.Bar(x=trimesters, y=low_birth_weight, name='Low Birth Weight (%)', 
                           marker_color='lightpink'))
        fig.add_trace(go.Bar(x=trimesters, y=preterm_birth, name='Preterm Birth (%)',
                           marker_color='#C71585'))  # Fixed color
        
        fig.update_layout(
            title='Pregnancy Risk by Trimester of PM2.5 Exposure',
            yaxis_title='Risk Increase (%)',
            height=400,
            barmode='group'
        )
        st.plotly_chart(fig, use_container_width=True)

# Personalized health assessment
st.markdown("## 👤 Personalized Health Risk Assessment")

# Get user profile if available
user_profile = st.session_state.get('user_profile', {})

if user_profile:
    st.markdown("### 📋 Your Health Profile Analysis")
    
    # Calculate personal risk factors
    risk_factors = []
    risk_score = 0
    
    age = user_profile.get('age', 30)
    conditions = user_profile.get('conditions', [])
    activity_level = user_profile.get('activity_level', 'moderate')
    
    # Age-based risk
    if age < 18:
        risk_factors.append("Age under 18 - Higher sensitivity to air pollution")
        risk_score += 2
    elif age > 65:
        risk_factors.append("Age over 65 - Increased cardiovascular and respiratory risk")
        risk_score += 3
    
    # Condition-based risk
    high_risk_conditions = ['asthma', 'copd', 'heart_disease', 'diabetes']
    for condition in conditions:
        if condition in high_risk_conditions:
            condition_names = {
                'asthma': 'Asthma',
                'copd': 'COPD', 
                'heart_disease': 'Heart Disease',
                'diabetes': 'Diabetes'
            }
            risk_factors.append(f"{condition_names[condition]} - Increased sensitivity to air pollution")
            risk_score += 3
    
    # Activity-based risk
    if activity_level in ['high', 'very high']:
        risk_factors.append("High activity level - Greater air pollution exposure during exercise")
        risk_score += 1
    
    # Display risk assessment
    assessment_col1, assessment_col2 = st.columns(2)
    
    with assessment_col1:
        if risk_score <= 2:
            st.success(f"**🟢 Low Risk Profile** (Score: {risk_score})")
            st.write("You have low sensitivity to air pollution effects.")
        elif risk_score <= 5:
            st.warning(f"**🟡 Moderate Risk Profile** (Score: {risk_score})")
            st.write("You should monitor air quality and take precautions during poor air days.")
        else:
            st.error(f"**🔴 High Risk Profile** (Score: {risk_score})")
            st.write("You are at high risk from air pollution. Take protective measures seriously.")
        
        if risk_factors:
            st.markdown("**Your Risk Factors:**")
            for factor in risk_factors:
                st.write(f"• {factor}")
    
    with assessment_col2:
        # Personalized AQI thresholds
        if risk_score <= 2:
            safe_aqi = 100
            caution_aqi = 150
            avoid_aqi = 200
        elif risk_score <= 5:
            safe_aqi = 75
            caution_aqi = 100
            avoid_aqi = 150
        else:
            safe_aqi = 50
            caution_aqi = 75
            avoid_aqi = 100
        
        st.markdown("**Your Personalized AQI Thresholds:**")
        st.success(f"🟢 Safe for all activities: AQI ≤ {safe_aqi}")
        st.warning(f"🟡 Take precautions: AQI {safe_aqi+1}-{caution_aqi}")
        st.error(f"🔴 Avoid outdoor activities: AQI > {avoid_aqi}")

else:
    st.info("📝 Complete your health profile in the **Profile** page to get personalized health risk assessment.")

# Healthcare system integration
st.markdown("## 🏥 Healthcare System Integration")

healthcare_col1, healthcare_col2 = st.columns(2)

with healthcare_col1:
    st.markdown("""
    ### 📊 Clinical Decision Support
    
    **Emergency Departments:**
    - Real-time AQI alerts for staff
    - Pollution-related symptom protocols
    - Capacity planning for high pollution days
    - Medication adjustment recommendations
    
    **Primary Care:**
    - Patient-specific air quality counseling
    - Medication timing optimization
    - Activity restriction guidance
    - Preventive care scheduling
    
    **Chronic Disease Management:**
    - Pollution-aware care plans
    - Symptom tracking integration
    - Medication adherence monitoring
    - Specialist referral triggers
    """)

with healthcare_col2:
    st.markdown("""
    ### 📱 Digital Health Integration
    
    **Electronic Health Records (EHR):**
    - Air quality data integration
    - Environmental exposure tracking
    - Risk stratification algorithms
    - Outcome correlation analysis
    
    **Mobile Health Apps:**
    - Personal exposure monitoring
    - Symptom tracking and alerts
    - Medication reminders
    - Healthcare provider communication
    
    **Telemedicine:**
    - Remote monitoring of high-risk patients
    - Virtual consultations during high pollution
    - Home air quality assessments
    - Patient education and counseling
    """)

# Medical research integration
st.markdown("## 🔬 Medical Research & Evidence")

research_tab1, research_tab2, research_tab3 = st.tabs(["📊 Epidemiological Studies", "🧬 Biological Mechanisms", "💊 Clinical Interventions"])

with research_tab1:
    st.markdown("### Large-Scale Epidemiological Studies")
    
    study_col1, study_col2 = st.columns(2)
    
    with study_col1:
        st.markdown("""
        **Major Cohort Studies:**
        
        **Harvard Six Cities Study**
        - 8,111 participants, 16-year follow-up
        - PM2.5 reduction of 10 μg/m³ = 27% mortality reduction
        - Established causal link between PM and mortality
        
        **American Cancer Society CPS-II**
        - 1.2 million participants, 30+ years
        - Long-term PM2.5 exposure and lung cancer risk
        - Cardiovascular mortality association
        
        **UK Biobank**
        - 500,000 participants
        - Genetic susceptibility to air pollution
        - Neurological and cognitive effects
        """)
    
    with study_col2:
        # Meta-analysis results visualization
        studies = ['Mortality\n(50+ studies)', 'Heart Disease\n(30+ studies)', 'Stroke\n(25+ studies)', 
                  'Lung Cancer\n(20+ studies)', 'Cognitive\n(15+ studies)']
        risk_per_10ug = [1.06, 1.11, 1.14, 1.09, 1.12]  # Relative risk per 10 μg/m³ PM2.5
        
        fig = px.bar(x=studies, y=risk_per_10ug,
                    title='Health Risk per 10 μg/m³ PM2.5 Increase\n(Meta-analysis Results)',
                    labels={'x': 'Health Outcome', 'y': 'Relative Risk'})
        fig.add_hline(y=1.0, line_dash="dash", annotation_text="No Effect")
        fig.update_layout(height=400)
        st.plotly_chart(fig, use_container_width=True)

with research_tab2:
    st.markdown("### Biological Mechanisms")
    
    mechanism_col1, mechanism_col2 = st.columns(2)
    
    with mechanism_col1:
        st.markdown("""
        **🫁 Respiratory System:**
        - Direct lung tissue damage
        - Inflammation and oxidative stress
        - Impaired lung function and development
        - Increased susceptibility to infections
        
        **❤️ Cardiovascular System:**
        - Systemic inflammation
        - Blood coagulation changes
        - Endothelial dysfunction
        - Autonomic nervous system imbalance
        
        **🧠 Central Nervous System:**
        - Blood-brain barrier disruption
        - Neuroinflammation
        - Oxidative damage to brain tissue
        - Neurotransmitter system effects
        """)
    
    with mechanism_col2:
        st.markdown("""
        **🔬 Cellular Level Effects:**
        - DNA damage and mutations
        - Epigenetic modifications
        - Mitochondrial dysfunction
        - Cell death pathways activation
        
        **🧬 Molecular Pathways:**
        - NF-κB inflammatory signaling
        - Aryl hydrocarbon receptor activation
        - Oxidative stress pathways
        - Immune system dysregulation
        
        **⚖️ Dose-Response Relationships:**
        - No safe threshold for PM2.5
        - Linear associations at low concentrations
        - Vulnerable population susceptibility
        - Cumulative lifetime exposure effects
        """)

with research_tab3:
    st.markdown("### Clinical Interventions & Protection")
    
    intervention_col1, intervention_col2 = st.columns(2)
    
    with intervention_col1:
        st.markdown("""
        **💊 Pharmacological Interventions:**
        
        **Anti-inflammatory Medications:**
        - Statins reduce cardiovascular risk from PM2.5
        - Antioxidants (limited evidence)
        - Omega-3 fatty acids protective effects
        - Inhaled corticosteroids for asthma
        
        **Preventive Medications:**
        - ACE inhibitors for cardiovascular protection
        - Beta-agonists timing for asthmatics
        - Antiplatelet therapy in high-risk patients
        - Vitamin supplements (mixed evidence)
        """)
    
    with intervention_col2:
        st.markdown("""
        **🛡️ Non-Pharmacological Interventions:**
        
        **Personal Protection:**
        - N95/N99 masks (80-95% filtration)
        - Indoor air purifiers (HEPA filters)
        - Timing of outdoor activities
        - Exercise location selection
        
        **Lifestyle Modifications:**
        - Mediterranean diet anti-inflammatory
        - Regular exercise (indoors when needed)
        - Smoking cessation critical
        - Stress reduction techniques
        """)
    
    # Intervention effectiveness
    interventions = ['N95 Masks', 'HEPA Filters', 'Statins', 'Timing Exercise', 'Diet Changes']
    effectiveness = [85, 70, 25, 40, 30]  # % reduction in health impact
    
    fig = px.bar(x=interventions, y=effectiveness,
                title='Effectiveness of Health Protection Interventions',
                labels={'x': 'Intervention', 'y': 'Risk Reduction (%)'},
                color=effectiveness, color_continuous_scale='Greens')
    fig.update_layout(height=300)
    st.plotly_chart(fig, use_container_width=True)

# Health advisory system
st.markdown("## ⚠️ Personalized Health Advisory System")

if st.session_state.get('selected_city'):
    city = st.session_state.selected_city
    
    # Simulate current AQI (in production, would get from forecast page)
    current_aqi = np.random.randint(40, 180)  # Random AQI for demonstration
    
    st.markdown(f"### 🏙️ Current Health Advisory for {city}")
    
    # Get health recommendation
    health_advice = get_health_recommendation(current_aqi, user_profile)
    
    advisory_col1, advisory_col2 = st.columns(2)
    
    with advisory_col1:
        category = health_advice['category']
        color = health_advice['color']
        
        st.markdown(f"""
        **Current AQI**: {current_aqi}
        
        **Category**: <span style='color: {color}; font-weight: bold;'>{category}</span>
        """, unsafe_allow_html=True)
        
        recommendations = health_advice['recommendations']
        st.info(recommendations['general'])
    
    with advisory_col2:
        st.markdown("**Specific Recommendations:**")
        st.write(f"🏃‍♀️ **Activities**: {recommendations['activities']}")
        st.write(f"⚠️ **Precautions**: {recommendations['precautions']}")
        
        # Additional health-specific advice
        if user_profile and any(condition in user_profile.get('conditions', []) for condition in ['asthma', 'copd']):
            st.warning("🫁 **Respiratory Condition Alert**: Keep rescue medications accessible. Consider pre-medication before going outdoors.")
        
        if user_profile and user_profile.get('age', 30) > 65:
            st.warning("👴 **Senior Health**: Monitor for shortness of breath, chest pain, or unusual fatigue. Consult healthcare provider if symptoms worsen.")

else:
    st.info("📍 Select a city on the Home page to get location-specific health advisories.")

# Healthcare provider resources
st.markdown("## 👨‍⚕️ Resources for Healthcare Providers")

provider_col1, provider_col2 = st.columns(2)

with provider_col1:
    st.markdown("""
    ### 📋 Clinical Guidelines
    
    **Patient Assessment:**
    - Environmental exposure history
    - Air pollution sensitivity evaluation
    - Risk factor identification
    - Baseline symptom documentation
    
    **Treatment Modifications:**
    - Medication timing optimization
    - Dosage adjustments for high pollution days
    - Preventive medication initiation
    - Emergency action plan updates
    """)

with provider_col2:
    st.markdown("""
    ### 🔗 Professional Resources
    
    **Medical Literature:**
    - Latest research on air pollution health effects
    - Clinical practice guidelines
    - Case studies and treatment protocols
    - Continuing medical education materials
    
    **Decision Support Tools:**
    - Risk calculators and assessment tools
    - Patient education materials
    - Air quality monitoring integration
    - Telemedicine protocols
    """)

# Call to action
st.markdown("---")
st.markdown("## 📞 Take Action for Your Health")

action_col1, action_col2, action_col3 = st.columns(3)

with action_col1:
    st.info("""
    **👤 Individuals**
    
    - Complete your health profile
    - Monitor daily air quality forecasts
    - Follow personalized recommendations
    - Discuss air pollution with your doctor
    """)

with action_col2:
    st.info("""
    **👨‍⚕️ Healthcare Providers**
    
    - Integrate air quality into patient care
    - Use clinical decision support tools
    - Educate patients about air pollution risks
    - Advocate for cleaner air policies
    """)

with action_col3:
    st.info("""
    **🏥 Health Systems**
    
    - Implement air quality monitoring
    - Train staff on pollution health effects
    - Develop surge capacity plans
    - Partner with environmental agencies
    """)

st.markdown("""
### 📚 Additional Health Resources

- **American Lung Association**: Air quality and lung health information
- **EPA AirNow**: Official US government air quality information  
- **WHO Air Quality Guidelines**: Global health-based air quality recommendations
- **CDC Air Pollution**: Health effects and protective measures

*Health integration features are based on peer-reviewed medical research and clinical guidelines. Always consult healthcare providers for personalized medical advice.*
""")
