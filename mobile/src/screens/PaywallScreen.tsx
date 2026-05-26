import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

const FEATURES = [
  'screen.paywall.feature_cities',
  'screen.paywall.feature_predictions',
  'screen.paywall.feature_health',
  'screen.paywall.feature_trends',
  'screen.paywall.feature_exports',
] as const;

interface Props {
  onDone?: () => void;
}

export function PaywallScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const setProfile = useStore((s) => s.setProfile);

  function handleStartTrial() {
    setProfile({ tier: 'pro' });
    if (onDone) { onDone(); } else { navigation.navigate('Subscription'); }
  }

  function handleContinueFree() {
    if (onDone) { onDone(); } else { navigation.goBack(); }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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

        <Text style={[styles.finePrint, { color: colors.muted }]}>{t('screen.paywall.fine_print')}</Text>
        <View style={styles.legalRow}>
          <TextLinkButton label={t('screen.paywall.terms')} onPress={() => {}} size={12} color={colors.muted} />
          <Text style={[styles.legalDivider, { color: colors.muted }]}>|</Text>
          <TextLinkButton label={t('screen.paywall.privacy')} onPress={() => {}} size={12} color={colors.muted} />
        </View>

        <PrimaryButton label={t('screen.paywall.start_trial')} onPress={handleStartTrial} style={styles.cta} />
        <TextLinkButton label={t('screen.paywall.continue_free')} onPress={handleContinueFree} color={colors.subtext} style={styles.skip} />
        <TextLinkButton label={t('screen.paywall.restore')} onPress={() => {}} size={12} color={colors.muted} style={styles.restore} />
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
  skip: { marginBottom: 16 },
  restore: { marginTop: 4 },
});
