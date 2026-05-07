import { httpClient, normalizeError } from "./httpClient.js";

const predictionCache = new Map();
const PREDICTION_CACHE_TTL_MS = 5 * 60 * 1000;

function predictionCacheKey(lat, lon, name) {
  return `${lat.toFixed(3)}:${lon.toFixed(3)}:${name || ""}`;
}

export async function resolveLocation(city) {
  try {
    const response = await httpClient.get("/api/v1/resolve-location", { params: { city } });
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error, "Location lookup failed"));
  }
}

export async function getPrediction(lat, lon, name = "Unknown") {
  const key = predictionCacheKey(lat, lon, name);
  const cached = predictionCache.get(key);
  if (cached && Date.now() - cached.timestamp < PREDICTION_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const response = await httpClient.get("/api/v1/predict", {
      params: { lat, lon, name },
    });
    predictionCache.set(key, { data: response.data, timestamp: Date.now() });
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error, "Prediction request failed"));
  }
}

export async function submitReport(lat, lon, perceivedQuality, comment = null) {
  try {
    const response = await httpClient.post("/api/v1/report", {
      lat,
      lon,
      perceived_quality: perceivedQuality,
      comment,
    });
    return response.data;
  } catch (error) {
    throw new Error(normalizeError(error, "Report submission failed"));
  }
}

export async function checkHealth() {
  try {
    const response = await httpClient.get("/api/v1/health");
    return response.data;
  } catch {
    return { status: "offline" };
  }
}

export function clearPredictionCache() {
  predictionCache.clear();
}
