import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

type FeatureRow = { key: string; free: boolean; pro: boolean; enterprise: boolean };

const FEATURES: FeatureRow[] = [
  { key: 'screen.pricing.feat.basic_aqi',       free: true,  pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.search',           free: true,  pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.saved_3',          free: true,  pro: false, enterprise: false },
  { key: 'screen.pricing.feat.saved_unlimited',  free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.ai_insights',      free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.predictions',      free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.health_risk',      free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.historical',       free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.compare',          free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.exports',          free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.community',        free: false, pro: true,  enterprise: true  },
  { key: 'screen.pricing.feat.anomaly',          free: false, pro: false, enterprise: true  },
  { key: 'screen.pricing.feat.heatmap',          free: false, pro: false, enterprise: true  },
  { key: 'screen.pricing.feat.batch',            free: false, pro: false, enterprise: true  },
  { key: 'screen.pricing.feat.api',              free: false, pro: false, enterprise: true  },
  { key: 'screen.pricing.feat.country',          free: false, pro: false, enterprise: true  }];

export function PricingScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const tier = useStore((s) => s.profile.tier);

  const TIERS = [
    {
      key: 'free' as const,
      nameKey: 'screen.pricing.tier_free',
      descKey: 'screen.pricing.tier_free_desc',
      priceKey: 'screen.pricing.price_free',
      color: colors.subtext,
      borderColor: colors.border,
      ctaKey: 'screen.pricing.cta_current',
      ctaDisabled: true,
      onPress: () => {},
    },
    {
      key: 'pro' as const,
      nameKey: 'screen.subscription.plan_pro',
      descKey: 'screen.pricing.tier_pro_desc',
      priceKey: 'screen.pricing.price_pro',
      color: Colors.brandGreen,
      borderColor: Colors.brandGreen,
      ctaKey: tier === 'pro' || tier === 'enterprise' ? 'screen.pricing.cta_current' : 'screen.pricing.cta_upgrade',
      ctaDisabled: tier === 'pro' || tier === 'enterprise',
      onPress: () => navigation.navigate('Paywall'),
    },
    {
      key: 'enterprise' as const,
      nameKey: 'screen.pricing.tier_enterprise',
      descKey: 'screen.pricing.tier_enterprise_desc',
      priceKey: 'screen.pricing.price_enterprise',
      color: Colors.enterprise,
      borderColor: Colors.enterprise,
      ctaKey: tier === 'enterprise' ? 'screen.pricing.cta_current' : 'screen.pricing.cta_contact',
      ctaDisabled: tier === 'enterprise',
      onPress: () => {},
    }] as const;

  function Check({ included, color }: { included: boolean; color: string }) {
    return (
      <Ionicons
        name={included ? 'checkmark-circle' : 'close-circle-outline'}
        size={18}
        color={included ? color : colors.border}
      />
    );
  }

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.pricing.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('screen.pricing.subtitle')}</Text>

        {/* Tier cards */}
        {TIERS.map((tier) => (
          <View
            key={tier.key}
            style={[styles.card, { backgroundColor: colors.card, borderColor: tier.borderColor }]}
          >
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.tierName, { color: tier.color }]}>{t(tier.nameKey)}</Text>
                <Text style={[styles.tierPrice, { color: colors.text }]}>{t(tier.priceKey)}</Text>
              </View>
              {tier.key === 'pro' ? (
                <View style={[styles.popularBadge, { backgroundColor: Colors.brandGreen + '22' }]}>
                  <Text style={[styles.popularText, { color: Colors.brandGreen }]}>{t('screen.pricing.badge_popular')}</Text>
                </View>
              ) : tier.key === 'free' && tier.ctaDisabled ? (
                <View style={[styles.popularBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.popularText, { color: colors.subtext }]}>{t('screen.pricing.badge_current')}</Text>
                </View>
              ) : null}
            </View>

            <Text style={[styles.tierDesc, { color: colors.subtext }]}>{t(tier.descKey)}</Text>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Feature rows */}
            {FEATURES.map((f) => {
              const included = tier.key === 'free' ? f.free : tier.key === 'pro' ? f.pro : f.enterprise;
              return (
                <View key={f.key} style={styles.featureRow}>
                  <Check included={included} color={tier.color} />
                  <Text style={[styles.featureText, { color: included ? colors.text : colors.muted }]}>
                    {t(f.key)}
                  </Text>
                </View>
              );
            })}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* CTA */}
            <TouchableOpacity
              onPress={tier.onPress}
              disabled={tier.ctaDisabled}
              style={[
                styles.cta,
                { borderColor: tier.ctaDisabled ? colors.border : tier.color },
                !tier.ctaDisabled && { backgroundColor: tier.color }]}
            >
              <Text style={[
                styles.ctaText,
                { color: tier.ctaDisabled ? colors.muted : '#fff' }]}>
                {t(tier.ctaKey)}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  subtitle: { fontSize: 14, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1.5, padding: 20, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  tierName: { fontSize: 22, fontWeight: '800' },
  tierPrice: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  popularBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  popularText: { fontSize: 12, fontWeight: '600' },
  tierDesc: { fontSize: 13, lineHeight: 18 },
  divider: { height: 1, marginVertical: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { fontSize: 14, flex: 1 },
  cta: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
