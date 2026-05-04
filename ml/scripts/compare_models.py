"""
Print a comparison table of all trained models in the model registry.

Usage::

    python -m ml.scripts.compare_models
    python -m ml.scripts.compare_models --registry ml/data/model_registry.json
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path
from typing import Any, Dict, List, Optional

from ml.model_registry import load_registry, default_registry_path
from ml.paths import repository_root


def _print_table(models: List[Dict[str, Any]]) -> None:
    header = (
        f"{'Region':<24}  {'Segment':<8}  {'R²':>7}  {'Half-Width':>10}  {'Trained At':<26}"
    )
    sep = "-" * len(header)
    print(sep)
    print(header)
    print(sep)
    for m in models:
        region = m.get("region_id", "")
        segment = m.get("segment", "")
        r2 = m.get("r2_val")
        hw = m.get("conformal_half_width")
        trained = m.get("trained_at_utc", "")

        # Trim UTC suffix for readability (keep date + time, drop microseconds/tz noise)
        trained_short = trained[:19] if trained else "—"

        r2_s = f"{r2:.4f}" if r2 is not None and not (isinstance(r2, float) and math.isnan(r2)) else "    n/a"
        hw_s = f"{hw:.3f}" if hw is not None and not (isinstance(hw, float) and math.isnan(hw)) else "       n/a"

        print(f"{region:<24}  {segment:<8}  {r2_s:>7}  {hw_s:>10}  {trained_short:<26}")
    print(sep)


def compare(registry_path: Optional[Path] = None) -> None:
    repo_root = repository_root()
    reg_path = registry_path or default_registry_path(repo_root / "ml")
    registry = load_registry(reg_path)
    models: List[Dict[str, Any]] = registry.get("models", [])

    trained = [m for m in models if m.get("r2_val") is not None]

    if not trained:
        if not models:
            print(
                "No trained models found yet. Run the training workflow to populate the registry."
            )
        else:
            print(
                f"{len(models)} model entr{'y' if len(models) == 1 else 'ies'} found in registry "
                "but none have r2_val recorded. Re-run training to capture metrics."
            )
        return

    print(f"\nModel registry: {reg_path}")
    print(f"Showing {len(trained)} trained model(s):\n")
    _print_table(trained)

    untrained = [m for m in models if m.get("r2_val") is None]
    if untrained:
        labels = [f"{m.get('region_id')}/{m.get('segment')}" for m in untrained]
        print(f"\n  {len(untrained)} entries without metrics: {', '.join(labels)}")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Summarise all trained regional PM2.5 models in the registry."
    )
    ap.add_argument(
        "--registry",
        type=Path,
        default=None,
        metavar="JSON",
        help="Path to model_registry.json (defaults to ml/data/model_registry.json).",
    )
    args = ap.parse_args()
    compare(registry_path=args.registry)


if __name__ == "__main__":
    main()
