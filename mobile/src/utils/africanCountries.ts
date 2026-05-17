/** ISO 3166-1 alpha-2 codes for African nations — matches V1 webapp SearchBar. */
export const AFRICAN_COUNTRY_CODES = [
  'dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cg', 'cd', 'ci',
  'dj', 'eg', 'gq', 'er', 'sz', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr',
  'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn',
  'sc', 'sl', 'so', 'za', 'ss', 'sd', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw',
] as const;

const AFRICAN_SET = new Set<string>(AFRICAN_COUNTRY_CODES);

export function isAfricanCountryCode(code: string | undefined): boolean {
  if (!code) return false;
  return AFRICAN_SET.has(code.toLowerCase());
}
