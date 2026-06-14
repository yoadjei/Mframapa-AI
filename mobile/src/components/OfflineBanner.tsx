import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { useTranslation } from '../hooks/useTranslation';
import { borderRadius, fontSize, getColors, spacing } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';

function isDeviceOffline(
  connected: boolean | null,
  reachable: boolean | null
): boolean {
  if (connected === false) return true;
  if (reachable === false) return true;
  return false;
}

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const lastPrediction = useStore((s) => s.lastPrediction);
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  useEffect(() => {
    const apply = (connected: boolean | null, reachable: boolean | null) => {
      setIsOffline(isDeviceOffline(connected, reachable));
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      apply(state.isConnected, state.isInternetReachable);
    });

    NetInfo.fetch().then((state) => {
      apply(state.isConnected, state.isInternetReachable);
    });

    return unsubscribe;
  }, []);

  if (!isOffline || !lastPrediction) return null;

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isDark ? '#51320E' : '#FFF5DD',
          borderColor: colors.warning,
        }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.warning + '22' }]}>
        <Ionicons name="cloud-offline-outline" size={15} color={colors.warning} />
      </View>
      <Text style={[styles.text, { color: isDark ? '#F8D27A' : '#8A5A00' }]}>
        {t('offline.cached_data')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    flex: 1,
  },
});
