import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { OutlineButton } from '../components/ui/OutlineButton';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

export function SubscriptionScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 22 }} />
        <Text style={[styles.navTitle, { color: colors.text }]}>{t('screen.subscription.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('screen.subscription.current_plan')}</Text>

        {/* Active Plan Card */}
        <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: Colors.brandGreen }]}>
          <View style={styles.planTop}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.brandGreen} />
            <Text style={[styles.planName, { color: Colors.brandGreen }]}>{t('screen.subscription.pro_trial')}</Text>
          </View>
          {/* Progress bar */}
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: '71%' }]} />
          </View>
          <Text style={[styles.planDetail, { color: colors.text }]}>{t('screen.subscription.days_remaining')}</Text>
          <Text style={[styles.planSub, { color: colors.subtext }]}>{t('screen.subscription.trial_ends')}</Text>
        </View>

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
            },
          ] as const).map((plan) => (
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

        <OutlineButton label={t('screen.subscription.restore')} onPress={() => {}} style={styles.restoreBtn} />
        <TouchableOpacity style={styles.cancelRow}>
          <Text style={[styles.cancel, { color: colors.subtext }]}>{t('screen.subscription.cancel')}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: colors.text, marginTop: 24 }]}>
          {t('screen.subscription.billing_history')}
        </Text>
        <Text style={[styles.noCharges, { color: colors.subtext }]}>{t('screen.subscription.no_charges')}</Text>

        <TouchableOpacity style={styles.manageRow}>
          <Text style={[styles.manageText, { color: colors.muted }]}>
            {Platform.OS === 'ios' ? t('screen.subscription.manage_ios') : t('screen.subscription.manage_android')}
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
  cancelRow: { alignItems: 'center', marginBottom: 24 },
  cancel: { fontSize: 14 },
  noCharges: { fontSize: 14, marginBottom: 16 },
  manageRow: { alignItems: 'center' },
  manageText: { fontSize: 13 },
});
