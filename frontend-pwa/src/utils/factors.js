/**
 * API returns factors as a dict `{ population_density: n, elevation: n, ... }`.
 * Older clients expected a string[]. Normalize for list UIs.
 */
export function factorEntries(factors) {
  if (!factors) return [];
  if (Array.isArray(factors)) {
    return factors
      .filter((f) => typeof f === "string" && f.trim())
      .map((key) => ({ key, label: humanizeFactorKey(key), value: null }));
  }
  if (typeof factors === "object") {
    return Object.entries(factors)
      .filter(([, v]) => v != null && v !== "")
      .map(([key, value]) => ({
        key,
        label: humanizeFactorKey(key),
        value,
      }));
  }
  return [];
}

export function factorLabels(factors) {
  return factorEntries(factors).map((e) => e.label);
}

function humanizeFactorKey(key) {
  return String(key).replace(/_/g, " ");
}
