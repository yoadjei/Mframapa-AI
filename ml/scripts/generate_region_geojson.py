"""
Build ``ml/data/african_regions.geojson`` from city coordinates.

Run from the repository root::

    python -m ml.scripts.generate_region_geojson
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

try:
    from shapely.geometry import MultiPoint, mapping
except ImportError as e:
    raise ImportError(
        "ml.scripts.generate_region_geojson requires the 'shapely' package. "
        "From the repo root: pip install -r requirements.txt"
    ) from e

from ml.paths import repository_root

ROOT = repository_root()
CITIES_PATH = ROOT / "backend" / "data" / "african_cities.json"
OUT_PATH = ROOT / "ml" / "data" / "african_regions.geojson"

# See ``ml.regions.REGION_CHECK_ORDER`` — same order for GeoJSON features list.
REGION_ORDER = (
    "horn_of_africa",
    "north_africa",
    "west_africa",
    "east_africa",
    "central_africa",
    "southern_africa",
)

BUFFER_DEG = 2.0


def main() -> None:
    with CITIES_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    cities = data["cities"]

    by_region: dict[str, list[tuple[float, float]]] = {r: [] for r in REGION_ORDER}
    for c in cities:
        r = c.get("region")
        if r in by_region:
            by_region[r].append((float(c["lon"]), float(c["lat"])))

    features = []
    for rid in REGION_ORDER:
        pts = by_region[rid]
        if len(pts) < 1:
            print(f"warning: no cities for {rid}", file=sys.stderr)
            continue
        hull = MultiPoint(pts).convex_hull.buffer(BUFFER_DEG)
        features.append(
            {
                "type": "Feature",
                "properties": {"region_id": rid, "name": rid.replace("_", " ").title()},
                "geometry": mapping(hull),
            }
        )

    fc = {"type": "FeatureCollection", "features": features}
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(fc, f, indent=2)
    print(f"Wrote {OUT_PATH} ({len(features)} regions)")


if __name__ == "__main__":
    main()
