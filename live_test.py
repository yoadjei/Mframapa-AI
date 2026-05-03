"""
Mframapa v2.0 — Live End-to-End Test
======================================
Run this on your LOCAL machine (not in the sandbox) where real API
credentials are available via .env and outbound internet is reachable.

Usage:
    cd v2.0
    pip install -r requirements.txt
    python live_test.py

What it tests:
    1. ERA5        — fetches weather variables for Accra, 2024-06-01
    2. Sentinel-5P — fetches tropospheric NO2 / AOD for same location
    3. MODIS MAIAC — fetches aerosol optical depth
    4. Open-Meteo  — fetches weather + AQ (always free, no auth)
    5. WorldPop    — fetches population density
    6. SRTM        — fetches elevation
    7. Orchestrator — runs full fallback pipeline for Accra
    8. Cache (Redis) — set / get round-trip via Upstash
    9. FeaturePipeline — assembles all feature groups end-to-end
"""

import os
import sys
import json
import traceback
from datetime import date, timedelta

# ── Load .env if present ──────────────────────────────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv optional; set env vars manually if needed

# ── Test config ───────────────────────────────────────────────────────────────
LAT    = 5.6037     # Accra, Ghana
LON    = -0.1870
DATE   = "2024-06-01"  # historical — cached by CDS within minutes


PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
SKIP = "\033[93m~\033[0m"

results: dict[str, str] = {}


def run(label: str, fn):
    """Run a test function, print result, record pass/fail/skip."""
    try:
        outcome = fn()
        if outcome is None:
            outcome = {}
        # show a short summary of returned keys
        keys = list(outcome.keys())[:5] if isinstance(outcome, dict) else []
        snippet = ", ".join(keys) + ("…" if len(keys) == 5 else "")
        print(f"  {PASS} {label}: {snippet or 'OK'}")
        results[label] = "pass"
    except SkipTest as e:
        print(f"  {SKIP} {label}: SKIPPED — {e}")
        results[label] = "skip"
    except Exception as e:
        print(f"  {FAIL} {label}: FAILED — {e}")
        if "--verbose" in sys.argv or "-v" in sys.argv:
            traceback.print_exc()
        results[label] = "fail"


class SkipTest(Exception):
    pass


# ── Individual tests ──────────────────────────────────────────────────────────

def test_open_meteo():
    """Always available — no auth required."""
    from backend.data_sources.open_meteo import OpenMeteoDataSource
    src = OpenMeteoDataSource()
    assert src.is_available
    data = src.fetch_data(LAT, LON, DATE)
    assert "temperature_2m" in data
    assert data["temperature_2m"] is not None
    return data


def test_srtm():
    """Always available — no auth required."""
    from backend.data_sources.srtm import SRTMDataSource
    src = SRTMDataSource()
    assert src.is_available
    data = src.fetch_data(LAT, LON, DATE)
    assert "elevation" in data
    return data


def test_worldpop():
    """REST API, no auth but rate-limited."""
    from backend.data_sources.worldpop import WorldPopDataSource
    src = WorldPopDataSource()
    assert src.is_available
    data = src.fetch_data(LAT, LON, DATE)
    assert "population_density" in data
    return data


def test_era5():
    """Requires CDSAPI_URL + CDSAPI_KEY."""
    from backend.data_sources.era5 import ERA5DataSource
    src = ERA5DataSource()
    if not src.is_available:
        raise SkipTest("CDSAPI credentials not set")
    data = src.fetch_data(LAT, LON, DATE)
    assert "temperature_2m" in data
    return data


def test_sentinel5p():
    """Requires CDSE_USERNAME + CDSE_PASSWORD."""
    from backend.data_sources.sentinel5p import Sentinel5PDataSource
    src = Sentinel5PDataSource()
    if not src.is_available:
        raise SkipTest("CDSE credentials not set")
    data = src.fetch_data(LAT, LON, DATE)
    assert "no2_tropospheric_column" in data
    return data


def test_modis():
    """Requires NASA_EARTHDATA_TOKEN."""
    from backend.data_sources.modis import MODISDataSource
    src = MODISDataSource()
    if not src.is_available:
        raise SkipTest("NASA_EARTHDATA_TOKEN not set")
    data = src.fetch_data(LAT, LON, DATE)
    assert "aerosol_optical_depth" in data
    return data


def test_orchestrator():
    """Full fallback pipeline — uses whatever sources are available."""
    from backend.data_sources.orchestrator import DataOrchestrator
    orch = DataOrchestrator()
    data = orch.get_features(LAT, LON, DATE)
    assert isinstance(data, dict)
    assert len(data) > 0
    print(f"       reliability: {json.dumps(orch.reliability_scores, indent=2)}")
    return data


def test_redis_cache():
    """Requires REDIS_URL (Upstash or local Redis)."""
    from backend.cache.redis_cache import RedisCache
    cache = RedisCache()
    if not cache.is_available:
        raise SkipTest("REDIS_URL not set or Redis unreachable")
    test_key = "mframapa:live_test:probe"
    test_val = {"probe": True, "date": DATE}
    cache.set(test_key, test_val, ttl_seconds=60)
    got = cache.get(test_key)
    assert got == test_val, f"Cache round-trip mismatch: {got}"
    cache.invalidate(test_key)
    assert cache.get(test_key) is None
    return {"round_trip": "ok", "invalidate": "ok"}


def test_feature_pipeline():
    """Full pipeline — combines orchestrator + WorldPop + SRTM."""
    from backend.pipeline.feature_pipeline import FeaturePipeline
    pipeline = FeaturePipeline()
    features = pipeline.get_features(LAT, LON, DATE)
    assert "temperature_2m" in features or "elevation" in features
    assert "elevation" in features          # SRTM always works
    return {k: v for k, v in features.items() if v is not None}


# ── Runner ────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "═" * 60)
    print("  Mframapa v2.0 — Live End-to-End Test")
    print(f"  Location: Accra, Ghana  ({LAT}, {LON})")
    print(f"  Date    : {DATE}")
    print("═" * 60 + "\n")

    # Always-on sources first
    run("Open-Meteo (weather + AQ)", test_open_meteo)
    run("SRTM elevation",            test_srtm)
    run("WorldPop density",          test_worldpop)

    # Credentialed sources
    run("ERA5 (Copernicus CDS)",     test_era5)
    run("Sentinel-5P (CDSE)",        test_sentinel5p)
    run("MODIS MAIAC (NASA)",        test_modis)

    # Integration layers
    run("DataOrchestrator (full fallback)", test_orchestrator)
    run("Redis cache (Upstash)",           test_redis_cache)
    run("FeaturePipeline (end-to-end)",    test_feature_pipeline)

    # Summary
    n_pass = sum(1 for v in results.values() if v == "pass")
    n_skip = sum(1 for v in results.values() if v == "skip")
    n_fail = sum(1 for v in results.values() if v == "fail")

    print("\n" + "─" * 60)
    print(f"  Results: {n_pass} passed, {n_skip} skipped, {n_fail} failed")
    print("─" * 60 + "\n")

    if n_fail:
        print("  Re-run with -v for full tracebacks.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
