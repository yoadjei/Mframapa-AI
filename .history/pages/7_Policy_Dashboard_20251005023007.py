import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

st.set_page_config(page_title="Policy Dashboard - Mframapa AI", page_icon="🏛️", layout="wide")

st.title("🏛️ Air Quality Policy & Regulation Dashboard")

st.markdown("""
Understanding air quality regulations, policy impacts, and compliance tracking across different regions. 
This dashboard helps policymakers, researchers, and citizens understand how regulations affect air quality.
""")

# Policy overview section
st.markdown("## 📜 Global Air Quality Standards")

standards_tab1, standards_tab2, standards_tab3 = st.tabs(["🌍 WHO Guidelines", "🇺🇸 US EPA Standards", "📊 Regional Comparisons"])

with standards_tab1:
    st.markdown("### World Health Organization (WHO) Air Quality Guidelines")
    
    who_col1, who_col2 = st.columns(2)
    
    with who_col1:
        st.markdown("""
        **WHO 2021 Guidelines (μg/m³):**
        
        | Pollutant | Annual | 24-hour |
        |-----------|--------|---------|
        | PM2.5 | 5 | 15 |
        | PM10 | 15 | 45 |
        | NO₂ | 10 | 25 |
        | O₃ | - | 100* |
        
        *8-hour average during peak season
        """)
    
    with who_col2:
        st.markdown("""
        **2021 Guidelines Updates:**
        
        - PM2.5 annual limit reduced from 10 to 5 μg/m³
        - NO₂ annual limit reduced from 40 to 10 μg/m³
        - New interim targets established for gradual improvement
        - Guidelines now based on latest health evidence
        
        **Key Changes:**
        - More stringent than previous 2005 guidelines
        - Recognition of health impacts at lower concentrations
        - Emphasis on no safe threshold for PM2.5
        """)
    
    st.info("""
    **📊 WHO Guideline Compliance Worldwide:**
    - Only 7% of cities worldwide meet WHO PM2.5 annual guidelines
    - 93% of global population lives in areas exceeding WHO PM2.5 limits
    - Low- and middle-income countries most affected
    """)

with standards_tab2:
    st.markdown("### United States EPA National Ambient Air Quality Standards (NAAQS)")
    
    epa_data = {
        'Pollutant': ['PM2.5', 'PM10', 'O₃', 'NO₂', 'SO₂', 'CO', 'Pb'],
        'Primary Standard': ['12 μg/m³ (annual)', '150 μg/m³ (24-hr)', '0.070 ppm (8-hr)', 
                           '0.053 ppm (annual)', '0.075 ppm (1-hr)', '9 ppm (8-hr)', '0.15 μg/m³ (3-mo)'],
        'Secondary Standard': ['15 μg/m³ (annual)', '150 μg/m³ (24-hr)', '0.070 ppm (8-hr)',
                             '0.053 ppm (annual)', '-', '-', '0.15 μg/m³ (3-mo)'],
        'Last Updated': ['2012', '2006', '2015', '2010', '2010', '1971', '2008']
    }
    
    epa_df = pd.DataFrame(epa_data)
    st.dataframe(epa_df, use_container_width=True)
    
    st.markdown("""
    **Standard Types:**
    - **Primary Standards**: Protect public health, including sensitive populations
    - **Secondary Standards**: Protect public welfare (crops, vegetation, buildings, etc.)
    
    **Attainment Status:**
    - Areas meeting standards: "Attainment"
    - Areas not meeting standards: "Nonattainment" (subject to additional requirements)
    """)

with standards_tab3:
    st.markdown("### Regional Air Quality Standards Comparison")
    
    # Comparative standards chart
    regions = ['WHO 2021', 'US EPA', 'EU', 'China', 'India', 'Japan']
    pm25_annual = [5, 12, 20, 35, 40, 15]
    no2_annual = [10, 53, 40, 40, 40, 40]  # Converting units for comparison
    
    fig = go.Figure()
    fig.add_trace(go.Bar(name='PM2.5 Annual', x=regions, y=pm25_annual, marker_color='red'))
    fig.add_trace(go.Bar(name='NO₂ Annual', x=regions, y=no2_annual, marker_color='blue', yaxis='y2'))
    
    fig.update_layout(
        title='Air Quality Standards Comparison (Annual Limits)',
        xaxis_title='Region/Organization',
        yaxis_title='PM2.5 (μg/m³)',
        yaxis2=dict(title='NO₂ (ppb)', overlaying='y', side='right'),
        height=400
    )
    st.plotly_chart(fig, use_container_width=True)
    
    st.warning("""
    **Key Observations:**
    - WHO guidelines are the most stringent
    - Significant variation between countries
    - Many developing countries have less strict standards
    - Trend toward tightening standards over time
    """)

# Policy impact analysis
st.markdown("## 📈 Policy Impact Analysis")

impact_tab1, impact_tab2, impact_tab3 = st.tabs(["🚗 Transportation Policies", "🏭 Industrial Regulations", "🏙️ Urban Planning"])

with impact_tab1:
    st.markdown("### Transportation Policy Impacts")
    
    transport_col1, transport_col2 = st.columns(2)
    
    with transport_col1:
        st.markdown("""
        **Effective Transportation Policies:**
        
        **🚌 Public Transit Investment**
        - Average NO₂ reduction: 15-25%
        - Best practices: BRT systems, electric buses
        - Example: Bogotá BRT reduced CO by 40%
        
        **🚗 Low Emission Zones (LEZ)**
        - PM2.5 reduction: 10-20% in urban centers
        - NO₂ reduction: 20-40%
        - 200+ cities worldwide have LEZ programs
        
        **⚡ Electric Vehicle Incentives**
        - Long-term NO₂ and PM2.5 benefits
        - Effectiveness depends on electricity grid mix
        - Norway: 80% EV sales share by 2022
        """)
    
    with transport_col2:
        # Transportation policy timeline
        policy_years = [2010, 2012, 2014, 2016, 2018, 2020, 2022, 2024]
        no2_reduction = [0, 5, 8, 12, 18, 25, 32, 35]  # Cumulative reduction %
        
        fig = px.line(x=policy_years, y=no2_reduction, 
                     title='Cumulative NO₂ Reduction from Transport Policies',
                     labels={'x': 'Year', 'y': 'NO₂ Reduction (%)'})
        fig.add_annotation(x=2016, y=12, text="LEZ Implementation", showarrow=True)
        fig.add_annotation(x=2020, y=25, text="EV Incentives", showarrow=True)
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    st.success("""
    **Success Story: London's ULEZ**
    - Ultra Low Emission Zone expanded in 2021
    - 44% reduction in NO₂ concentrations in central London
    - 27% reduction in PM2.5 concentrations
    - £200M annual health benefits estimated
    """)

with impact_tab2:
    st.markdown("### Industrial Regulation Effectiveness")
    
    industrial_col1, industrial_col2 = st.columns(2)
    
    with industrial_col1:
        st.markdown("""
        **Key Industrial Regulations:**
        
        **🏭 Emission Standards**
        - Best Available Technology (BAT) requirements
        - Continuous emission monitoring
        - Regular facility inspections and reporting
        
        **🌍 International Agreements**
        - Paris Climate Agreement
        - Montreal Protocol (ozone protection)
        - Gothenburg Protocol (air pollution)
        
        **💰 Economic Instruments**
        - Carbon pricing and cap-and-trade
        - Pollution taxes and fees
        - Emission trading systems
        """)
    
    with industrial_col2:
        # Industrial emissions trend
        sectors = ['Power Generation', 'Manufacturing', 'Chemical Industry', 'Steel Production', 'Cement']
        reduction_2010_2020 = [45, 25, 35, 30, 20]  # % reduction over decade
        
        fig = px.bar(x=reduction_2010_2020, y=sectors, orientation='h',
                    title='Industrial Emission Reductions (2010-2020)',
                    labels={'x': 'Emission Reduction (%)', 'y': 'Sector'})
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)
    
    st.info("""
    **Regulatory Challenges:**
    - Enforcement in developing countries
    - Cross-border pollution issues  
    - Balancing economic growth with environmental protection
    - Technology transfer and capacity building needs
    """)

with impact_tab3:
    st.markdown("### Urban Planning and Air Quality")
    
    urban_col1, urban_col2 = st.columns(2)
    
    with urban_col1:
        st.markdown("""
        **Urban Planning Strategies:**
        
        **🌳 Green Infrastructure**
        - Urban forests: 10-20% PM reduction
        - Green corridors and parks
        - Rooftop gardens and green walls
        
        **🏘️ Mixed-Use Development**
        - Reduces commuting distances
        - Promotes walking and cycling
        - Decreases vehicle dependency
        
        **🌬️ Urban Ventilation**
        - Building height and spacing optimization
        - Wind corridor preservation
        - Pollution dispersion modeling
        """)
    
    with urban_col2:
        # Green space vs air quality
        green_space_percent = [5, 10, 15, 20, 25, 30, 35, 40]
        pm25_concentration = [65, 58, 52, 47, 43, 40, 37, 35]
        
        fig = px.scatter(x=green_space_percent, y=pm25_concentration,
                        title='Green Space vs PM2.5 Concentration',
                        labels={'x': 'Green Space (%)', 'y': 'PM2.5 (μg/m³)'})
        
        # Add trendline
        z = np.polyfit(green_space_percent, pm25_concentration, 1)
        p = np.poly1d(z)
        fig.add_trace(go.Scatter(x=green_space_percent, y=p(green_space_percent),
                               mode='lines', name='Trend'))
        fig.update_layout(height=300)
        st.plotly_chart(fig, use_container_width=True)

# Compliance monitoring
st.markdown("## 📊 Compliance Monitoring & Enforcement")

compliance_col1, compliance_col2 = st.columns(2)

with compliance_col1:
    st.markdown("""
    ### 🎯 Current Compliance Status
    
    **Based on latest available data:**
    """)
    
    # Compliance data by region (example data)
    regions = ['North America', 'Europe', 'East Asia', 'South Asia', 'Africa', 'Latin America']
    pm25_compliance = [75, 45, 25, 15, 20, 35]  # % of population in compliant areas
    no2_compliance = [85, 70, 40, 30, 50, 60]
    
    compliance_df = pd.DataFrame({
        'Region': regions,
        'PM2.5 Compliance (%)': pm25_compliance,
        'NO₂ Compliance (%)': no2_compliance
    })
    
    fig = px.bar(compliance_df, x='Region', y=['PM2.5 Compliance (%)', 'NO₂ Compliance (%)'],
                title='Air Quality Standard Compliance by Region',
                barmode='group')
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)

with compliance_col2:
    st.markdown("""
    ### 🔍 Enforcement Mechanisms
    
    **Monitoring Systems:**
    - Real-time air quality networks
    - Satellite-based compliance monitoring
    - Industrial emission reporting systems
    - Mobile monitoring units
    
    **Enforcement Actions:**
    - Financial penalties and fines
    - Facility shutdowns and restrictions
    - Legal action and court orders
    - Public disclosure and naming
    
    **Challenges:**
    - Limited monitoring infrastructure
    - Insufficient enforcement capacity
    - Political and economic pressures
    - Cross-jurisdictional issues
    """)

# Policy recommendations
st.markdown("## 💡 Policy Recommendations")

st.markdown("""
Based on satellite data analysis and international best practices, key policy recommendations include:
""")

rec_col1, rec_col2, rec_col3 = st.columns(3)

with rec_col1:
    st.success("""
    **🚀 Short-term Actions (1-2 years)**
    
    - Strengthen monitoring networks
    - Implement vehicle emission standards
    - Enhance industrial reporting requirements
    - Emergency action plans for high pollution events
    - Public awareness campaigns
    """)

with rec_col2:
    st.info("""
    **🔄 Medium-term Goals (3-5 years)**
    
    - Low emission zones in major cities
    - Clean energy transition incentives
    - Green building standards
    - Public transit infrastructure investment
    - Regional cooperation agreements
    """)

with rec_col3:
    st.warning("""
    **🌟 Long-term Vision (5+ years)**
    
    - Achieve WHO guideline compliance
    - Net-zero emission targets
    - Circular economy implementation
    - Climate-air quality co-benefits
    - Global technology transfer programs
    """)

# Regional focus sections
st.markdown("## 🌍 Regional Policy Focus")

regional_tab1, regional_tab2 = st.tabs(["🇺🇸 North America", "🇬🇭 West Africa"])

with regional_tab1:
    st.markdown("### North America: Advanced Monitoring & Regulation")
    
    na_col1, na_col2 = st.columns(2)
    
    with na_col1:
        st.markdown("""
        **Current Strengths:**
        - Comprehensive monitoring networks
        - TEMPO satellite provides high-resolution data
        - Strong regulatory frameworks (EPA NAAQS)
        - Cross-border cooperation (US-Canada)
        
        **Key Challenges:**
        - Wildfire smoke management
        - Environmental justice issues
        - Interstate transport of pollution
        - Climate change adaptation
        """)
    
    with na_col2:
        st.markdown("""
        **Policy Priorities:**
        - Wildfire smoke protection strategies
        - Environmental justice improvements
        - Electric vehicle infrastructure
        - Building electrification programs
        - Green recovery post-pandemic
        
        **Innovation Opportunities:**
        - AI-powered compliance monitoring
        - Real-time emission controls
        - Community-based monitoring
        - Satellite data integration
        """)

with regional_tab2:
    st.markdown("### West Africa: Building Monitoring Infrastructure")
    
    wa_col1, wa_col2 = st.columns(2)
    
    with wa_col1:
        st.markdown("""
        **Current Situation:**
        - Limited ground-based monitoring
        - Rapid urbanization and industrialization
        - Seasonal dust pollution from Sahara
        - Biomass burning for cooking/heating
        
        **Infrastructure Needs:**
        - Air quality monitoring networks
        - Emission inventory development
        - Technical capacity building
        - Regional coordination mechanisms
        """)
    
    with wa_col2:
        st.markdown("""
        **Policy Opportunities:**
        - Leverage satellite data (MERRA-2) for monitoring
        - Regional dust storm early warning systems
        - Clean cooking fuel transitions
        - Urban planning for air quality
        - International development partnerships
        
        **Immediate Actions:**
        - National air quality standards
        - Vehicle emission standards
        - Industrial permitting systems
        - Public health preparedness
        """)

# Data integration and satellite monitoring
st.markdown("## 🛰️ Satellite Data for Policy Support")

satellite_col1, satellite_col2 = st.columns(2)

with satellite_col1:
    st.markdown("""
    ### How Satellite Data Supports Policy
    
    **🔍 Compliance Monitoring:**
    - Independent verification of emission reductions
    - Detection of unauthorized emissions
    - Cross-border pollution tracking
    - Long-term trend analysis
    
    **📊 Policy Evaluation:**
    - Before/after policy impact assessment
    - Regional comparison studies
    - Cost-effectiveness analysis
    - Unintended consequences detection
    """)

with satellite_col2:
    st.markdown("""
    ### Mframapa AI Policy Applications
    
    **🎯 For Policymakers:**
    - Real-time compliance dashboards
    - Policy impact forecasting
    - Public health risk assessment
    - Environmental justice analysis
    
    **📈 For Researchers:**
    - Historical trend analysis
    - Policy effectiveness studies
    - Health impact quantification
    - Economic cost-benefit analysis
    """)

# Call to action
st.markdown("---")
st.markdown("## 📞 Take Action")

action_col1, action_col2, action_col3 = st.columns(3)

with action_col1:
    st.info("""
    **🏛️ Policymakers**
    
    - Use satellite data for evidence-based policy
    - Implement graduated compliance measures
    - Invest in monitoring infrastructure
    - Foster regional cooperation
    """)

with action_col2:
    st.info("""
    **👥 Civil Society**
    
    - Advocate for stronger standards
    - Support monitoring transparency  
    - Participate in public consultations
    - Hold governments accountable
    """)

with action_col3:
    st.info("""
    **🏢 Private Sector**
    
    - Adopt voluntary emission reductions
    - Invest in clean technologies
    - Support monitoring initiatives
    - Engage in policy dialogue
    """)

st.markdown("""
### 📚 Additional Resources

- **WHO Air Quality Guidelines**: Latest health-based recommendations
- **EPA NAAQS**: US air quality standards and attainment status
- **UNEP Air Quality Reports**: Global and regional air quality assessments
- **Satellite Data Portals**: NASA Worldview, Copernicus Atmosphere Monitoring

*This dashboard is updated regularly with new policy developments and compliance data.*
""")
