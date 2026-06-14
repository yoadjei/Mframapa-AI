import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getColors, Colors } from '../theme';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { useTranslation } from '../hooks/useTranslation';

const FEATURE_KEYS = [
  { icon: 'pulse-outline' as const, labelKey: 'screen.landing.feature1_label', descKey: 'screen.landing.feature1_desc' },
  { icon: 'globe-outline' as const, labelKey: 'screen.landing.feature2_label', descKey: 'screen.landing.feature2_desc' },
  { icon: 'cloud-offline-outline' as const, labelKey: 'screen.landing.feature3_label', descKey: 'screen.landing.feature3_desc' }];

export function LandingMarketingScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <Text style={[styles.heroText, { color: colors.text }]}>{t('screen.landing.hero')}</Text>
          <Text style={[styles.heroParagraph, { color: colors.subtext }]}>{t('screen.landing.hero_sub')}</Text>
          <PrimaryButton label={t('screen.landing.get_started')} onPress={() => {}} style={styles.cta} />
        </View>

        <View style={styles.featuresRow}>
          {FEATURE_KEYS.map((f) => (
            <View key={f.labelKey} style={[styles.featureCard, { backgroundColor: colors.card }]}>
              <Ionicons name={f.icon} size={22} color={Colors.brandGreen} />
              <Text style={[styles.featureLabel, { color: colors.text }]}>{t(f.labelKey)}</Text>
              <Text style={[styles.featureDesc, { color: colors.muted }]}>{t(f.descKey)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
          <Text style={[styles.statsText, { color: colors.subtext }]}>{t('screen.landing.stats')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  heroBlock: { gap: 20, marginBottom: 36 },
  heroText: { fontSize: 44, fontWeight: '800', lineHeight: 52, letterSpacing: -0.5 },
  heroParagraph: { fontSize: 16, lineHeight: 24 },
  cta: {},
  featuresRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  featureCard: { flex: 1, borderRadius: 14, padding: 12, gap: 6, minHeight: 110 },
  featureLabel: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
  featureDesc: { fontSize: 10, lineHeight: 14, flexShrink: 1 },
  statsBar: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
  statsText: { fontSize: 12, fontWeight: '500' },
});
