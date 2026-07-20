"""shared test environment — must be set before the app is imported."""

import os

# no live upstream calls during tests
os.environ.setdefault("PREWARM_ON_START", "0")
# key the suites authenticate with (matches the client fixture in test_api.py)
os.environ.setdefault("MFRAMAPA_INTERNAL_KEY", "mframapa-internal-dev-key")
# a real key in the developer's .env would otherwise make tests call gemini for
# real — slow, billable, and it made the "no gemini" test depend on live quota.
os.environ["GEMINI_API_KEY"] = ""

import pytest


@pytest.fixture(autouse=True)
def _reset_rate_limiter():
    """Every test starts with a clean rate-limit window.

    TestClient sends every request from the same host, so without this the whole
    suite shares one anonymous window (30/min) and tests start 429ing purely
    because earlier tests ran first. Isolating here keeps the real limits intact.
    """
    from backend.api.security import _limiter

    _limiter._mem_windows.clear()
    _limiter._mem_buckets.clear()
    yield
