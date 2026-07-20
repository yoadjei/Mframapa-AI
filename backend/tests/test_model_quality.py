"""a model that is worse than the mean must never reach a user.

r2 below zero means the bundle predicts worse than always answering with the
average. when that happens the honest move is to ship nothing for that region
and let select_bundle fall back to continental, which is measurably better.
"""

import json
import pathlib

from ml.paths import repository_root

EXPORTS = repository_root() / "ml" / "exports"
REGISTRY = repository_root() / "ml" / "data" / "model_registry.json"


def _exported_manifests():
    return sorted(EXPORTS.glob("*/*/manifest.json"))


def test_no_exported_model_is_worse_than_the_mean():
    bad = []
    for manifest in _exported_manifests():
        d = json.loads(manifest.read_text(encoding="utf-8"))
        r2 = (d.get("metrics") or {}).get("r2_val_ensemble_mean")
        if r2 is not None and r2 <= 0:
            bad.append(f"{d.get('region_id')}/{d.get('segment')} r2={r2:.3f}")
    assert not bad, "shipping models that are worse than predicting the mean: " + ", ".join(bad)


def test_registry_only_lists_models_that_exist():
    """a stale entry points the loader at a bundle that is not on disk."""
    if not REGISTRY.is_file():
        return
    entries = json.loads(REGISTRY.read_text(encoding="utf-8")).get("models", [])
    missing = [
        f"{e['region_id']}/{e['segment']}"
        for e in entries
        if not (EXPORTS / e["region_id"] / e["segment"] / "manifest.json").is_file()
    ]
    assert not missing, f"registry lists models with no export on disk: {missing}"
