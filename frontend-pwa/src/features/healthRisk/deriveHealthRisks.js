const LADDER = ["good", "moderate", "sensitive", "unhealthy", "very_unhealthy", "hazardous"];

export function normalizeAqiCategory(category) {
  const lower = (category || "").toLowerCase();
  if (lower.includes("hazardous")) return "hazardous";
  if (lower.includes("very")) return "very_unhealthy";
  if (lower.includes("unhealthy") && !lower.includes("sensitive")) return "unhealthy";
  if (lower.includes("sensitive") || lower === "high") return "sensitive";
  if (lower.includes("moderate")) return "moderate";
  return "good";
}

function elevateOne(category) {
  const idx = LADDER.indexOf(normalizeAqiCategory(category));
  return LADDER[Math.min(Math.max(idx, 0) + 1, LADDER.length - 1)];
}

function factorsText(factors) {
  if (!factors) return "";
  if (Array.isArray(factors)) return factors.join(" ").toLowerCase();
  if (typeof factors === "object") return Object.keys(factors).join(" ").toLowerCase();
  return String(factors).toLowerCase();
}

function heatCategory(temp) {
  if (temp == null || Number.isNaN(Number(temp))) return "moderate";
  const t = Number(temp);
  if (t < 28) return "good";
  if (t <= 34) return "moderate";
  return "unhealthy";
}

function uvCategory(aqiCategory, uvIndex) {
  if (uvIndex != null && !Number.isNaN(Number(uvIndex))) {
    const uv = Number(uvIndex);
    if (uv < 3) return "good";
    if (uv < 6) return "moderate";
    if (uv < 8) return "sensitive";
    return "unhealthy";
  }
  // No UV sensor — midday heuristic, lightly tied to AQI.
  const aqi = normalizeAqiCategory(aqiCategory);
  if (aqi === "good" || aqi === "moderate") return "moderate";
  return "sensitive";
}

function dustCategory(aqiCategory, pm25, factors) {
  const text = factorsText(factors);
  const dustSignal =
    Number(pm25) >= 55 || /dust|harmattan|aod|aerosol/.test(text);
  return dustSignal ? elevateOne(aqiCategory) : normalizeAqiCategory(aqiCategory);
}

/** Resolve prediction from navigation params (flat or nested). */
export function resolvePrediction(params) {
  if (!params) return null;
  const p = params.prediction?.prediction ?? params.prediction ?? null;
  return p && typeof p === "object" ? p : null;
}

export function cityNameFromPrediction(prediction) {
  if (!prediction) return "";
  return (
    prediction.location?.name ||
    prediction.city?.name ||
    prediction.name ||
    ""
  );
}

/**
 * Derive asthma / dust / heat / UV risk bands from a live prediction.
 * Returns null when no prediction is available.
 */
export function deriveHealthRisks(prediction) {
  if (!prediction) return null;

  const aqi = normalizeAqiCategory(
    prediction.aqi_category ?? prediction.category ?? "good"
  );
  const pm25 = Number(prediction.pm25 ?? 0);
  const factors = prediction.factors;
  const temp = prediction.weather?.temp;
  const uvIndex = prediction.weather?.uv ?? prediction.uv_index ?? prediction.uv;

  return [
    {
      nameKey: "screen.health_risk.asthma_name",
      descKey: "screen.health_risk.asthma_desc",
      category: aqi,
    },
    {
      nameKey: "screen.health_risk.dust_name",
      descKey: "screen.health_risk.dust_desc",
      category: dustCategory(aqi, pm25, factors),
    },
    {
      nameKey: "screen.health_risk.heat_name",
      descKey: "screen.health_risk.heat_desc",
      category: heatCategory(temp),
    },
    {
      nameKey: "screen.health_risk.uv_name",
      descKey:
        uvIndex == null
          ? "screen.health_risk.uv_desc_estimate"
          : "screen.health_risk.uv_desc",
      category: uvCategory(aqi, uvIndex),
    },
  ];
}

export function isDegradedPrediction(prediction) {
  if (!prediction) return false;
  const source =
    prediction.modelSource ||
    prediction.model?.source ||
    (typeof prediction.model === "string" ? "" : "");
  return Boolean(
    prediction.degraded ||
      source === "openmeteo_fallback" ||
      source === "fallback_constant"
  );
}
