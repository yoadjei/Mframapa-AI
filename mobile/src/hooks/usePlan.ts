import { useStore } from '../store/useStore';
import { hasAccess, FeatureKey, Tier } from '../utils/planFeatures';

export function usePlan() {
  const tier = useStore((s) => s.profile.tier) as Tier;

  return {
    tier,
    can: (feature: FeatureKey) => hasAccess(tier, feature),
    isResearcher:    tier === 'researcher' || tier === 'institutional',
    isInstitutional: tier === 'institutional',
    isFree:          tier === 'free',
  };
}
