# 🔐 Mframapa AI: Real Data Setup Guide (Strict)

**To run this project without synthetic data, you MUST sign up for these 4 services.**
*We do not use fake data. If you don't provide these keys, the system will error out.*

---

## 1. NASA Earthdata (For Historical Training Data) 🛰️
*   **Purpose:** Downloading historical MERRA-2 (Dust) and TROPOMI (NO2) data to train the AI.
*   **Sign Up:** [https://urs.earthdata.nasa.gov/users/new](https://urs.earthdata.nasa.gov/users/new)
*   **Action:**
    1.  Create an account.
    2.  Go to "My Profile" -> "Generate Token" (or just use your password in the script).
    3.  **Required Config (.env or Script):**
        *   `EARTHDATA_USERNAME`
        *   `EARTHDATA_PASSWORD`

## 2. Sentinel Hub (For Real-Time Satellite Feeds) ⚡
*   **Purpose:** Fetching live pollution tiles (NO2, Aerosols) for the App interface. NASA's direct API is too slow for a live web app; Sentinel Hub is the industry standard wrapper.
*   **Sign Up:** [https://www.sentinel-hub.com/trialf](https://www.sentinel-hub.com/trialf) (Start a Trial or Dev Account).
*   **Action:**
    1.  Go to Dashboard -> User Settings -> OAuth Clients.
    2.  Create a Client.
    3.  **Required Config (.env):**
        *   `SH_CLIENT_ID`
        *   `SH_CLIENT_SECRET`

## 3. Mapbox (For the 3D Globe) 🗺️
*   **Purpose:** Rendering the 3D interactive map of Africa in the React Frontend.
*   **Sign Up:** [https://account.mapbox.com/auth/signup/](https://account.mapbox.com/auth/signup/)
*   **Action:**
    1.  Copy your "Default Public Token".
    2.  **Required Config (frontend/src/App.jsx):**
        *   `MAPBOX_TOKEN` (Replace the placeholder).

## 4. OpenAQ API (For Ground Truth) 💨
*   **Purpose:** Validating the AI model with real sensors.
*   **Sign Up:** [https://openaq.org/developers/](https://openaq.org/developers/)
*   **Action:**
    1.  Generate an API Key (Optional for V2, Required for V3/High Rate).
    2.  **Required Config (backend/scripts/harvest_ground.py):**
        *   `OPENAQ_API_KEY` (Optional but recommended).

---

## ⚙️ How to Apply
1.  Create a `.env` file in `backend/`.
2.  Add lines:
    ```env
    EARTHDATA_USERNAME=your_username
    EARTHDATA_PASSWORD=your_password
    SH_CLIENT_ID=your_id
    SH_CLIENT_SECRET=your_secret
    ```
3.  Update `frontend/src/App.jsx` with your Mapbox Token.
