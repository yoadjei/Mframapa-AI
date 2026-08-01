"""Regenerate the PWA/mobile search city pack from the full backend dataset.

Map dots stay on MAJOR_CITIES (~200) via /map-summary. Search gets ~1000 places
with baked Aug–Dec usual afternoon climatology + typical PM2.5/AQI so list rows
are instant (no predict call until the user opens a city).
"""

from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone

from ml.paths import repository_root


def _season_for_demo_site(site) -> dict:
    """Pitch sites: lock August to the scripted payload; drift Sep–Dec seasonally."""
    from backend.api.aqi import aqi_category_from_pm25
    from backend.api import mock_aq as mock

    kind = {
        "manso": "mining",
        "nsuta": "mining",
        "damongo": "dust",
        "kejetia": "market",
    }.get(site.id)

    months: dict = {}
    for m in mock.USUAL_MONTHS:
        if m == 8:
            months["8"] = {
                "pm25": site.pm25,
                "aqi_category": aqi_category_from_pm25(site.pm25),
                "temp": site.weather["temp"],
                "humidity": site.weather["humidity"],
            }
            continue
        # Harmattan arc: drier, slightly dustier into Nov–Dec
        pm_bump = {9: 2.0, 10: 5.0, 11: 9.0, 12: 11.0}.get(m, 0.0)
        t_d = {9: 0.5, 10: 1.0, 11: 1.2, 12: 1.5}.get(m, 0.0)
        h_d = {9: -4.0, 10: -10.0, 11: -18.0, 12: -24.0}.get(m, 0.0)
        pm25 = round(min(92.0, site.pm25 + pm_bump), 2)
        months[str(m)] = {
            "pm25": pm25,
            "aqi_category": aqi_category_from_pm25(pm25),
            "temp": round(site.weather["temp"] + t_d, 1),
            "humidity": round(max(25.0, site.weather["humidity"] + h_d), 1),
        }

    now_m = datetime.now(timezone.utc).month
    pick = str(now_m) if str(now_m) in months else "8"
    top = months[pick]
    out = {
        "pm25": top["pm25"],
        "aqi_category": top["aqi_category"],
        "temp": top["temp"],
        "humidity": top["humidity"],
        "months": months,
    }
    if kind:
        out["kind"] = kind
    return out


def _usual_for(lat: float, lon: float, name: str) -> dict | None:
    """Prefer exact pitch-site payloads when they match; else spatial usual season."""
    from backend.api import demo_overrides as demo
    from backend.api import mock_aq as mock

    n = (name or "").strip().lower()
    for site in demo._SITES:
        if any(alias in n for alias in site.aliases) or (
            abs(lat - site.lat) <= 0.01 and abs(lon - site.lon) <= 0.01
        ):
            return _season_for_demo_site(site)

    return mock.usual_season(lat, lon)


def _usual_js(usual: dict) -> str:
    """Bundle fallback: top-level usual only (months live in the JSON pack)."""
    return (
        f'usual: {{ pm25: {usual["pm25"]}, aqi_category: "{usual["aqi_category"]}", '
        f'temp: {usual["temp"]}, humidity: {usual["humidity"]} }}'
    )


def main() -> None:
    path = repository_root() / "backend" / "data" / "african_cities.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    cities = data["cities"]

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
    print(f"backend total={len(cities)} countries={len({c['country'] for c in cities})}")

    pack = []
    seen = set()
    with_usual = 0
    for c in cities:
        key = (c["name"].lower(), c["country"].lower())
        if key in seen:
            continue
        seen.add(key)
        usual = _usual_for(float(c["lat"]), float(c["lon"]), c["name"])
        row = {
            "country": c["country"],
            "name": c["name"],
            "lat": c["lat"],
            "lon": c["lon"],
            "urban": bool(c.get("urban", True)),
        }
        if usual:
            slim = {
                "pm25": usual["pm25"],
                "aqi_category": usual["aqi_category"],
                "temp": usual["temp"],
                "humidity": usual["humidity"],
                "months": usual["months"],
            }
            if usual.get("kind"):
                slim["kind"] = usual["kind"]
            row["usual"] = slim
            with_usual += 1
        pack.append(row)

    out = {
        "version": "v5",
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "count": len(pack),
        "cities": pack,
        "usualNote": "Aug–Dec afternoon climatology + typical PM2.5; UI picks current month",
        "usualMonths": [8, 9, 10, 11, 12],
    }
    pack_path = repository_root() / "frontend-pwa" / "public" / "city-packs" / "top-cities.v5.json"
    pack_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"pack={out['count']} usual={with_usual} -> {pack_path.name}")

    js_path = repository_root() / "frontend-pwa" / "src" / "data" / "africanCities.js"
    lines = ["export const africanCities = [\n"]
    for c in pack:
        name = c["name"].replace("\\", "\\\\").replace('"', '\\"')
        country = c["country"].replace("\\", "\\\\").replace('"', '\\"')
        urban = "true" if c.get("urban", True) else "false"
        usual = c.get("usual")
        if usual:
            lines.append(
                f'  {{ country: "{country}", name: "{name}", lat: {c["lat"]}, lon: {c["lon"]}, urban: {urban}, {_usual_js(usual)} }},\n'
            )
        else:
            lines.append(
                f'  {{ country: "{country}", name: "{name}", lat: {c["lat"]}, lon: {c["lon"]}, urban: {urban} }},\n'
            )
    lines.append("];\n")
    js_path.write_text("".join(lines), encoding="utf-8")
    print(f"wrote africanCities.js n={len(pack)}")

    mobile_cities = []
    for c in cities:
        row = dict(c)
        usual = _usual_for(float(c["lat"]), float(c["lon"]), c["name"])
        if usual:
            slim = {
                "pm25": usual["pm25"],
                "aqi_category": usual["aqi_category"],
                "temp": usual["temp"],
                "humidity": usual["humidity"],
                "months": usual["months"],
            }
            if usual.get("kind"):
                slim["kind"] = usual["kind"]
            row["usual"] = slim
        mobile_cities.append(row)
    mobile_data = {**data, "cities": mobile_cities, "total": len(mobile_cities)}
    mobile_path = repository_root() / "mobile" / "src" / "data" / "african_cities.json"
    mobile_path.write_text(json.dumps(mobile_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"synced mobile african_cities.json n={len(mobile_cities)}")


if __name__ == "__main__":
    main()
