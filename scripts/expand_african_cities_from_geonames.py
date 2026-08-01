"""Merge GeoNames Africa cities into backend/data/african_cities.json.

Uses cities5000 (population > 5k) for dense search coverage. Existing hand-curated
rows (pitch sites, preferred names) are kept and win on near-duplicate coords.
Map dots stay on MAJOR_CITIES (~200) via cities.py — this file is for search.
"""

from __future__ import annotations

import csv
import io
import json
import tempfile
import urllib.request
import zipfile
from collections import Counter
from pathlib import Path

from ml.paths import repository_root

GEONAMES_URL = "https://download.geonames.org/export/dump/cities5000.zip"

# ISO2 → (iso3, English country name, region_id)
_AFRICA: dict[str, tuple[str, str, str]] = {
    "DZ": ("DZA", "Algeria", "north_africa"),
    "AO": ("AGO", "Angola", "central_africa"),
    "BJ": ("BEN", "Benin", "west_africa"),
    "BW": ("BWA", "Botswana", "southern_africa"),
    "BF": ("BFA", "Burkina Faso", "west_africa"),
    "BI": ("BDI", "Burundi", "east_africa"),
    "CM": ("CMR", "Cameroon", "central_africa"),
    "CV": ("CPV", "Cape Verde", "west_africa"),
    "CF": ("CAF", "Central African Republic", "central_africa"),
    "TD": ("TCD", "Chad", "central_africa"),
    "KM": ("COM", "Comoros", "east_africa"),
    "CG": ("COG", "Congo", "central_africa"),
    "CD": ("COD", "DR Congo", "central_africa"),
    "CI": ("CIV", "Côte d'Ivoire", "west_africa"),
    "DJ": ("DJI", "Djibouti", "horn_of_africa"),
    "EG": ("EGY", "Egypt", "north_africa"),
    "GQ": ("GNQ", "Equatorial Guinea", "central_africa"),
    "ER": ("ERI", "Eritrea", "horn_of_africa"),
    "SZ": ("SWZ", "Eswatini", "southern_africa"),
    "ET": ("ETH", "Ethiopia", "horn_of_africa"),
    "GA": ("GAB", "Gabon", "central_africa"),
    "GM": ("GMB", "Gambia", "west_africa"),
    "GH": ("GHA", "Ghana", "west_africa"),
    "GN": ("GIN", "Guinea", "west_africa"),
    "GW": ("GNB", "Guinea-Bissau", "west_africa"),
    "KE": ("KEN", "Kenya", "east_africa"),
    "LS": ("LSO", "Lesotho", "southern_africa"),
    "LR": ("LBR", "Liberia", "west_africa"),
    "LY": ("LBY", "Libya", "north_africa"),
    "MG": ("MDG", "Madagascar", "east_africa"),
    "MW": ("MWI", "Malawi", "east_africa"),
    "ML": ("MLI", "Mali", "west_africa"),
    "MR": ("MRT", "Mauritania", "west_africa"),
    "MU": ("MUS", "Mauritius", "east_africa"),
    "MA": ("MAR", "Morocco", "north_africa"),
    "MZ": ("MOZ", "Mozambique", "southern_africa"),
    "NA": ("NAM", "Namibia", "southern_africa"),
    "NE": ("NER", "Niger", "west_africa"),
    "NG": ("NGA", "Nigeria", "west_africa"),
    "RW": ("RWA", "Rwanda", "east_africa"),
    "ST": ("STP", "São Tomé and Príncipe", "central_africa"),
    "SN": ("SEN", "Senegal", "west_africa"),
    "SC": ("SYC", "Seychelles", "east_africa"),
    "SL": ("SLE", "Sierra Leone", "west_africa"),
    "SO": ("SOM", "Somalia", "horn_of_africa"),
    "ZA": ("ZAF", "South Africa", "southern_africa"),
    "SS": ("SSD", "South Sudan", "east_africa"),
    "SD": ("SDN", "Sudan", "north_africa"),
    "TZ": ("TZA", "Tanzania", "east_africa"),
    "TG": ("TGO", "Togo", "west_africa"),
    "TN": ("TUN", "Tunisia", "north_africa"),
    "UG": ("UGA", "Uganda", "east_africa"),
    "EH": ("ESH", "Western Sahara", "north_africa"),
    "ZM": ("ZMB", "Zambia", "southern_africa"),
    "ZW": ("ZWE", "Zimbabwe", "southern_africa"),
}


def _download_cities5000(dest: Path) -> Path:
    dest.mkdir(parents=True, exist_ok=True)
    txt = dest / "cities5000.txt"
    if txt.exists() and txt.stat().st_size > 1_000_000:
        return txt
    zip_path = dest / "cities5000.zip"
    print(f"Downloading {GEONAMES_URL} …")
    urllib.request.urlretrieve(GEONAMES_URL, zip_path)
    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(dest)
    if not txt.exists():
        raise FileNotFoundError("cities5000.txt missing after extract")
    return txt


def _load_geonames(txt: Path) -> list[dict]:
    out: list[dict] = []
    with txt.open(encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for cols in reader:
            if len(cols) < 15:
                continue
            iso2 = cols[8]
            meta = _AFRICA.get(iso2)
            if not meta:
                continue
            iso3, country, region = meta
            try:
                lat = float(cols[4])
                lon = float(cols[5])
                pop = int(cols[14] or 0)
            except ValueError:
                continue
            name = (cols[1] or "").strip()
            if not name:
                continue
            out.append(
                {
                    "name": name,
                    "country": country,
                    "iso3": iso3,
                    "lat": round(lat, 4),
                    "lon": round(lon, 4),
                    "region": region,
                    "urban": pop >= 50_000,
                    "population": pop,
                }
            )
    return out


def _near(a: dict, b: dict, deg: float = 0.08) -> bool:
    return abs(a["lat"] - b["lat"]) <= deg and abs(a["lon"] - b["lon"]) <= deg


def merge(existing: list[dict], geonames: list[dict]) -> list[dict]:
    """Existing rows win; GeoNames fills gaps. Dedupe near-duplicates by pop."""
    kept: list[dict] = []
    # Start with curated rows (strip population if present for stable schema)
    for c in existing:
        kept.append(
            {
                "name": c["name"],
                "country": c["country"],
                "iso3": c.get("iso3") or "",
                "lat": float(c["lat"]),
                "lon": float(c["lon"]),
                "region": c.get("region") or "west_africa",
                "urban": bool(c.get("urban", True)),
            }
        )

    # Sort GeoNames by population desc so larger places claim a cell first
    geonames = sorted(geonames, key=lambda c: c.get("population", 0), reverse=True)
    for g in geonames:
        if any(_near(g, k) for k in kept):
            continue
        # Also skip exact name+country duplicates even if coords differ slightly
        key = (g["name"].lower(), g["country"].lower())
        if any((k["name"].lower(), k["country"].lower()) == key for k in kept):
            continue
        kept.append(
            {
                "name": g["name"],
                "country": g["country"],
                "iso3": g["iso3"],
                "lat": g["lat"],
                "lon": g["lon"],
                "region": g["region"],
                "urban": g["urban"],
            }
        )
    # Stable-ish order: region then name
    kept.sort(key=lambda c: (c["region"], c["country"], c["name"]))
    return kept


def main() -> None:
    root = repository_root()
    path = root / "backend" / "data" / "african_cities.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    existing = data["cities"]
    print(f"existing={len(existing)}")

    cache = Path(tempfile.gettempdir()) / "geonames-mframapa"
    txt = _download_cities5000(cache)
    geo = _load_geonames(txt)
    print(f"geonames_africa={len(geo)}")

    merged = merge(existing, geo)
    data["cities"] = merged
    data["total"] = len(merged)
    data["regions"] = dict(Counter(c["region"] for c in merged))
    data["urban"] = sum(1 for c in merged if c.get("urban"))
    data["rural"] = sum(1 for c in merged if not c.get("urban"))
    data["source"] = "geonames_cities5000+curated"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"wrote {path} total={len(merged)} countries={len({c['country'] for c in merged})}"
    )


if __name__ == "__main__":
    main()
