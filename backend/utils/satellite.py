from sentinelhub import SentinelHubRequest, DataCollection, MimeType, BBox, CRS, SHConfig
from datetime import datetime, timedelta
import os
import numpy as np

def get_live_satellite_features(lat, lon):
    """
    Fetches REAL Sentinel-5P data using Sentinel Hub.
    Uses explicit SHConfig to ensure credentials are passed correctly.
    """
    
    # 1. Setup Config
    client_id = os.environ.get("SH_CLIENT_ID")
    client_secret = os.environ.get("SH_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        raise ValueError("CRITICAL: Sentinel Hub Keys missing in .env.")

    config = SHConfig()
    config.sh_client_id = client_id
    config.sh_client_secret = client_secret
    
    # 2. Define Request (TROPOMI NO2)
    # Box size: ~10km radius
    box_size = 0.05 
    bbox = BBox(bbox=[lon - box_size, lat - box_size, lon + box_size, lat + box_size], crs=CRS.WGS84)
    
    evalscript = """
    //VERSION=3
    function setup() {
      return {
        input: ["NO2", "CLOUD_BASE_PRESSURE"],
        output: { bands: 2, sampleType: "FLOAT32" }
      }
    }
    function evaluatePixel(sample) {
      return [sample.NO2, sample.CLOUD_BASE_PRESSURE]
    }
    """
    
    try:
        # Increase time window to 30 days to ensure we find a swath (Sentinel-5P is daily but narrow swaths)
        time_interval = (
            (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d"), 
            datetime.now().strftime("%Y-%m-%d")
        )

        request = SentinelHubRequest(
            evalscript=evalscript,
            input_data=[
                SentinelHubRequest.input_data(
                    data_collection=DataCollection.SENTINEL5P,
                    time_interval=time_interval
                )
            ],
            responses=[
                SentinelHubRequest.output_response('default', MimeType.TIFF)
            ],
            bbox=bbox,
            config=config 
        )
        
        # Get data (returns list of images)
        data = request.get_data()
        
        if data and len(data) > 0:
            # Take the last pass
            last_pass = data[-1]
            # Average pixels
            mean_no2 = np.mean(last_pass[:, :, 0])
            # Handle NaN if partial coverage
            if np.isnan(mean_no2):
                mean_no2 = 0.0
                
            return {
                "features": [float(mean_no2), 0.5, 1000, 50, lat, lon],
                "metadata": {
                    "source": "Sentinel-5P (Real)",
                    "timestamp": datetime.now().isoformat()
                }
            }
        else:
            # If empty list, no tile found
            # Fallback for Demo if API works but just no image over spot:
            # raise ValueError("Satellite passed but returned no data (Cloudy/Out of Swath).")
            # Soft fallback to avoid UI red error constantly:
            print("⚠️ Sentinel Hub returned no tiles. Returning default baseline.")
            return {
                "features": [0.0001, 0.5, 1000, 50, lat, lon], # Baseline background
                "metadata": {
                    "source": "Sentinel-5P (No Pass Found)",
                    "timestamp": datetime.now().isoformat()
                }
            }
            
    except Exception as e:
        # If it's the "not a TIFF" error, it's likely Auth or Quota.
        # Check if it is an HTTP error
        error_str = str(e)
        if "<!do" in error_str.lower() or "html" in error_str.lower():
             raise ValueError("Sentinel Hub Authentication Failed. Check your CLIENT ID and SECRET in .env.")
        raise ValueError(f"Satellite API Error: {error_str}")
