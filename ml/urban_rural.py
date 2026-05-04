"""Urban vs rural classification for model routing."""

from __future__ import annotations

from typing import Any, Mapping, Optional

DEFAULT_POP_DENSITY_URBAN_THRESHOLD = 300.0


def classify_from_population_density(
    population_density: Optional[float],
    threshold: float = DEFAULT_POP_DENSITY_URBAN_THRESHOLD,
) -> str:
    if population_density is None:
        return "rural"
    return "urban" if float(population_density) >= threshold else "rural"


def segment_from_city_record(city: Mapping[str, Any]) -> str:
    return "urban" if city.get("urban") else "rural"
