"""Label Somaliland cities as Somalia for map country coverage (one ISO SOM)."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATHS = [
    ROOT / "backend" / "data" / "african_cities.json",
    ROOT / "mobile" / "src" / "data" / "african_cities.json",
]


def main() -> None:
    for path in PATHS:
        if not path.exists():
            print("skip missing", path)
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        n = 0
        for c in data["cities"]:
            if c.get("country") == "Somaliland":
                c["country"] = "Somalia"
                c["iso3"] = "SOM"
                n += 1
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{path}: relabeled {n} cities -> Somalia")


if __name__ == "__main__":
    main()
