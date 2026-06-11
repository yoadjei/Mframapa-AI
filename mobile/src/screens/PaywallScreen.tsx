import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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

  const startFreeTrial   = useStore((s) => s.startFreeTrial);
  const restorePurchases = useStore((s) => s.restorePurchases);
  const trialEndsAt      = useStore((s) => s.trialEndsAt);
  const tier             = useStore((s) => s.profile.tier);

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

  const [restoring, setRestoring] = useState(false);

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

        <Text style={[styles.finePrint, { color: colors.muted }]}>{t('screen.paywall.fine_print')}</Text>
        <View style={styles.legalRow}>
          <TextLinkButton label={t('screen.paywall.terms')} onPress={() => {}} size={12} color={colors.muted} />
          <Text style={[styles.legalDivider, { color: colors.muted }]}>|</Text>
          <TextLinkButton label={t('screen.paywall.privacy')} onPress={() => {}} size={12} color={colors.muted} />
        </View>

        <PrimaryButton label={primaryLabel} onPress={handlePrimary} style={styles.cta} />
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
  skip: { marginBottom: 16 },
  restore: { marginTop: 4 },
});
