import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import {
  requestPermissions,
  getAndRegisterPushToken,
} from '../services/notifications';
import { GlassSheet } from './ui/GlassSheet';

export const PUSH_PROMPT_SEEN_KEY = 'mframapa:push-prompt-seen';

export async function markPushPromptSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(PUSH_PROMPT_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export async function hasSeenPushPrompt(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PUSH_PROMPT_SEEN_KEY)) === '1';
  } catch {
    return false;
  }
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPermissionSheet({ visible, onClose }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const lastPrediction = useStore((s) => s.lastPrediction);
  const [busy, setBusy] = useState(false);

  async function handleAllow() {
    if (busy) return;
    setBusy(true);
    try {
      await markPushPromptSeen();
      const granted = await requestPermissions();
      if (granted) {
        const lat = lastPrediction?.location?.lat;
        const lon = lastPrediction?.location?.lon;
        await getAndRegisterPushToken(lat, lon);
      }
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      onClose();
    }
  }

  async function handleNotNow() {
    await markPushPromptSeen();
    onClose();
  }

  return (
    <GlassSheet visible={visible} onClose={handleNotNow} overlayOpacity={0.45}>
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: Colors.brandGreen + '22' }]}>
          <Ionicons name="notifications-outline" size={22} color={Colors.brandGreen} />
        </View>
        <TouchableOpacity onPress={handleNotNow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={20} color={colors.subtext} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{t('push_prompt.title')}</Text>
      <Text style={[styles.body, { color: colors.subtext }]}>{t('push_prompt.body')}</Text>

      <TouchableOpacity
        style={[styles.allowBtn, { backgroundColor: Colors.brandGreen }]}
        onPress={handleAllow}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.allowText}>{t('push_prompt.allow')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.notNowBtn}
        onPress={handleNotNow}
        disabled={busy}
        activeOpacity={0.7}
      >
        <Text style={[styles.notNowText, { color: colors.subtext }]}>
          {t('push_prompt.not_now')}
        </Text>
      </TouchableOpacity>
    </GlassSheet>
  );
}

const styles = StyleSheet.create({
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 18, marginBottom: 20 },
  allowBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  allowText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  notNowBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 4 : 0,
  },
  notNowText: { fontSize: 15, fontWeight: '500' },
});
