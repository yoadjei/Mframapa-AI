"""canonical set of cities the service keeps warm.

one list, used by both the startup cache pre-warm and the /map-summary endpoint,
so every city shown on the continental map is already cached and answers instantly.
spread across north, west, east, central and southern africa.
"""

from typing import List, Tuple

# (name, lat, lon)
MAJOR_CITIES: List[Tuple[str, float, float]] = [
    # west
    ("Lagos", 6.52, 3.38),
    ("Accra", 5.60, -0.19),
    ("Abidjan", 5.36, -4.01),
    ("Dakar", 14.72, -17.47),
    ("Kano", 12.00, 8.59),
    ("Bamako", 12.64, -8.00),
    # north
    ("Cairo", 30.04, 31.24),
    ("Casablanca", 33.57, -7.59),
    ("Algiers", 36.75, 3.06),
    ("Khartoum", 15.50, 32.56),
    # east
    ("Nairobi", -1.29, 36.82),
    ("Addis Ababa", 9.03, 38.74),
    ("Dar es Salaam", -6.79, 39.21),
    ("Kampala", 0.35, 32.58),
    ("Kigali", -1.94, 29.87),
    # central
    ("Kinshasa", -4.32, 15.31),
    ("Douala", 4.05, 9.77),
    ("Luanda", -8.84, 13.23),
    # southern
    ("Johannesburg", -26.20, 28.04),
    ("Cape Town", -33.92, 18.42),
    ("Harare", -17.83, 31.03),
    ("Lusaka", -15.42, 28.28),
]

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
