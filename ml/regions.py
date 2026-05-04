"""
African sub-region assignment for (lat, lon).

GeoJSON polygons are hulls around the 500-city dataset (buffered), checked in
priority order so overlapping areas resolve consistently with training splits.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Tuple, TYPE_CHECKING, Any

if TYPE_CHECKING:
    from shapely.geometry.base import BaseGeometry

logger = logging.getLogger(__name__)

from ml.paths import repository_root

# Overlaps (e.g. Sudan) are resolved by first match.
REGION_CHECK_ORDER: Tuple[str, ...] = (
    "horn_of_africa",
    "north_africa",
    "west_africa",
    "east_africa",
    "central_africa",
    "southern_africa",
)

_DEFAULT_GEOJSON = repository_root() / "ml" / "data" / "african_regions.geojson"


@lru_cache(maxsize=1)
def _load_region_geometries(geojson_path: str) -> Dict[str, Any]:
    try:
        from shapely.geometry import shape
    except ImportError:
        logger.warning("shapely not installed — region polygons unavailable")
        return {}

    path = Path(geojson_path)
    with path.open(encoding="utf-8") as f:
        fc = json.load(f)
    out: Dict[str, BaseGeometry] = {}
    for feat in fc.get("features", []):
        props = feat.get("properties") or {}
        rid = props.get("region_id")
        if not rid:
            continue
        out[str(rid)] = shape(feat["geometry"])
    return out


def assign_region(
    lat: float,
    lon: float,
    *,
    geojson_path: Optional[Path] = None,
) -> Optional[str]:
    """
    Return region_id for a WGS84 point, or None if outside all regions.
    """
    try:
        from shapely.geometry import Point
    except ImportError:
        logger.warning("shapely not installed — assign_region returns None")
        return None

    path = str(geojson_path or _DEFAULT_GEOJSON)
    geoms = _load_region_geometries(path)
    pt = Point(lon, lat)
    for rid in REGION_CHECK_ORDER:
        g = geoms.get(rid)
        if g is not None and g.covers(pt):
            return rid
    return None


def list_regions() -> List[str]:
    return list(REGION_CHECK_ORDER)
