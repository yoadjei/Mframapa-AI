"""Copy urban/rural flags from mobile african_cities.json into PWA city pack + africanCities.js."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "mobile" / "src" / "data" / "african_cities.json"
PACK = ROOT / "frontend-pwa" / "public" / "city-packs" / "top-cities.v1.json"
JS = ROOT / "frontend-pwa" / "src" / "data" / "africanCities.js"


def key(name: str, country: str) -> str:
    return f"{(name or '').strip().lower()}|{(country or '').strip().lower()}"


def main() -> None:
    mobile = json.loads(MOBILE.read_text(encoding="utf-8"))
    by_key = {
        key(c["name"], c["country"]): bool(c.get("urban"))
        for c in mobile["cities"]
    }
    by_name = {}
    for c in mobile["cities"]:
        by_name.setdefault(c["name"].strip().lower(), bool(c.get("urban")))

    pack = json.loads(PACK.read_text(encoding="utf-8"))
    updated = 0
    for c in pack["cities"]:
        k = key(c["name"], c.get("country", ""))
        if k in by_key:
            c["urban"] = by_key[k]
            updated += 1
        elif c["name"].strip().lower() in by_name:
            c["urban"] = by_name[c["name"].strip().lower()]
            updated += 1
        else:
            # Capitals / large metros default urban when unknown
            c["urban"] = True
    pack["generatedAt"] = __import__("datetime").datetime.utcnow().isoformat() + "Z"
    PACK.write_text(json.dumps(pack, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"pack: urban flags on {updated}/{len(pack['cities'])} cities")

    # Patch africanCities.js entries in place
    text = JS.read_text(encoding="utf-8")
    # Match object literals: { country: "...", name: "...", lat: n, lon: n }
    pattern = re.compile(
        r'\{\s*country:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*lat:\s*([^,]+),\s*lon:\s*([^}]+)\}'
    )

    def repl(m: re.Match) -> str:
        country, name, lat, lon = m.group(1), m.group(2), m.group(3), m.group(4)
        urban = by_key.get(key(name, country), by_name.get(name.lower(), True))
        return (
            f'{{ country: "{country}", name: "{name}", lat: {lat}, lon: {lon}, '
            f"urban: {'true' if urban else 'false'} }}"
        )

    new_text, n = pattern.subn(repl, text)
    JS.write_text(new_text, encoding="utf-8")
    print(f"africanCities.js: patched {n} entries")


if __name__ == "__main__":
    main()
