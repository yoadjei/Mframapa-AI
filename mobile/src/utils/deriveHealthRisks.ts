const LADDER = ['good', 'moderate', 'sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'] as const;

export type RiskCategory = (typeof LADDER)[number];

export function normalizeAqiCategory(category?: string | null): RiskCategory {
  const lower = (category || '').toLowerCase();
  if (lower.includes('hazardous')) return 'hazardous';
  if (lower.includes('very')) return 'very_unhealthy';
  if (lower.includes('unhealthy') && !lower.includes('sensitive')) return 'unhealthy';
  if (lower.includes('sensitive') || lower === 'high') return 'sensitive';
  if (lower.includes('moderate')) return 'moderate';
  return 'good';
}

function elevateOne(category: string): RiskCategory {
  const idx = LADDER.indexOf(normalizeAqiCategory(category));
  return LADDER[Math.min(Math.max(idx, 0) + 1, LADDER.length - 1)];
}

function factorsText(factors: unknown): string {
  if (!factors) return '';
  if (Array.isArray(factors)) return factors.join(' ').toLowerCase();
  if (typeof factors === 'object') return Object.keys(factors as object).join(' ').toLowerCase();
  return String(factors).toLowerCase();
}

function heatCategory(temp: unknown): RiskCategory {
  if (temp == null || Number.isNaN(Number(temp))) return 'moderate';
  const t = Number(temp);
  if (t < 28) return 'good';
  if (t <= 34) return 'moderate';
  return 'unhealthy';
}

function uvCategory(aqiCategory: string, uvIndex: unknown): RiskCategory {
  if (uvIndex != null && !Number.isNaN(Number(uvIndex))) {
    const uv = Number(uvIndex);
    if (uv < 3) return 'good';
    if (uv < 6) return 'moderate';
    if (uv < 8) return 'sensitive';
    return 'unhealthy';
  }
  const aqi = normalizeAqiCategory(aqiCategory);
  if (aqi === 'good' || aqi === 'moderate') return 'moderate';
  return 'sensitive';
}

function dustCategory(aqiCategory: string, pm25: number, factors: unknown): RiskCategory {
  const text = factorsText(factors);
  const dustSignal = pm25 >= 55 || /dust|harmattan|aod|aerosol/.test(text);
  return dustSignal ? elevateOne(aqiCategory) : normalizeAqiCategory(aqiCategory);
}

export type HealthRiskRow = {
  nameKey: string;
  descKey: string;
  category: RiskCategory;
};

export function deriveHealthRisks(prediction: {
  aqi_category?: string;
  category?: string;
  pm25?: number;
  factors?: string[] | Record<string, unknown>;
  weather?: { temp?: number | null; humidity?: number | null; wind?: number | null; uv?: number | null };
  uv_index?: number;
  uv?: number;
} | null): HealthRiskRow[] | null {
  if (!prediction) return null;

  const aqi = normalizeAqiCategory(prediction.aqi_category ?? prediction.category ?? 'good');
  const pm25 = Number(prediction.pm25 ?? 0);
  const temp = prediction.weather?.temp;
  const uvIndex = prediction.weather?.uv ?? prediction.uv_index ?? prediction.uv;

  return [
    {
      nameKey: 'screen.health_risk.asthma_name',
      descKey: 'screen.health_risk.asthma_desc',
      category: aqi,
    },
    {
      nameKey: 'screen.health_risk.dust_name',
      descKey: 'screen.health_risk.dust_desc',
      category: dustCategory(aqi, pm25, prediction.factors),
    },
    {
      nameKey: 'screen.health_risk.heat_name',
      descKey: 'screen.health_risk.heat_desc',
      category: heatCategory(temp),
    },
    {
      nameKey: 'screen.health_risk.uv_name',
      descKey:
        uvIndex == null
          ? 'screen.health_risk.uv_desc_estimate'
          : 'screen.health_risk.uv_desc',
      category: uvCategory(aqi, uvIndex),
    },
  ];
}

export function isDegradedPrediction(prediction: {
  degraded?: boolean;
  modelSource?: string;
  model?: string | { source?: string };
} | null): boolean {
  if (!prediction) return false;
  const source =
    prediction.modelSource ||
    (typeof prediction.model === 'object' ? prediction.model?.source : '') ||
    '';
  return Boolean(
    prediction.degraded ||
      source === 'openmeteo_fallback' ||
      source === 'fallback_constant'
  );
}
