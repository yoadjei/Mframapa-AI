"""rate limits — generous enough for a shared connection, bounded enough to bill for."""

import time

import pytest

from backend.api.security import _TIER_LIMITS, RateLimiter


@pytest.fixture
def limiter(monkeypatch):
    # exercise the in-memory path; redis is covered by the cache suite
    monkeypatch.setattr(RateLimiter, "_redis", staticmethod(lambda: None))
    return RateLimiter()


def _drain(limiter, key, tier, n):
    return [limiter.check(f"{key}", tier)[0] for _ in range(n)]


def test_anonymous_absorbs_a_screen_load_burst(limiter):
    """opening a screen fires several requests at once — that must not 429.

    the playback and map screens fan out on mount, and a shared office or campus
    connection multiplies that across real people behind one ip.
    """
    assert all(_drain(limiter, "ip:1.2.3.4", "anonymous", 40))


def test_anonymous_is_still_bounded(limiter):
    """burst is not a blank cheque — sustained abuse from one ip stops."""
    capacity = _TIER_LIMITS["anonymous"][0]
    results = _drain(limiter, "ip:9.9.9.9", "anonymous", capacity * 3)
    assert results[-1] is False


def test_bucket_refills_over_time(limiter, monkeypatch):
    """a user who waits gets more requests, unlike a fixed window that stays shut."""
    key = "ip:5.5.5.5"
    capacity = _TIER_LIMITS["anonymous"][0]
    _drain(limiter, key, "anonymous", capacity * 3)
    assert limiter.check(key, "anonymous")[0] is False

    real = time.time
    monkeypatch.setattr(time, "time", lambda: real() + 120)
    assert limiter.check(key, "anonymous")[0] is True


def test_signed_in_users_get_more_headroom_than_anonymous():
    assert _TIER_LIMITS["free"][0] > _TIER_LIMITS["anonymous"][0]
    assert _TIER_LIMITS["researcher"][0] > _TIER_LIMITS["free"][0]


def test_identities_are_isolated(limiter):
    """one noisy ip must not spend anyone else's budget."""
    _drain(limiter, "ip:1.1.1.1", "anonymous", _TIER_LIMITS["anonymous"][0] * 3)
    assert limiter.check("ip:2.2.2.2", "anonymous")[0] is True


def test_denial_reports_a_retry_after(limiter):
    key = "ip:7.7.7.7"
    _drain(limiter, key, "anonymous", _TIER_LIMITS["anonymous"][0] * 3)
    allowed, retry_after = limiter.check(key, "anonymous")
    assert allowed is False
    assert retry_after >= 1
