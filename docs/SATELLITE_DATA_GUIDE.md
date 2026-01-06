# Mframapa AI - Proper Satellite Data Guide

## The Problem

Your current satellite data is **area-averaged** (one value for all of Africa per time step).
You need **point-extracted** data (one value per station per time step).

---

## Step 1: List Your Station Locations

First, extract unique lat/lon from your ground truth data:

```python
import pandas as pd
import glob

# Combine all ground truth files
all_files = glob.glob("backend/data/ground_truth/*.csv")
stations = pd.concat([pd.read_csv(f)[['location', 'lat', 'lon']].drop_duplicates() for f in all_files])
stations = stations.drop_duplicates()
stations.to_csv("station_locations.csv", index=False)
print(f"Found {len(stations)} unique stations")
```

---

## Step 2: Get Satellite Data (Choose ONE Method)

### Option A: Google Earth Engine (RECOMMENDED)
**Best for: Custom extraction at exact lat/lon**

1. Go to: https://code.earthengine.google.com/
2. Sign up (free)
3. Use this JavaScript code:

```javascript
// Load your stations
var stations = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([-0.1707, 5.5794]), {name: 'Accra'}),
  // Add more stations...
]);

// Extract MODIS AOD at each station
var aod = ee.ImageCollection('MODIS/061/MCD19A2_GRANULES')
  .filterDate('2020-01-01', '2024-01-01')
  .select('Optical_Depth_047');

// Sample at stations
var extracted = aod.map(function(img) {
  return img.reduceRegions({
    collection: stations,
    reducer: ee.Reducer.mean(),
    scale: 1000
  });
}).flatten();

Export.table.toDrive({
  collection: extracted,
  description: 'satellite_aod_per_station',
  fileFormat: 'CSV'
});
```

### Option B: NASA Giovanni (Point Extraction)
**Best for: Quick single-variable extraction**

1. Go to: https://giovanni.gsfc.nasa.gov/
2. Select:
   - Data: MERRA-2 (for wind, humidity, PBLH)
   - Area: Enter ONE station's lat/lon bounding box (±0.25°)
   - Time: Your date range
3. Download as CSV
4. Repeat for each station (tedious)

### Option C: Copernicus Climate Data Store (ERA5)
**Best for: Wind, humidity, PBLH at hourly resolution**

1. Go to: https://cds.climate.copernicus.eu/
2. Register (free)
3. Use their API:

```python
import cdsapi

c = cdsapi.Client()

c.retrieve(
    'reanalysis-era5-single-levels',
    {
        'product_type': 'reanalysis',
        'format': 'netcdf',
        'variable': ['10m_u_component_of_wind', '10m_v_component_of_wind', 
                     'boundary_layer_height', 'relative_humidity'],
        'year': ['2020', '2021', '2022', '2023'],
        'month': [str(i).zfill(2) for i in range(1, 13)],
        'day': [str(i).zfill(2) for i in range(1, 32)],
        'time': ['00:00', '06:00', '12:00', '18:00'],
        'area': [38, -17, -35, 52],  # Africa bounding box
    },
    'era5_africa.nc')
```

Then extract at station locations:
```python
import xarray as xr

ds = xr.open_dataset('era5_africa.nc')

# For each station
for lat, lon in stations[['lat', 'lon']].values:
    point_data = ds.sel(latitude=lat, longitude=lon, method='nearest')
    # Save to CSV
```

### Option D: Use OpenAQ with CAMS (Pre-Matched)
**Best for: Already has PM2.5 + model estimates**

The Copernicus Atmosphere Monitoring Service (CAMS) provides PM2.5 estimates.
You can download their reanalysis and match to your station times.

---

## Step 3: Required Output Format

Your merged training data should look like this:

| datetime | lat | lon | location | pm25 | sat_aod | sat_no2 | sat_pblh | sat_rh | wind_u | wind_v | pop_density |
|----------|-----|-----|----------|------|---------|---------|----------|--------|--------|--------|-------------|
| 2020-05-01 00:00 | 5.579 | -0.171 | Accra | 26.0 | 0.35 | 4.2e14 | 850 | 0.72 | -1.2 | 0.5 | 5000 |

**Key requirements:**
- Each row = one PM2.5 measurement
- Satellite values extracted at that EXACT lat/lon
- Timestamps aligned (±1 hour for hourly data)

---

## Step 4: Merge Script

Once you have point-extracted satellite data, use this merge script:

```python
import pandas as pd

# Load ground truth
pm25 = pd.read_csv("ground_truth.csv", parse_dates=['datetime'])

# Load satellite (now with lat/lon!)
sat_aod = pd.read_csv("satellite_aod_per_station.csv", parse_dates=['time'])
sat_aod = sat_aod.rename(columns={'time': 'datetime', 'mean': 'sat_aod'})

# Merge on datetime + location
merged = pm25.merge(
    sat_aod[['datetime', 'lat', 'lon', 'sat_aod']], 
    on=['datetime', 'lat', 'lon'],
    how='left'
)

# Repeat for other satellite variables...
merged.to_csv("training_dataset.csv", index=False)
```

---

## Recommended Priority

1. **ERA5 (Copernicus)** - Wind, humidity, PBLH (high quality, gridded)
2. **MODIS AOD (Earth Engine)** - Aerosol optical depth
3. **Sentinel-5P NO2 (Earth Engine)** - Nitrogen dioxide

These three sources cover the most predictive features for PM2.5.

---

## Alternative: Use Existing Matched Datasets

If this is too complex, consider:

1. **OpenAQ + CAMS fusion products** (already matched)
2. **WHO Global Air Quality Database** (has modeled PM2.5)
3. **AirNow International** (embassy stations with some satellite matching)
