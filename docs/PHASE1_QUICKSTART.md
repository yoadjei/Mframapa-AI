# Phase 1 Quick Start Guide

**Goal**: Multi-source satellite data infrastructure with zero single-point-of-failure  
**Duration**: Weeks 1-4  
**Priority**: CRITICAL

---

## Week 1 Sprint: Satellite API Connectors

### Day 1-2: Project Setup

1. **Create new module structure**:

```
backend/
├── data_sources/
│   ├── __init__.py
│   ├── base.py              # Abstract base class
│   ├── sentinel5p.py        # Sentinel-5P TROPOMI
│   ├── modis.py             # MODIS Terra/Aqua AOD
│   ├── viirs.py             # VIIRS AOD
│   ├── era5.py              # ERA5 Reanalysis
│   ├── cams.py              # Copernicus CAMS
│   └── open_meteo.py        # Open-Meteo (current fallback)
├── orchestration/
│   ├── __init__.py
│   ├── data_orchestrator.py # Fallback logic
│   ├── reliability.py       # Source scoring
│   └── cache.py             # Redis integration
└── storage/
    ├── __init__.py
    ├── archive.py           # Historical data storage
    └── versioning.py        # Dataset versioning
```

2. **Install new dependencies**:

```bash
pip install cdsapi sentinelsat xarray netCDF4 redis aiohttp tenacity
```

Add to `requirements.txt`:
```
cdsapi>=0.6.1
sentinelsat>=1.2.1
xarray>=2024.1.0
netCDF4>=1.6.5
redis>=5.0.0
aiohttp>=3.9.0
tenacity>=8.2.0
```

### Day 2-3: Base Data Source Class

Create `backend/data_sources/base.py`:

```python
"""
Base classes for satellite data sources with standardized interface.
All data sources must implement this interface for orchestrator compatibility.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, List, Any
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)


class DataSourceStatus(Enum):
    AVAILABLE = "available"
    DEGRADED = "degraded"  # Partial data or high latency
    UNAVAILABLE = "unavailable"
    RATE_LIMITED = "rate_limited"
    ERROR = "error"


@dataclass
class DataSourceResult:
    """Standardized result from any data source."""
    features: Dict[str, float]  # Variable name -> value
    source: str
    status: DataSourceStatus
    reliability_score: float  # 0.0-1.0
    timestamp: str
    latency_ms: int
    coverage: float = 1.0  # 0.0-1.0, fraction of requested data returned
    metadata: Dict[str, Any] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)


@dataclass
class DataSourceHealth:
    """Health check result for a data source."""
    source: str
    status: DataSourceStatus
    last_success: Optional[datetime]
    success_rate_24h: float
    avg_latency_ms: float
    error_count_24h: int


class SatelliteDataSource(ABC):
    """Abstract base class for all satellite/reanalysis data sources."""
    
    def __init__(self, name: str, priority: int = 50):
        self.name = name
        self.priority = priority  # Lower = higher priority
        self._last_success: Optional[datetime] = None
        self._success_count = 0
        self._error_count = 0
        self._total_latency_ms = 0
    
    @abstractmethod
    async def fetch(
        self, 
        lat: float, 
        lon: float, 
        timestamp: Optional[str] = None
    ) -> DataSourceResult:
        """
        Fetch atmospheric data for a location.
        
        Args:
            lat: Latitude (-90 to 90)
            lon: Longitude (-180 to 180)
            timestamp: ISO 8601 timestamp (default: now)
        
        Returns:
            DataSourceResult with features and metadata
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> DataSourceHealth:
        """Check if the data source is available and responsive."""
        pass
    
    @abstractmethod
    def get_provided_features(self) -> List[str]:
        """Return list of feature names this source provides."""
        pass
    
    def get_reliability_score(self) -> float:
        """
        Calculate reliability score based on recent performance.
        Override for custom scoring logic.
        """
        if self._success_count + self._error_count == 0:
            return 0.5  # Unknown reliability
        
        success_rate = self._success_count / (self._success_count + self._error_count)
        
        # Penalize high latency
        if self._success_count > 0:
            avg_latency = self._total_latency_ms / self._success_count
            latency_penalty = min(avg_latency / 10000, 0.3)  # Max 0.3 penalty
        else:
            latency_penalty = 0
        
        return max(0.0, min(1.0, success_rate - latency_penalty))
    
    def _record_success(self, latency_ms: int):
        """Record a successful request."""
        self._last_success = datetime.utcnow()
        self._success_count += 1
        self._total_latency_ms += latency_ms
    
    def _record_error(self):
        """Record a failed request."""
        self._error_count += 1


# Standard feature names used across all sources
STANDARD_FEATURES = {
    # Atmospheric composition
    "no2": "Tropospheric NO2 column (mol/m²)",
    "aod": "Aerosol Optical Depth (550nm)",
    "so2": "Sulphur Dioxide column (DU)",
    "co": "Carbon Monoxide column (mol/m²)",
    "o3": "Ozone column (DU)",
    "uvai": "UV Aerosol Index",
    
    # Meteorological
    "pblh": "Planetary Boundary Layer Height (m)",
    "temperature": "2m Temperature (°C)",
    "humidity": "Relative Humidity (%)",
    "pressure": "Surface Pressure (hPa)",
    "wind_speed": "10m Wind Speed (m/s)",
    "wind_direction": "10m Wind Direction (°)",
    "cloud_cover": "Cloud Cover (%)",
    "precipitation": "Precipitation (mm)",
    
    # Surface/Land
    "elevation": "Elevation (m)",
    "ndvi": "Normalized Difference Vegetation Index",
    "lst": "Land Surface Temperature (°C)",
    "urban_fraction": "Urban Land Fraction (0-1)",
    "road_density": "Road Network Density (km/km²)",
    "nightlights": "Nighttime Lights Radiance",
    
    # Demographics
    "population_density": "Population Density (people/km²)",
}
```

### Day 3-4: Sentinel-5P TROPOMI Connector

Create `backend/data_sources/sentinel5p.py`:

```python
"""
Sentinel-5P TROPOMI data connector via Google Earth Engine or direct Copernicus access.
Provides: NO2, AOD (via UV Aerosol Index), SO2, CO, O3
"""

import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import os
from tenacity import retry, stop_after_attempt, wait_exponential

from .base import SatelliteDataSource, DataSourceResult, DataSourceStatus, DataSourceHealth

# Copernicus Data Store credentials
CDS_URL = os.getenv("CDS_URL", "https://cds.climate.copernicus.eu/api/v2")
CDS_KEY = os.getenv("CDS_API_KEY")


class Sentinel5PDataSource(SatelliteDataSource):
    """
    Sentinel-5P TROPOMI atmospheric data.
    
    Data latency: ~3-6 hours from observation
    Spatial resolution: ~5.5 x 3.5 km
    """
    
    def __init__(self):
        super().__init__(name="sentinel5p", priority=10)
        self._session: Optional[aiohttp.ClientSession] = None
    
    def get_provided_features(self) -> List[str]:
        return ["no2", "uvai", "so2", "co", "o3"]
    
    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=30)
            )
        return self._session
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch(
        self, 
        lat: float, 
        lon: float, 
        timestamp: Optional[str] = None
    ) -> DataSourceResult:
        """Fetch Sentinel-5P data for location."""
        
        start_time = datetime.utcnow()
        errors = []
        features = {}
        
        try:
            # Use Google Earth Engine API or Copernicus API
            # For demo, using a simplified approach
            
            session = await self._get_session()
            
            # Sentinel-5P data via Earth Engine (requires setup)
            # Alternative: Use Copernicus Atmosphere Data Store
            
            # For now, implement via the S5P PAL API (simpler)
            # https://data-portal.s5p-pal.com/
            
            api_url = f"https://data-portal.s5p-pal.com/api/v1/timeseries"
            
            params = {
                "lat": lat,
                "lon": lon,
                "product": "L2__NO2___",
                "start_date": (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d"),
                "end_date": datetime.utcnow().strftime("%Y-%m-%d"),
            }
            
            async with session.get(api_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Extract latest valid NO2 value
                    if data.get("values"):
                        latest = data["values"][-1]
                        features["no2"] = latest.get("value", 0) * 1e-6  # Convert to mol/m²
                else:
                    errors.append(f"S5P API returned {response.status}")
            
            # Fetch other products similarly...
            # SO2, CO, O3 have similar endpoints
            
            latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            if features:
                self._record_success(latency_ms)
                status = DataSourceStatus.AVAILABLE
            else:
                status = DataSourceStatus.DEGRADED
            
            return DataSourceResult(
                features=features,
                source=self.name,
                status=status,
                reliability_score=self.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=latency_ms,
                coverage=len(features) / len(self.get_provided_features()),
                errors=errors
            )
            
        except Exception as e:
            self._record_error()
            latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return DataSourceResult(
                features={},
                source=self.name,
                status=DataSourceStatus.ERROR,
                reliability_score=self.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=latency_ms,
                errors=[str(e)]
            )
    
    async def health_check(self) -> DataSourceHealth:
        """Check Sentinel-5P API availability."""
        try:
            # Simple ping to verify API is responding
            session = await self._get_session()
            async with session.get("https://data-portal.s5p-pal.com/api/v1/status") as response:
                status = DataSourceStatus.AVAILABLE if response.status == 200 else DataSourceStatus.UNAVAILABLE
        except Exception:
            status = DataSourceStatus.UNAVAILABLE
        
        return DataSourceHealth(
            source=self.name,
            status=status,
            last_success=self._last_success,
            success_rate_24h=self._success_count / max(1, self._success_count + self._error_count),
            avg_latency_ms=self._total_latency_ms / max(1, self._success_count),
            error_count_24h=self._error_count
        )
    
    async def close(self):
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
```

### Day 4-5: ERA5 Reanalysis Connector

Create `backend/data_sources/era5.py`:

```python
"""
ERA5 Reanalysis data connector via Copernicus Climate Data Store.
Provides: PBLH, temperature, humidity, wind, pressure, precipitation
"""

import cdsapi
import xarray as xr
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor

from .base import SatelliteDataSource, DataSourceResult, DataSourceStatus, DataSourceHealth


class ERA5DataSource(SatelliteDataSource):
    """
    ERA5 atmospheric reanalysis from ECMWF.
    
    Temporal resolution: Hourly
    Spatial resolution: ~31 km (0.25°)
    Latency: 5 days for ERA5, 5 hours for ERA5T (preliminary)
    """
    
    def __init__(self):
        super().__init__(name="era5", priority=20)
        self._executor = ThreadPoolExecutor(max_workers=2)
        self._client = None
    
    def get_provided_features(self) -> List[str]:
        return [
            "pblh", "temperature", "humidity", "pressure",
            "wind_speed", "wind_direction", "cloud_cover", "precipitation"
        ]
    
    def _get_client(self):
        """Get CDS API client (blocking)."""
        if self._client is None:
            self._client = cdsapi.Client(quiet=True)
        return self._client
    
    def _fetch_sync(self, lat: float, lon: float, target_time: datetime) -> Dict:
        """Synchronous fetch for running in executor."""
        
        client = self._get_client()
        
        # Round to nearest hour
        hour = target_time.replace(minute=0, second=0, microsecond=0)
        
        # ERA5 single-level variables
        variables = [
            'boundary_layer_height',
            '2m_temperature',
            '2m_dewpoint_temperature',
            'surface_pressure',
            '10m_u_component_of_wind',
            '10m_v_component_of_wind',
            'total_cloud_cover',
            'total_precipitation'
        ]
        
        # Create a small bounding box around the point
        area = [lat + 0.25, lon - 0.25, lat - 0.25, lon + 0.25]  # N, W, S, E
        
        with tempfile.NamedTemporaryFile(suffix='.nc', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            client.retrieve(
                'reanalysis-era5-single-levels',
                {
                    'product_type': 'reanalysis',
                    'variable': variables,
                    'year': hour.strftime('%Y'),
                    'month': hour.strftime('%m'),
                    'day': hour.strftime('%d'),
                    'time': hour.strftime('%H:00'),
                    'area': area,
                    'format': 'netcdf',
                },
                tmp_path
            )
            
            # Parse NetCDF
            ds = xr.open_dataset(tmp_path)
            
            # Extract values at closest point
            data = ds.sel(latitude=lat, longitude=lon, method='nearest')
            
            # Calculate derived values
            import numpy as np
            
            u10 = float(data['u10'].values)
            v10 = float(data['v10'].values)
            wind_speed = np.sqrt(u10**2 + v10**2)
            wind_direction = np.degrees(np.arctan2(-u10, -v10)) % 360
            
            t2m = float(data['t2m'].values) - 273.15  # K to °C
            d2m = float(data['d2m'].values) - 273.15
            
            # Calculate relative humidity from dewpoint
            e = 6.112 * np.exp((17.67 * d2m) / (d2m + 243.5))
            es = 6.112 * np.exp((17.67 * t2m) / (t2m + 243.5))
            humidity = 100 * (e / es)
            
            features = {
                'pblh': float(data['blh'].values),
                'temperature': t2m,
                'humidity': min(100, max(0, humidity)),
                'pressure': float(data['sp'].values) / 100,  # Pa to hPa
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'cloud_cover': float(data['tcc'].values) * 100,  # fraction to %
                'precipitation': float(data['tp'].values) * 1000,  # m to mm
            }
            
            ds.close()
            return features
            
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)
    
    async def fetch(
        self, 
        lat: float, 
        lon: float, 
        timestamp: Optional[str] = None
    ) -> DataSourceResult:
        """Fetch ERA5 data for location."""
        
        start_time = datetime.utcnow()
        
        if timestamp:
            target_time = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        else:
            # ERA5 has ~5 day latency, use ERA5T for recent data
            target_time = datetime.utcnow() - timedelta(hours=6)
        
        try:
            loop = asyncio.get_event_loop()
            features = await loop.run_in_executor(
                self._executor,
                self._fetch_sync,
                lat, lon, target_time
            )
            
            latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            self._record_success(latency_ms)
            
            return DataSourceResult(
                features=features,
                source=self.name,
                status=DataSourceStatus.AVAILABLE,
                reliability_score=self.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=latency_ms,
                coverage=1.0,
                metadata={'era5_time': target_time.isoformat()}
            )
            
        except Exception as e:
            self._record_error()
            latency_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
            
            return DataSourceResult(
                features={},
                source=self.name,
                status=DataSourceStatus.ERROR,
                reliability_score=self.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=latency_ms,
                errors=[str(e)]
            )
    
    async def health_check(self) -> DataSourceHealth:
        """Check ERA5 API availability."""
        try:
            client = self._get_client()
            # CDS API doesn't have a simple health endpoint
            status = DataSourceStatus.AVAILABLE
        except Exception:
            status = DataSourceStatus.UNAVAILABLE
        
        return DataSourceHealth(
            source=self.name,
            status=status,
            last_success=self._last_success,
            success_rate_24h=self._success_count / max(1, self._success_count + self._error_count),
            avg_latency_ms=self._total_latency_ms / max(1, self._success_count),
            error_count_24h=self._error_count
        )
```

---

## Week 2 Sprint: Orchestration Layer

### Day 1-2: Data Orchestrator

Create `backend/orchestration/data_orchestrator.py`:

```python
"""
Data orchestrator with fallback hierarchy and reliability-weighted source selection.
"""

import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import logging

from backend.data_sources.base import (
    SatelliteDataSource, 
    DataSourceResult, 
    DataSourceStatus,
    STANDARD_FEATURES
)

logger = logging.getLogger(__name__)


# Fallback hierarchy per feature
FALLBACK_HIERARCHY: Dict[str, List[str]] = {
    "no2": ["sentinel5p", "omi", "cams", "historical_climatology"],
    "aod": ["modis", "viirs", "sentinel3", "cams", "merra2", "historical_climatology"],
    "uvai": ["sentinel5p", "omi", "historical_climatology"],
    "so2": ["sentinel5p", "omi", "cams", "historical_climatology"],
    "co": ["sentinel5p", "mopitt", "cams", "historical_climatology"],
    "o3": ["sentinel5p", "omi", "cams", "historical_climatology"],
    
    "pblh": ["era5", "merra2", "open_meteo", "calculated_estimate"],
    "temperature": ["era5", "open_meteo", "merra2", "historical_monthly"],
    "humidity": ["era5", "open_meteo", "merra2", "historical_monthly"],
    "pressure": ["era5", "open_meteo", "merra2", "historical_monthly"],
    "wind_speed": ["era5", "open_meteo", "merra2", "historical_monthly"],
    "wind_direction": ["era5", "open_meteo", "merra2", "historical_monthly"],
    "cloud_cover": ["era5", "open_meteo", "modis", "historical_monthly"],
    "precipitation": ["era5", "open_meteo", "chirps", "historical_monthly"],
    
    "elevation": ["srtm", "aster", "local_cache"],
    "ndvi": ["modis", "sentinel2", "historical_monthly"],
    "lst": ["modis", "landsat", "era5", "historical_monthly"],
    "urban_fraction": ["worldcover", "modis_lc", "local_cache"],
    "road_density": ["osm", "local_cache"],
    "nightlights": ["viirs_dnb", "dmsp", "local_cache"],
    "population_density": ["worldpop", "landscan", "local_cache"],
}


class DataOrchestrator:
    """
    Orchestrates data fetching across multiple sources with fallback logic.
    """
    
    def __init__(self, sources: List[SatelliteDataSource]):
        self.sources: Dict[str, SatelliteDataSource] = {s.name: s for s in sources}
        self._reliability_cache: Dict[str, float] = {}
        self._last_health_check: Optional[datetime] = None
    
    async def fetch_all_features(
        self, 
        lat: float, 
        lon: float,
        timestamp: Optional[str] = None,
        required_features: Optional[List[str]] = None
    ) -> Tuple[Dict[str, float], Dict[str, str], Dict[str, float]]:
        """
        Fetch all required features using fallback hierarchy.
        
        Returns:
            Tuple of (features, sources_used, reliability_scores)
        """
        
        if required_features is None:
            required_features = list(STANDARD_FEATURES.keys())
        
        features: Dict[str, float] = {}
        sources_used: Dict[str, str] = {}
        reliability_scores: Dict[str, float] = {}
        
        # Group features by their primary source to batch requests
        source_features: Dict[str, List[str]] = {}
        for feature in required_features:
            hierarchy = FALLBACK_HIERARCHY.get(feature, [])
            if hierarchy:
                primary_source = hierarchy[0]
                if primary_source not in source_features:
                    source_features[primary_source] = []
                source_features[primary_source].append(feature)
        
        # Fetch from primary sources in parallel
        tasks = []
        for source_name in source_features:
            if source_name in self.sources:
                tasks.append(self._fetch_from_source(
                    source_name, lat, lon, timestamp
                ))
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, DataSourceResult) and result.status == DataSourceStatus.AVAILABLE:
                    for feature, value in result.features.items():
                        if feature in required_features and feature not in features:
                            features[feature] = value
                            sources_used[feature] = result.source
                            reliability_scores[feature] = result.reliability_score
        
        # Fill missing features using fallback hierarchy
        missing_features = [f for f in required_features if f not in features]
        
        for feature in missing_features:
            hierarchy = FALLBACK_HIERARCHY.get(feature, [])
            
            for fallback_source in hierarchy[1:]:  # Skip primary (already tried)
                if fallback_source in self.sources:
                    result = await self._fetch_from_source(
                        fallback_source, lat, lon, timestamp
                    )
                    
                    if result.status == DataSourceStatus.AVAILABLE:
                        if feature in result.features:
                            features[feature] = result.features[feature]
                            sources_used[feature] = f"{result.source} (fallback)"
                            reliability_scores[feature] = result.reliability_score * 0.9  # Slight penalty for fallback
                            break
                
                elif fallback_source == "historical_climatology":
                    # Use historical average as last resort
                    value = await self._get_climatology(feature, lat, lon)
                    if value is not None:
                        features[feature] = value
                        sources_used[feature] = "climatology"
                        reliability_scores[feature] = 0.5
                        break
                
                elif fallback_source == "calculated_estimate":
                    # Calculate from other available features
                    value = self._calculate_estimate(feature, features, lat, lon)
                    if value is not None:
                        features[feature] = value
                        sources_used[feature] = "calculated"
                        reliability_scores[feature] = 0.4
                        break
        
        return features, sources_used, reliability_scores
    
    async def _fetch_from_source(
        self, 
        source_name: str, 
        lat: float, 
        lon: float,
        timestamp: Optional[str]
    ) -> DataSourceResult:
        """Fetch data from a specific source with error handling."""
        
        source = self.sources.get(source_name)
        if not source:
            return DataSourceResult(
                features={},
                source=source_name,
                status=DataSourceStatus.UNAVAILABLE,
                reliability_score=0,
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=0,
                errors=["Source not configured"]
            )
        
        try:
            return await asyncio.wait_for(
                source.fetch(lat, lon, timestamp),
                timeout=30.0
            )
        except asyncio.TimeoutError:
            return DataSourceResult(
                features={},
                source=source_name,
                status=DataSourceStatus.ERROR,
                reliability_score=source.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=30000,
                errors=["Request timeout"]
            )
        except Exception as e:
            logger.error(f"Error fetching from {source_name}: {e}")
            return DataSourceResult(
                features={},
                source=source_name,
                status=DataSourceStatus.ERROR,
                reliability_score=source.get_reliability_score(),
                timestamp=datetime.utcnow().isoformat(),
                latency_ms=0,
                errors=[str(e)]
            )
    
    async def _get_climatology(
        self, 
        feature: str, 
        lat: float, 
        lon: float
    ) -> Optional[float]:
        """Get historical climatology value for a feature."""
        
        # Regional climatology defaults for Africa
        # These would be replaced with actual historical averages
        CLIMATOLOGY_DEFAULTS = {
            "no2": 0.5e-6,  # mol/m²
            "aod": 0.35,
            "temperature": 25.0,  # °C
            "humidity": 60.0,  # %
            "wind_speed": 4.0,  # m/s
            "pblh": 1200.0,  # m
            "pressure": 1013.0,  # hPa
        }
        
        return CLIMATOLOGY_DEFAULTS.get(feature)
    
    def _calculate_estimate(
        self, 
        feature: str, 
        available_features: Dict[str, float],
        lat: float,
        lon: float
    ) -> Optional[float]:
        """Calculate feature estimate from other available features."""
        
        if feature == "pblh":
            # Estimate PBLH from surface conditions
            temp = available_features.get("temperature", 25)
            pressure = available_features.get("pressure", 1013)
            # Simplified: PBLH increases with temperature
            return max(500, min(2500, 1000 + (temp - 25) * 50))
        
        return None
    
    async def get_system_health(self) -> Dict[str, any]:
        """Get health status of all data sources."""
        
        health_tasks = [
            source.health_check() 
            for source in self.sources.values()
        ]
        
        health_results = await asyncio.gather(*health_tasks, return_exceptions=True)
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "sources": [
                h.__dict__ if not isinstance(h, Exception) else {"error": str(h)}
                for h in health_results
            ],
            "overall_status": "healthy" if any(
                not isinstance(h, Exception) and h.status == DataSourceStatus.AVAILABLE
                for h in health_results
            ) else "degraded"
        }
```

---

## Environment Setup

### Required API Keys

Create `.env` in `backend/`:

```bash
# Copernicus Climate Data Store
CDS_API_KEY=your_cds_api_key_here
CDS_URL=https://cds.climate.copernicus.eu/api/v2

# NASA Earthdata (for MODIS, VIIRS)
EARTHDATA_USERNAME=your_username
EARTHDATA_PASSWORD=your_password

# Sentinel Hub (optional, for processed data)
SENTINEL_HUB_CLIENT_ID=your_client_id
SENTINEL_HUB_CLIENT_SECRET=your_secret

# Redis (local or AWS ElastiCache)
REDIS_URL=redis://localhost:6379

# Existing keys
OPENAQ_API_KEY=your_openaq_key
OPENWEATHERMAP_API_KEY=your_owm_key
GEMINI_API_KEY=your_gemini_key
```

### API Registration Links

1. **Copernicus CDS** (ERA5, CAMS): https://cds.climate.copernicus.eu/user/register
2. **NASA Earthdata** (MODIS, VIIRS): https://urs.earthdata.nasa.gov/users/new
3. **Sentinel Hub** (Sentinel-5P): https://www.sentinel-hub.com/
4. **AirQo** (African ground stations): Contact info@airqo.net

---

## Testing

### Unit Test Template

```python
# tests/test_data_sources.py
import pytest
import asyncio
from backend.data_sources.sentinel5p import Sentinel5PDataSource
from backend.data_sources.era5 import ERA5DataSource
from backend.data_sources.base import DataSourceStatus


@pytest.fixture
def sentinel5p():
    return Sentinel5PDataSource()


@pytest.fixture
def era5():
    return ERA5DataSource()


@pytest.mark.asyncio
async def test_sentinel5p_fetch(sentinel5p):
    """Test Sentinel-5P data fetch for Accra, Ghana."""
    result = await sentinel5p.fetch(lat=5.6037, lon=-0.1870)
    
    assert result.source == "sentinel5p"
    assert result.latency_ms > 0
    
    if result.status == DataSourceStatus.AVAILABLE:
        assert "no2" in result.features


@pytest.mark.asyncio
async def test_era5_fetch(era5):
    """Test ERA5 data fetch for Nairobi, Kenya."""
    result = await era5.fetch(lat=-1.2864, lon=36.8172)
    
    assert result.source == "era5"
    
    if result.status == DataSourceStatus.AVAILABLE:
        assert "temperature" in result.features
        assert "pblh" in result.features


@pytest.mark.asyncio
async def test_fallback_hierarchy():
    """Test that fallback works when primary source fails."""
    from backend.orchestration.data_orchestrator import DataOrchestrator
    from backend.data_sources.open_meteo import OpenMeteoDataSource
    
    # Only configure Open-Meteo (fallback source)
    orchestrator = DataOrchestrator([OpenMeteoDataSource()])
    
    features, sources, scores = await orchestrator.fetch_all_features(
        lat=5.6037, lon=-0.1870,
        required_features=["temperature", "humidity"]
    )
    
    # Should get data from fallback
    assert "temperature" in features
    assert "humidity" in features
```

---

## Next Steps

After completing Week 1-2:
1. Run full integration tests
2. Measure latency for each source
3. Build reliability score tracking
4. Implement Redis caching (Week 3)
5. Deploy to staging environment

---

*Quick Start Guide v1.0*
