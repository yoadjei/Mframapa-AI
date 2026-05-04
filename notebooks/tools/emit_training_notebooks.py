#!/usr/bin/env python3
"""Generate ``00_prepare_training_assets.ipynb`` and 12 regional training notebooks."""

from __future__ import annotations

import json
from pathlib import Path

_MARK = Path("backend") / "data" / "african_cities.json"

# Default matches ``origin`` for this repo; override in Colab with env ``MFRAMAPA_CLONE_URL``.
_DEFAULT_CLONE_URL = "https://github.com/yoadjei/Mframapa-AI.git"


def _repo_root() -> Path:
    p = Path(__file__).resolve()
    for anc in p.parents:
        if (anc / _MARK).is_file():
            return anc
    raise RuntimeError("Place this file under notebooks/tools/ (need african_cities.json marker).")


ROOT = _repo_root()
NB_DIR = ROOT / "notebooks"

META = {
    "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
    "language_info": {"name": "python", "version": "3.12.0"},
}

NOTEBOOK_BOOTSTRAP = rf'''import importlib.util
import os
from pathlib import Path
import subprocess
import sys

REPO_CLONE_URL = os.environ.get("MFRAMAPA_CLONE_URL", "{_DEFAULT_CLONE_URL}")
IN_COLAB = "COLAB_GPU" in os.environ or "COLAB_RELEASE_TAG" in os.environ
REQUIRED_MODULES = ("numpy", "pandas", "sklearn", "xgboost", "lightgbm", "shapely")


def _looks_like_repo(path: Path) -> bool:
    return (
        (path / "backend" / "data" / "african_cities.json").is_file()
        and (path / "ml").is_dir()
    )


def _missing_runtime_modules() -> list[str]:
    return [name for name in REQUIRED_MODULES if importlib.util.find_spec(name) is None]


def _candidate_roots() -> list[Path]:
    cwd = Path.cwd().resolve()
    candidates: list[Path] = [cwd, *cwd.parents]

    env_repo = os.environ.get("MFRAMAPA_REPO_DIR")
    if env_repo:
        env_path = Path(env_repo).expanduser()
        candidates.extend([env_path, *env_path.parents])

    candidates.extend(
        [
            Path("/content/Mframapa-AI"),
            Path("/content/Mframapa"),
            Path("/content/drive/MyDrive/Mframapa-AI"),
            Path("/content/drive/MyDrive/Mframapa"),
            Path.home() / "Mframapa-AI",
            Path.home() / "Mframapa",
        ]
    )

    seen: set[Path] = set()
    unique: list[Path] = []
    for candidate in candidates:
        try:
            resolved = candidate.resolve()
        except FileNotFoundError:
            resolved = candidate.absolute()
        if resolved not in seen:
            seen.add(resolved)
            unique.append(resolved)
    return unique


def _find_repo_root() -> Path | None:
    return next((candidate for candidate in _candidate_roots() if _looks_like_repo(candidate)), None)


def _bootstrap_repo(*, install_deps: bool) -> Path | None:
    root = _find_repo_root()

    if root is None and IN_COLAB:
        repo_dir = Path(os.environ.get("MFRAMAPA_REPO_DIR", "/content/Mframapa-AI")).expanduser()
        if not _looks_like_repo(repo_dir):
            print(f"Cloning repo into {{repo_dir}}...")
            result = subprocess.run(
                ["git", "clone", REPO_CLONE_URL, str(repo_dir)],
                capture_output=True,
                text=True,
            )
            if result.returncode != 0 or not repo_dir.is_dir():
                if result.stderr:
                    print(result.stderr)
                raise RuntimeError(
                    "Git clone failed. If the repo is private, mount Google Drive and "
                    "upload the repo there, then set MFRAMAPA_REPO_DIR to its path."
                )
            print("Cloned successfully.")
        root = _find_repo_root() or (repo_dir if _looks_like_repo(repo_dir) else None)

    if root is None:
        return None

    os.environ["MFRAMAPA_REPO_DIR"] = str(root)
    os.chdir(root)
    if str(root) not in sys.path:
        sys.path.insert(0, str(root))

    missing = _missing_runtime_modules()
    if install_deps and (IN_COLAB or missing):
        reason = (
            "Installing project dependencies for Colab runtime..."
            if IN_COLAB
            else f"Installing missing project dependencies for this kernel: {{', '.join(missing)}}"
        )
        print(reason)
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", "requirements.txt"],
            check=True,
        )
        print("Dependencies ready.")
    elif missing:
        print(f"Kernel is missing packages: {{', '.join(missing)}}")
    else:
        print("Project dependencies already available in this kernel.")

    print(f"Repo root: {{root}}")
    return root
'''

COLAB_SETUP = (
    "# Project setup: clone/find repo and install notebook dependencies\n"
    + NOTEBOOK_BOOTSTRAP
    + "\nROOT = _bootstrap_repo(install_deps=True)\n"
    + "if ROOT is None:\n"
    + '    print("Repo not auto-detected. Start this notebook from inside the repo, or set MFRAMAPA_REPO_DIR.")\n'
)

ROOT_DISCOVER = NOTEBOOK_BOOTSTRAP + r'''
ROOT = _bootstrap_repo(install_deps=True)

if ROOT is None:
    searched = "\\n".join(f" - {candidate}" for candidate in _candidate_roots())
    raise RuntimeError(
        f"Cannot find repo root from {Path.cwd()}.\n"
        "Run the setup cell first in Colab, or set MFRAMAPA_REPO_DIR to the cloned repo.\n"
        f"Searched:\\n{searched}"
    )
'''

COMBOS = [
    ("west_africa", "urban"),
    ("west_africa", "rural"),
    ("east_africa", "urban"),
    ("east_africa", "rural"),
    ("north_africa", "urban"),
    ("north_africa", "rural"),
    ("central_africa", "urban"),
    ("central_africa", "rural"),
    ("southern_africa", "urban"),
    ("southern_africa", "rural"),
    ("horn_of_africa", "urban"),
    ("horn_of_africa", "rural"),
]


def _nb(cells: list) -> dict:
    return {
        "nbformat": 4,
        "nbformat_minor": 5,
        "metadata": META,
        "cells": cells,
    }


def _md(source: str, *, cell_id: str) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "id": cell_id,
        "source": source.splitlines(keepends=True),
    }


def _code(source: str, *, cell_id: str) -> dict:
    return {
        "cell_type": "code",
        "metadata": {},
        "id": cell_id,
        "source": source.splitlines(keepends=True),
        "outputs": [],
        "execution_count": None,
    }


def _slug(region: str, segment: str) -> str:
    return f"{region.replace('_', '-')}-{segment}"


def write_prepare_notebook() -> Path:
    cells = [
        _md(
            "# Prepare training assets (Phase 2 Week 6)\n\n"
            "Regenerates **region polygons** (`ml/data/african_regions.geojson`) and "
            "**city split manifests** (`ml/data/splits/*.json`) from `backend/data/african_cities.json`.\n\n"
            "Run once after updating the city list.\n\n"
            "Requires **Shapely** and the rest of `requirements.txt` on this kernel.\n\n"
            "**Google Colab:** run the setup cell below first (optional: set secret `MFRAMAPA_CLONE_URL` "
            "if you use a fork). Skip that cell when running locally.",
            cell_id="prepare-md",
        ),
        _code(COLAB_SETUP, cell_id="prepare-colab"),
        _code(
            ROOT_DISCOVER
            + "\nfrom ml.scripts.generate_region_geojson import main as _generate_region_geojson\n"
            "from ml.scripts.build_training_splits import main as _build_training_splits\n\n"
            "_generate_region_geojson()\n"
            "# Pass argv explicitly so argparse does not consume Jupyter's sys.argv.\n"
            "_build_training_splits([])\n"
            "print('Done. See ml/data/african_regions.geojson and ml/data/splits/')\n",
            cell_id="prepare-main",
        ),
    ]
    path = NB_DIR / "00_prepare_training_assets.ipynb"
    path.write_text(json.dumps(_nb(cells), indent=1), encoding="utf-8")
    return path


def write_regional_notebook(region: str, segment: str) -> Path:
    slug = _slug(region, segment)
    title = f"{region.replace('_', ' ').title()} — {segment.title()}"
    fname = f"train_{region}_{segment}.ipynb"
    train_code = (
        ROOT_DISCOVER
        + f'\nREGION = "{region}"\nSEGMENT = "{segment}"\n\n'
        "from ml.training import synthetic_training_frame, train_regional_bundle\n"
        "from ml.model_selection import regional_export_dir\n\n"
        "# Replace synthetic_training_frame(...) with your labelled parquet when available.\n"
        "df = synthetic_training_frame(n_rows=1200, seed=42)\n"
        "export_dir = regional_export_dir(REGION, SEGMENT)\n"
        "result = train_regional_bundle(df, REGION, SEGMENT, export_dir, update_registry=True)\n"
        "print(result)\n"
    )
    cells = [
        _md(
            f"# Train regional model — {title}\n\n"
            "Targets **PM2.5** (`pm25_surface`). Exports XGBoost JSON, LightGBM model, "
            "and `manifest.json` under `ml/exports/{region}/{segment}/`.\n\n"
            "**Google Colab:** run the setup cell below first (optional: set secret `MFRAMAPA_CLONE_URL` "
            "if you use a fork). Skip that cell when running locally.",
            cell_id=f"md-{slug}",
        ),
        _code(COLAB_SETUP, cell_id=f"colab-{slug}"),
        _code(train_code, cell_id=f"train-{slug}"),
    ]
    path = NB_DIR / fname
    path.write_text(json.dumps(_nb(cells), indent=1), encoding="utf-8")
    return path


def main() -> None:
    NB_DIR.mkdir(parents=True, exist_ok=True)
    (NB_DIR / "tools").mkdir(parents=True, exist_ok=True)
    paths = [write_prepare_notebook()]
    for r, s in COMBOS:
        paths.append(write_regional_notebook(r, s))
    for p in paths:
        print(p.relative_to(ROOT))


if __name__ == "__main__":
    main()
