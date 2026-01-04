"""Per-IP Rate Limiter with Daily Limits"""

import time
from collections import defaultdict
from threading import Lock
from typing import Tuple

RATE_LIMITS = {
    "predict": 15,
    "insight": 3,
    "translate": 2,
    "report": 3,
    "health": 10,
}

DAILY_LIMITS = {
    "insight": 50,
    "translate": 30,
}


class RateLimiter:
    """In-memory rate limiter with per-minute and daily limits."""
    
    def __init__(self):
        self._lock = Lock()
        self._requests = defaultdict(lambda: defaultdict(list))
        self._daily_counts = defaultdict(lambda: defaultdict(int))
        self._last_daily_reset = time.time()
    
    def _cleanup_old_requests(self, ip: str, endpoint: str, window_seconds: int = 60):
        now = time.time()
        cutoff = now - window_seconds
        self._requests[ip][endpoint] = [
            ts for ts in self._requests[ip][endpoint] if ts > cutoff
        ]
    
    def _reset_daily_if_needed(self):
        now = time.time()
        if now - self._last_daily_reset > 86400:
            with self._lock:
                self._daily_counts.clear()
                self._last_daily_reset = now
    
    def check_limit(self, ip: str, endpoint: str) -> Tuple[bool, str]:
        """Check if request is allowed."""
        self._reset_daily_if_needed()
        
        with self._lock:
            limit = RATE_LIMITS.get(endpoint, 10)
            self._cleanup_old_requests(ip, endpoint)
            
            if len(self._requests[ip][endpoint]) >= limit:
                return False, f"Rate limit exceeded. Max {limit} per minute."
            
            if endpoint in DAILY_LIMITS:
                daily_limit = DAILY_LIMITS[endpoint]
                if self._daily_counts[ip][endpoint] >= daily_limit:
                    return False, f"Daily limit exceeded. Max {daily_limit} per day."
            
            self._requests[ip][endpoint].append(time.time())
            if endpoint in DAILY_LIMITS:
                self._daily_counts[ip][endpoint] += 1
            
            return True, "OK"


rate_limiter = RateLimiter()


def check_rate_limit(ip: str, endpoint: str) -> Tuple[bool, str]:
    """Check rate limit for IP/endpoint."""
    return rate_limiter.check_limit(ip, endpoint)
