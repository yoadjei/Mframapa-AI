"""
Emit JSON manifests of cities per region × urban/rural for training notebooks.

Run from the repository root::

    python -m ml.scripts.build_training_splits --out ml/data/splits
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from ml.paths import repository_root
from ml.regions import REGION_CHECK_ORDER
from ml.urban_rural import segment_from_city_record

ROOT = repository_root()
DEFAULT_CITIES = ROOT / "backend" / "data" / "african_cities.json"


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description="Build training split manifests from african_cities.json")
    ap.add_argument("--cities", type=Path, default=DEFAULT_CITIES, help="Path to african_cities.json")
    ap.add_argument("--out", type=Path, default=ROOT / "ml" / "data" / "splits", help="Output directory")
    args = ap.parse_args(argv)

    with args.cities.open(encoding="utf-8") as f:
        data = json.load(f)
    cities = data["cities"]

    args.out.mkdir(parents=True, exist_ok=True)
    summary = {"regions": {}, "files": []}

    for rid in REGION_CHECK_ORDER:
        summary["regions"][rid] = {"urban": 0, "rural": 0}
        for seg in ("urban", "rural"):
            subset = [
                c
                for c in cities
                if c.get("region") == rid and segment_from_city_record(c) == seg
            ]
            summary["regions"][rid][seg] = len(subset)
            out = args.out / f"{rid}_{seg}.json"
            payload = {
                "region_id": rid,
                "segment": seg,
                "n_cities": len(subset),
                "cities": subset,
            }
            with out.open("w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
            rel = str(out.relative_to(ROOT))
            summary["files"].append(rel)
            print(f"{rel}  ({len(subset)} cities)")

    summary_path = args.out / "summary.json"
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"Wrote {summary_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
