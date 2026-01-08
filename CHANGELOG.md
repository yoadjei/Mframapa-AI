# changelog

all notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-08

### added
- xgboost pm2.5 prediction model (r² = 0.73)
- 28 language support with pre-translated health insights
- real-time satellite data integration (sentinel-5p, open-meteo)
- aws ec2 backend deployment with ssl
- vercel frontend with custom domain (mframapaai.health)
- responsive mobile-first design

### infrastructure
- nginx reverse proxy with rate limiting
- systemd service for 24/7 uptime
- let's encrypt ssl auto-renewal
