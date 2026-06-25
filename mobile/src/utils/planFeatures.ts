export type Tier = 'free' | 'researcher' | 'institutional';

const RANK: Record<Tier, number> = { free: 0, researcher: 1, institutional: 2 };

export const PLAN_FEATURES = {
  // Free tier — never gated, mission-critical
  basicAqi:              'free',
  searchCities:          'free',
  savedLocations3:       'free',

  // Researcher tier
  savedLocationsUnlimited: 'researcher',
  aiInsights:            'researcher',
  predictionDashboard:   'researcher',
  historicalPlayback:    'researcher',
  healthRisk:            'researcher',
  compareCities:         'researcher',
  dataExports:           'researcher',
  communityHub:          'researcher',
  trendAnalysis:         'researcher',

  // Institutional API tier
  anomalyAlerts:         'institutional',
  africaHeatmap:         'institutional',
  batchPredict:          'institutional',
  apiAccess:             'institutional',
  countryExplorer:       'institutional',
  trustTransparency:     'institutional',
} as const satisfies Record<string, Tier>;

export type FeatureKey = keyof typeof PLAN_FEATURES;

export function hasAccess(userTier: Tier, feature: FeatureKey): boolean {
  return RANK[userTier] >= RANK[PLAN_FEATURES[feature]];
}
