"""Abstract base class for all Mframapa data sources."""

from abc import ABC, abstractmethod
from typing import Dict, Any, List


class DataSource(ABC):
    """
    Base class for every data connector.

    Subclasses must implement:
        - source_name       : human-readable name used in logs / reliability scores
        - provided_features : list of feature keys this source can return
        - is_available      : True if credentials / packages are present
        - fetch_data        : perform the actual data retrieval
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Human-readable identifier (e.g. 'ERA5', 'Sentinel-5P')."""

    @property
    @abstractmethod
    def provided_features(self) -> List[str]:
        """Feature keys this source can supply (e.g. ['temperature_2m', 'pblh'])."""

    @property
    @abstractmethod
    def is_available(self) -> bool:
        """
        Return True when the source is usable.
        Typically checks for credentials or optional package availability.
        """

    @abstractmethod
    def fetch_data(self, lat: float, lon: float, date: str) -> Dict[str, Any]:
        """
        Retrieve data for the given location and date.

        Args:
            lat:  Latitude  in decimal degrees (-90 … 90).
            lon:  Longitude in decimal degrees (-180 … 180).
            date: ISO-8601 date string (YYYY-MM-DD).

        Returns:
            Dict mapping feature names to values (float or None).

        Raises:
            ValueError:      Invalid lat/lon/date.
            ConnectionError: Network or API failure (retriable).
            RuntimeError:    Misconfiguration or unrecoverable error.
        """
