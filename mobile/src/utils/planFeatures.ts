export type Tier = 'free' | 'pro' | 'enterprise';

const RANK: Record<Tier, number> = { free: 0, pro: 1, enterprise: 2 };

export const PLAN_FEATURES = {
  // Free tier
  basicAqi:              'free',
  searchCities:          'free',
  savedLocations3:       'free',   // up to 3 saved cities

  // Pro tier
  savedLocationsUnlimited: 'pro',
  aiInsights:            'pro',
  predictionDashboard:   'pro',
  historicalPlayback:    'pro',
  healthRisk:            'pro',
  compareCities:         'pro',
  dataExports:           'pro',
  communityHub:          'pro',
  trendAnalysis:         'pro',

  // Enterprise tier
  anomalyAlerts:         'enterprise',
  africaHeatmap:         'enterprise',
  batchPredict:          'enterprise',
  apiAccess:             'enterprise',
  countryExplorer:       'enterprise',
  trustTransparency:     'enterprise',
} as const satisfies Record<string, Tier>;

export type FeatureKey = keyof typeof PLAN_FEATURES;

export function hasAccess(userTier: Tier, feature: FeatureKey): boolean {
  return RANK[userTier] >= RANK[PLAN_FEATURES[feature]];
}
