export type FactorEntry = { key: string; label: string; value: unknown };

/** API factors are a dict; older clients used string[]. */
export function factorEntries(factors: unknown): FactorEntry[] {
  if (!factors) return [];
  if (Array.isArray(factors)) {
    return factors
      .filter((f): f is string => typeof f === 'string' && f.trim().length > 0)
      .map((key) => ({ key, label: humanize(key), value: null }));
  }
  if (typeof factors === 'object') {
    return Object.entries(factors as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== '')
      .map(([key, value]) => ({ key, label: humanize(key), value }));
  }
  return [];
}

export function factorLabels(factors: unknown): string[] {
  return factorEntries(factors).map((e) => e.label);
}

function humanize(key: string): string {
  return key.replace(/_/g, ' ');
}
