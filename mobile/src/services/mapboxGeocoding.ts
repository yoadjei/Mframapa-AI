import axios from 'axios';
import { MAPBOX_TOKEN } from '../utils/constants';
import { isAfricanCountryCode } from '../utils/africanCountries';

export interface PlaceSuggestion {
  id: string;
  placeName: string;
  lat: number;
  lon: number;
  country?: string;
  usual?: {
    pm25: number;
    aqi_category: string;
    temp: number;
    humidity: number;
    months?: Record<
      string,
      { pm25: number; aqi_category: string; temp: number; humidity: number }
    >;
  };
}

type MapboxFeature = {
  id: string;
  place_name: string;
  center: [number, number];
  properties?: { short_code?: string };
  context?: Array<{ id: string; short_code?: string }>;
};

function isAfricanFeature(feature: MapboxFeature): boolean {
  if (feature.id.startsWith('country.') && feature.properties?.short_code) {
    return isAfricanCountryCode(feature.properties.short_code);
  }
  if (feature.context) {
    const countryContext = feature.context.find((c) => c.id.startsWith('country.'));
    if (countryContext?.short_code) {
      return isAfricanCountryCode(countryContext.short_code);
    }
  }
  return false;
}

function countryFromFeature(feature: MapboxFeature): string | undefined {
  const parts = feature.place_name.split(',').map((p) => p.trim());
  if (parts.length > 1) return parts[parts.length - 1];
  const countryContext = feature.context?.find((c) => c.id.startsWith('country.'));
  return countryContext?.short_code?.toUpperCase();
}

/** ISO 3166-1 alpha-2 from a Mapbox feature (handles short_code like "us" or "gb-eng"). */
export function countryCodeFromFeature(feature: MapboxFeature): string | null {
  const fromProps = feature.properties?.short_code;
  if (fromProps) {
    const code = fromProps.includes('-') ? fromProps.split('-').pop()! : fromProps;
    return code.toLowerCase();
  }
  const countryContext = feature.context?.find((c) => c.id.startsWith('country.'));
  if (countryContext?.short_code) {
    const raw = countryContext.short_code;
    const code = raw.includes('-') ? raw.split('-').pop()! : raw;
    return code.toLowerCase();
  }
  return null;
}

/**
 * Resolve the country at a coordinate (for Africa-only gating).
 */
export async function reverseGeocodeCountryCode(lat: number, lon: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  const base =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json` +
    `?access_token=${MAPBOX_TOKEN}&limit=1`;

  try {
    for (const types of ['country', 'region,place,locality,district,neighborhood']) {
      const { data } = await axios.get<{ features?: MapboxFeature[] }>(
        `${base}&types=${types}`,
        { timeout: 10000 }
      );
      const feature = data.features?.[0];
      if (!feature) continue;
      const code = countryCodeFromFeature(feature);
      if (code) return code;
    }
  } catch {
    return null;
  }
  return null;
}

/** Reverse geocode coordinates to a place label (city/town/region) within Africa. */

/**
 * V1 parity: Mapbox forward geocode restricted to Africa bbox, filtered by country code.
 */
export async function reverseGeocodePlace(lat: number, lon: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json` +
    `?access_token=${MAPBOX_TOKEN}` +
    `&types=place,locality,district,region` +
    `&limit=1`;

  try {
    const { data } = await axios.get<{ features?: MapboxFeature[] }>(url, { timeout: 10000 });
    const feature = data.features?.[0];
    if (!feature) return null;
    if (!isAfricanFeature(feature)) return null;
    const parts = feature.place_name.split(',').map((p) => p.trim());
    return parts[0] || feature.place_name;
  } catch {
    return null;
  }
}

export async function fetchAfricanPlaceSuggestions(
  query: string
): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (text.length < 3 || !MAPBOX_TOKEN) return [];

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json` +
    `?access_token=${MAPBOX_TOKEN}` +
    `&bbox=-26,-38,59,38` +
    `&types=country,region,district,place,locality` +
    `&limit=10`;

  const { data } = await axios.get<{ features?: MapboxFeature[] }>(url, { timeout: 10000 });

  if (!data.features?.length) return [];

  return data.features
    .filter(isAfricanFeature)
    .slice(0, 5)
    .map((feature) => ({
      id: feature.id,
      placeName: feature.place_name,
      lon: feature.center[0],
      lat: feature.center[1],
      country: countryFromFeature(feature),
    }));
}
