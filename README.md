# mframapa ai

**v1.0** - production release

building air quality intelligence for africa where ground sensors don't exist.

**[live site](https://mframapaai.health)** | **[view architecture](mframapa_architecture.drawio.png)**

## why this exists
ground-level monitoring stations are expensive and sparse across africa. we can't manage what we can't measure. this tool uses satellite data to fill the gaps, providing free, accurate air quality estimates for any coordinate on the continent.

## features
- **satellite-based prediction**: uses real-time sentinel-5p satellite data (no physical hardware needed).
- **live inference**: xgboost model predicts pm2.5 levels instantly based on atmospheric gases and weather (r² score: 0.73).
- **28 languages**: native support for major african languages (french, arabic, twi, swahili, yoruba, amharic, etc) so insights are actually accessible.
- **health context**: translates raw numbers (aqi) into actionable health advice.
- **responsive**: works on low-bandwidth mobile connections.

## what we used & why
- **sentinel-5p (esa)**: free, daily global coverage of atmospheric pollutants (no2, aod). foundation of our data.
- **xgboost**: handles tabular satellite/weather features efficiently. simpler to deploy and uses less ram than deep learning.
- **fastapi (python)**: high performance, easy async satellite fetching.
- **react + vite**: super fast loading times, essential for users with slower internet.
- **gemini flash 2.0**: used to pre-translate comprehensive health insights contextually, avoiding slow runtime api calls.
- **aws ec2**: reliable compute for holding the model in memory.

## maintenance
- **model retraining**: monthly (first week of each month)
- **satellite data refresh**: real-time on each request
- **ssl renewal**: automatic via certbot

## status
live in production.
- backend: aws ec2
- frontend: vercel
- ssl: active

