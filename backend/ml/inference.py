"""
model loading and inference.

a ``ModelBundle`` wraps one region/segment's xgboost + lightgbm boosters plus its
manifest. bundles are loaded once at startup into ``app.state.models`` and reused.
the hallucination rectifier guards against the model diverging wildly from the
openmeteo baseline (guide §8.2).
"""

from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Mapping, Optional, Tuple

import numpy as np

from ml.features import FEATURE_COLUMNS

logger = logging.getLogger(__name__)

# hallucination thresholds (guide §8.2).
_ABS_FLOOR = 15.0      # ignore small absolute disagreements (ug/m3)
_RATIO_HI = 3.0
_RATIO_LO = 0.33

BundleKey = Tuple[str, str]


@dataclass
class ModelBundle:
    region_id: str
    segment: str
    feature_columns: List[str]
    xgb_model: Any
    lgb_model: Any
    manifest: Dict[str, Any]
    conformal_half_width: float = field(default=0.0)
    target_transform: Optional[str] = None

    def vectorize(self, features: Mapping[str, Any]) -> np.ndarray:
        # build the 1xk input row in manifest column order; missing -> nan.
        row = [
            float(features[c]) if features.get(c) is not None else np.nan
            for c in self.feature_columns
        ]
        return np.asarray([row], dtype=np.float64)

    def predict_point(self, features: Mapping[str, Any]) -> float:
        # ensemble mean of xgboost and lightgbm; invert the target transform per model.
        x = self.vectorize(features)
        pred_x = self._inv(float(self.xgb_model.predict(x)[0]))
        pred_l = self._inv(float(self.lgb_model.predict(x)[0]))
        return (pred_x + pred_l) / 2.0

    def _inv(self, value: float) -> float:
        if self.target_transform == "log1p":
            return max(0.0, math.expm1(value))
        return value


def _load_bundle(manifest_path: Path) -> Optional[ModelBundle]:
    try:
        import lightgbm as lgb
        import xgboost as xgb
    except Exception as e:  # native lib missing
        logger.warning("inference: xgboost/lightgbm unavailable — %s", e)
        return None

    d = manifest_path.parent
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        xgb_model = xgb.XGBRegressor()
        xgb_model.load_model(str(d / "xgboost.json"))
        lgb_model = lgb.Booster(model_file=str(d / "lightgbm.txt"))
    except Exception as e:
        logger.warning("inference: failed to load bundle at %s — %s", d, e)
        return None

    return ModelBundle(
        region_id=manifest.get("region_id", d.parent.name),
        segment=manifest.get("segment", d.name),
        feature_columns=list(manifest.get("feature_columns", FEATURE_COLUMNS)),
        xgb_model=xgb_model,
        lgb_model=lgb_model,
        manifest=manifest,
        conformal_half_width=float(
            (manifest.get("uncertainty") or {}).get("conformal_half_width", 0.0)
        ),
        target_transform=manifest.get("target_transform"),
    )


def load_bundles(exports_dir: Path) -> Dict[BundleKey, ModelBundle]:
    """load every ``exports/<region>/<segment>/manifest.json`` bundle.

    variant subdirs (e.g. ``with_pm10/``) sit one level deeper and are skipped.
    """
    exports_dir = Path(exports_dir)
    bundles: Dict[BundleKey, ModelBundle] = {}
    if not exports_dir.is_dir():
        logger.warning("inference: exports dir %s missing — no models loaded", exports_dir)
        return bundles

    for manifest_path in exports_dir.glob("*/*/manifest.json"):
        bundle = _load_bundle(manifest_path)
        if bundle is not None:
            bundles[(bundle.region_id, bundle.segment)] = bundle
    logger.info("inference: loaded %d model bundle(s)", len(bundles))
    return bundles


def select_bundle(
    bundles: Mapping[BundleKey, ModelBundle],
    region_id: str,
    segment: str,
) -> Optional[ModelBundle]:
    # exact match, then same region (other segment), then continental.
    for key in ((region_id, segment), (region_id, "urban"), (region_id, "rural")):
        if key in bundles:
            return bundles[key]
    for seg in (segment, "all", "urban", "rural"):
        if ("continental", seg) in bundles:
            return bundles[("continental", seg)]
    return None


def rectify_prediction(
    model_pred: float,
    openmeteo_pm25: Optional[float],
) -> Tuple[float, bool]:
    """blend 50/50 with openmeteo when the model diverges implausibly.

    returns (final_pm25, degraded).
    """
    if openmeteo_pm25 is None:
        return model_pred, False
    om = float(openmeteo_pm25)
    if abs(model_pred - om) < _ABS_FLOOR:
        return model_pred, False
    if om <= 0:
        return model_pred, False
    ratio = model_pred / om
    if ratio > _RATIO_HI or ratio < _RATIO_LO:
        return 0.5 * model_pred + 0.5 * om, True
    return model_pred, False
