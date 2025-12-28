# 🌍 Mframapa AI: The Sentinel of African Air Quality

**Mframapa AI** (Akan for "Wind Map") is a next-generation environmental intelligence platform designed specifically for the African continent. It combines satellite telemetry, ground station data, and advanced machine learning to provide hyper-local, real-time air quality forecasts (PM2.5) for any location in Africa.

![Mframapa AI Dashboard](https://via.placeholder.com/1200x600?text=Mframapa+AI+Dashboard)

## 🚀 Features

*   **Orbital Landing Interface**: A cinematic, 3D globe visualization starting from space.
*   **Hyper-Local Precision**: "Fly-to" navigation that zooms from continent-level down to city streets.
*   **Hybrid AI Engine**: Uses XGBoost optimized for T4 GPUs with a fallback CPU loader for massive datasets.
*   **Afro-Futurist UI**: A premium, "Glassmorphism" interface designed with warm earth tones and high accessibility.
*   **Social Integration**: One-click sharing of health reports to **WhatsApp** for community awareness.

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Mapbox GL JS (Globe Projection).
*   **Backend**: Python, FastAPI, RAPIDS (cuDF/cuPy), XGBoost.
*   **Data**: Sentinel-5P (Precursor), OpenAQ, NASA GEOS-CF.

## ⚡ Quick Start

### Prerequisites
*   Node.js v18+
*   Python 3.10+
*   NVIDIA GPU (Recommended for Training)

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```
*Server runs at: http://localhost:8000*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*App runs at: http://localhost:5173*

## 🔮 The Vision
Mframapa AI aims to democratize access to clean air data, empowering millions of Africans to make informed health decisions daily.

---
*Built by Yo Adjei*
