import axios from 'axios';
import { MAPBOX_TOKEN } from '../utils/constants';
import { isAfricanCountryCode } from '../utils/africanCountries';

export interface PlaceSuggestion {
  id: string;
  placeName: string;
  lat: number;
  lon: number;
  country?: string;
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

/**
 * V1 parity: Mapbox forward geocode restricted to Africa bbox, filtered by country code.
 * @see https://mframapaai.health/ SearchBar component
 */
export async function fetchAfricanPlaceSuggestions(
  query: string
): Promise<PlaceSuggestion[]> {
  const text = query.trim();
  if (text.length < 3 || !MAPBOX_TOKEN) return [];

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json` +
    `?access_token=${MAPBOX_TOKEN}` +
    `&bbox=-26,-38,60,38` +
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
