"""Abstract base class for cache backends."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class BaseCache(ABC):

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """Return True if this backend is usable."""

    @abstractmethod
    def get(self, key: str) -> Optional[Dict[str, Any]]:
        """Return cached value or None on miss / expiry."""

    @abstractmethod
    def set(self, key: str, value: Dict[str, Any], ttl_seconds: int) -> None:
        """Store value with a TTL."""

    @abstractmethod
    def invalidate(self, key: str) -> None:
        """Remove a cached entry."""
