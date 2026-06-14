import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { useTranslation } from '../../hooks/useTranslation';

export function ErrorScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.root, {paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.center}>
        <View style={[styles.iconWrap]}>
          <Ionicons name="cloud-outline" size={80} color={Colors.brandGreen} />
          <View style={[styles.xOverlay, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={32} color={Colors.brandGreen} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{t('screen.error.no_connection')}</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>{t('screen.error.subtitle')}</Text>

        <View style={styles.buttons}>
          <PrimaryButton label={t('screen.error.try_again')} onPress={() => {}} style={styles.btn} />
          <OutlineButton
            label={t('screen.error.go_home')}
            onPress={() => navigation.navigate('Home')}
            color={colors.text}
            style={styles.btn}
          />
        </View>
      </View>

      <View style={styles.bottom}>
        <Ionicons name="leaf" size={14} color={Colors.brandGreen} />
        <Text style={[styles.wordmark, { color: Colors.brandGreen }]}>mframapa</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  xOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    borderRadius: 20,
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  buttons: { width: '100%', gap: 12, marginTop: 8 },
  btn: {},
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 16,
  },
  wordmark: { fontSize: 16, fontWeight: '700' },
});
