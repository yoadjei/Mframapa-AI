"""
episode detection — the core alert loop.

an episode is a sharp regional pm2.5 spike (harmattan onset, dust intrusion). a
city is flagged when today's pm2.5 exceeds twice its recent baseline and the aqi
category is in the unhealthy/hazardous range (guide §8.4). detection is pure so it
is testable; wiring to the token store + push is a thin orchestration layer.
"""

import logging
from typing import Any, Dict, Iterable, List, Optional, Sequence

logger = logging.getLogger(__name__)

# categories that qualify as an episode (case-insensitive substring match).
_EPISODE_MARKERS = ("unhealthy", "hazardous")
_DEFAULT_MULTIPLIER = 2.0


def is_episode_category(category: Optional[str]) -> bool:
    c = (category or "").lower()
    return any(m in c for m in _EPISODE_MARKERS)


def city_baseline(history_pm25: Sequence[float]) -> float:
    values = [float(v) for v in history_pm25 if v is not None]
    return sum(values) / len(values) if values else 0.0


def detect_episode(
    today_pm25: Optional[float],
    today_category: Optional[str],
    baseline_pm25: float,
    *,
    multiplier: float = _DEFAULT_MULTIPLIER,
) -> bool:
    if today_pm25 is None:
        return False
    if not is_episode_category(today_category):
        return False
    # Cold start (no Redis history yet): still alert on Unhealthy/Hazardous so
    # day-1 deployments are not silent until baselines accumulate.
    if baseline_pm25 <= 0:
        return True
    return float(today_pm25) > baseline_pm25 * multiplier


def scan_cities(
    city_records: Iterable[Dict[str, Any]],
    *,
    multiplier: float = _DEFAULT_MULTIPLIER,
) -> List[Dict[str, Any]]:
    """return one record per city currently in an episode.

    each input record: {name, lat, lon, history (list of pm25), today_pm25, today_category}.
    """
    episodes: List[Dict[str, Any]] = []
    for rec in city_records:
        baseline = city_baseline(rec.get("history", []))
        if detect_episode(rec.get("today_pm25"), rec.get("today_category"), baseline, multiplier=multiplier):
            episodes.append({
                "name": rec.get("name"),
                "lat": rec.get("lat"),
                "lon": rec.get("lon"),
                "today_pm25": rec.get("today_pm25"),
                "baseline_pm25": round(baseline, 1),
                "category": rec.get("today_category"),
            })
    logger.info("episode scan: %d episode(s) detected", len(episodes))
    return episodes
