import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { TextLinkButton } from '../../components/ui/TextLinkButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTranslation } from '../../hooks/useTranslation';

interface Props {
  onAllow: () => void;
  onSkip: () => void;
}

export function PermissionsScreen({ onAllow, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.logoContainer}>
        <MframapaLogo size="md" />
      </View>

      <View style={styles.center}>
        <View style={[styles.iconCircle, { backgroundColor: colors.accentDim, borderColor: Colors.brandGreen }]}>
          <Ionicons name="location" size={52} color={Colors.brandGreen} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.permissions.title')}</Text>
        <Text style={[styles.body, { color: colors.subtext }]}>{t('screen.permissions.body')}</Text>
      </View>

      <View style={styles.buttons}>
        <PrimaryButton label={t('screen.permissions.allow')} onPress={onAllow} style={styles.btn} />
        <OutlineButton label={t('screen.permissions.not_now')} onPress={onSkip} color={colors.muted} style={styles.btn} />
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: Colors.brandGreen }]} />
          <View style={[styles.dot, { backgroundColor: colors.muted }]} />
        </View>
        <TextLinkButton
          label={t('screen.permissions.setup_later')}
          onPress={onSkip}
          color={Colors.brandGreen}
          size={13}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  logoContainer: { alignItems: 'center', paddingTop: 16, paddingBottom: 8, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: Colors.brandGreen,
    shadowRadius: 20,
    shadowOpacity: 0.4,
    elevation: 8,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  buttons: { gap: 12, paddingBottom: 16, alignItems: 'center' },
  btn: { width: '100%' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
