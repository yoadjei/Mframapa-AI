"""Continent-wide mock air-quality field for pitch / demo.

Gated by MFRAMAPA_MOCK_AQ=1, or automatically when MFRAMAPA_DEMO_OVERRIDES=1
so a single pitch flag yields coherent map + tap readings across Africa.

This is not live sensor data. It synthesises PM2.5 from:
  - a clean rural baseline
  - soft Sahel / Sahara dust bands
  - Gaussian kernels around known pollution-prone sites
    (mining, industry, dense urban, markets, dusty roads, oil/gas)

Deterministic for a given lat/lon (and day for light day-to-day drift).
"""

from __future__ import annotations

import hashlib
import math
import os
from dataclasses import dataclass
from datetime import date as dt_date
from typing import Any, Dict, Optional, Tuple


def mock_aq_enabled() -> bool:
    """Mock field on when explicitly requested or when pitch demo overrides are on."""
    if os.getenv("MFRAMAPA_MOCK_AQ", "").strip().lower() in {"1", "true", "yes", "on"}:
        return True
    # Pitch flag also turns on the continental field so the map isn't empty/odd.
    return os.getenv("MFRAMAPA_DEMO_OVERRIDES", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


# Rough continental bbox (same spirit as the PWA map gate).
_AFRICA = dict(min_lat=-35.0, max_lat=37.5, min_lon=-18.0, max_lon=52.0)


def in_africa(lat: float, lon: float) -> bool:
    return (
        _AFRICA["min_lat"] <= lat <= _AFRICA["max_lat"]
        and _AFRICA["min_lon"] <= lon <= _AFRICA["max_lon"]
    )


@dataclass(frozen=True)
class Hotspot:
    """Local pollution kernel. peak_pm25 is the extra bump at the centre."""

    name: str
    lat: float
    lon: float
    peak: float  # µg/m³ contribution at centre
    sigma_deg: float  # ~0.08 ≈ 9 km, 0.35 ≈ 40 km
    kind: str  # mining | industrial | urban | market | dust | burning | oil


# Curated prone sites — peaks chosen so centres land Unhealthy / Sensitive,
# not theatrical Hazardous. Falloff leaves intervening countryside clean-ish.
_HOTSPOTS: Tuple[Hotspot, ...] = (
    # Ghana pitch corridor
    Hotspot("Manso mining", 5.0833, -1.8333, 68.0, 0.10, "mining"),
    Hotspot("Nsuta manganese", 5.2690, -1.9730, 57.0, 0.09, "mining"),
    Hotspot("Damongo road dust", 9.0830, -1.8180, 48.0, 0.12, "dust"),
    Hotspot("Kejetia market", 6.6985, -1.6248, 38.0, 0.05, "market"),
    Hotspot("Obuasi gold belt", 6.2000, -1.6830, 52.0, 0.12, "mining"),
    Hotspot("Tarkwa mining", 5.3000, -1.9950, 50.0, 0.11, "mining"),
    Hotspot("Accra urban core", 5.5600, -0.2050, 32.0, 0.18, "urban"),
    Hotspot("Tema industrial", 5.6700, 0.0160, 40.0, 0.10, "industrial"),
    # West Africa
    Hotspot("Lagos megacity", 6.5244, 3.3792, 48.0, 0.28, "urban"),
    Hotspot("Port Harcourt oil", 4.8156, 7.0498, 55.0, 0.16, "oil"),
    Hotspot("Warri / Delta flare", 5.5160, 5.7500, 50.0, 0.14, "oil"),
    Hotspot("Kano dusty basin", 12.0022, 8.5920, 42.0, 0.20, "dust"),
    Hotspot("Abidjan urban", 5.3600, -4.0083, 34.0, 0.18, "urban"),
    Hotspot("Kumasi metro", 6.6885, -1.6244, 28.0, 0.14, "urban"),
    Hotspot("Ibadan urban", 7.3775, 3.9470, 30.0, 0.16, "urban"),
    Hotspot("Onitsha / Anambra", 6.1450, 6.7870, 36.0, 0.10, "urban"),
    # North Africa
    Hotspot("Cairo industrial", 30.0444, 31.2357, 55.0, 0.25, "industrial"),
    Hotspot("Alexandria port", 31.2001, 29.9187, 38.0, 0.14, "industrial"),
    Hotspot("Casablanca urban", 33.5731, -7.5898, 30.0, 0.16, "urban"),
    Hotspot("Algiers urban", 36.7538, 3.0588, 28.0, 0.14, "urban"),
    # East Africa
    Hotspot("Nairobi urban", -1.2921, 36.8219, 34.0, 0.16, "urban"),
    Hotspot("Kampala urban", 0.3476, 32.5825, 30.0, 0.14, "urban"),
    Hotspot("Addis Ababa urban", 9.0320, 38.7469, 32.0, 0.16, "urban"),
    Hotspot("Dar es Salaam", -6.7924, 39.2083, 28.0, 0.14, "urban"),
    # Copperbelt / Central mining
    Hotspot("Lubumbashi copper", -11.6876, 27.5026, 58.0, 0.18, "mining"),
    Hotspot("Kolwezi mining", -10.7147, 25.4667, 56.0, 0.16, "mining"),
    Hotspot("Kitwe copperbelt", -12.8024, 28.2132, 52.0, 0.14, "mining"),
    Hotspot("Ndola industrial", -12.9987, 28.6366, 48.0, 0.12, "industrial"),
    # Southern Highveld (coal / industry)
    Hotspot("Mpumalanga Highveld", -26.1500, 29.1000, 62.0, 0.35, "industrial"),
    Hotspot("Secunda synthetic fuel", -26.5150, 29.1800, 58.0, 0.12, "industrial"),
    Hotspot("Vaal Triangle", -26.6700, 27.9300, 55.0, 0.18, "industrial"),
    Hotspot("Johannesburg metro", -26.2041, 28.0473, 40.0, 0.22, "urban"),
    Hotspot("Durban industrial", -29.8587, 31.0218, 36.0, 0.14, "industrial"),
    # Burning / charcoal corridors (soft, wide)
    Hotspot("Congo Basin edge burn", -2.0000, 18.0000, 22.0, 1.20, "burning"),
    Hotspot("Southern savanna burn", -15.0000, 28.0000, 18.0, 1.40, "burning"),
    Hotspot("West Africa burn belt", 8.5000, -2.0000, 16.0, 1.00, "burning"),
)


_KIND_INSIGHT = {
    "mining": (
        "Dust from mining and earth works is high here today. Stay indoors when you can, "
        "cut outdoor labour, and cover your face if you must go out."
    ),
    "industrial": (
        "Industrial emissions are weighing on the air today. Limit time outside, "
        "and keep children and anyone with chest problems indoors when you can."
    ),
    "urban": (
        "City traffic and cooking smoke are lifting particle levels. Prefer shade and "
        "shorter outdoor trips, especially for children and elders."
    ),
    "market": (
        "Crowded market air is harder on sensitive people today. Keep children's time "
        "in the open shorter, and take it easy if you have a chest condition."
    ),
    "dust": (
        "Road and soil dust is high today. Avoid the roadside when you can, cover your "
        "face if you travel, and keep outdoor errands short."
    ),
    "burning": (
        "Smoke from open burning is in the air today. Close windows if it smells smoky, "
        "and postpone heavy outdoor work until it clears."
    ),
    "oil": (
        "Oil and gas activity is elevating particles in this area. Limit outdoor exertion "
        "and keep sensitive people indoors when readings are high."
    ),
}


def _hash01(*parts: Any) -> float:
    h = hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()
    return int(h[:8], 16) / 0xFFFFFFFF


def _haversine_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Approximate great-circle distance in degrees of arc (enough for kernels)."""
    # Equirectangular in degrees — fine at hotspot scale across Africa.
    mid = math.radians((lat1 + lat2) * 0.5)
    dx = (lon1 - lon2) * math.cos(mid)
    dy = lat1 - lat2
    return math.hypot(dx, dy)


def _dust_band(lat: float, lon: float) -> float:
    """Soft Sahel / Sahara dust — higher inland 12–28°N, weaker near coasts."""
    if lat < 10 or lat > 30:
        return 0.0
    # Peak around 18–22°N
    lat_w = math.exp(-0.5 * ((lat - 20.0) / 5.5) ** 2)
    # Weaker over far west Atlantic fringe
    lon_w = 1.0 if -10 <= lon <= 40 else 0.35
    return 22.0 * lat_w * lon_w


def _hotspot_field(lat: float, lon: float) -> Tuple[float, Optional[str]]:
    total = 0.0
    top_kind: Optional[str] = None
    top_val = 0.0
    for hs in _HOTSPOTS:
        d = _haversine_deg(lat, lon, hs.lat, hs.lon)
        if d > hs.sigma_deg * 4:
            continue
        w = math.exp(-0.5 * (d / hs.sigma_deg) ** 2)
        contrib = hs.peak * w
        total += contrib
        if contrib > top_val:
            top_val = contrib
            top_kind = hs.kind
    return total, top_kind if top_val >= 8.0 else None


def pm25_at(lat: float, lon: float, day: Optional[str] = None) -> Optional[float]:
    """Synthetic PM2.5 for an Africa point, or None outside the mock domain."""
    if not in_africa(lat, lon):
        return None

    day = day or dt_date.today().isoformat()
    month = _month_of(day)
    noise = (_hash01("base", round(lat, 2), round(lon, 2)) - 0.5) * 6.0
    day_drift = (_hash01("day", day, round(lat, 1), round(lon, 1)) - 0.5) * 4.0

    # Clean countryside / remote highland baseline
    base = 10.5 + noise
    # Slightly higher near equator wet-season haze without hotspots
    if -5 <= lat <= 12:
        base += 3.0

    dust = _dust_band(lat, lon) * _dust_month_scale(lat, month)
    hot, _ = _hotspot_field(lat, lon)
    # Late-year biomass / harmattan bump (esp. Sahel + West Africa)
    seasonal = _pm25_month_bias(lat, month)

    pm = base + dust + hot + day_drift + seasonal
    # Believable envelope: clean Good/Moderate floor, Unhealthy ceiling — no Hazardous.
    pm = max(6.0, min(92.0, pm))
    return round(pm, 2)


USUAL_MONTHS: Tuple[int, ...] = (8, 9, 10, 11, 12)


def _month_of(day: Optional[str]) -> int:
    if not day:
        return dt_date.today().month
    try:
        return int(str(day)[5:7])
    except (TypeError, ValueError):
        return dt_date.today().month


def _dust_month_scale(lat: float, month: int) -> float:
    """Sahel / Sahara dust rises into the dry season (Oct–Dec)."""
    if lat < 8 or lat > 30:
        # Southern dry-season dust is milder; still ticks up Aug→Oct
        if lat < 0:
            return {8: 0.85, 9: 0.95, 10: 1.05, 11: 1.1, 12: 1.05}.get(month, 1.0)
        return 1.0
    return {8: 0.75, 9: 0.9, 10: 1.15, 11: 1.35, 12: 1.45}.get(month, 1.0)


def _pm25_month_bias(lat: float, month: int) -> float:
    """Extra particles: Harmattan / burning season vs wet-season washout."""
    # West + Sahel (roughly)
    if 4 <= lat <= 18:
        return {8: -4.0, 9: -1.0, 10: 3.0, 11: 8.0, 12: 10.0}.get(month, 0.0)
    # Southern Africa spring burn / winter dust
    if lat < -10:
        return {8: 5.0, 9: 4.0, 10: 2.0, 11: 0.0, 12: -1.0}.get(month, 0.0)
    # North Africa: late summer haze, milder by Dec
    if lat >= 28:
        return {8: 4.0, 9: 3.0, 10: 1.0, 11: -1.0, 12: -2.0}.get(month, 0.0)
    return {8: -2.0, 9: 0.0, 10: 2.0, 11: 4.0, 12: 5.0}.get(month, 0.0)


def usual_profile(lat: float, lon: float, *, day: str = "2026-08-15") -> Optional[Dict[str, Any]]:
    """One-month afternoon climatology + typical PM2.5 for search catalogs."""
    if not in_africa(lat, lon):
        return None

    from backend.api.aqi import aqi_category_from_pm25

    pm25 = pm25_at(lat, lon, day)
    if pm25 is None:
        return None
    wx = _weather_for(lat, lon, day)
    kind = dominant_kind(lat, lon)
    return {
        "pm25": pm25,
        "aqi_category": aqi_category_from_pm25(pm25),
        "temp": wx["temp"],
        "humidity": wx["humidity"],
        "kind": kind,
        "month": _month_of(day),
    }


def usual_season(
    lat: float,
    lon: float,
    *,
    months: Tuple[int, ...] = USUAL_MONTHS,
    year: int = 2026,
) -> Optional[Dict[str, Any]]:
    """Bake Aug–Dec (default) profiles. Top-level fields = current month if in range, else Aug."""
    if not in_africa(lat, lon):
        return None

    by_month: Dict[str, Dict[str, Any]] = {}
    kind: Optional[str] = None
    for m in months:
        day = f"{year}-{m:02d}-15"
        prof = usual_profile(lat, lon, day=day)
        if not prof:
            continue
        kind = kind or prof.get("kind")
        by_month[str(m)] = {
            "pm25": prof["pm25"],
            "aqi_category": prof["aqi_category"],
            "temp": prof["temp"],
            "humidity": prof["humidity"],
        }

    if not by_month:
        return None

    now_m = dt_date.today().month
    pick = str(now_m) if str(now_m) in by_month else str(months[0])
    top = by_month[pick]
    out: Dict[str, Any] = {
        "pm25": top["pm25"],
        "aqi_category": top["aqi_category"],
        "temp": top["temp"],
        "humidity": top["humidity"],
        "months": by_month,
    }
    if kind:
        out["kind"] = kind
    return out


def dominant_kind(lat: float, lon: float) -> Optional[str]:
    _, kind = _hotspot_field(lat, lon)
    return kind


def _weather_for(lat: float, lon: float, day: Optional[str]) -> Dict[str, float]:
    """Afternoon climatology by latitude band + month (Aug–Dec arc)."""
    month = _month_of(day)

    # Base = mid-August-ish afternoon.
    if lat >= 20:
        temp, humidity, wind = 33.0, 35.0, 3.5
    elif lat >= 10:
        temp, humidity, wind = 30.5, 68.0, 2.6
    elif lat >= 0:
        temp, humidity, wind = 29.0, 82.0, 2.1
    elif lat >= -15:
        temp, humidity, wind = 27.0, 55.0, 3.0
    else:
        temp, humidity, wind = 18.0, 45.0, 4.0

    # Month deltas (°C / RH pts) — Harmattan dries the north; south warms into spring/summer.
    if lat >= 10:
        # Sahel / North: Aug wet → Dec dry harmattan
        t_d = {8: 0.0, 9: 1.0, 10: 1.5, 11: 0.5, 12: -0.5}.get(month, 0.0)
        h_d = {8: 0.0, 9: -8.0, 10: -18.0, 11: -28.0, 12: -32.0}.get(month, 0.0)
    elif lat >= 0:
        # Guinean coast: rains ease, Dec drier
        t_d = {8: 0.0, 9: 0.5, 10: 1.0, 11: 1.5, 12: 2.0}.get(month, 0.0)
        h_d = {8: 0.0, 9: -4.0, 10: -10.0, 11: -16.0, 12: -20.0}.get(month, 0.0)
    elif lat >= -20:
        # Southern Africa: late winter → early summer
        t_d = {8: 0.0, 9: 2.5, 10: 5.0, 11: 7.0, 12: 8.5}.get(month, 0.0)
        h_d = {8: 0.0, 9: 2.0, 10: 5.0, 11: 8.0, 12: 10.0}.get(month, 0.0)
    else:
        t_d = {8: 0.0, 9: 2.0, 10: 4.0, 11: 6.0, 12: 7.0}.get(month, 0.0)
        h_d = {8: 0.0, 9: 3.0, 10: 6.0, 11: 8.0, 12: 10.0}.get(month, 0.0)

    temp += t_d
    humidity += h_d

    jitter = (_hash01("wx", round(lat, 2), round(lon, 2), day or "") - 0.5) * 1.6
    temp = round(temp + jitter, 1)
    humidity = round(max(18.0, min(92.0, humidity + jitter * 2)), 1)
    return {
        "temp": temp,
        "humidity": humidity,
        "wind": round(wind, 1),
        "pressure": 1013.0,
        "precipitation": 0.0,
        "dew_point": round(temp - (100 - humidity) / 5, 1),
        "cloud_cover": 55.0 if humidity > 70 else 35.0,
    }


def _factors_for(pm25: float, kind: Optional[str], lat: float, lon: float) -> Dict[str, float]:
    t = max(0.0, min(1.0, (pm25 - 10.0) / 80.0))
    dust = 15.0 + 90.0 * t
    aod = 0.12 + 0.75 * t
    pm10 = pm25 * (1.35 + 0.25 * t)
    pop = 80.0
    no2 = 5.0e14
    if kind in ("urban", "market"):
        pop = 8000.0 + 12000.0 * t
        no2 = 1.5e15 + 3.0e15 * t
        dust *= 0.55
    elif kind in ("mining", "dust"):
        dust = 40.0 + 70.0 * t
        pop = 120.0 + 400.0 * t
    elif kind in ("industrial", "oil"):
        no2 = 2.0e15 + 4.0e15 * t
        aod = 0.25 + 0.6 * t
        pop = 1500.0 + 4000.0 * t
    elif kind == "burning":
        aod = 0.35 + 0.55 * t
        dust = 25.0 + 40.0 * t

    elev = max(0.0, 200.0 + abs(lat) * 15.0)  # crude
    out: Dict[str, float] = {
        "dust_surface": round(dust, 1),
        "aerosol_optical_depth": round(aod, 2),
        "pm10_surface": round(pm10, 1),
        "population_density": round(pop, 1),
        "elevation": round(elev, 1),
    }
    if kind in ("urban", "market", "industrial", "oil"):
        out["no2_tropospheric_column"] = no2
    return out


def _region_for(lat: float, lon: float) -> str:
    try:
        from ml.regions import assign_region

        return assign_region(lat, lon) or "continental"
    except Exception:
        return "continental"


def prediction_payload(
    lat: float,
    lon: float,
    name: str,
    day: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """Full predict-shaped dict, or None if mock does not apply here."""
    if not mock_aq_enabled():
        return None
    pm25 = pm25_at(lat, lon, day)
    if pm25 is None:
        return None

    from backend.api.aqi import aqi_category_from_pm25

    kind = dominant_kind(lat, lon)
    half = round(6.0 + (pm25 / 92.0) * 10.0, 2)
    display = name if name and name.lower() != "unknown" else f"{lat:.2f}, {lon:.2f}"
    segment = "urban" if kind in ("urban", "market", "industrial") else "rural"

    return {
        "pm25": pm25,
        "aqi_category": aqi_category_from_pm25(pm25),
        "degraded": False,
        "factors": _factors_for(pm25, kind, lat, lon),
        "weather": _weather_for(lat, lon, day),
        "uncertainty": {
            "pm25_lower": round(max(0.0, pm25 - half), 2),
            "pm25_upper": round(pm25 + half, 2),
            "half_width": half,
            "coverage": 0.9,
            "method": "mock_spatial",
        },
        "location": {"name": display, "lat": round(lat, 2), "lon": round(lon, 2)},
        "model": {
            "region_id": _region_for(lat, lon),
            "segment": segment,
            "version": "2.0.0-mock",
            "source": "mock_spatial",
        },
        "_mock_kind": kind,
    }


def insight_for_point(lat: float, lon: float, language: str = "en") -> Optional[str]:
    if not mock_aq_enabled() or not in_africa(lat, lon):
        return None
    if language not in ("en", ""):
        return None
    kind = dominant_kind(lat, lon)
    if kind and kind in _KIND_INSIGHT:
        return _KIND_INSIGHT[kind]
    pm = pm25_at(lat, lon)
    if pm is None:
        return None
    if pm <= 12:
        return (
            "Air looks good here today. A fine day for outdoor errands and exercise."
        )
    if pm <= 35:
        return (
            "Air is moderate. Most people are fine outdoors; sensitive people may want "
            "shorter heavy exercise."
        )
    if pm <= 55:
        return (
            "Air is harder on sensitive groups. Children, elders, and anyone with a chest "
            "condition should take it easier outside."
        )
    return (
        "Air quality is poor today. Limit time outdoors, and keep windows closed if the "
        "air looks hazy."
    )
