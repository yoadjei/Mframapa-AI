"""Export the untranslated keys per language for an external agent to fill.

The Antigravity agent translates far better than a chunked API call and does not
touch our Gemini quota, but it needs clean, small inputs. This writes one file
per language into src/locales/_todo/ containing only the missing keys with their
English source. The agent translates the values in place; merge_translations.py
then folds them back in.

    python -m ml.scripts.export_missing            # every language
    python -m ml.scripts.export_missing fr sw tw   # only these
"""

from __future__ import annotations

import json
import sys

from ml.paths import repository_root

LOCALES = repository_root() / "frontend-pwa" / "src" / "locales"
TODO = LOCALES / "_todo"


def looks_untranslated(value: str, english: str) -> bool:
    return str(value).strip().casefold() == str(english).strip().casefold()


def main() -> int:
    english = json.loads((LOCALES / "en.json").read_text(encoding="utf-8"))
    only = sys.argv[1:]
    langs = only or sorted(
        p.stem for p in LOCALES.glob("*.json") if p.stem != "en"
    )

    TODO.mkdir(exist_ok=True)
    total = 0
    for code in langs:
        bundle = LOCALES / f"{code}.json"
        if not bundle.exists():
            print(f"{code}: no bundle, skipping")
            continue
        current = json.loads(bundle.read_text(encoding="utf-8"))
        missing = {
            k: english[k]
            for k in english
            if k not in current or looks_untranslated(current.get(k, ""), english[k])
        }
        out = TODO / f"{code}.json"
        if not missing:
            out.unlink(missing_ok=True)
            print(f"{code}: complete")
            continue
        out.write_text(json.dumps(missing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        total += len(missing)
        print(f"{code}: {len(missing)} to translate -> {out.relative_to(repository_root())}")

    print(f"\n{total} strings across {len(langs)} languages written to {TODO.relative_to(repository_root())}")
    print("Now run the agent task in docs/TRANSLATION_AGENT_TASK.md, then merge_translations.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
