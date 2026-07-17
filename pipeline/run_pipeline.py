"""Run the fresh-pull training data pipeline in manifest order."""

from __future__ import annotations

import logging
import time

from pipeline.discover_stations import discover_stations
from pipeline.enrich_satellite import enrich
from pipeline.fetch_openaq import fetch_all
from pipeline.prepare_data import prepare
from pipeline.qa import run_qa


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    started = time.monotonic()
    if discover_stations() is None:
        return 1
    if not fetch_all() or not enrich() or not run_qa() or prepare() is None:
        return 1
    logging.info("Pipeline complete in %.1f minutes", (time.monotonic() - started) / 60)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
