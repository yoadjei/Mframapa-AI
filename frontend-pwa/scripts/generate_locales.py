"""
Fill every bundled locale JSON with all EN keys, translated via Google Translate.
Usage: python scripts/generate_locales.py  (from frontend-pwa directory)

No API key needed — uses deep_translator (unofficial Google Translate endpoint).
"""

import json, time, re, sys
from pathlib import Path
from deep_translator import GoogleTranslator

LOCALES = Path(__file__).parent.parent / "src" / "locales"
EN      = json.loads((LOCALES / "en.json").read_text("utf-8"))
EN_KEYS = list(EN.keys())

# Mapping from locale file code → Google Translate code
GOOGLE_CODE = {
    "af": "af", "am": "am", "ar": "ar", "ee": "ee",
    "es": "es", "fr": "fr", "ga": "ak",  # Ga → Akan (closest)
    "ha": "ha", "ig": "ig", "mg": "mg", "nd": "zu",  # Ndebele → Zulu (Nguni group)
    "ny": "ny", "pt": "pt", "rn": "sw", "rw": "rw",  # Kirundi → Swahili (Bantu proxy)
    "sn": "sn", "so": "so", "ss": "zu", "st": "st",  # Swati → Zulu (Nguni group)
    "sw": "sw", "ti": "ti", "tn": "nso", "tw": "ak",  # Tswana → Sepedi (Sotho-Tswana)
    "wo": "fr", "xh": "xh", "yo": "yo", "zu": "zu",  # Wolof → French (Francophone proxy)
}

# Placeholders in strings that must survive translation intact
PLACEHOLDER_RE = re.compile(r"\{\{[^}]+\}\}")


def protect(text):
    """Replace {{placeholders}} with tokens the translator won't touch."""
    tokens = {}
    def _sub(m):
        tok = f"XPLACEHOLDERX{len(tokens)}X"
        tokens[tok] = m.group(0)
        return tok
    safe = PLACEHOLDER_RE.sub(_sub, text)
    return safe, tokens


def restore(text, tokens):
    for tok, orig in tokens.items():
        text = text.replace(tok, orig)
    return text


def translate_batch(strings: dict, google_code: str) -> dict:
    """Translate a dict of {key: english_value} → {key: translated_value}."""
    result = {}
    translator = GoogleTranslator(source="en", target=google_code)

    for i, (key, value) in enumerate(strings.items()):
        safe, tokens = protect(value)
        try:
            raw = translator.translate(safe)
            result[key] = restore(raw or value, tokens)
        except Exception as exc:
            print(f"    skipping '{key}': {exc}")
            result[key] = value  # fall back to English
        if i % 20 == 19:
            time.sleep(1.0)  # brief pause every 20 strings
    return result


def process_locale(file: Path):
    lang = file.stem
    gcode = GOOGLE_CODE.get(lang)
    if not gcode:
        print(f"  {lang}: no Google code mapping — skipping")
        return

    existing = json.loads(file.read_text("utf-8")) if file.exists() else {}
    missing  = {k: EN[k] for k in EN_KEYS if not existing.get(k) or existing[k] == EN[k]}

    if not missing:
        print(f"  {lang}: already complete ✓")
        return

    print(f"  {lang} → {gcode}: translating {len(missing)} keys…")
    try:
        translated = translate_batch(missing, gcode)
    except Exception as exc:
        print(f"  {lang}: FAILED — {exc}")
        return

    merged  = {**existing, **translated}
    ordered = {k: merged.get(k, EN[k]) for k in EN_KEYS}
    file.write_text(json.dumps(ordered, indent=2, ensure_ascii=False) + "\n", "utf-8")
    print(f"  {lang}: saved ✓\n")


if __name__ == "__main__":
    files = sorted(f for f in LOCALES.glob("*.json") if f.name != "en.json")
    print(f"Processing {len(files)} locale files ({len(EN_KEYS)} keys each)…\n")
    for f in files:
        process_locale(f)
    print("\nDone.")
