# 🚀 MFRAMAPA AI - Data Pipeline Execution Guide

## Overview

This guide walks you through creating a **properly aligned training dataset** where satellite data is extracted at each PM2.5 station's exact location.

---

## Why Open-Meteo ERA5? (RECOMMENDED)

| Feature | Open-Meteo | Google Earth Engine | NASA Giovanni |
|---------|------------|---------------------|---------------|
| **Cost** | FREE | FREE | FREE |
| **Signup** | ❌ None needed | ✓ Required | ✓ Required |
| **API** | ✓ REST API | JavaScript only | Manual download |
| **Variables** | Wind, temp, humidity, pressure | AOD, NO2 | Varies |
| **Lat/Lon extraction** | ✓ Automatic | ✓ Manual script | ❌ Area only |
| **Hourly data** | ✓ Yes | Depends on product | Limited |

**Open-Meteo gives you ERA5 reanalysis data (same as Copernicus) with zero setup.**

---

## Step-by-Step Execution

### STEP 1: Install Dependencies

```bash
cd "c:\Users\adjei\Mframapa AI"
pip install requests pandas numpy rasterio
```

### STEP 2: Run the Pipeline

```bash
python backend/scripts/satellite_data_pipeline.py
```

**What it does:**
1. Reads all `*_PM25_V3.csv` files from `backend/data/ground_truth/`
2. Extracts unique stations (location, lat, lon)
3. For each station, calls Open-Meteo API to get hourly:
   - Wind speed & direction (10m)
   - Temperature (2m)
   - Relative humidity
   - Surface pressure
   - Cloud cover
   - Precipitation
4. Extracts population density from `pd.tif`
5. Merges everything on `datetime + lat + lon`
6. Validates correlations
7. Saves to `backend/data/training_dataset_v2.csv`

### STEP 3: Expected Runtime

| Stations | API Calls | Estimated Time |
|----------|-----------|----------------|
| 10 | ~50 | ~5 minutes |
| 50 | ~250 | ~30 minutes |
| 100+ | ~500+ | ~1-2 hours |

The script has built-in:
- Rate limiting (0.5s between requests)
- Retry logic (3 attempts per request)
- Progress saving (every 10 stations)

### STEP 4: Check Output

After completion, check the validation output:

```
Correlations with PM2.5:
----------------------------------------
  sat_wind_speed       +0.250 +++++
  sat_pressure         -0.180 ----
  sat_rh               +0.120 ++
  ...
```

**Good signs:**
- At least one feature with |correlation| > 0.2
- "GOOD: Best correlation is 0.XX - model should work!"

**Bad signs:**
- All correlations < 0.1
- "PROBLEM: No feature has correlation > 0.1"

### STEP 5: Update Training Notebook

Once you have `training_dataset_v2.csv`, update the notebook:

```python
# Cell 0: No need to unzip, just point to new file
LOCAL_DATASET = '/content/data/training_dataset_v2.csv'

# Cell 2: Update schema
SATELLITE_FEATURES = {
    'sat_wind_speed': 'float32',
    'sat_wind_dir': 'float32',
    'sat_rh': 'float32',
    'sat_pressure': 'float32',
    'sat_temp': 'float32',
    'sat_clouds': 'float32',
    'sat_precip': 'float32',
}
```

---

## Troubleshooting

### "Rate limited" errors
- The free tier allows 10,000 requests/day
- Wait 1 hour and resume, or reduce stations

### "Connection timeout"
- Internet issue, script will auto-retry
- If persistent, check firewall/VPN

### No population density extracted
- Install rasterio: `pip install rasterio`
- Or ignore (placeholder value 1000 used)

### Low correlations after pipeline
- Data alignment is correct, but meteorology may not predict PM2.5 well at your locations
- Try adding more features (AOD from Earth Engine)
- Consider CAMS PM2.5 estimates instead

---

## Next: Adding AOD & NO2 (Optional Enhancement)

For better predictions, add Aerosol Optical Depth (AOD) and NO2 from Google Earth Engine:

1. Sign up: https://earthengine.google.com/
2. Use the script in `docs/SATELLITE_DATA_GUIDE.md`
3. Merge the exported CSV with `training_dataset_v2.csv`

---

## File Locations

| File | Path |
|------|------|
| Pipeline script | `backend/scripts/satellite_data_pipeline.py` |
| Ground truth data | `backend/data/ground_truth/*.csv` |
| Population raster | `backend/data/space/pd.tif` |
| Output dataset | `backend/data/training_dataset_v2.csv` |
| Station list | `backend/data/station_locations.csv` |
