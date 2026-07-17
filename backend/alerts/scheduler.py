"""
daily alert scheduler.

orchestrates the episode scan -> push notifications -> radio bulletin. apscheduler
is imported lazily so the rest of the app doesn't depend on it. the live
prediction-history provider (redis-backed, from the precompute job) is injected at
deploy time; ``run_daily_scan`` itself is pure orchestration and fully testable.
"""

import logging
from typing import Any, Callable, Dict, List, Optional

from backend.alerts.episode_detector import scan_cities
from backend.alerts.push import send_push
from backend.alerts.radio_digest import format_bulletin
from backend.alerts.storage import PushTokenStore, get_push_store

logger = logging.getLogger(__name__)


def run_daily_scan(
    city_records: List[Dict[str, Any]],
    *,
    store: Optional[PushTokenStore] = None,
    digest_sink: Optional[Callable[[str], None]] = None,
    push: Optional[Callable[..., Any]] = None,
) -> List[Dict[str, Any]]:
    # detect episodes, notify nearby tokens, and emit a radio bulletin.
    episodes = scan_cities(city_records)
    store = store or get_push_store()
    send = push or send_push
    for ep in episodes:
        tokens = [t["token"] for t in store.near(ep["lat"], ep["lon"])]
        if tokens:
            send(
                tokens,
                f"Air quality alert: {ep['name']}",
                f"PM2.5 {ep['today_pm25']} — {ep['category']}. Take precautions.",
                data={"city": ep["name"], "pm25": ep["today_pm25"]},
            )
    bulletin = format_bulletin(episodes)
    if digest_sink:
        digest_sink(bulletin)
    return episodes


def build_scheduler(job: Callable[[], None], *, hour: int = 6):
    # a utc cron scheduler running ``job`` once daily; requires apscheduler.
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(job, "cron", hour=hour, id="daily_episode_scan", replace_existing=True)
    return scheduler


def main() -> None:  # pragma: no cover — deployment entry point
    logging.basicConfig(level=logging.INFO)
    logger.info(
        "scheduler ready. inject a redis-backed city_records provider (from the "
        "precompute job) into run_daily_scan to go live."
    )


if __name__ == "__main__":  # pragma: no cover
    main()
