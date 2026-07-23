"""Fold the agent's translations back into the locale bundles.

Reads each src/locales/_todo/<lang>.json (translated in place by the agent) and
merges it into src/locales/<lang>.json. Ordered like en.json so diffs stay
readable, and it refuses to write back a value that is still the English source
(the agent occasionally leaves a term untranslated) so a bundle never silently
regresses to English.

    python -m ml.scripts.merge_translations            # every _todo file
    python -m ml.scripts.merge_translations fr sw tw   # only these

Add --keep to leave the _todo files in place; by default a fully merged one is
deleted so it is obvious what still needs work.
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
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    keep = "--keep" in sys.argv

    if not TODO.exists():
        print(f"no {TODO.relative_to(repository_root())} directory; run export_missing first")
        return 1

    english = json.loads((LOCALES / "en.json").read_text(encoding="utf-8"))
    files = (
        [TODO / f"{c}.json" for c in args]
        if args
        else sorted(TODO.glob("*.json"))
    )

    grand = 0
    for todo_file in files:
        code = todo_file.stem
        bundle = LOCALES / f"{code}.json"
        if not todo_file.exists() or not bundle.exists():
            print(f"{code}: nothing to merge")
            continue

        translated = json.loads(todo_file.read_text(encoding="utf-8"))
        current = json.loads(bundle.read_text(encoding="utf-8"))

        added = 0
        skipped_english = 0
        for key, value in translated.items():
            text = str(value).strip()
            if not text:
                continue
            if key in english and looks_untranslated(text, english[key]):
                skipped_english += 1
                continue
            current[key] = text
            added += 1

        # order like english, keep any extra keys after
        ordered = {k: current[k] for k in english if k in current}
        ordered.update({k: v for k, v in current.items() if k not in english})
        bundle.write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        coverage = 100 * len([k for k in english if k in ordered]) / len(english)
        note = f" ({skipped_english} left English)" if skipped_english else ""
        grand += added
        print(f"{code}: +{added}{note} -> {coverage:.1f}%")

        # drop the todo file only when the bundle is now complete
        if not keep and all(k in ordered for k in english):
            todo_file.unlink()

    print(f"\nmerged {grand} strings")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
