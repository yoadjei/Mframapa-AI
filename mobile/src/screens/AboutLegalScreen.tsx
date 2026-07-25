import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import Constants from 'expo-constants';
import { useTheme } from '../hooks/useTheme';
import { getColors } from '../theme';
import { MframapaLogo } from '../components/MframapaLogo';
import { useTranslation } from '../hooks/useTranslation';

const APP_VERSION =
  Constants.expoConfig?.version ??
  Constants.nativeAppVersion ??
  '1.0.0';

const APP_VERSION =
  Constants.expoConfig?.version ??
  Constants.nativeAppVersion ??
  '1.0.0';

const LINK_KEYS = [
  'settings.about.privacy',
  'settings.about.terms',
  'settings.about.licenses',
  'settings.about.contact',
];

export function AboutLegalScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  return (
    <View style={[styles.root, {paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoBlock}>
          <MframapaLogo size="lg" />
          <Text style={[styles.version, { color: colors.muted }]}>{`Version ${APP_VERSION}`}</Text>
        </View>

        <View style={[styles.linkList, { borderColor: colors.border }]}>
          {LINK_KEYS.map((linkKey, i) => (
            <TouchableOpacity
              key={linkKey}
              style={[
                styles.linkRow,
                { backgroundColor: colors.card, borderBottomColor: colors.border },
                i === LINK_KEYS.length - 1 && styles.linkRowLast]}
            >
              <Text style={[styles.linkText, { color: colors.text }]}>{t(linkKey)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  logoBlock: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  version: { fontSize: 13 },
  linkList: { width: '100%', borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkRowLast: { borderBottomWidth: 0 },
  linkText: { fontSize: 15 },
  footer: { fontSize: 13, marginTop: 32 },
});
