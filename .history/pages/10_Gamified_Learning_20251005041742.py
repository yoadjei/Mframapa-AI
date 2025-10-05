import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import random
from datetime import datetime, timedelta
from utils import get_aqi_category, calculate_aqi_from_components

st.set_page_config(page_title="Gamified Learning - Mframapa AI", page_icon="🎮", layout="wide")

st.title("🎮 Gamified Air Quality Learning")

st.markdown("""
Learn about air quality through interactive games, quizzes, and challenges. 
Understanding air pollution helps you make better decisions for your health and environment.
""")

# Initialize game state
if 'game_stats' not in st.session_state:
    st.session_state.game_stats = {
        'total_points': 0,
        'quiz_scores': [],
        'challenges_completed': 0,
        'streak_days': 0,
        'badges_earned': [],
        'level': 1
    }

# User progress overview
st.markdown("## 🏆 Your Learning Progress")

progress_col1, progress_col2, progress_col3, progress_col4 = st.columns(4)

with progress_col1:
    st.metric(
        "Total Points",
        st.session_state.game_stats['total_points'],
        help="Points earned from quizzes and challenges"
    )

with progress_col2:
    level = st.session_state.game_stats['level']
    next_level_points = level * 100
    st.metric(
        f"Level {level}",
        f"{st.session_state.game_stats['total_points'] % 100}/100",
        help=f"Points to next level: {next_level_points - st.session_state.game_stats['total_points']}"
    )

with progress_col3:
    st.metric(
        "Quiz Average",
        f"{np.mean(st.session_state.game_stats['quiz_scores']):.1f}%" if st.session_state.game_stats['quiz_scores'] else "0%",
        help="Average quiz score percentage"
    )

with progress_col4:
    st.metric(
        "Badges Earned",
        len(st.session_state.game_stats['badges_earned']),
        help="Special achievements unlocked"
    )

# Progress bar for current level
current_level_progress = st.session_state.game_stats['total_points'] % 100
st.progress(current_level_progress / 100, text=f"Level {level} Progress: {current_level_progress}/100 points")

# Main learning activities
st.markdown("## 🎯 Learning Activities")

activity_tab1, activity_tab2, activity_tab3, activity_tab4 = st.tabs(["📝 Quiz Zone", "🏃‍♀️ Daily Challenges", "🎲 Interactive Games", "🏅 Achievements"])

with activity_tab1:
    st.markdown("### 📝 Air Quality Knowledge Quiz")
    
    # Quiz selection
    quiz_topics = [
        "Air Quality Basics",
        "Health Effects", 
        "Pollution Sources",
        "Protection Methods",
        "Global Patterns",
        "Satellite Data"
    ]
    
    selected_topic = st.selectbox("Choose quiz topic:", quiz_topics)
    difficulty = st.selectbox("Select difficulty:", ["Beginner", "Intermediate", "Advanced"])
    
    if st.button("🚀 Start Quiz", type="primary"):
        # Generate quiz questions based on topic and difficulty
        if selected_topic == "Air Quality Basics":
            questions = [
                {
                    "question": "What does PM2.5 refer to?",
                    "options": [
                        "Particles with diameter less than 2.5 micrometers",
                        "Pollution measured 2.5 times per day",
                        "Air quality index of 25",
                        "Particles larger than 2.5 millimeters"
                    ],
                    "correct": 0,
                    "explanation": "PM2.5 refers to fine particulate matter with diameter less than 2.5 micrometers - about 30 times smaller than the width of human hair."
                },
                {
                    "question": "Which AQI range is considered 'Good' air quality?",
                    "options": ["0-50", "51-100", "101-150", "151-200"],
                    "correct": 0,
                    "explanation": "AQI 0-50 is considered 'Good' - air quality is satisfactory and poses little or no health risk."
                },
                {
                    "question": "What is the primary source of ground-level ozone?",
                    "options": [
                        "Direct emissions from cars",
                        "Natural atmospheric ozone",
                        "Chemical reactions involving sunlight",
                        "Industrial smokestacks"
                    ],
                    "correct": 2,
                    "explanation": "Ground-level ozone forms when nitrogen oxides and volatile organic compounds react in sunlight - it's not directly emitted."
                }
            ]
        elif selected_topic == "Health Effects":
            questions = [
                {
                    "question": "Which age group is most vulnerable to air pollution?",
                    "options": ["Young adults (18-30)", "Middle-aged (30-50)", "Children and elderly", "Teenagers (13-19)"],
                    "correct": 2,
                    "explanation": "Children and elderly are most vulnerable due to developing/declining immune systems and respiratory function."
                },
                {
                    "question": "Air pollution is linked to which of these health conditions?",
                    "options": ["Heart disease", "Stroke", "Lung cancer", "All of the above"],
                    "correct": 3,
                    "explanation": "Air pollution is linked to numerous health conditions including cardiovascular disease, stroke, cancer, and respiratory illnesses."
                }
            ]
        else:
            questions = [
                {
                    "question": f"Sample {selected_topic.lower()} question",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct": 0,
                    "explanation": "This is a sample question for demonstration."
                }
            ]
        
        # Store questions in session state
        st.session_state.current_quiz = questions
        st.session_state.quiz_started = True
        st.session_state.current_question = 0
        st.session_state.quiz_score = 0
        st.session_state.quiz_answers = []
        st.rerun()
    
    # Display quiz if started
    if st.session_state.get('quiz_started', False):
        questions = st.session_state.current_quiz
        current_q = st.session_state.current_question
        
        if current_q < len(questions):
            question_data = questions[current_q]
            
            st.markdown(f"### Question {current_q + 1} of {len(questions)}")
            st.markdown(f"**{question_data['question']}**")
            
            # Display options as radio buttons
            answer = st.radio(
                "Select your answer:",
                question_data['options'],
                key=f"quiz_q_{current_q}"
            )
            
            col1, col2 = st.columns([1, 4])
            
            with col1:
                if st.button("Submit Answer"):
                    selected_index = question_data['options'].index(answer)
                    is_correct = selected_index == question_data['correct']
                    
                    st.session_state.quiz_answers.append({
                        'question': question_data['question'],
                        'selected': answer,
                        'correct': question_data['options'][question_data['correct']],
                        'is_correct': is_correct,
                        'explanation': question_data['explanation']
                    })
                    
                    if is_correct:
                        st.session_state.quiz_score += 1
                        st.success("✅ Correct!")
                    else:
                        st.error("❌ Incorrect")
                    
                    st.info(f"**Explanation:** {question_data['explanation']}")
                    
                    st.session_state.current_question += 1
                    
                    if st.session_state.current_question >= len(questions):
                        # Quiz completed
                        score_percentage = (st.session_state.quiz_score / len(questions)) * 100
                        points_earned = int(score_percentage / 10) * 10  # 10 points per 10%
                        
                        st.session_state.game_stats['quiz_scores'].append(score_percentage)
                        st.session_state.game_stats['total_points'] += points_earned
                        
                        # Check for level up
                        new_level = (st.session_state.game_stats['total_points'] // 100) + 1
                        if new_level > st.session_state.game_stats['level']:
                            st.session_state.game_stats['level'] = new_level
                            st.balloons()
                            st.success(f"🎉 Level Up! You're now level {new_level}!")
                        
                        # Check for badges
                        if score_percentage == 100 and "Perfect Quiz" not in st.session_state.game_stats['badges_earned']:
                            st.session_state.game_stats['badges_earned'].append("Perfect Quiz")
                            st.success("🏅 Badge Earned: Perfect Quiz!")
                    
                    st.rerun()
        else:
            # Show quiz results
            st.markdown("### 🎉 Quiz Complete!")
            score_percentage = (st.session_state.quiz_score / len(questions)) * 100
            points_earned = int(score_percentage / 10) * 10
            
            result_col1, result_col2 = st.columns(2)
            
            with result_col1:
                st.metric("Your Score", f"{st.session_state.quiz_score}/{len(questions)}")
                st.metric("Percentage", f"{score_percentage:.1f}%")
                st.metric("Points Earned", points_earned)
            
            with result_col2:
                if score_percentage >= 90:
                    st.success("🌟 Excellent! You're an air quality expert!")
                elif score_percentage >= 70:
                    st.info("👍 Good job! Keep learning!")
                else:
                    st.warning("📚 Keep studying - you'll get it next time!")
            
            if st.button("🔄 Take Another Quiz"):
                # Reset quiz state
                for key in ['quiz_started', 'current_quiz', 'current_question', 'quiz_score', 'quiz_answers']:
                    if key in st.session_state:
                        del st.session_state[key]
                st.rerun()

with activity_tab2:
    st.markdown("### 🏃‍♀️ Daily Challenges")
    
    # Generate daily challenge based on date
    today = datetime.now().date()
    random.seed(str(today))  # Consistent challenge per day
    
    challenges = [
        {
            "title": "🌬️ Wind Direction Detective",
            "description": "Use weather data to predict how pollution will move in your city today.",
            "task": "Check wind direction and speed, then predict which areas will have better/worse air quality.",
            "points": 20,
            "type": "prediction"
        },
        {
            "title": "🚗 Transport Mode Challenge", 
            "description": "Calculate the air quality impact of different transportation choices.",
            "task": "Compare the pollution impact of driving vs. public transit vs. cycling for a 5km trip.",
            "points": 15,
            "type": "calculation"
        },
        {
            "title": "🌡️ Temperature-Ozone Connection",
            "description": "Explore the relationship between temperature and ozone formation.",
            "task": "Find the correlation between daily temperature and ozone levels in your area.",
            "points": 25,
            "type": "analysis"
        },
        {
            "title": "🏠 Indoor Air Quality Audit",
            "description": "Assess and improve your indoor air quality.",
            "task": "Identify 3 sources of indoor air pollution in your home and suggest improvements.",
            "points": 30,
            "type": "action"
        }
    ]
    
    daily_challenge = random.choice(challenges)
    
    st.markdown(f"### Today's Challenge: {daily_challenge['title']}")
    st.markdown(daily_challenge['description'])
    
    challenge_col1, challenge_col2 = st.columns([2, 1])
    
    with challenge_col1:
        st.info(f"**Task:** {daily_challenge['task']}")
        
        # Challenge completion interface
        if daily_challenge['type'] == 'prediction':
            st.markdown("**Make your prediction:**")
            wind_direction = st.selectbox("Current wind direction:", ["North", "South", "East", "West", "Northeast", "Northwest", "Southeast", "Southwest"])
            wind_speed = st.slider("Wind speed (km/h):", 0, 50, 10)
            
            prediction = st.text_area("Describe how you think pollution will move and which areas will be affected:")
            
        elif daily_challenge['type'] == 'calculation':
            st.markdown("**Transportation Analysis:**")
            car_emissions = st.number_input("Car CO2 emissions (g/km):", value=120)
            bus_emissions = st.number_input("Bus CO2 emissions per person (g/km):", value=40)
            
            calculation = st.text_area("Explain your calculation for the 5km trip:")
            
        else:  # analysis or action
            response = st.text_area("Describe your findings or actions:")
    
    with challenge_col2:
        st.metric("Points Available", daily_challenge['points'])
        
        if st.button("Complete Challenge", type="primary"):
            # Award points
            st.session_state.game_stats['total_points'] += daily_challenge['points']
            st.session_state.game_stats['challenges_completed'] += 1
            
            st.success(f"🎉 Challenge completed! You earned {daily_challenge['points']} points!")
            
            # Check for streak badge
            if st.session_state.game_stats['challenges_completed'] >= 7:
                if "Challenge Streak" not in st.session_state.game_stats['badges_earned']:
                    st.session_state.game_stats['badges_earned'].append("Challenge Streak")
                    st.success("🏅 Badge Earned: Challenge Streak!")
            
            st.balloons()
    
    st.markdown("---")
    st.markdown("### 📅 Previous Challenges")
    st.info("Complete daily challenges to build your streak and earn bonus points!")

with activity_tab3:
    st.markdown("### 🎲 Interactive Air Quality Games")
    
    game_choice = st.selectbox(
        "Choose a game:",
        ["🎯 AQI Guessing Game", "🌍 Pollution Source Matching", "📊 Data Detective", "🏃‍♀️ Health Decision Simulator"]
    )
    
    if game_choice == "🎯 AQI Guessing Game":
        st.markdown("#### Guess the AQI")
        st.markdown("Look at the pollution levels and guess the AQI value!")
        
        # Generate random pollution scenario
        if st.button("🎲 Generate New Scenario"):
            pm25 = random.randint(5, 150)
            o3 = random.randint(20, 120)
            no2 = random.randint(10, 80)
            
            st.session_state.game_scenario = {
                'pm25': pm25,
                'o3': o3, 
                'no2': no2
            }
        
        if 'game_scenario' in st.session_state:
            scenario = st.session_state.game_scenario
            
            st.markdown("**Pollution Levels:**")
            st.write(f"PM2.5: {scenario['pm25']} μg/m³")
            st.write(f"O₃: {scenario['o3']} ppb")
            st.write(f"NO₂: {scenario['no2']} ppb")
            
            user_guess = st.slider("Your AQI guess:", 0, 300, 100)
            
            if st.button("Submit Guess"):
                # Calculate actual AQI
                aqi_data = calculate_aqi_from_components(scenario['pm25'], scenario['o3'], scenario['no2'])
                actual_aqi = aqi_data.get('Overall', 0)
                
                difference = abs(user_guess - actual_aqi)
                
                if difference <= 10:
                    st.success(f"🎉 Excellent! Actual AQI: {actual_aqi}. You were within 10 points!")
                    points = 25
                elif difference <= 25:
                    st.info(f"👍 Good! Actual AQI: {actual_aqi}. You were within 25 points!")
                    points = 15
                else:
                    st.warning(f"📚 Keep practicing! Actual AQI: {actual_aqi}. Difference: {difference} points")
                    points = 5
                
                st.session_state.game_stats['total_points'] += points
                category, color = get_aqi_category(actual_aqi)
                st.markdown(f"Category: <span style='color: {color}; font-weight: bold;'>{category}</span>", unsafe_allow_html=True)
    
    elif game_choice == "🌍 Pollution Source Matching":
        st.markdown("#### Match Pollutants to Their Main Sources")
        
        pollutants = ["PM2.5", "NO₂", "O₃", "SO₂"]
        sources = ["Vehicle exhaust", "Photochemical reactions", "Coal power plants", "Road dust and combustion"]
        correct_matches = [3, 0, 1, 2]  # Correct indices
        
        st.markdown("**Match each pollutant with its primary source:**")
        
        matches = {}
        for i, pollutant in enumerate(pollutants):
            matches[pollutant] = st.selectbox(f"{pollutant} primarily comes from:", sources, key=f"match_{i}")
        
        if st.button("Check Matches"):
            score = 0
            for i, pollutant in enumerate(pollutants):
                if sources.index(matches[pollutant]) == correct_matches[i]:
                    score += 1
                    st.success(f"✅ {pollutant}: Correct!")
                else:
                    correct_source = sources[correct_matches[i]]
                    st.error(f"❌ {pollutant}: Correct answer is {correct_source}")
            
            points = score * 10
            st.session_state.game_stats['total_points'] += points
            st.info(f"You scored {score}/4 correct! Earned {points} points.")
    
    elif game_choice == "📊 Data Detective":
        st.markdown("#### Analyze Air Quality Patterns")
        st.markdown("Look at this data pattern and identify the likely cause!")
        
        # Generate sample pattern
        hours = list(range(24))
        if st.button("🔍 Generate Mystery Pattern"):
            pattern_type = random.choice(['traffic', 'photochemical', 'industrial'])
            
            if pattern_type == 'traffic':
                # Rush hour pattern
                values = [30 + 20*np.exp(-((h-8)**2)/8) + 15*np.exp(-((h-17)**2)/8) + random.randint(-5,5) for h in hours]
                st.session_state.pattern_data = {'values': values, 'type': 'traffic', 'answer': 'Vehicle traffic (rush hour peaks)'}
            elif pattern_type == 'photochemical':
                # Afternoon ozone peak
                values = [20 + 30*np.exp(-((h-14)**2)/20) + random.randint(-3,3) for h in hours] 
                st.session_state.pattern_data = {'values': values, 'type': 'photochemical', 'answer': 'Photochemical ozone formation (afternoon peak)'}
            else:
                # Industrial pattern
                values = [40 + 10*random.random() if 6 <= h <= 22 else 20 + 5*random.random() for h in hours]
                st.session_state.pattern_data = {'values': values, 'type': 'industrial', 'answer': 'Industrial emissions (daytime operations)'}
        
        if 'pattern_data' in st.session_state:
            data = st.session_state.pattern_data
            
            fig = px.line(x=hours, y=data['values'], title="Mystery Pollution Pattern",
                         labels={'x': 'Hour of Day', 'y': 'Concentration'})
            st.plotly_chart(fig, use_container_width=True)
            
            user_answer = st.selectbox("What's causing this pattern?", [
                "Vehicle traffic (rush hour peaks)",
                "Photochemical ozone formation (afternoon peak)", 
                "Industrial emissions (daytime operations)",
                "Residential heating (evening peak)"
            ])
            
            if st.button("Submit Analysis"):
                if user_answer == data['answer']:
                    st.success("🎯 Correct! You're a data detective!")
                    st.session_state.game_stats['total_points'] += 30
                else:
                    st.error(f"❌ Incorrect. The answer is: {data['answer']}")
                    st.session_state.game_stats['total_points'] += 10

with activity_tab4:
    st.markdown("### 🏅 Achievements & Badges")
    
    # Display earned badges
    if st.session_state.game_stats['badges_earned']:
        st.markdown("#### 🏆 Your Badges")
        
        badge_descriptions = {
            "Perfect Quiz": "🥇 Scored 100% on a quiz",
            "Challenge Streak": "🔥 Completed 7 daily challenges", 
            "Data Expert": "📊 Analyzed 10 pollution patterns",
            "Health Guardian": "🛡️ Made 50 health-conscious decisions",
            "Pollution Detective": "🔍 Identified 25 pollution sources",
            "Learning Enthusiast": "📚 Completed 20 learning activities"
        }
        
        cols = st.columns(3)
        for i, badge in enumerate(st.session_state.game_stats['badges_earned']):
            with cols[i % 3]:
                st.success(f"{badge}")
                if badge in badge_descriptions:
                    st.caption(badge_descriptions[badge])
    
    else:
        st.info("Complete activities to earn badges!")
    
    # Available badges to earn
    st.markdown("#### 🎯 Badges to Earn")
    
    all_badges = [
        ("Perfect Quiz", "🥇", "Score 100% on any quiz"),
        ("Challenge Streak", "🔥", "Complete 7 daily challenges"),
        ("Data Expert", "📊", "Analyze 10 pollution patterns correctly"),
        ("Health Guardian", "🛡️", "Make 50 health-conscious decisions"),
        ("Pollution Detective", "🔍", "Identify 25 pollution sources correctly"),
        ("Learning Enthusiast", "📚", "Complete 20 different learning activities"),
        ("Environmental Advocate", "🌱", "Share 10 air quality tips"),
        ("Global Explorer", "🌍", "Learn about air quality in 15 different cities")
    ]
    
    badge_col1, badge_col2 = st.columns(2)
    
    for i, (name, emoji, description) in enumerate(all_badges):
        col = badge_col1 if i % 2 == 0 else badge_col2
        
        with col:
            if name in st.session_state.game_stats['badges_earned']:
                st.success(f"{emoji} {name} ✅")
            else:
                st.info(f"{emoji} {name}")
            st.caption(description)

# Leaderboard (simulated)
st.markdown("## 🏆 Global Leaderboard")

leaderboard_data = [
    {"Rank": 1, "Player": "AirQualityExpert", "Points": 2450, "Level": 25, "Badges": 8},
    {"Rank": 2, "Player": "CleanAirChampion", "Points": 2180, "Level": 22, "Badges": 7},
    {"Rank": 3, "Player": "PollutionDetective", "Points": 1920, "Level": 20, "Badges": 6},
    {"Rank": 4, "Player": "HealthGuardian", "Points": 1756, "Level": 18, "Badges": 5},
    {"Rank": 5, "Player": "EcoWarrior", "Points": 1634, "Level": 17, "Badges": 4},
    {"Rank": "...", "Player": "You", "Points": st.session_state.game_stats['total_points'], 
     "Level": st.session_state.game_stats['level'], "Badges": len(st.session_state.game_stats['badges_earned'])}
]

leaderboard_df = pd.DataFrame(leaderboard_data)
st.dataframe(leaderboard_df, use_container_width=True)

# Learning resources
st.markdown("## 📚 Learning Resources")

resource_col1, resource_col2 = st.columns(2)

with resource_col1:
    st.markdown("""
    ### 📖 Quick Facts
    
    **Did You Know?**
    - The average person breathes 20,000 times per day
    - Air pollution causes more deaths than malaria and AIDS combined
    - Indoor air can be 2-5x more polluted than outdoor air
    - Plants can help reduce indoor air pollution by 10-25%
    - Walking or cycling instead of driving for short trips can reduce your pollution exposure
    """)

with resource_col2:
    st.markdown("""
    ### 🎓 Study Tips
    
    **Master Air Quality Knowledge:**
    - Start with basic concepts before advanced topics
    - Practice AQI calculations with real data
    - Learn to read satellite imagery and weather patterns
    - Understand health impacts for different populations
    - Study successful pollution reduction policies
    """)

# Progress encouragement
if st.session_state.game_stats['total_points'] > 0:
    st.markdown("---")
    st.markdown("## 🌟 Keep Learning!")
    
    if st.session_state.game_stats['total_points'] < 100:
        st.info("🚀 You're just getting started! Complete more activities to level up.")
    elif st.session_state.game_stats['total_points'] < 500:
        st.success("👍 Great progress! You're building solid air quality knowledge.")
    else:
        st.success("🏆 You're becoming an air quality expert! Keep up the excellent work.")
    
    # Motivational progress bar
    points_to_next_milestone = 100 - (st.session_state.game_stats['total_points'] % 100)
    if points_to_next_milestone < 100:
        st.info(f"💪 Only {points_to_next_milestone} points until your next level!")

st.markdown("""
---
### 🎯 Learning Goals

- **Understand**: Basic air quality concepts and health impacts
- **Analyze**: Real air quality data and patterns
- **Apply**: Knowledge to make healthier daily decisions
- **Advocate**: Share air quality awareness with others

*Learning about air quality empowers you to protect yourself and your community!*
""")