"""
Precompute cache job — fetches features for all 500 African cities
and stores them in Redis (+ SQLite fallback) so the API can serve
responses instantly without hitting satellite APIs at request time.

Designed to run nightly via GitHub Actions (see .github/workflows/).

Usage:
    python -m backend.jobs.precompute_cache

    # Specific date (default: today UTC):
    python -m backend.jobs.precompute_cache --date 2024-06-01

    # Specific region only:
    python -m backend.jobs.precompute_cache --region west_africa

    # Dry run (fetch but don't cache):
    python -m backend.jobs.precompute_cache --dry-run
"""

import argparse
import json
import logging
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from backend.cache.cache_manager import CachedOrchestrator, CacheManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

_CITIES_FILE  = Path(__file__).parent.parent / "data" / "african_cities.json"
_REQUEST_DELAY = 1.5   # seconds between API calls (rate limit courtesy)


def load_cities(region: Optional[str] = None) -> list:
    """Load the African cities dataset, optionally filtered by region."""
    if not _CITIES_FILE.exists():
        raise FileNotFoundError(f"Cities file not found: {_CITIES_FILE}")

    with open(_CITIES_FILE, encoding="utf-8") as f:
        data = json.load(f)

    cities = data["cities"]
    if region:
        cities = [c for c in cities if c.get("region") == region]
        logger.info("Filtered to region '%s': %d cities", region, len(cities))
    else:
        logger.info("Loaded %d cities across all regions", len(cities))

    return cities


def precompute(
    date: Optional[str] = None,
    region: Optional[str] = None,
    dry_run: bool = False,
) -> dict:
    """
    Main precompute routine.

    Args:
        date:    Date to fetch data for (YYYY-MM-DD). Defaults to today UTC.
        region:  Optional region filter (e.g. 'west_africa').
        dry_run: If True, fetch data but do not write to cache.

    Returns:
        Summary dict with counts of successes, failures, skips.
    """
    date   = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    cities = load_cities(region)

    logger.info("=" * 60)
    logger.info("Precompute job starting")
    logger.info("  Date     : %s", date)
    logger.info("  Cities   : %d", len(cities))
    logger.info("  Dry run  : %s", dry_run)
    logger.info("=" * 60)

    cached_orch = CachedOrchestrator()
    cache       = cached_orch.cache

    results = {"success": 0, "failure": 0, "already_cached": 0}
    start   = time.time()

    for i, city in enumerate(cities, 1):
        name = city["name"]
        lat  = city["lat"]
        lon  = city["lon"]

        # Skip if already in cache (avoids redundant API calls on re-runs)
        if not dry_run and cache.get(lat, lon, date) is not None:
            logger.debug("[%d/%d] SKIP (cached): %s", i, len(cities), name)
            results["already_cached"] += 1
            continue

        logger.info("[%d/%d] Fetching: %s, %s (%.4f, %.4f)",
                    i, len(cities), name, city.get("country", "?"), lat, lon)

        try:
            features = cached_orch.get_features(lat=lat, lon=lon, date=date)

            resolved = sum(1 for v in features.values() if v is not None)
            total    = len(features)
            logger.info("         ✓ %d/%d features resolved", resolved, total)

            results["success"] += 1

        except Exception as e:
            logger.error("         ✗ Failed: %s", e)
            results["failure"] += 1

        time.sleep(_REQUEST_DELAY)

    elapsed = time.time() - start
    logger.info("=" * 60)
    logger.info("Precompute complete in %.1fs", elapsed)
    logger.info("  Success        : %d", results["success"])
    logger.info("  Already cached : %d", results["already_cached"])
    logger.info("  Failed         : %d", results["failure"])
    logger.info("  Cache backend  : %s",
                "Redis + SQLite" if cache.redis_available else "SQLite only")
    logger.info("=" * 60)

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Pre-compute and cache features for all African cities."
    )
    parser.add_argument(
        "--date", default=None,
        help="Date to fetch (YYYY-MM-DD). Defaults to today UTC.",
    )
    parser.add_argument(
        "--region", default=None,
        choices=["west_africa", "east_africa", "north_africa",
                 "central_africa", "southern_africa", "horn_of_africa"],
        help="Only process cities in this region.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Fetch data but do not write to cache.",
    )
    args = parser.parse_args()
    precompute(date=args.date, region=args.region, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
