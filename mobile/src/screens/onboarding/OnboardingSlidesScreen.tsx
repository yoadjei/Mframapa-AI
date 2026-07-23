import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { MframapaLogo } from '../../components/MframapaLogo';
import { useTranslation } from '../../hooks/useTranslation';

const { width: W } = Dimensions.get('window');

const SLIDE_KEYS = [
  { titleKey: 'screen.onboarding.slide1_title', subKey: 'screen.onboarding.slide1_sub', icon: 'earth-outline' as const },
  { titleKey: 'screen.onboarding.slide2_title', subKey: 'screen.onboarding.slide2_sub', icon: 'analytics-outline' as const },
  { titleKey: 'screen.onboarding.slide3_title', subKey: 'screen.onboarding.slide3_sub', icon: 'shield-checkmark-outline' as const }];

interface Props {
  onDone: () => void;
}

export function OnboardingSlidesScreen({ onDone }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();

  function goNext() {
    if (index < SLIDE_KEYS.length - 1) {
      const next = index + 1;
      scrollRef.current?.scrollTo({ x: next * W, animated: true });
      setIndex(next);
    } else {
      onDone();
    }
  }

  return (
    <View style={[styles.root, {paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <MframapaLogo size="sm" markOnly />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {SLIDE_KEYS.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: W }]}>
            <View style={styles.mapContainer}>
              <LinearGradient
                colors={isDark ? ['#0D3325', '#071810'] : ['#C8F0E0', '#A8E6CC']}
                style={styles.mapGlow}
              >
                <Ionicons name={slide.icon} size={120} color={Colors.brandGreen} style={{ opacity: 0.9 }} />
              </LinearGradient>
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: colors.text }]}>{t(slide.titleKey)}</Text>
              <Text style={[styles.subtitle, { color: colors.subtext }]}>{t(slide.subKey)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.dots}>
          {SLIDE_KEYS.map((_, i) => (
            <View
              key={i}
              style={[styles.pageDot, { backgroundColor: i === index ? Colors.brandGreen : colors.muted }]}
            />
          ))}
        </View>
        <PrimaryButton
          label={index === SLIDE_KEYS.length - 1 ? t('screen.onboarding.get_started') : t('screen.onboarding.next')}
          onPress={goNext}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  mapContainer: { width: W * 0.75, height: W * 0.75, marginBottom: 40 },
  mapGlow: { flex: 1, borderRadius: W * 0.375, alignItems: 'center', justifyContent: 'center' },
  textBlock: { alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', lineHeight: 32 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  bottom: { paddingHorizontal: 24, paddingBottom: 24, gap: 20, alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 8 },
  pageDot: { width: 8, height: 8, borderRadius: 4 },
  btn: { width: '100%' },
});
