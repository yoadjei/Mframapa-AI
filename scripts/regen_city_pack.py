"""Expand african_cities coverage and regenerate the PWA city pack."""

from __future__ import annotations

import importlib
import json
from collections import Counter
from datetime import datetime, timezone

from ml.paths import repository_root


def main() -> None:
    path = repository_root() / "backend" / "data" / "african_cities.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    cities = data["cities"]
    existing = {(c["name"].lower(), c["country"].lower()) for c in cities}

    extras = [
        {
            "name": "São Tomé",
            "country": "São Tomé and Príncipe",
            "iso3": "STP",
            "lat": 0.3365,
            "lon": 6.7273,
            "region": "central_africa",
            "urban": True,
        },
        {
            "name": "Victoria",
            "country": "Seychelles",
            "iso3": "SYC",
            "lat": -4.6191,
            "lon": 55.4513,
            "region": "east_africa",
            "urban": True,
        },
    ]
    added = 0
    for e in extras:
        key = (e["name"].lower(), e["country"].lower())
        if key not in existing:
            cities.append(e)
            added += 1

    for c in cities:
        if c["country"] == "Democratic Republic of the Congo":
            c["country"] = "DR Congo"
            c["iso3"] = "COD"

    data["cities"] = cities
    data["total"] = len(cities)
    data["regions"] = dict(Counter(c["region"] for c in cities))
    data["urban"] = sum(1 for c in cities if c.get("urban"))
    data["rural"] = sum(1 for c in cities if not c.get("urban"))
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"added={added} total={len(cities)} countries={len({c['country'] for c in cities})}")

    import backend.api.cities as C

    importlib.reload(C)
    selected = C._build_map_cities(280)
    loaded = C._load()
    pack = []
    for name, lat, lon in selected:
        match = next((x for x in loaded if x["name"] == name and abs(x["lat"] - lat) < 0.05), None)
        if not match:
            match = {"name": name, "country": "Unknown", "lat": lat, "lon": lon}
        pack.append(
            {
                "country": match["country"],
                "name": match["name"],
                "lat": match["lat"],
                "lon": match["lon"],
            }
        )

    have = {p["country"] for p in pack}
    for c in loaded:
        if c["country"] not in have:
            pack.insert(
                0,
                {
                    "country": c["country"],
                    "name": c["name"],
                    "lat": c["lat"],
                    "lon": c["lon"],
                },
            )
            have.add(c["country"])

    out = {
        "version": "v1",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "count": len(pack),
        "cities": pack,
    }
    pack_path = repository_root() / "frontend-pwa" / "public" / "city-packs" / "top-cities.v1.json"
    pack_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"pack={out['count']} countries={len({c['country'] for c in pack})}")

    js_path = repository_root() / "frontend-pwa" / "src" / "data" / "africanCities.js"
    lines = ["export const africanCities = [\n"]
    for c in pack:
        name = c["name"].replace("\\", "\\\\").replace('"', '\\"')
        country = c["country"].replace("\\", "\\\\").replace('"', '\\"')
        lines.append(
            f'  {{ country: "{country}", name: "{name}", lat: {c["lat"]}, lon: {c["lon"]} }},\n'
        )
    lines.append("];\n")
    js_path.write_text("".join(lines), encoding="utf-8")
    print(f"wrote africanCities.js n={len(pack)}")


if __name__ == "__main__":
    main()
