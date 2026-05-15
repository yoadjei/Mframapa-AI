"""
Sentinel-5P TROPOMI connector via Copernicus Data Space Ecosystem (CDSE).

Flow:
    1. OAuth2 token from CDSE identity service.
    2. OData search for the nearest TROPOMI L2 granule.
    3. Download HDF5 product → extract pixel nearest to (lat, lon) with QA ≥ 0.5.

Credentials (env vars):
    CDSE_USERNAME
    CDSE_PASSWORD

Provides:
    no2_tropospheric_column  (mol/m²)
    aerosol_optical_depth
    so2_total_column         (mol/m²)
    co_total_column          (mol/m²)
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

_TOKEN_URL  = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
_ODATA_URL  = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
_DOWNLOAD_URL = "https://zipper.dataspace.copernicus.eu/odata/v1/Products"
_QA_THRESHOLD = 0.5
_TIMEOUT      = 60


class Sentinel5PDataSource(DataSource):
    """CDSE-backed connector for Sentinel-5P TROPOMI L2 products."""

    @property
    def source_name(self) -> str:
        return "Sentinel-5P"

    @property
    def provided_features(self) -> List[str]:
        return [
            "no2_tropospheric_column",
            "aerosol_optical_depth",
            "so2_total_column",
            "co_total_column",
        ]

    @property
    def is_available(self) -> bool:
        return bool(
            os.environ.get("CDSE_USERNAME") and os.environ.get("CDSE_PASSWORD")
        )

    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        if not self.is_available:
            raise RuntimeError(
                "Sentinel5PDataSource: set CDSE_USERNAME and CDSE_PASSWORD env vars."
            )
        self._validate_inputs(lat, lon, date)
        token   = self._get_token()
        granule = self._search_granule(lat, lon, date, token)
        if granule is None:
            logger.warning("Sentinel-5P: no granule found for %s at (%.4f, %.4f)", date, lat, lon)
            return {f: None for f in self.provided_features}
        return self._extract_pixels(granule, lat, lon, token)

    # ------------------------------------------------------------------ #

    @with_retry(max_attempts=2, backoff_factor=2, timeout=30)
    def _get_token(self) -> str:
        resp = requests.post(
            _TOKEN_URL,
            data={
                "grant_type": "password",
                "client_id":  "cdse-public",
                "username":   os.environ["CDSE_USERNAME"],
                "password":   os.environ["CDSE_PASSWORD"],
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    @with_retry(max_attempts=3, backoff_factor=2, timeout=_TIMEOUT)
    def _search_granule(self, lat: float, lon: float, date: str, token: str) -> Optional[Dict]:
        start = f"{date}T00:00:00.000Z"
        end   = f"{date}T23:59:59.999Z"
        params = {
            "$filter": (
                f"Collection/Name eq 'SENTINEL-5P' and "
                f"Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' "
                f"and att/OData.CSC.StringAttribute/Value eq 'L2__NO2___') and "
                f"ContentDate/Start gt {start} and ContentDate/Start lt {end} and "
                f"OData.CSC.Intersects(area=geography'SRID=4326;POINT({lon} {lat})')"
            ),
            "$orderby": "ContentDate/Start desc",
            "$top":     1,
        }
        try:
            resp = requests.get(
                _ODATA_URL,
                params=params,
                headers={"Authorization": f"Bearer {token}"},
                timeout=_TIMEOUT,
            )
            resp.raise_for_status()
            items = resp.json().get("value", [])
            return items[0] if items else None
        except requests.RequestException as e:
            raise ConnectionError(f"Sentinel-5P: OData search failed — {e}") from e

    def _extract_pixels(self, granule: Dict, lat: float, lon: float, token: str) -> Dict[str, Any]:
        import h5py
        import numpy as np

        product_id = granule["Id"]
        with tempfile.TemporaryDirectory() as tmpdir:
            zip_path = os.path.join(tmpdir, "product.zip")
            try:
                r = requests.get(
                    f"{_DOWNLOAD_URL}({product_id})/$value",
                    headers={"Authorization": f"Bearer {token}"},
                    timeout=300,
                    stream=True,
                )
                r.raise_for_status()
                with open(zip_path, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
            except requests.RequestException as e:
                logger.warning("Sentinel-5P: download failed — %s", e)
                return {f: None for f in self.provided_features}

            import zipfile
            nc_path = os.path.join(tmpdir, "product.nc")
            try:
                with zipfile.ZipFile(zip_path, "r") as zf:
                    zf.extractall(tmpdir)
            except zipfile.BadZipFile:
                # CDSE zipper returns the NetCDF directly (not wrapped in zip)
                os.rename(zip_path, nc_path)

            nc_files = [
                os.path.join(root, fn)
                for root, _, files in os.walk(tmpdir)
                for fn in files
                if fn.endswith(".nc")
            ]
            if not nc_files:
                return {f: None for f in self.provided_features}

            result = {f: None for f in self.provided_features}
            with h5py.File(nc_files[0], "r") as hf:
                try:
                    lats = hf["PRODUCT/latitude"][0]
                    lons = hf["PRODUCT/longitude"][0]
                    qa   = hf["PRODUCT/qa_value"][0]

                    dist = (lats - lat) ** 2 + (lons - lon) ** 2
                    dist[qa < _QA_THRESHOLD] = np.inf
                    idx  = np.unravel_index(dist.argmin(), dist.shape)

                    def _val(path):
                        try:
                            return float(hf[path][0][idx])
                        except Exception:
                            return None

                    result["no2_tropospheric_column"] = _val(
                        "PRODUCT/nitrogendioxide_tropospheric_column"
                    )
                    result["so2_total_column"] = _val(
                        "PRODUCT/SUPPORT_DATA/DETAILED_RESULTS/sulfurdioxide_total_vertical_column"
                    )
                    result["co_total_column"] = _val(
                        "PRODUCT/carbonmonoxide_total_column"
                    )
                    result["aerosol_optical_depth"] = _val(
                        "PRODUCT/SUPPORT_DATA/INPUT_DATA/aerosol_optical_thickness_SWIR"
                    )
                except Exception as e:
                    logger.warning("Sentinel-5P: pixel extraction failed — %s", e)

        return result

    @staticmethod
    def _validate_inputs(lat: float, lon: float, date: str) -> None:
        if not (-90 <= lat <= 90):
            raise ValueError(f"Sentinel-5P: latitude {lat} out of range [-90, 90]")
        if not (-180 <= lon <= 180):
            raise ValueError(f"Sentinel-5P: longitude {lon} out of range [-180, 180]")
        try:
            datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            raise ValueError(f"Sentinel-5P: invalid date '{date}' — expected YYYY-MM-DD")
