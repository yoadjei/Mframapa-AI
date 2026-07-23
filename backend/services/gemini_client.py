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

    prompt = f"""You are a professional localiser and a native speaker of {target_name}.
You are translating the interface of Mframapa, an air quality app used across Africa by
ordinary people, many on small phones and many reading in their second or third language.

TASK
Translate each value in the input JSON into {target_name} ({target_language}).
Return the same keys, with translated values.

MEANING FIRST
- Translate what the sentence *does*, not word by word. If a literal rendering would read
  stiff, foreign or comic, rewrite it as a fluent speaker would actually say it.
- Everyday, respectful register. Not academic, not slangy, not corporate.
- Keep it short. These are buttons, labels and one line cards on a small screen. If the
  natural translation is much longer than the English, find a shorter way to say it.
- Health guidance must stay accurate and actionable. A caregiver has to know immediately
  what to do. Never soften a warning, never strengthen one, never invent a detail.

CAPITALISATION
- Follow the conventions of {target_name} itself, not English habits.
- English UI often title cases ("Saved Locations"). Most languages do not. Use the casing a
  native reader expects: usually sentence case, capital on the first word only.
- If the language has no letter case at all, ignore casing entirely.
- Preserve capitalisation that carries meaning: proper nouns, place names, acronyms.
- If the English is ALL CAPS for emphasis, do not copy that. Use normal casing; the app
  applies its own styling.
- Keep the first letter capitalised where the language would, even if the English key is
  lowercase.

PUNCTUATION AND NUMBERS
- Use the punctuation conventions of {target_name}, including its own quotation marks and
  spacing rules where they differ from English.
- Never use em dashes or en dashes. Use a comma or a full stop.
- Keep numerals as digits. Do not convert 17 into a word.
- Keep the decimal and thousands convention the language actually uses.

NEVER TRANSLATE
- Placeholders exactly as written: {{{{name}}}}, {{{{pm25}}}}, {{{{category}}}}, {{{{city}}}},
  {{{{count}}}}, {{{{low}}}}, {{{{high}}}}. Keep the braces, keep the spelling, keep them all.
- The product name "Mframapa".
- Units and technical tokens: PM2.5, PM10, AQI, NO2, SO2, CO, µg/m³.

FORBIDDEN
- Do not keep the English alongside the translation.
- Do not add a gloss, transliteration, explanation or note in brackets.
  "Lite mode (mapu achepetsedwa)" is wrong. "mapu achepetsedwa" is right.
- Do not add quotation marks that were not in the English.
- Do not add or drop keys, and do not reorder them.
- Do not return commentary. Only the JSON.
- If a term genuinely has no equivalent, use the widely understood loanword rather than
  inventing a new one, and do not mark it in any way.

OUTPUT
Return only valid JSON. Same keys as the input, translated values, nothing else.

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


# distinct angles on the same guidance, so a category's pool reads like advice
# from a person rather than one sentence reshuffled.
_INSIGHT_ANGLES = [
    "what to do outdoors right now",
    "who should be most careful today",
    "whether windows should be open or closed",
    "exercise timing",
    "protecting children",
    "protecting older relatives",
    "commuting and traffic fumes",
    "cooking smoke indoors",
    "when conditions usually improve during the day",
    "whether a mask is worth wearing",
    "signs to watch for in your breathing",
    "a simple reassurance if conditions are fine",
]


def generate_air_quality_insight(
    *,
    pm25: float,
    aqi_category: str,
    weather: Dict[str, Any],
    language: str = "en",
    language_name: Optional[str] = None,
    variant: int = 0,
) -> str:
    """One-sentence localized insight for the current reading.

    ``variant`` asks for a different angle on the same advice so a pool of lines
    for one category does not come back as twelve rewordings of one sentence.
    """
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

Be calm, specific, and actionable. Do not mention satellites, AI, or models.
Take this angle: {_INSIGHT_ANGLES[variant % len(_INSIGHT_ANGLES)]}
Do not start with the same word every time. Output only the sentence in {lang_name}."""

    # higher temperature for later variants so the pool does not converge
    return _generate_content(prompt, temperature=0.4 if variant == 0 else 0.9)
