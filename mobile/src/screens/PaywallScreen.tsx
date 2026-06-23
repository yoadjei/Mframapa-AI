import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { getColors, Colors } from '../theme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { TextLinkButton } from '../components/ui/TextLinkButton';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import {
  PRICING_PLANS,
  PlanId,
  PricingPlan,
  formatPrice,
  formatPriceWithLocal,
  SUPPORTED_CURRENCIES,
  CURRENCY_INFO,
  Currency,
} from '../utils/plans';
import { isPaystackConfigured } from '../services/paystack';

interface Props {
  onDone?: () => void;
}

export function PaywallScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const paymentCurrency    = useStore((s) => s.paymentCurrency);
  const setPaymentCurrency = useStore((s) => s.setPaymentCurrency);
  const restorePurchases   = useStore((s) => s.restorePurchases);

  const [selectedPlan, setSelected] = useState<PlanId | null>(null);
  const [restoring, setRestoring]   = useState(false);

  const proMonthly    = PRICING_PLANS.find((p) => p.id === 'pro_monthly')!;
  const proAnnual     = PRICING_PLANS.find((p) => p.id === 'pro_annual')!;
  const entMonthly    = PRICING_PLANS.find((p) => p.id === 'enterprise_monthly')!;
  const entAnnual     = PRICING_PLANS.find((p) => p.id === 'enterprise_annual')!;
  const selectedInfo  = selectedPlan ? PRICING_PLANS.find((p) => p.id === selectedPlan) : null;

  function handleStartTrial() {
    if (!selectedPlan) return;
    if (!isPaystackConfigured()) {
      Alert.alert(t('screen.paywall.paystack_not_configured'));
      return;
    }
    navigation.navigate('PaystackCheckout', { planId: selectedPlan });
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.restored === 'pro' || res.restored === 'trial') {
      Alert.alert(t('screen.paywall.pro_restored'));
      if (onDone) onDone();
      else navigation.goBack();
    } else {
      Alert.alert(t('screen.paywall.nothing_to_restore'));
    }
  }

  function PlanCard({ plan, tier }: { plan: PricingPlan; tier: 'pro' | 'enterprise' }) {
    const selected = selectedPlan === plan.id;
    const tierColor = tier === 'pro' ? Colors.brandGreen : Colors.enterprise;
    const isAnnual = plan.id.endsWith('_annual');

    return (
      <TouchableOpacity
        onPress={() => setSelected(plan.id as PlanId)}
        activeOpacity={0.85}
        style={[
          styles.planCard,
          {
            backgroundColor: colors.card,
            borderColor: selected ? tierColor : colors.border,
            borderWidth: selected ? 2 : 1,
          },
        ]}
      >
        {plan.badge ? (
          <View style={[styles.planBadge, { backgroundColor: tierColor }]}>
            <Text style={styles.planBadgeText}>{plan.badge}</Text>
          </View>
        ) : null}
        <Text style={[styles.planInterval, { color: selected ? tierColor : colors.subtext }]}>
          {isAnnual ? t('screen.paywall.billing_annual') : t('screen.paywall.billing_monthly')}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.planPrice, { color: colors.text }]}>
            {formatPrice(plan.amountUsd, 'USD')}
          </Text>
          <Text style={[styles.planPer, { color: colors.subtext }]}>{plan.perUnit}</Text>
        </View>
        {paymentCurrency !== 'USD' ? (
          <Text style={[styles.planEquivalent, { color: colors.muted }]}>
            ≈ {formatPrice(plan.amountUsd, paymentCurrency)} {plan.perUnit}
          </Text>
        ) : null}
        {isAnnual ? (
          <Text style={[styles.planEquivalent, { color: colors.muted }]}>
            {formatPriceWithLocal(plan.amountUsd / 12, paymentCurrency)} / mo
          </Text>
        ) : null}
        {selected ? (
          <View style={styles.selectedBadge}>
            <Ionicons name="checkmark-circle" size={16} color={tierColor} />
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity
          onPress={() => { if (onDone) onDone(); else navigation.goBack(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('screen.paywall.all_plans_title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t('screen.paywall.all_plans_subtitle')}
        </Text>

        {/* ── Pro Plans ────────────────────────────────────────────────────────── */}
        <View style={[styles.tierSection, { backgroundColor: colors.card, borderColor: Colors.brandGreen }]}>
          <View style={styles.tierHeader}>
            <View style={[styles.tierIconWrap, { backgroundColor: Colors.brandGreen + '22' }]}>
              <Ionicons name="star" size={18} color={Colors.brandGreen} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: Colors.brandGreen }]}>
                {t('screen.subscription.plan_pro')}
              </Text>
              <Text style={[styles.tierDesc, { color: colors.subtext }]}>
                {t('screen.pricing.tier_pro_desc')}
              </Text>
            </View>
          </View>
          <View style={styles.plansRow}>
            <View style={styles.planHalf}><PlanCard plan={proMonthly} tier="pro" /></View>
            <View style={styles.planHalf}><PlanCard plan={proAnnual} tier="pro" /></View>
          </View>
        </View>

        {/* ── Enterprise Plans ──────────────────────────────────────────────────── */}
        <View style={[styles.tierSection, { backgroundColor: colors.card, borderColor: Colors.enterprise }]}>
          <View style={styles.tierHeader}>
            <View style={[styles.tierIconWrap, { backgroundColor: Colors.enterprise + '22' }]}>
              <Ionicons name="business" size={18} color={Colors.enterprise} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tierName, { color: Colors.enterprise }]}>
                {t('screen.pricing.tier_enterprise')}
              </Text>
              <Text style={[styles.tierDesc, { color: colors.subtext }]}>
                {t('screen.pricing.tier_enterprise_desc')}
              </Text>
            </View>
          </View>
          <View style={styles.plansRow}>
            <View style={styles.planHalf}><PlanCard plan={entMonthly} tier="enterprise" /></View>
            <View style={styles.planHalf}><PlanCard plan={entAnnual} tier="enterprise" /></View>
          </View>
        </View>

        {/* ── Currency selector ─────────────────────────────────────────────────── */}
        <Text style={[styles.payInLabel, { color: colors.subtext }]}>
          {t('screen.paywall.pay_in')}
        </Text>
        <View style={styles.currencyRow}>
          {SUPPORTED_CURRENCIES.map((c: Currency) => {
            const info = CURRENCY_INFO[c];
            const sel  = paymentCurrency === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setPaymentCurrency(c)}
                activeOpacity={0.8}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: sel ? Colors.brandGreen : colors.surface,
                    borderColor:     sel ? Colors.brandGreen : colors.border,
                  },
                ]}
              >
                <Text style={styles.currencyFlag}>{info.flag}</Text>
                <Text style={[styles.currencyCode, { color: sel ? '#fff' : colors.text }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Payment channels for selected currency */}
        <View style={styles.channelsRow}>
          {CURRENCY_INFO[paymentCurrency].channels.map((ch) => (
            <View key={ch} style={[styles.channelChip, { backgroundColor: Colors.brandGreen + '15' }]}>
              <Ionicons
                name={
                  ch === 'card'           ? 'card-outline'           :
                  ch === 'mobile_money'   ? 'phone-portrait-outline' :
                  ch === 'bank_transfer'  ? 'business-outline'       :
                  ch === 'ussd'           ? 'keypad-outline'         :
                  ch === 'qr'             ? 'qr-code-outline'        :
                                            'card-outline'
                }
                size={12}
                color={Colors.brandGreen}
              />
              <Text style={[styles.channelText, { color: Colors.brandGreen }]}>
                {t(`screen.paywall.channel_${ch}`)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Trial CTA ────────────────────────────────────────────────────────── */}
        {selectedInfo ? (
          <View style={styles.trialSection}>
            <PrimaryButton
              label={t('screen.paywall.start_free_trial_plan', { plan: selectedInfo.label })}
              onPress={handleStartTrial}
              style={styles.trialBtn}
            />
            <Text style={[styles.trialNote, { color: colors.subtext }]}>
              {t('screen.paywall.trial_note')}
            </Text>
          </View>
        ) : (
          <View style={[styles.selectPrompt, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="hand-left-outline" size={16} color={colors.muted} />
            <Text style={[styles.selectPromptText, { color: colors.muted }]}>
              {t('screen.paywall.select_plan_prompt')}
            </Text>
          </View>
        )}

        <View style={styles.legalRow}>
          <TextLinkButton label={t('screen.paywall.terms')} onPress={() => {}} size={12} color={colors.muted} />
          <Text style={[styles.legalDivider, { color: colors.muted }]}>|</Text>
          <TextLinkButton label={t('screen.paywall.privacy')} onPress={() => {}} size={12} color={colors.muted} />
        </View>

        <TextLinkButton
          label={restoring ? t('screen.paywall.restoring') : t('screen.paywall.restore')}
          onPress={handleRestore}
          size={12}
          color={colors.muted}
          style={styles.restore}
        />
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
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  subtitle: { fontSize: 14, marginBottom: 20, textAlign: 'center' },

  tierSection: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  tierHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  tierIconWrap: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  tierName: { fontSize: 18, fontWeight: '800' },
  tierDesc: { fontSize: 12, lineHeight: 16, marginTop: 2 },

  plansRow: { flexDirection: 'row', gap: 10 },
  planHalf: { flex: 1 },
  planCard: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
    minHeight: 100,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  planInterval: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 20, fontWeight: '800' },
  planPer: { fontSize: 11 },
  planEquivalent: { fontSize: 10, marginTop: 1 },
  selectedBadge: { position: 'absolute', bottom: 8, right: 8 },

  payInLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  currencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  currencyChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1,
  },
  currencyFlag: { fontSize: 13 },
  currencyCode: { fontSize: 12, fontWeight: '700' },
  channelsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    marginBottom: 20, justifyContent: 'flex-start',
  },
  channelChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999,
  },
  channelText: { fontSize: 11, fontWeight: '600' },

  trialSection: { gap: 10, marginBottom: 16 },
  trialBtn: { width: '100%' },
  trialNote: { fontSize: 12, textAlign: 'center', lineHeight: 18 },

  selectPrompt: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, borderWidth: 1,
    paddingVertical: 14, marginBottom: 16,
  },
  selectPromptText: { fontSize: 13, fontWeight: '500' },

  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 8 },
  legalDivider: { fontSize: 12 },
  restore: { marginTop: 4, alignSelf: 'center' },
});
