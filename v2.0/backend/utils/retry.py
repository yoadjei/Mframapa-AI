"""
Reusable retry decorator with exponential backoff and per-attempt timeout.

Usage:
    from backend.utils.retry import with_retry

    @with_retry(max_attempts=3, backoff_factor=2, timeout=30)
    def my_api_call():
        ...
"""

import functools
import logging
import signal
import time
from typing import Tuple, Type

logger = logging.getLogger(__name__)


class RetryError(Exception):
    """Raised when all retry attempts are exhausted."""

    def __init__(self, attempts: int, last_error: Exception):
        self.attempts = attempts
        self.last_error = last_error
        super().__init__(
            f"Failed after {attempts} attempt(s). Last error: {last_error}"
        )


def _timeout_handler(signum, frame):
    raise TimeoutError("Operation timed out")


def with_retry(
    max_attempts: int = 3,
    backoff_factor: float = 2.0,
    timeout: int = 30,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
    reraise_on_exhaust: bool = True,
):
    """
    Decorator factory: retries the wrapped function up to *max_attempts* times
    with exponential backoff.  Each attempt is bounded by *timeout* seconds
    (implemented via SIGALRM on POSIX systems; silently skipped on Windows).

    Args:
        max_attempts:         Maximum number of attempts (including the first).
        backoff_factor:       Multiplier for successive wait times (1s, 2s, 4s …).
        timeout:              Per-attempt wall-clock limit in seconds.
        retryable_exceptions: Only retry on these exception types.
        reraise_on_exhaust:   If True, raise RetryError when all attempts fail.
                              If False, return None instead.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_error = None
            func_name = func.__qualname__

            for attempt in range(1, max_attempts + 1):
                # Install SIGALRM timeout (POSIX only)
                use_alarm = hasattr(signal, "SIGALRM")
                if use_alarm:
                    signal.signal(signal.SIGALRM, _timeout_handler)
                    signal.alarm(timeout)

                try:
                    result = func(*args, **kwargs)
                    if use_alarm:
                        signal.alarm(0)   # cancel alarm on success
                    return result

                except retryable_exceptions as e:
                    if use_alarm:
                        signal.alarm(0)
                    last_error = e
                    logger.warning(
                        "[%s] Attempt %d/%d failed: %s",
                        func_name, attempt, max_attempts, e,
                    )
                    if attempt < max_attempts:
                        wait = backoff_factor ** (attempt - 1)
                        logger.debug("[%s] Retrying in %.1fs…", func_name, wait)
                        time.sleep(wait)

                except Exception:
                    if use_alarm:
                        signal.alarm(0)
                    raise   # non-retryable — propagate immediately

            if reraise_on_exhaust:
                raise RetryError(max_attempts, last_error)
            return None

        return wrapper
    return decorator
