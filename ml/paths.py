"""Locate the repository root (directory that contains ``backend/data/african_cities.json``)."""

from __future__ import annotations

from pathlib import Path

_MARKER = ("backend", "data", "african_cities.json")


def repository_root() -> Path:
    start = Path(__file__).resolve()
    for anc in start.parents:
        if (anc.joinpath(*_MARKER)).is_file():
            return anc
    raise RuntimeError(
        "Cannot find repository root — expected backend/data/african_cities.json in a parent of ml/"
    )
