import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTranslation } from '../../hooks/useTranslation';

export function ForceUpdateScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={[styles.root, {paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.logoContainer}>
        <MframapaLogo size="md" />
      </View>

      <View style={styles.center}>
        <Ionicons name="download-outline" size={72} color={Colors.brandGreen} />
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.force_update.title')}</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('screen.force_update.subtitle')}</Text>
      </View>

      <View style={styles.buttons}>
        <PrimaryButton
          label={t('screen.force_update.cta')}
          onPress={() => Linking.openURL('https://mframapa.ai')}
          style={styles.btn}
        />

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={[styles.accordion, { borderColor: colors.border }]}
        >
          <Text style={[styles.accordionLabel, { color: colors.subtext }]}>{t('screen.force_update.whats_new')}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
        </TouchableOpacity>
        {expanded ? (
          <View style={[styles.accordionBody, { backgroundColor: colors.card }]}>
            <Text style={[styles.accordionText, { color: colors.subtext }]}>{t('screen.force_update.changelog')}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', paddingTop: 16, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  buttons: { gap: 12, paddingBottom: 16 },
  btn: {},
  accordion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  accordionLabel: { fontSize: 15 },
  accordionBody: { borderRadius: 10, padding: 14 },
  accordionText: { fontSize: 14, lineHeight: 22 },
});
