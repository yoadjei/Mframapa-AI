"""Phase 2 ML — regions, splits, training smoke test."""

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def geojson_path():
    p = ROOT / "ml" / "data" / "african_regions.geojson"
    if not p.is_file():
        pytest.skip("Run: python -m ml.scripts.generate_region_geojson")
    return p


def test_assign_region_accra(geojson_path):
    from ml.regions import assign_region

    # Accra, Ghana — west_africa in city list
    assert assign_region(5.6037, -0.1870, geojson_path=geojson_path) == "west_africa"


def test_assign_region_addis(geojson_path):
    from ml.regions import assign_region

    assert assign_region(9.0320, 38.7469, geojson_path=geojson_path) == "horn_of_africa"


def test_splits_summary_exists():
    p = ROOT / "ml" / "data" / "splits" / "summary.json"
    if not p.is_file():
        pytest.skip("Run: python -m ml.scripts.build_training_splits")
    data = json.loads(p.read_text(encoding="utf-8"))
    assert "regions" in data
    assert data["regions"]["west_africa"]["urban"] >= 1


def test_urban_rural_from_city():
    from ml.urban_rural import segment_from_city_record, classify_from_population_density

    assert segment_from_city_record({"urban": True}) == "urban"
    assert classify_from_population_density(500.0) == "urban"
    assert classify_from_population_density(50.0) == "rural"


@pytest.mark.skipif(
    not (ROOT / "ml" / "training.py").is_file(),
    reason="ml package",
)
def test_train_synthetic_smoke(tmp_path):
    pytest.importorskip("xgboost")
    pytest.importorskip("lightgbm")

    from ml.training import synthetic_training_frame, train_regional_bundle

    df = synthetic_training_frame(n_rows=200, seed=1)
    out = tmp_path / "west_africa" / "urban"
    res = train_regional_bundle(
        df,
        "west_africa",
        "urban",
        out,
        update_registry=False,
    )
    assert res.r2_val_ensemble > -1.0
    assert (out / "xgboost.json").is_file()
    assert (out / "lightgbm.txt").is_file()
    assert (out / "manifest.json").is_file()
