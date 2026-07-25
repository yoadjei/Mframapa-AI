export function aqiCategoryKey(category) {
  const lower = (category || "").toLowerCase();
  if (lower.includes("hazardous")) return "aqi.hazardous";
  if (lower.includes("very unhealthy") || lower.includes("very_unhealthy") || lower === "very") {
    return "aqi.very_unhealthy";
  }
  if (lower.includes("unhealthy") && !lower.includes("sensitive")) return "aqi.unhealthy";
  if (lower.includes("sensitive") || lower === "high") return "aqi.sensitive";
  if (lower.includes("moderate")) return "aqi.moderate";
  return "aqi.good";
}
