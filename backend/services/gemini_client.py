"""
Gemini API client for translations and localized air-quality insights.

Requires GEMINI_API_KEY (https://aistudio.google.com/apikey).
Optional: GEMINI_MODEL (default gemini-2.0-flash).
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)

_GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
_DEFAULT_MODEL = "gemini-2.0-flash"
_TIMEOUT_SECONDS = 30

# In-process cache: translation bundles are stable for a given source hash + language.
_translation_cache: Dict[str, Dict[str, str]] = {}
_CACHE_MAX = 64

_LANGUAGE_NAMES: Dict[str, str] = {
    "af": "Afrikaans",
    "am": "Amharic",
    "ar": "Arabic",
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "ga": "Ga",
    "ha": "Hausa",
    "ig": "Igbo",
    "mg": "Malagasy",
    "nd": "Ndebele",
    "ny": "Chichewa",
    "pt": "Portuguese",
    "rn": "Kirundi",
    "rw": "Kinyarwanda",
    "sn": "Shona",
    "so": "Somali",
    "ss": "Swati",
    "st": "Sotho",
    "sw": "Swahili",
    "ti": "Tigrinya",
    "tn": "Tswana",
    "tw": "Twi",
    "wo": "Wolof",
    "xh": "Xhosa",
    "yo": "Yoruba",
    "zu": "Zulu",
}


def is_available() -> bool:
    return bool(os.getenv("GEMINI_API_KEY", "").strip())


def language_display_name(code: str, override: Optional[str] = None) -> str:
    if override and override.strip():
        return override.strip()
    return _LANGUAGE_NAMES.get(code.lower(), code)


def _model() -> str:
    return os.getenv("GEMINI_MODEL", _DEFAULT_MODEL).strip() or _DEFAULT_MODEL


def _api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("GEMINI_API_KEY is not configured")
    return key


def _generate_content(prompt: str, *, temperature: float = 0.2) -> str:
    url = f"{_GEMINI_BASE}/{_model()}:generateContent"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature},
    }
    # the key goes in a header, not the query string: request errors quote the
    # url, so a query-string key ends up in logs and sentry on every failure.
    resp = requests.post(
        url,
        headers={"x-goog-api-key": _api_key()},
        json=payload,
        timeout=_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    data = resp.json()
    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned no candidates")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(p.get("text", "") for p in parts).strip()
    if not text:
        raise RuntimeError("Gemini returned empty text")
    return text


def _parse_json_object(raw: str) -> Dict[str, Any]:
    cleaned = raw.strip()
    fence = re.match(r"^```(?:json)?\s*([\s\S]*?)\s*```$", cleaned, re.IGNORECASE)
    if fence:
        cleaned = fence.group(1).strip()
    return json.loads(cleaned)


def _cache_key(strings: Dict[str, str], target_language: str) -> str:
    payload = json.dumps(strings, sort_keys=True, ensure_ascii=False)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]
    return f"{target_language.lower()}:{digest}"


def _trim_cache() -> None:
    if len(_translation_cache) <= _CACHE_MAX:
        return
    for key in list(_translation_cache.keys())[: len(_translation_cache) - _CACHE_MAX]:
        _translation_cache.pop(key, None)


_CHUNK_MAX_KEYS = 35
_CHUNK_MAX_CHARS = 10_000


def _chunk_strings(strings: Dict[str, str]) -> List[Dict[str, str]]:
    """Split large catalogs so Gemini responses stay within token limits."""
    chunks: List[Dict[str, str]] = []
    current: Dict[str, str] = {}
    current_chars = 0

    for key, value in strings.items():
        entry_chars = len(key) + len(str(value)) + 8
        if current and (
            len(current) >= _CHUNK_MAX_KEYS
            or current_chars + entry_chars > _CHUNK_MAX_CHARS
        ):
            chunks.append(current)
            current = {}
            current_chars = 0
        current[key] = value
        current_chars += entry_chars

    if current:
        chunks.append(current)
    return chunks


def _translate_chunk(
    strings: Dict[str, str],
    *,
    target_language: str,
    source_language: str,
    target_language_name: Optional[str],
) -> Dict[str, str]:
    target_name = language_display_name(target_language, target_language_name)

    prompt = f"""You are a native {target_name} speaker localizing an air-quality health app used across Africa.
Rewrite each English UI string in {target_name} ({target_language}) the way a fluent local speaker would actually say it.

Translate meaning, not words:
- Sound natural and human, never like a literal machine translation. If a word-for-word version would feel stiff or foreign, rephrase it the way a local person would.
- Use everyday, respectful register. Keep it short and clear for a small mobile screen.
- Health guidance must stay accurate and actionable — a caregiver should immediately understand what to do.
- Adapt phrasing to local usage where it helps comprehension, but do not invent facts or change numbers.

Keep exactly as-is (do not translate):
- Placeholders like {{{{name}}}}, {{{{pm25}}}}, {{{{category}}}}.
- The product name "Mframapa".
- Technical tokens: PM2.5, PM10, AQI, NO2, SO2, CO, µg/m³.

Formatting:
- Return ONLY valid JSON with the exact same keys as the input. Do not add, remove, or reorder keys.
- Use simple punctuation. Do not use em dashes or en dashes; use a full stop or comma instead.
- Give ONLY the translated text. Never keep the English wording alongside it, and never add a
  gloss, transliteration or explanation in brackets. "Lite mode (mapu achepetsedwa)" is wrong;
  "mapu achepetsedwa" is right.

Input JSON:
{json.dumps(strings, ensure_ascii=False, indent=2)}
"""

    raw = _generate_content(prompt, temperature=0.1)
    parsed = _parse_json_object(raw)
    if not isinstance(parsed, dict):
        raise RuntimeError("Gemini translation response was not a JSON object")

    out: Dict[str, str] = {}
    for key, value in strings.items():
        translated = parsed.get(key)
        out[key] = _strip_source_echo(str(translated), value) if translated is not None else value
    return out


def _strip_source_echo(translated: str, source: str) -> str:
    """drop an english echo the model sometimes leaves in, e.g.
    "Lite mode (mapu achepetsedwa)" -> "mapu achepetsedwa". only fires when one
    side matches the source exactly, so real bracketed content is preserved."""
    match = re.match(r"^\s*(.+?)\s*\(([^()]+)\)\s*\.?\s*$", translated)
    if not match:
        return translated
    head, inner = match.group(1).strip(), match.group(2).strip()
    src = source.strip().rstrip(".").casefold()
    if head.rstrip(".").casefold() == src and inner:
        return inner
    if inner.rstrip(".").casefold() == src and head:
        return head
    return translated


def translate_strings(
    strings: Dict[str, str],
    *,
    target_language: str,
    source_language: str = "en",
    target_language_name: Optional[str] = None,
) -> Dict[str, str]:
    """Translate a key→string map via Gemini. Returns the same keys."""
    if not strings:
        return {}
    if target_language.lower() == source_language.lower():
        return dict(strings)

    cache_key = _cache_key(strings, target_language)
    if cache_key in _translation_cache:
        return dict(_translation_cache[cache_key])

    chunks = _chunk_strings(strings)
    out: Dict[str, str] = {}
    for chunk in chunks:
        out.update(
            _translate_chunk(
                chunk,
                target_language=target_language,
                source_language=source_language,
                target_language_name=target_language_name,
            )
        )

    _translation_cache[cache_key] = out
    _trim_cache()
    return out


def generate_air_quality_insight(
    *,
    pm25: float,
    aqi_category: str,
    weather: Dict[str, Any],
    language: str = "en",
    language_name: Optional[str] = None,
) -> str:
    """One-sentence localized insight for the current reading."""
    lang_name = language_display_name(language, language_name)
    weather_bits = []
    for k in ("temp", "humidity", "wind"):
        if k in weather and weather[k] is not None:
            weather_bits.append(f"{k}={weather[k]}")
    weather_summary = ", ".join(weather_bits) if weather_bits else "unknown"

    prompt = f"""Write exactly one short sentence (maximum 28 words) of practical air-quality advice for a user in Africa.

Language: {lang_name} (ISO code {language})
PM2.5: {pm25:.1f} µg/m³
AQI category: {aqi_category}
Weather: {weather_summary}

Be calm, specific, and actionable. Do not mention satellites, AI, or models. Output only the sentence in {lang_name}."""

    return _generate_content(prompt, temperature=0.4)
