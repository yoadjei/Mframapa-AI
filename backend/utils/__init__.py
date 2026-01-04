"""Mframapa AI Backend Utilities"""

from .geo import get_african_location
from .satellite import get_live_satellite_features
from .weather import get_weather, check_weather_api
from .database import init_db, save_report, get_all_reports, get_report_count
from .rate_limiter import check_rate_limit, rate_limiter
from .gemini import generate_insight, translate_strings, check_gemini_api, get_supported_languages

__all__ = [
    "get_african_location",
    "get_live_satellite_features",
    "get_weather",
    "check_weather_api",
    "init_db",
    "save_report",
    "get_all_reports",
    "get_report_count",
    "check_rate_limit",
    "rate_limiter",
    "generate_insight",
    "translate_strings",
    "check_gemini_api",
    "get_supported_languages",
]
