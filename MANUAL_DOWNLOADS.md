# 📥 Manual Data Download Links

If you prefer to download the raw CSVs manually instead of waiting for the scripts, here is exactly where to go.

### ⚠️ Important: Where to save files
Move any downloaded CSVs into this folder for the AI to find them:
`C:\Users\adjei\Mframapa AI\backend\data\ground_truth\`

---

## 1. Ground Truth (OpenAQ) 🌍
**Best source for CSVs of specific cities.**

*   **Website:** [https://openaq.org/explorer/](https://openaq.org/explorer/)
*   **Direct Download Steps:**
    1.  Go to the **Explorer**.
    2.  In the "Location" search bar, type: `Accra`, `Lagos`, `Johannesburg`, `Nairobi`, or `Cairo`.
    3.  Click on a specific sensor location (e.g., "US Diplomatic Post: Accra").
    4.  Scroll down to the "Download Data" section.
    5.  **Select Dates:** `01/01/2020` to `12/31/2025`.
    6.  **Select Parameter:** `PM2.5`.
    7.  Click **Download CSV**.
    8.  **Rename the file:** `Accra_pm25.csv` (or similar) and put it in the `ground_truth` folder.

---

## 2. Satellite Data (NASA EarthData) 🛰️
**For historical Aerosol & Dust data (MERRA-2).**

*   **Website:** [https://giovanni.gsfc.nasa.gov/giovanni/](https://giovanni.gsfc.nasa.gov/giovanni/) (Easiest UI)
*   **Steps:**
    1.  **Select Plot:** "Time Series, Area-Averaged".
    2.  **Select Date Range:** `2020-01-01` to `2025-12-31`.
    3.  **Select Region (Bounding Box):**
        *   Africa General: `-17,-35,52,38` (West, South, East, North)
        *   Or draw a box around a specific city.
    4.  **Select Variables (Search for these):**
        *   `M2T1NXAER.5.12.4: Dust Aerosol Optical Thickness` (MERRA-2)
        *   `OMNO2d.003: Nitrogen Dioxide` (OMI/Aura)
    5.  Click **Plot Data**.
    6.  Once loaded, click **"Downloads"** on the left sidebar.
    7.  Download the **CSV**.
    8.  Save to `backend/data/space/`.

---

## 3. Real-Time Feed (Sentinel Hub) ⚡
*This is an API, so there isn't a simple "Download CSV" button for the past 5 years easily without a script. However, you can view and download images via the **EO Browser**.*

*   **Website:** [https://apps.sentinel-hub.com/eo-browser/](https://apps.sentinel-hub.com/eo-browser/)
*   **Steps:**
    1.  Search for your city (e.g., "Accra").
    2.  Under **Data Sources**, check **Sentinel-5P**.
    3.  Select **NO2**.
    4.  Click **Search**.
    5.  Click on a tile result to visualize.
    6.  Use the "Download Image" icon on the right to save a snapshot (TIFF/JPG).
