"""Smoke-train continental + regional bundles so the API has model artifacts."""

from __future__ import annotations

from ml.model_selection import regional_export_dir
from ml.training import synthetic_training_frame, train_regional_bundle

BUNDLES = [
    ("continental", "all"),
    ("west_africa", "urban"),
    ("west_africa", "rural"),
    ("east_africa", "urban"),
    ("east_africa", "rural"),
    ("southern_africa", "urban"),
    ("southern_africa", "rural"),
    ("north_africa", "urban"),
    ("north_africa", "rural"),
    ("central_africa", "urban"),
    ("central_africa", "rural"),
    ("horn_of_africa", "urban"),
    ("horn_of_africa", "rural"),
]


def main() -> None:
    df = synthetic_training_frame(n_rows=400, seed=0)
    for region, segment in BUNDLES:
        out = regional_export_dir(region, segment)
        print(f"training {region}/{segment} -> {out}")
        train_regional_bundle(df, region, segment, out, update_registry=True)
    print(f"done: {len(BUNDLES)} bundles")


if __name__ == "__main__":
    main()
