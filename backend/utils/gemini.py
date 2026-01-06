"""Gemini API Wrapper for AI Insights and Translation"""

import os
import json
import requests
from typing import Dict

def get_gemini_api_key():
    """Get the Gemini API key from environment."""
    return os.getenv("GEMINI_API_KEY", "")

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

SUPPORTED_LANGUAGES = {
    "ar": "Arabic", "fr": "French", "pt": "Portuguese", "en": "English",
    "tn": "Tswana", "rn": "Kirundi", "es": "Spanish", "ti": "Tigrinya",
    "ss": "Swati", "am": "Amharic", "tw": "Twi", "sw": "Swahili",
    "st": "Sotho", "mg": "Malagasy", "ny": "Chichewa", "ha": "Hausa",
    "yo": "Yoruba", "ig": "Igbo", "rw": "Kinyarwanda", "wo": "Wolof",
    "so": "Somali", "zu": "Zulu", "xh": "Xhosa", "af": "Afrikaans",
    "sn": "Shona", "nd": "Ndebele", "ga": "Ga",
}

RTL_LANGUAGES = {"ar"}
_translation_cache: Dict[str, Dict[str, str]] = {}


def _call_gemini(prompt: str) -> str:
    """Call Gemini API."""
    api_key = get_gemini_api_key()
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        raise ValueError("GEMINI_API_KEY not configured")
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 500}
    }
    
    try:
        response = requests.post(
            f"{GEMINI_URL}?key={api_key}",
            headers={"Content-Type": "application/json"},
            json=payload, timeout=30
        )
        
        if response.status_code == 429:
            raise ValueError("Rate limit exceeded")
        if response.status_code != 200:
            raise ValueError(f"API error: {response.status_code}")
        
        data = response.json()
        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            if parts:
                return parts[0].get("text", "")
        
        raise ValueError("Empty response")
    except requests.exceptions.Timeout:
        raise ValueError("API timeout")


def generate_insight(pm25: float, aqi_category: str, weather: Dict, language: str = "en") -> str:
    """Generate AI health advice."""
    lang_name = SUPPORTED_LANGUAGES.get(language, "English")
    
    prompt = f"""You are an air quality health advisor for Africa. Generate a brief health recommendation:

PM2.5: {pm25}
Air Quality: {aqi_category}
Temperature: {weather.get('temperature', 'N/A')}C
Humidity: {weather.get('humidity', 'N/A')}%

Write 1-2 sentences in {lang_name}. Be practical and culturally appropriate."""

    return _call_gemini(prompt).strip()


def translate_strings(strings: Dict[str, str], target_language: str) -> Dict[str, str]:
    """Translate UI strings."""
    if target_language == "en":
        return strings
    
    lang_name = SUPPORTED_LANGUAGES.get(target_language)
    if not lang_name:
        raise ValueError(f"Unsupported language: {target_language}")
    
    cache_key = target_language
    if cache_key not in _translation_cache:
        _translation_cache[cache_key] = {}
    
    result = {}
    to_translate = {}
    
    for key, text in strings.items():
        if text in _translation_cache[cache_key]:
            result[key] = _translation_cache[cache_key][text]
        else:
            to_translate[key] = text
    
    if not to_translate:
        return result
    
    prompt = f"""Translate to {lang_name}. Return JSON only:
{json.dumps(to_translate, indent=2)}"""

    try:
        response = _call_gemini(prompt).strip()
        if response.startswith("```"):
            response = response.split("```")[1]
            if response.startswith("json"):
                response = response[4:]
        
        translations = json.loads(response)
        
        for key, translated in translations.items():
            _translation_cache[cache_key][to_translate.get(key, "")] = translated
            result[key] = translated
        
        return result
    except json.JSONDecodeError:
        return strings


def check_gemini_api() -> bool:
    """Check if Gemini API is configured."""
    try:
        api_key = get_gemini_api_key()
        if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
            return False
        _call_gemini("Say ok")
        return True
    except:
        return False


def get_supported_languages() -> Dict[str, str]:
    """Return supported languages."""
    return SUPPORTED_LANGUAGES.copy()
