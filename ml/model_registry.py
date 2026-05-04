"""Model registry JSON — tracks exported regional bundles."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class RegionalModelEntry:
    region_id: str
    segment: str
    xgboost_path: str
    lightgbm_path: str
    manifest_path: str
    r2_val: Optional[float]
    conformal_half_width: Optional[float]
    trained_at_utc: str


def default_registry_path(root: Optional[Path] = None) -> Path:
    base = root or Path(__file__).resolve().parent
    return base / "data" / "model_registry.json"


def load_registry(path: Path) -> Dict[str, Any]:
    if not path.is_file():
        return {"version": 1, "models": []}
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def save_registry(data: Dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def upsert_entry(entry: RegionalModelEntry, path: Optional[Path] = None) -> None:
    p = path or default_registry_path()
    data = load_registry(p)
    models: List[Dict[str, Any]] = data.setdefault("models", [])
    key = (entry.region_id, entry.segment)
    filtered = [m for m in models if (m.get("region_id"), m.get("segment")) != key]
    filtered.append(asdict(entry))
    data["models"] = filtered
    data["updated_at_utc"] = datetime.now(timezone.utc).isoformat()
    save_registry(data, p)
