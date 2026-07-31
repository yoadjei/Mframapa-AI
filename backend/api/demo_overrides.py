"""Pitch-only overrides for four Ghana demo sites.

Gated by MFRAMAPA_DEMO_OVERRIDES=1. When off, predict is unchanged for everyone.

PM2.5 values are elevated but not theatrical — they map to Unhealthy /
Unhealthy for Sensitive Groups so badges, What to do, and factors stay coherent.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple


def demo_overrides_enabled() -> bool:
    return os.getenv("MFRAMAPA_DEMO_OVERRIDES", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@dataclass(frozen=True)
class DemoSite:
    id: str
    name: str
    lat: float
    lon: float
    pm25: float
    half_width: float
    factors: Dict[str, float]
    weather: Dict[str, float]
    insight: str
    # Accept these search / GPS name fragments (case-insensitive).
    aliases: Tuple[str, ...] = ()


# Coords: Manso from user DMS → 5.0833°N, 1.8333°W (rounded grid 5.08, -1.83).
# Nsuta ≈ GMC; Damongo dusty north; Kejetia market ≈ Adum/Kumasi centre.
#
# Weather = August afternoon (~14:00) climatology (pitch / field tests in August).
# Sources: weatherandclimate.com (Nsuta Aug high 29.8°C / RH 86%; Damongo Aug
# high 30.2°C / RH 81%); Kumasi Aug high ~28–29°C / RH ~84%; Manso Nkwanta
# Jul–Aug high ~28.8°C.
_SITES: Tuple[DemoSite, ...] = (
    DemoSite(
        id="manso",
        name="Manso",
        lat=5.0833,
        lon=-1.8333,
        pm25=82.0,  # Unhealthy (not Hazardous)
        half_width=14.0,
        factors={
            "dust_surface": 92.0,
            "aerosol_optical_depth": 0.78,
            "pm10_surface": 128.0,
            "population_density": 180.0,
            "elevation": 95.0,
        },
        # August afternoon — coolest months; humid mining belt
        weather={
            "temp": 28.9,
            "humidity": 84.0,
            "wind": 2.2,  # m/s
            "pressure": 1014.0,
            "precipitation": 0.0,
            "dew_point": 23.5,
            "cloud_cover": 62.0,
        },
        insight=(
            "Dust from the mining area is heavy today. Stay indoors where you can, "
            "cut outdoor work, and cover your face if you must go out."
        ),
        aliases=("manso",),
    ),
    DemoSite(
        id="nsuta",
        name="Nsuta",
        lat=5.2690,
        lon=-1.9730,
        pm25=71.0,  # Unhealthy — manganese site, elevated but believable
        half_width=12.0,
        factors={
            "dust_surface": 74.0,
            "aerosol_optical_depth": 0.62,
            "pm10_surface": 98.0,
            "population_density": 420.0,
            "elevation": 70.0,
        },
        # Nsuta August avg high 29.78°C, RH ~86%
        weather={
            "temp": 29.8,
            "humidity": 86.0,
            "wind": 2.0,
            "pressure": 1014.0,
            "precipitation": 0.0,
            "dew_point": 24.0,
            "cloud_cover": 64.0,
        },
        insight=(
            "Air is poor around the manganese works today. Limit time outside, "
            "postpone hard outdoor labour, and keep children indoors when you can."
        ),
        aliases=("nsuta", "ghana manganese", "gmc"),
    ),
    DemoSite(
        id="damongo",
        name="Damongo",
        lat=9.0830,
        lon=-1.8180,
        pm25=64.0,  # Unhealthy — dusty road
        half_width=11.0,
        factors={
            "dust_surface": 88.0,
            "aerosol_optical_depth": 0.55,
            "pm10_surface": 105.0,
            "population_density": 95.0,
            "elevation": 180.0,
        },
        # Damongo August avg high 30.18°C, RH ~81% (rainy-season north)
        weather={
            "temp": 30.2,
            "humidity": 81.0,
            "wind": 2.5,
            "pressure": 1013.0,
            "precipitation": 0.0,
            "dew_point": 24.5,
            "cloud_cover": 58.0,
        },
        insight=(
            "Road dust is high today. Avoid the roadside when you can, cover your "
            "face if you travel, and keep outdoor errands short."
        ),
        aliases=("damongo", "damango"),
    ),
    DemoSite(
        id="kejetia",
        name="Kejetia",
        lat=6.6985,
        lon=-1.6248,
        pm25=52.0,  # Unhealthy for Sensitive Groups — crowded market, not extreme
        half_width=9.0,
        factors={
            "population_density": 18500.0,
            "no2_tropospheric_column": 3.8e15,
            "aerosol_optical_depth": 0.41,
            "pm10_surface": 62.0,
            "dust_surface": 28.0,
        },
        # Kumasi August afternoon high ~28–29°C; humid market still air
        weather={
            "temp": 28.5,
            "humidity": 84.0,
            "wind": 1.4,
            "pressure": 1014.0,
            "precipitation": 0.0,
            "dew_point": 23.2,
            "cloud_cover": 60.0,
        },
        insight=(
            "Crowded market air is harder on sensitive people today. Keep children's "
            "time in the open shorter, and take it easy if you have a chest condition."
        ),
        aliases=("kejetia", "adum", "kumasi kejetia", "kejetia adum"),
    ),
)


def _norm_name(name: Optional[str]) -> str:
    if not name:
        return ""
    return re.sub(r"\s+", " ", name.strip().lower())


def match_demo_site(
    lat: float,
    lon: float,
    name: Optional[str] = None,
    *,
    radius_deg: float = 0.008,
) -> Optional[DemoSite]:
    """Match by alias name or by the API's 0.01° snap grid.

    Radius is tight so Kumasi (6.69) does not steal Kejetia (6.70).
    """
    if not demo_overrides_enabled():
        return None

    n = _norm_name(name)
    # Prefer alias so "Kejetia" / "Adum" win even if GPS is slightly off.
    if n:
        for site in _SITES:
            if any(alias in n for alias in site.aliases):
                return site

    rlat, rlon = round(lat, 2), round(lon, 2)
    for site in _SITES:
        if rlat == round(site.lat, 2) and rlon == round(site.lon, 2):
            return site
        if abs(lat - site.lat) <= radius_deg and abs(lon - site.lon) <= radius_deg:
            return site
    return None


def prediction_payload(site: DemoSite, request_name: str, lat: float, lon: float) -> Dict[str, Any]:
    from backend.api.aqi import aqi_category_from_pm25

    pm25 = site.pm25
    half = site.half_width
    display = request_name if request_name and request_name.lower() != "unknown" else site.name
    return {
        "pm25": pm25,
        "aqi_category": aqi_category_from_pm25(pm25),
        "degraded": False,
        "factors": dict(site.factors),
        "weather": dict(site.weather),
        "uncertainty": {
            "pm25_lower": round(max(0.0, pm25 - half), 2),
            "pm25_upper": round(pm25 + half, 2),
            "half_width": round(half, 2),
            "coverage": 0.9,
            "method": "demo_pitch",
        },
        "location": {"name": display, "lat": round(lat, 2), "lon": round(lon, 2)},
        "model": {
            "region_id": "west_africa",
            "segment": "urban",
            "version": "2.0.0",
            "source": "model_ensemble",
        },
    }


def insight_for_site(site: DemoSite) -> str:
    return site.insight
