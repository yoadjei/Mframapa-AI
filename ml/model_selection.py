"""Resolve export directory for a regional model bundle."""

from __future__ import annotations

from pathlib import Path


def regional_export_dir(region_id: str, segment: str, root: Path | None = None) -> Path:
    base = root or Path(__file__).resolve().parent
    return base / "exports" / region_id / segment
