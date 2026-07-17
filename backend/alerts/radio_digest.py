"""
radio digest — a short, plain-language air-quality bulletin a presenter can read.

near-zero logic, high distribution value: radio reaches more africans than
smartphones (scope §1). delivered as text/email per city.
"""

from datetime import date as dt_date
from typing import Any, Dict, List, Optional

_ADVICE = {
    "good": "Air quality is good. No precautions needed.",
    "moderate": "Air quality is moderate. Unusually sensitive people should take it easy outdoors.",
    "sensitive": "Sensitive groups — children, the elderly, and people with asthma — should limit prolonged outdoor exertion.",
    "unhealthy": "Everyone may feel effects. Limit outdoor activity, especially for children and the elderly.",
    "hazardous": "Health alert. Stay indoors, keep windows closed, and avoid outdoor exertion.",
}


def _advice_for(category: str) -> str:
    c = (category or "").lower()
    if "hazardous" in c:
        return _ADVICE["hazardous"]
    if "unhealthy" in c and "sensitive" not in c:
        return _ADVICE["unhealthy"]
    if "sensitive" in c:
        return _ADVICE["sensitive"]
    if "moderate" in c:
        return _ADVICE["moderate"]
    return _ADVICE["good"]


def format_digest(city_name: str, prediction: Dict[str, Any], day: Optional[str] = None) -> str:
    # one city's forecast as a readable script line.
    day = day or dt_date.today().isoformat()
    pm25 = prediction.get("pm25")
    category = prediction.get("aqi_category", "Unknown")
    return (
        f"Air quality for {city_name}, {day}: "
        f"PM2.5 around {pm25} micrograms per cubic metre ({category}). "
        f"{_advice_for(category)}"
    )


def format_bulletin(episodes: List[Dict[str, Any]], day: Optional[str] = None) -> str:
    # a multi-city episode bulletin for a regional broadcast.
    day = day or dt_date.today().isoformat()
    if not episodes:
        return f"Air quality bulletin, {day}: no pollution episodes detected."
    lines = [f"Air quality alert, {day}. Elevated pollution episodes detected in:"]
    for ep in episodes:
        lines.append(
            f"- {ep.get('name')}: PM2.5 {ep.get('today_pm25')} "
            f"(baseline {ep.get('baseline_pm25')}), {ep.get('category')}."
        )
    lines.append("Sensitive groups should stay indoors where possible.")
    return "\n".join(lines)
