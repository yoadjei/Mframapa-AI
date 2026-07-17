import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import { Colors, getAQIColor } from '../../theme/colors';
import { useTheme } from '../../hooks/useTheme';
import { getColors } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';
import { aqiCategoryKey } from '../../utils/i18nHelpers';

interface Props {
  visible: boolean;
  onClose: () => void;
  cityName?: string;
  pm25?: number;
  category?: string;
}

export function ShareSheetScreen({
  visible,
  onClose,
  cityName = 'Accra',
  pm25 = 42,
  category = 'moderate',
}: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const categoryLabel = t(aqiCategoryKey(category));
  const categoryColor = getAQIColor(category);

  const shareText = `${cityName} air quality is ${categoryLabel}. PM2.5: ${pm25} μg/m³. Check real-time air quality across Africa on Mframapa: https://mframapa.ai`;

  async function handleWhatsApp() {
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: shareText });
    }
    onClose();
  }

  async function handleX() {
    const tweetText = `${cityName} air quality is ${categoryLabel}. PM2.5: ${pm25} μg/m³ #AirQuality #Africa`;
    const url = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent('https://mframapa.ai')}`;
    await Linking.openURL(url);
    onClose();
  }

  async function handleLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://mframapa.ai')}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      await Share.share({ message: shareText });
    }
    onClose();
  }

  async function handleCopyLink() {
    await Clipboard.setStringAsync(shareText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  }

  const SHARE_OPTIONS = [
    { label: 'WhatsApp', icon: 'logo-whatsapp' as const, color: '#25D366', onPress: handleWhatsApp },
    { label: 'X', icon: 'logo-twitter' as const, color: '#000000', onPress: handleX },
    { label: 'LinkedIn', icon: 'logo-linkedin' as const, color: '#0077B5', onPress: handleLinkedIn },
    { label: copied ? t('screen.share.copied') : t('screen.share.copy_link'), icon: copied ? 'checkmark' as const : 'link-outline' as const, color: copied ? Colors.brandGreen : '#8E8E93', onPress: handleCopyLink }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: isDark ? Colors.bgCard : '#fff' }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('screen.share.title')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {`${cityName} ${t('screen.share.air_quality_is')} `}
            <Text style={{ color: categoryColor }}>{categoryLabel}</Text>
          </Text>
          <Text style={[styles.pm25Text, { color: colors.subtext }]}>
            {t('screen.share.pm25_label', { value: String(pm25) })}
          </Text>
        </View>

        <View style={styles.barWrap}>
          <Svg width={300} height={10}>
            <Defs>
              <LinearGradient id="shareLegend" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={Colors.aqiGood} />
                <Stop offset="0.4" stopColor={Colors.aqiModerate} />
                <Stop offset="0.7" stopColor={Colors.aqiHigh} />
                <Stop offset="1" stopColor={Colors.aqiUnhealthy} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="300" height="10" fill="url(#shareLegend)" rx="5" />
          </Svg>
          <Text style={[styles.barLabel, { color: colors.subtext }]}>{t('common.aqi')}</Text>
        </View>

        <View style={styles.shareRow}>
          {SHARE_OPTIONS.map((opt) => (
            <View key={opt.label} style={styles.shareItem}>
              <TouchableOpacity
                style={[styles.shareIcon, { backgroundColor: opt.color }]}
                onPress={opt.onPress}
                activeOpacity={0.8}
              >
                <Ionicons name={opt.icon} size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={[styles.shareLabel, { color: colors.subtext }]}>{opt.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  summary: { marginBottom: 16, gap: 4 },
  summaryText: { fontSize: 16, fontWeight: '600' },
  pm25Text: { fontSize: 14 },
  barWrap: { alignItems: 'center', marginBottom: 24, gap: 6 },
  barLabel: { fontSize: 12 },
  shareRow: { flexDirection: 'row', justifyContent: 'space-around' },
  shareItem: { alignItems: 'center', gap: 8 },
  shareIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 11 },
});
