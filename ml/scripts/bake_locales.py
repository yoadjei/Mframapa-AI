"""Translate the UI catalog into every bundled language, once, at build time.

The app can translate at runtime, but the catalog is ~730 keys, which chunks
into roughly twenty provider calls per language. That is slow on a poor
connection, spends quota per user, and produces text nobody ever reviews. It
also fails completely without a key, which is how every bundle ended up at 54%
with the rest showing English.

Baking them here means the shipped app is fully localised offline, costs
nothing at runtime, and — the part that matters for a health app — the output
sits in the repo where a native speaker can read and correct it.

    python -m ml.scripts.bake_locales              # fill every gap
    python -m ml.scripts.bake_locales tw sw fr     # only these
    python -m ml.scripts.bake_locales --retranslate  # redo everything

Needs GEMINI_API_KEY in the environment (the repo-root .env is loaded).
"""

from __future__ import annotations

import argparse
import json
import pathlib
import sys
import time

from dotenv import load_dotenv

from ml.paths import repository_root

load_dotenv(repository_root() / ".env")

from backend.services import gemini_client  # noqa: E402  (needs env first)

LOCALES = repository_root() / "frontend-pwa" / "src" / "locales"
CHUNK = 25          # small enough that one bad chunk costs little
# gemini's free tier allows roughly 15 requests a minute; going faster just
# earns 429s. four seconds between calls keeps us under it, and a failed chunk
# backs off further rather than hammering.
PAUSE = 4.0
MAX_RETRIES = 4

LANGUAGE_NAMES = {
    "af": "Afrikaans", "am": "Amharic", "ar": "Arabic", "ee": "Ewe",
    "es": "Spanish", "fr": "French", "ga": "Ga", "ha": "Hausa", "ig": "Igbo",
    "mg": "Malagasy", "nd": "Ndebele", "ny": "Chichewa", "pt": "Portuguese",
    "rn": "Kirundi", "rw": "Kinyarwanda", "sn": "Shona", "so": "Somali",
    "ss": "Swati", "st": "Sotho", "sw": "Swahili", "ti": "Tigrinya",
    "tn": "Tswana", "tw": "Twi", "wo": "Wolof", "xh": "Xhosa",
    "yo": "Yoruba", "zu": "Zulu",
}


def looks_untranslated(value: str, english: str) -> bool:
    """the model sometimes echoes the source; never store that as a translation."""
    return value.strip().casefold() == english.strip().casefold()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("langs", nargs="*", help="language codes; default is all")
    ap.add_argument("--retranslate", action="store_true",
                    help="redo keys that already have a translation")
    args = ap.parse_args()

    if not gemini_client.is_available():
        print("GEMINI_API_KEY is not set; nothing to do.", file=sys.stderr)
        return 1

    english = json.loads((LOCALES / "en.json").read_text(encoding="utf-8"))
    targets = args.langs or sorted(
        p.stem for p in LOCALES.glob("*.json") if p.stem != "en"
    )

    grand_total = 0
    for code in targets:
        path = LOCALES / f"{code}.json"
        if not path.exists():
            print(f"{code}: no bundle, skipping")
            continue

        current = json.loads(path.read_text(encoding="utf-8"))
        todo = [
            k for k in english
            if args.retranslate or k not in current or looks_untranslated(current.get(k, ""), english[k])
        ]
        if not todo:
            print(f"{code}: already complete")
            continue

        print(f"{code} ({LANGUAGE_NAMES.get(code, code)}): {len(todo)} to translate", end="", flush=True)
        added = 0

        for i in range(0, len(todo), CHUNK):
            keys = todo[i:i + CHUNK]
            payload = {k: english[k] for k in keys}
            out = None
            for attempt in range(MAX_RETRIES):
                try:
                    out = gemini_client.translate_strings(
                        payload,
                        target_language=code,
                        target_language_name=LANGUAGE_NAMES.get(code),
                    )
                    break
                except Exception as exc:
                    throttled = "429" in str(exc)
                    if attempt == MAX_RETRIES - 1:
                        print(f"\n  chunk gave up: {str(exc)[:120]}", flush=True)
                        break
                    # back off, and much harder when the provider is throttling us
                    wait = (15 if throttled else 2) * (2 ** attempt)
                    print(f"\n  retrying in {wait}s", end="", flush=True)
                    time.sleep(wait)
            if out is None:
                continue

            for k in keys:
                value = (out.get(k) or "").strip()
                if value and not looks_untranslated(value, english[k]):
                    current[k] = value
                    added += 1
            print(".", end="", flush=True)
            time.sleep(PAUSE)

        # keep the file ordered like english so diffs stay readable
        ordered = {k: current[k] for k in english if k in current}
        ordered.update({k: v for k, v in current.items() if k not in english})
        path.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        coverage = 100 * len([k for k in english if k in ordered]) / len(english)
        grand_total += added
        print(f" +{added} -> {coverage:.1f}%", flush=True)

    print(f"\ndone: {grand_total} strings translated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
