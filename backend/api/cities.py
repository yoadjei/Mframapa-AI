"""canonical set of cities the service keeps warm.

one list, used by both the startup cache pre-warm and the /map-summary endpoint,
so every city shown on the continental map is already cached and answers instantly.

the list is derived from backend/data/african_cities.json rather than hand-typed:
every country contributes its largest city first, so no country is a blank space
on the map, and the rest is filled round-robin across regions. a hand-kept list
had drifted to 22 cities clustered in a few countries, which is exactly what the
map showed.
"""

import json
from itertools import cycle
from typing import Dict, List, Tuple

from ml.paths import repository_root

_CITIES_PATH = repository_root() / "backend" / "data" / "african_cities.json"

# every extra city costs one prediction on the startup pre-warm and on each
# map-summary rebuild (every 3h), so this trades map coverage against warm-up
# time. ~120 keeps all 55 countries plus the largest cities in each region.
MAP_CITY_TARGET = 120


def _load() -> List[Dict]:
    with _CITIES_PATH.open(encoding="utf-8") as f:
        return json.load(f)["cities"]


def _build_map_cities(target: int = MAP_CITY_TARGET) -> List[Tuple[str, float, float]]:
    """largest city of every country first, then round-robin across regions.

    the file is grouped by region and ordered by size within each, so the first
    occurrence of a country is its primary city. filling in file order instead
    would spend most of the budget on the first region in the file.
    """
    cities = _load()

    chosen: List[Dict] = []
    picked = set()                          # identity by (name, country)

    def take(c: Dict) -> None:
        key = (c["name"], c["country"])
        if key not in picked:
            picked.add(key)
            chosen.append(c)

    seen_countries = set()
    for c in cities:                        # one per country: full continental coverage
        if c["country"] not in seen_countries:
            seen_countries.add(c["country"])
            take(c)

    # remaining candidates per region, still ordered by size
    by_region: Dict[str, List[Dict]] = {}
    for c in cities:
        if (c["name"], c["country"]) not in picked:
            by_region.setdefault(c["region"], []).append(c)

    regions = cycle(sorted(by_region))
    exhausted = 0
    while len(chosen) < target and exhausted < len(by_region):
        bucket = by_region[next(regions)]
        if bucket:
            take(bucket.pop(0))
            exhausted = 0
        else:
            exhausted += 1

    return [(c["name"], float(c["lat"]), float(c["lon"])) for c in chosen[:target]]


# (name, lat, lon)
MAJOR_CITIES: List[Tuple[str, float, float]] = _build_map_cities()

# the timeline playback replays a fixed handful of cities, one per region. the
# set is fixed on purpose: it lets the server reconstruct the window once and
# serve the same payload to everyone, instead of every client reconstructing it.
PLAYBACK_CITIES: List[Tuple[str, float, float]] = [
    ("Accra", 5.60, -0.19),
    ("Lagos", 6.52, 3.38),
    ("Cairo", 30.04, 31.24),
    ("Nairobi", -1.29, 36.82),
    ("Kinshasa", -4.32, 15.31),
]
