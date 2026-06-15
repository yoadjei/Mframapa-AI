import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  formatPrice,
  formatPriceWithLocal,
  SUPPORTED_CURRENCIES,
  CURRENCY_INFO,
  Currency,
} from '../utils/plans';
import { isPaystackConfigured } from '../services/paystack';

const FEATURES = [
  'screen.paywall.feature_cities',
  'screen.paywall.feature_predictions',
  'screen.paywall.feature_health',
  'screen.paywall.feature_trends',
  'screen.paywall.feature_exports'] as const;

interface Props {
  onDone?: () => void;
}

export function PaywallScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const startFreeTrial    = useStore((s) => s.startFreeTrial);
  const restorePurchases  = useStore((s) => s.restorePurchases);
  const trialEndsAt       = useStore((s) => s.trialEndsAt);
  const tier              = useStore((s) => s.profile.tier);
  const paymentCurrency   = useStore((s) => s.paymentCurrency);
  const setPaymentCurrency = useStore((s) => s.setPaymentCurrency);

  const trialActive = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  // State machine for the primary CTA:
  //   • inTrial → "Continue with Free Trial" (paywall reopened during an
  //     active trial; subscribing again would be a no-op)
  //   • alreadyPro → "Continue" (manually upgraded, restore handles re-link)
  //   • else → "Start Free Trial"
  const primaryMode: 'continue_trial' | 'continue' | 'start_trial' =
    trialActive ? 'continue_trial' : tier === 'pro' ? 'continue' : 'start_trial';

  const primaryLabel = (() => {
    switch (primaryMode) {
      case 'continue_trial': return t('screen.paywall.continue_trial');
      case 'continue':       return t('screen.paywall.continue');
      case 'start_trial':    return t('screen.paywall.start_trial');
    }
  })();

  const [restoring, setRestoring]   = useState(false);
  const [selectedPlan, setSelected] = useState<PlanId>('pro_annual');
  const paystackReady = isPaystackConfigured();

  function handleBuy() {
    if (!paystackReady) {
      Alert.alert(t('screen.paywall.paystack_not_configured'));
      return;
    }
    navigation.navigate('PaystackCheckout', { planId: selectedPlan });
  }

  function handlePrimary() {
    if (primaryMode === 'start_trial') startFreeTrial();
    if (onDone) onDone();
    else navigation.navigate('Subscription');
  }

  function handleContinueFree() {
    if (onDone) onDone();
    else navigation.goBack();
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.restored === 'pro') {
      Alert.alert(t('screen.paywall.pro_restored'));
      if (onDone) onDone();
    } else if (res.restored === 'trial') {
      Alert.alert(t('screen.paywall.trial_restored'));
      if (onDone) onDone();
    } else {
      Alert.alert(t('screen.paywall.nothing_to_restore'));
    }
  }

  return (
    <View style={[styles.root]}>
      {/* Preview card with fade */}
      <View style={styles.previewArea}>
        <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.previewCardTitle, { color: colors.subtext }]}>
            {t('screen.paywall.preview_title')}
          </Text>
          <View style={styles.previewFakeChart}>
            {[60, 90, 50, 110, 80, 70, 100, 60].map((h, i) => (
              <View
                key={i}
                style={[styles.previewBar, {
                  height: h * 0.6,
                  backgroundColor: [Colors.aqiGood, Colors.aqiModerate, Colors.aqiHigh, Colors.aqiUnhealthy][i % 4],
                  opacity: isDark ? 0.75 : 0.55,
                }]}
              />
            ))}
          </View>
        </View>
        <LinearGradient
          colors={['transparent', colors.background]}
          style={styles.previewFade}
          pointerEvents="none"
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconWrap, { backgroundColor: Colors.brandGreen + '22' }]}>
          <Ionicons name="sparkles" size={40} color={Colors.brandGreen} />
        </View>

        <Text style={[styles.headline, { color: colors.text }]}>{t('screen.paywall.headline')}</Text>
        <Text style={[styles.sub, { color: colors.subtext }]}>{t('screen.paywall.sub')}</Text>

        <View style={styles.features}>
          {FEATURES.map((key) => (
            <View key={key} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.brandGreen} />
              <Text style={[styles.featureText, { color: colors.text }]}>{t(key)}</Text>
            </View>
          ))}
        </View>

        {/* ── Plan selector ─────────────────────────────────────────────── */}
        <View style={styles.planRow}>
          {PRICING_PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            const monthly = plan.id === 'pro_monthly';
            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => setSelected(plan.id)}
                activeOpacity={0.85}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: selected ? Colors.brandGreen : colors.border,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                {plan.badge ? (
                  <View style={[styles.planBadge, { backgroundColor: Colors.brandGreen }]}>
                    <Text style={styles.planBadgeText}>{plan.badge}</Text>
                  </View>
                ) : null}
                <Text style={[styles.planLabel, { color: colors.subtext }]}>{plan.label}</Text>
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
                {!monthly ? (
                  <Text style={[styles.planEquivalent, { color: colors.muted }]}>
                    {formatPriceWithLocal(plan.amountUsd / 12, paymentCurrency)} / month
                  </Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Pay-in currency selector ──────────────────────────────────── */}
        <Text style={[styles.payInLabel, { color: colors.subtext }]}>
          {t('screen.paywall.pay_in')}
        </Text>
        <View style={styles.currencyRow}>
          {SUPPORTED_CURRENCIES.map((c: Currency) => {
            const info = CURRENCY_INFO[c];
            const selected = paymentCurrency === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setPaymentCurrency(c)}
                activeOpacity={0.8}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: selected ? Colors.brandGreen : colors.card,
                    borderColor: selected ? Colors.brandGreen : colors.border,
                  },
                ]}
              >
                <Text style={styles.currencyFlag}>{info.flag}</Text>
                <Text
                  style={[
                    styles.currencyCode,
                    { color: selected ? '#fff' : colors.text },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.channelsRow}>
          {CURRENCY_INFO[paymentCurrency].channels.map((ch) => (
            <View
              key={ch}
              style={[styles.channelChip, { backgroundColor: Colors.brandGreen + '15' }]}
            >
              <Ionicons
                name={
                  ch === 'card'           ? 'card-outline'         :
                  ch === 'mobile_money'   ? 'phone-portrait-outline' :
                  ch === 'bank_transfer'  ? 'business-outline'     :
                  ch === 'ussd'           ? 'keypad-outline'       :
                  ch === 'qr'             ? 'qr-code-outline'      :
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

        <PrimaryButton
          label={t('screen.paywall.subscribe_for', {
            price: formatPriceWithLocal(
              PRICING_PLANS.find((p) => p.id === selectedPlan)!.amountUsd,
              paymentCurrency,
            ),
          })}
          onPress={handleBuy}
          style={styles.cta}
        />

        <Text style={[styles.finePrint, { color: colors.muted }]}>{t('screen.paywall.fine_print')}</Text>
        <View style={styles.legalRow}>
          <TextLinkButton label={t('screen.paywall.terms')} onPress={() => {}} size={12} color={colors.muted} />
          <Text style={[styles.legalDivider, { color: colors.muted }]}>|</Text>
          <TextLinkButton label={t('screen.paywall.privacy')} onPress={() => {}} size={12} color={colors.muted} />
        </View>

        <TextLinkButton label={primaryLabel} onPress={handlePrimary} color={colors.subtext} style={styles.skip} />
        <TextLinkButton label={t('screen.paywall.continue_free')} onPress={handleContinueFree} color={colors.subtext} style={styles.skip} />
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
  previewArea: { height: 160, overflow: 'hidden' },
  previewCard: { margin: 20, borderRadius: 16, borderWidth: 1, padding: 14, flex: 1 },
  previewCardTitle: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  previewFakeChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, paddingTop: 4 },
  previewBar: { flex: 1, borderRadius: 3 },
  previewFade: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  content: { paddingHorizontal: 28, alignItems: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  headline: { fontSize: 34, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  sub: { fontSize: 15, textAlign: 'center', marginBottom: 28 },
  features: { width: '100%', gap: 16, marginBottom: 28 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 16, fontWeight: '500' },
  finePrint: { fontSize: 12, textAlign: 'center', marginBottom: 4 },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  legalDivider: { fontSize: 12 },
  cta: { width: '100%', marginBottom: 14 },
  skip: { marginBottom: 12 },
  restore: { marginTop: 4 },
  planRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 18 },
  planCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 4,
    minHeight: 110,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  planBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  planLabel: { fontSize: 12, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 22, fontWeight: '800' },
  planPer: { fontSize: 12 },
  planEquivalent: { fontSize: 11, marginTop: 2 },
  payInLabel: {
    fontSize: 12,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currencyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  currencyFlag: { fontSize: 14 },
  currencyCode: { fontSize: 13, fontWeight: '700' },
  channelsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
    marginBottom: 16,
    justifyContent: 'center',
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  channelText: { fontSize: 11, fontWeight: '600' },
});
