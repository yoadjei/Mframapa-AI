"""
MODIS MAIAC AOD connector (NASA EarthData).

Dataset: MCD19A2 v061 — MAIAC Land Aerosol Optical Depth (500m, daily).

Flow:
    1. CMR search for the granule covering (lat, lon) on the given date.
    2. Download HDF4 from LAADS DAAC.
    3. Extract Optical_Depth_055 at the nearest pixel (scale 0.001, fill -28672).

Credential:
    NASA_EARTHDATA_TOKEN — bearer token from https://urs.earthdata.nasa.gov/
"""

import logging
import os
import tempfile
from datetime import datetime
from typing import Dict, Any, List, Optional

import requests

from .base import DataSource
from backend.utils.retry import with_retry

logger = logging.getLogger(__name__)

_CMR_URL   = "https://cmr.earthdata.nasa.gov/search/granules.json"
_LAADS_URL = "https://ladsweb.modaps.eosdis.nasa.gov"
_FILL_VAL  = -28672
_SCALE     = 0.001
_TIMEOUT   = 60


class MODISDataSource(DataSource):
    """NASA MODIS MCD19A2 MAIAC aerosol optical depth connector."""

    @property
    def source_name(self) -> str:
        return "MODIS-MAIAC"

    @property
    def provided_features(self) -> List[str]:
        return ["aerosol_optical_depth"]

    @property
    def is_available(self) -> bool:
        return bool(os.environ.get("NASA_EARTHDATA_TOKEN"))

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        if not self.is_available:
            raise RuntimeError(
                "MODISDataSource: set NASA_EARTHDATA_TOKEN env var."
            )
        self._validate_inputs(lat, lon, date)
        granule_url = self._search_granule(lat, lon, date)
        if granule_url is None:
            logger.warning("MODIS: no granule found for %s at (%.4f, %.4f)", date, lat, lon)
            return {"aerosol_optical_depth": None}
        return self._download_and_extract(granule_url, lat, lon)

    # ------------------------------------------------------------------ #

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def _search_granule(self, lat: float, lon: float, date: str) -> Optional[str]:
        params = {
            "short_name": "MCD19A2",
            "version":    "061",
            "temporal":   f"{date}T00:00:00Z,{date}T23:59:59Z",
            "point":      f"{lon},{lat}",
            "page_size":  1,
            "sort_key":   "-start_date",
        }
        try:
            r = requests.get(_CMR_URL, params=params, timeout=_TIMEOUT)
            r.raise_for_status()
            entries = r.json().get("feed", {}).get("entry", [])
        except requests.RequestException as e:
            raise ConnectionError(f"MODIS: CMR search failed — {e}") from e

        if not entries:
            return None

        # Prefer LAADS DAAC download link
        for link in entries[0].get("links", []):
            href = link.get("href", "")
            if "ladsweb" in href and href.endswith(".hdf"):
                return href
        return None

    def _download_and_extract(self, url: str, lat: float, lon: float) -> Dict[str, Any]:
        token = os.environ["NASA_EARTHDATA_TOKEN"]
        headers = {"Authorization": f"Bearer {token}"}

        with tempfile.NamedTemporaryFile(suffix=".hdf", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            r = requests.get(url, headers=headers, timeout=300, stream=True)
            r.raise_for_status()
            with open(tmp_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)

            return self._extract_aod(tmp_path, lat, lon)

        except requests.RequestException as e:
            logger.warning("MODIS: HDF download failed — %s", e)
            return {"aerosol_optical_depth": None}
        finally:
            try:
                os.remove(tmp_path)
            except OSError:
                pass

    @staticmethod
    def _extract_aod(hdf_path: str, lat: float, lon: float) -> Dict[str, Any]:
        try:
            from pyhdf.SD import SD, SDC
            import numpy as np
        except ImportError:
            logger.warning("MODIS: pyhdf not installed. Run: pip install pyhdf")
            return {"aerosol_optical_depth": None}

        try:
            hdf    = SD(hdf_path, SDC.READ)
            ds     = hdf.select("Optical_Depth_055")
            data   = ds[:].astype(float)
            attrs  = ds.attributes()

            # Get geolocation
            lat_ds = hdf.select("Latitude")
            lon_ds = hdf.select("Longitude")
            lats   = lat_ds[:].astype(float)
            lons   = lon_ds[:].astype(float)

            # Mask fill values
            data[data == _FILL_VAL] = np.nan

            # Find nearest valid pixel
            dist = (lats - lat) ** 2 + (lons - lon) ** 2
            dist[np.isnan(data)] = np.inf
            idx  = np.unravel_index(dist.argmin(), dist.shape)

            aod = data[idx]
            if np.isnan(aod):
                return {"aerosol_optical_depth": None}

            return {"aerosol_optical_depth": round(float(aod) * _SCALE, 4)}

        except Exception as e:
            logger.warning("MODIS: HDF extraction failed — %s", e)
            return {"aerosol_optical_depth": None}

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"MODIS: latitude {lat} out of range [-90, 90]")
        if not (-180 <= lon <= 180):
            raise ValueError(f"MODIS: longitude {lon} out of range [-180, 180]")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"MODIS: invalid date '{date}' — expected YYYY-MM-DD")
