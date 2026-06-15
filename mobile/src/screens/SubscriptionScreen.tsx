import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OutlineButton } from '../components/ui/OutlineButton';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

// Deep links into the platform's native subscription management UI.
// These are the canonical URLs Apple and Google document for in-app links.
const MANAGE_SUB_URL = Platform.select({
  ios:     'itms-apps://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
}) ?? 'https://example.com';

export function SubscriptionScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const tier                  = useStore((s) => s.profile.tier);
  const trialStartedAt        = useStore((s) => s.trialStartedAt);
  const trialEndsAt           = useStore((s) => s.trialEndsAt);
  const subscriptionPlan      = useStore((s) => s.subscriptionPlan);
  const subscriptionExpiresAt = useStore((s) => s.subscriptionExpiresAt);
  const startFreeTrial        = useStore((s) => s.startFreeTrial);
  const cancelTrial           = useStore((s) => s.cancelTrial);
  const restorePurchases      = useStore((s) => s.restorePurchases);
  const trialDaysRemaining    = useStore((s) => s.trialDaysRemaining);
  const trialProgress         = useStore((s) => s.trialProgress);

  const [restoring, setRestoring]   = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────
  const trialActive   = !!trialEndsAt && new Date(trialEndsAt) > new Date();
  const daysLeft      = trialDaysRemaining();
  const progressPct: `${number}%` = `${Math.round(trialProgress() * 100)}%`;
  const trialEndsDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  type Mode = 'free' | 'trial' | 'pro' | 'enterprise';
  const mode: Mode =
    tier === 'enterprise'           ? 'enterprise' :
    tier === 'pro' && trialActive   ? 'trial' :
    tier === 'pro'                  ? 'pro' :
                                      'free';

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleUpgrade() {
    navigation.navigate('Paywall');
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    const res = await restorePurchases();
    setRestoring(false);
    if (res.restored === 'pro')   Alert.alert(t('screen.paywall.pro_restored'));
    else if (res.restored === 'trial') Alert.alert(t('screen.paywall.trial_restored'));
    else Alert.alert(t('screen.paywall.nothing_to_restore'));
  }

  function handleCancel() {
    if (cancelling) return;
    if (mode === 'free') return;

    // Trial cancellations are local — there's no platform store charge to
    // refund. Paid subscriptions must be managed via the platform store.
    if (mode === 'trial') {
      Alert.alert(
        t('screen.subscription.cancel_trial_heading'),
        t('screen.subscription.cancel_trial_warning'),
        [
          { text: t('common.back'), style: 'cancel' },
          {
            text: t('screen.subscription.confirm_cancel_trial'),
            style: 'destructive',
            onPress: () => {
              setCancelling(true);
              cancelTrial();
              setCancelling(false);
              Alert.alert(t('screen.subscription.trial_cancelled_message'));
            },
          },
        ],
      );
      return;
    }

    // Paid → deep-link to native subscription management.
    void handleManage();
  }

  async function handleManage() {
    try {
      const supported = await Linking.canOpenURL(MANAGE_SUB_URL);
      if (!supported) {
        Alert.alert(t('screen.subscription.cannot_open_manage_page'));
        return;
      }
      await Linking.openURL(MANAGE_SUB_URL);
    } catch {
      Alert.alert(t('screen.subscription.cannot_open_manage_page'));
    }
  }

  // Tiny derived "billing history" — the only real event we track locally is
  // when the trial began. Real purchase events would be appended here when
  // wired through StoreKit / Play Billing.
  const billingEntries = trialStartedAt
    ? [
        {
          id: 'trial-start',
          label: t('screen.subscription.entry_trial_started'),
          date: new Date(trialStartedAt).toLocaleDateString([], {
            month: 'short', day: 'numeric', year: 'numeric',
          }),
          amount: t('screen.subscription.amount_free'),
        },
      ]
    : [];

  // ── Render plan card based on mode ────────────────────────────────────────
  function PlanCard() {
    if (mode === 'trial') {
      return (
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: Colors.brandGreen }]}>
          <View style={styles.planTop}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.brandGreen} />
            <Text style={[styles.planName, { color: Colors.brandGreen }]}>
              {t('screen.subscription.pro_trial')}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: progressPct }]} />
          </View>
          <Text style={[styles.planDetail, { color: colors.text }]}>
            {t('screen.subscription.days_remaining', { count: String(daysLeft) })}
          </Text>
          <Text style={[styles.planSub, { color: colors.subtext }]}>
            {t('screen.subscription.trial_ends_date', { date: trialEndsDate })}
          </Text>
        </View>
      );
    }
    if (mode === 'pro') {
      const planLabel = subscriptionPlan === 'pro_annual'
        ? t('screen.subscription.plan_pro_annual')
        : subscriptionPlan === 'pro_monthly'
          ? t('screen.subscription.plan_pro_monthly')
          : t('screen.subscription.plan_pro');
      const renewsOn = subscriptionExpiresAt
        ? new Date(subscriptionExpiresAt).toLocaleDateString([], {
            month: 'short', day: 'numeric', year: 'numeric',
          })
        : '';
      return (
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: Colors.brandGreen }]}>
          <View style={styles.planTop}>
            <Ionicons name="star" size={16} color={Colors.brandGreen} />
            <Text style={[styles.planName, { color: Colors.brandGreen }]}>{planLabel}</Text>
          </View>
          <Text style={[styles.planDetail, { color: colors.text }]}>
            {t('screen.subscription.subscription_active')}
          </Text>
          {renewsOn ? (
            <Text style={[styles.planSub, { color: colors.subtext }]}>
              {t('screen.subscription.renews_on', { date: renewsOn })}
            </Text>
          ) : null}
        </View>
      );
    }
    if (mode === 'enterprise') {
      return (
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: Colors.enterprise }]}>
          <View style={styles.planTop}>
            <Ionicons name="business" size={16} color={Colors.enterprise} />
            <Text style={[styles.planName, { color: Colors.enterprise }]}>
              {t('screen.subscription.plan_enterprise')}
            </Text>
          </View>
          <Text style={[styles.planDetail, { color: colors.text }]}>
            {t('screen.subscription.enterprise_active')}
          </Text>
        </View>
      );
    }
    // Free
    return (
      <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.planTop}>
          <Ionicons name="leaf-outline" size={16} color={colors.subtext} />
          <Text style={[styles.planName, { color: colors.text }]}>
            {t('screen.subscription.plan_free')}
          </Text>
        </View>
        <Text style={[styles.planSub, { color: colors.subtext }]}>
          {t('screen.subscription.free_plan_blurb')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{t('screen.subscription.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.text }]}>
          {t('screen.subscription.current_plan')}
        </Text>

        <PlanCard />

        {/* Primary CTA for the Free tier — start trial or open paywall */}
        {mode === 'free' ? (
          <View style={{ gap: 8, marginBottom: 16 }}>
            <PrimaryButton
              label={t('screen.paywall.start_trial')}
              onPress={() => {
                startFreeTrial();
                Alert.alert(t('screen.subscription.trial_started_message'));
              }}
            />
            <OutlineButton label={t('screen.subscription.see_all_plans')} onPress={handleUpgrade} />
          </View>
        ) : null}

        {/* Plan comparison row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.compareScroll}>
          {([
            {
              nameKey: 'screen.subscription.plan_free',
              color: colors.subtext,
              features: ['screen.pricing.feat.basic_aqi', 'screen.pricing.feat.search', 'screen.pricing.feat.saved_3'],
            },
            {
              nameKey: 'screen.subscription.plan_pro',
              color: Colors.brandGreen,
              features: ['screen.pricing.feat.saved_unlimited', 'screen.pricing.feat.ai_insights', 'screen.pricing.feat.predictions', 'screen.pricing.feat.health_risk', 'screen.pricing.feat.historical', 'screen.pricing.feat.compare', 'screen.pricing.feat.exports'],
            },
            {
              nameKey: 'screen.subscription.plan_enterprise',
              color: Colors.enterprise,
              features: ['screen.pricing.feat.anomaly', 'screen.pricing.feat.heatmap', 'screen.pricing.feat.batch', 'screen.pricing.feat.api', 'screen.pricing.feat.country'],
            }] as const).map((plan) => (
            <View key={plan.nameKey} style={[styles.compareCard, { backgroundColor: colors.card, borderColor: plan.color }]}>
              <Text style={[styles.compareTitle, { color: plan.color }]}>{t(plan.nameKey)}</Text>
              {plan.features.map((fk) => (
                <View key={fk} style={styles.compareFeat}>
                  <Ionicons name="checkmark" size={13} color={plan.color} />
                  <Text style={[styles.compareDesc, { color: colors.subtext }]}>{t(fk)}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        <OutlineButton
          label={restoring ? t('screen.paywall.restoring') : t('screen.subscription.restore')}
          onPress={handleRestore}
          style={styles.restoreBtn}
        />

        {/* Cancel: only useful when there is something cancellable */}
        {mode !== 'free' ? (
          <TouchableOpacity
            style={styles.cancelRow}
            onPress={handleCancel}
            disabled={cancelling}
          >
            <Text style={[styles.cancel, { color: Colors.danger }]}>
              {mode === 'trial'
                ? t('screen.subscription.cancel_trial')
                : t('screen.subscription.cancel')}
            </Text>
          </TouchableOpacity>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 24 }]}>
          {t('screen.subscription.billing_history')}
        </Text>
        {billingEntries.length === 0 ? (
          <Text style={[styles.noCharges, { color: colors.subtext }]}>
            {t('screen.subscription.no_charges')}
          </Text>
        ) : (
          billingEntries.map((entry) => (
            <View
              key={entry.id}
              style={[styles.billingRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.billingLabel, { color: colors.text }]}>{entry.label}</Text>
                <Text style={[styles.billingDate, { color: colors.subtext }]}>{entry.date}</Text>
              </View>
              <Text style={[styles.billingAmount, { color: Colors.brandGreen }]}>{entry.amount}</Text>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.manageRow} onPress={handleManage}>
          <Text style={[styles.manageText, { color: Colors.brandGreen }]}>
            {Platform.OS === 'ios'
              ? t('screen.subscription.manage_ios')
              : t('screen.subscription.manage_android')}
          </Text>
        </TouchableOpacity>
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
  navTitle: { fontSize: 17, fontWeight: '600' },
  content: { padding: 16 },
  sectionLabel: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  planCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 16, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.brandGreen, borderRadius: 3 },
  planDetail: { fontSize: 15, fontWeight: '600' },
  planSub: { fontSize: 13 },
  compareScroll: { marginBottom: 24 },
  compareCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginRight: 10,
    gap: 6,
  },
  compareTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  compareFeat: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compareDesc: { fontSize: 12, flex: 1, lineHeight: 16 },
  restoreBtn: { marginBottom: 12 },
  cancelRow: { alignItems: 'center', marginBottom: 24, paddingVertical: 8 },
  cancel: { fontSize: 14, fontWeight: '600' },
  noCharges: { fontSize: 14, marginBottom: 16 },
  billingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  billingLabel: { fontSize: 14, fontWeight: '600' },
  billingDate: { fontSize: 12, marginTop: 2 },
  billingAmount: { fontSize: 14, fontWeight: '700' },
  manageRow: { alignItems: 'center', marginTop: 8, paddingVertical: 8 },
  manageText: { fontSize: 13, fontWeight: '600' },
});
