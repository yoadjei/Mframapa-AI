import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { TextLinkButton } from '../../components/ui/TextLinkButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTranslation } from '../../hooks/useTranslation';
import { useStore } from '../../store/useStore';

interface Props {
  onAllow: () => void;
  onSkip: () => void;
}

export function PermissionsScreen({ onAllow, onSkip }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const setLocationSharing = useStore((s) => s.setLocationSharing);
  const [requesting, setRequesting] = useState(false);

  async function handleAllow() {
    if (requesting) return;
    setRequesting(true);
    try {
      // Check current state first — if "never ask again" was already chosen,
      // requestForegroundPermissionsAsync resolves silently as denied and the
      // user must visit Settings to grant.
      const current = await Location.getForegroundPermissionsAsync();
      let status = current.status;

      if (status !== 'granted' && current.canAskAgain !== false) {
        const res = await Location.requestForegroundPermissionsAsync();
        status = res.status;
      }

      if (status === 'granted') {
        setLocationSharing('balanced');
        onAllow();
        return;
      }

      // Denied — offer to open Settings, but always continue the onboarding
      // flow so the user isn't stuck on this screen.
      setLocationSharing('off');
      Alert.alert(
        t('screen.permissions.denied_title'),
        t('screen.permissions.denied_body'),
        [
          { text: t('screen.permissions.open_settings'), onPress: () => Linking.openSettings() },
          { text: t('common.continue'), onPress: onAllow, style: 'cancel' },
        ],
      );
    } catch {
      setLocationSharing('off');
      onAllow();
    } finally {
      setRequesting(false);
    }
  }

  function handleSkip() {
    setLocationSharing('off');
    onSkip();
  }

  return (
    <View style={[styles.root, {paddingTop: insets.top, paddingBottom: insets.bottom }]}>
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
        <PrimaryButton
          label={t('screen.permissions.allow')}
          onPress={handleAllow}
          loading={requesting}
          style={styles.btn}
        />
        <OutlineButton label={t('screen.permissions.not_now')} onPress={handleSkip} color={colors.muted} style={styles.btn} />
        <View style={styles.dots}>
          <View style={[styles.dot, { backgroundColor: Colors.brandGreen }]} />
          <View style={[styles.dot, { backgroundColor: colors.muted }]} />
        </View>
        <TextLinkButton
          label={t('screen.permissions.setup_later')}
          onPress={handleSkip}
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
