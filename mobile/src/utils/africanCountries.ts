/**
 * African nations and territories for coverage gating.
 * Includes AU member states plus island nations/territories geographically in Africa.
 */

/** ISO 3166-1 alpha-2 — 54 AU members + African island states/territories. */
export const AFRICAN_COUNTRY_CODES = [
  'dz', 'ao', 'bj', 'bw', 'bf', 'bi', 'cm', 'cv', 'cf', 'td', 'km', 'cg', 'cd', 'ci',
  'dj', 'eg', 'gq', 'er', 'sz', 'et', 'ga', 'gm', 'gh', 'gn', 'gw', 'ke', 'ls', 'lr',
  'ly', 'mg', 'mw', 'ml', 'mr', 'mu', 'ma', 'mz', 'na', 'ne', 'ng', 'rw', 'st', 'sn',
  'sc', 'sl', 'so', 'za', 'ss', 'sd', 'tz', 'tg', 'tn', 'ug', 'zm', 'zw',
  // Island nations / territories often missing from short lists
  'eh', // Western Sahara
  're', // Réunion
  'yt', // Mayotte
  'sh', // Saint Helena, Ascension and Tristan da Cunha
] as const;

const AFRICAN_SET = new Set<string>(AFRICAN_COUNTRY_CODES);

/**
 * Geocoded under a parent state but treated as in-scope (e.g. Mapbox returns `fr` for Réunion).
 * Boxes are [west, south, east, north] in degrees.
 */
export const AFRICAN_TERRITORY_BBOXES: ReadonlyArray<{
  parentCode: string;
  west: number;
  south: number;
  east: number;
  north: number;
}> = [
  { parentCode: 'fr', west: 55.2, south: -21.55, east: 55.95, north: -20.75 }, // Réunion
  { parentCode: 'fr', west: 44.95, south: -13.05, east: 45.35, north: -12.6 }, // Mayotte
  { parentCode: 'gb', west: -14.5, south: -8.1, east: -5.4, north: -7.5 }, // Ascension
  { parentCode: 'gb', west: -5.85, south: -16.05, east: -5.55, north: -15.85 }, // Saint Helena
  { parentCode: 'gb', west: -12.5, south: -37.2, east: -11.0, north: -34.5 }, // Tristan da Cunha
];

/** Geographic pre-check boxes: mainland + Atlantic/Indian Ocean African islands. */
export const AFRICA_GEO_BOXES: ReadonlyArray<readonly [number, number, number, number]> = [
  [-18.5, -35.5, 52.5, 37.5], // Continental Africa, Madagascar, Comoros, etc.
  [52.5, -26.0, 58.5, -3.0], // Seychelles, Mauritius, Réunion, outer Seychelles
  [-25.5, 14.0, -22.0, 17.5], // Cape Verde
  [-14.5, -37.5, -11.0, -34.5], // Tristan da Cunha (SH)
];

function pointInBox(
  lat: number,
  lon: number,
  box: readonly [number, number, number, number]
): boolean {
  const [west, south, east, north] = box;
  return lon >= west && lon <= east && lat >= south && lat <= north;
}

export function isInAfricaGeography(lat: number, lon: number): boolean {
  return AFRICA_GEO_BOXES.some((box) => pointInBox(lat, lon, box));
}

export function isAfricanTerritoryByParent(
  lat: number,
  lon: number,
  parentCode: string
): boolean {
  const code = parentCode.toLowerCase();
  return AFRICAN_TERRITORY_BBOXES.some(
    (t) =>
      t.parentCode === code &&
      pointInBox(lat, lon, [t.west, t.south, t.east, t.north])
  );
}

export function isAfricanCountryCode(code: string | undefined): boolean {
  if (!code) return false;
  return AFRICAN_SET.has(code.toLowerCase());
}

/** True when ISO (or parent-territory) indicates an African nation/territory. */
export function isAfricanLocation(
  lat: number,
  lon: number,
  countryCode?: string | null
): boolean {
  const code = countryCode?.toLowerCase() ?? null;
  if (!code) return false;
  if (AFRICAN_SET.has(code)) return true;
  return isAfricanTerritoryByParent(lat, lon, code);
}
