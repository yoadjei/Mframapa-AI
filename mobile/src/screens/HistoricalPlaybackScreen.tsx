import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { AfricaMapView, MapMarker } from '../components/AfricaMapView';
import { getAQIColor } from '../theme/colors';
import { useTranslation } from '../hooks/useTranslation';
import { MframapaLogo } from '../components/MframapaLogo';

const PLAYBACK_CITIES = [
  { name: 'Accra', lat: 5.6, lon: -0.2 },
  { name: 'Lagos', lat: 6.5, lon: 3.4 },
  { name: 'Cairo', lat: 30.1, lon: 31.2 },
  { name: 'Nairobi', lat: -1.3, lon: 36.8 },
  { name: 'Kinshasa', lat: -4.3, lon: 15.3 },
] as const;

const AQI_CATEGORIES = [
  'good',
  'moderate',
  'unhealthy for sensitive groups',
  'unhealthy',
  'very unhealthy',
] as const;

/** Jan 2024 → May 2025 (matches range labels). */
const RANGE_START = new Date(2024, 0, 1);
const RANGE_END = new Date(2025, 4, 31, 23, 59, 59);
const PLAYBACK_DURATION_MS = 14_000;
const TICK_MS = 80;
/** Map marker updates are stepped to limit WebView reloads during playback. */
const MARKER_STEPS = 36;

function categoryAtProgress(cityIndex: number, progress: number): string {
  const phase = cityIndex * 1.73 + 0.4;
  const wave =
    Math.sin(progress * Math.PI * 5 + phase) * 0.45 +
    Math.cos(progress * Math.PI * 2.3 + phase * 0.6) * 0.35;
  const normalized = (wave + 1) / 2;
  const idx = Math.min(
    AQI_CATEGORIES.length - 1,
    Math.floor(normalized * AQI_CATEGORIES.length)
  );
  return AQI_CATEGORIES[idx];
}

function dateAtProgress(progress: number): Date {
  const t = RANGE_START.getTime() + progress * (RANGE_END.getTime() - RANGE_START.getTime());
  return new Date(t);
}

function formatPlaybackDate(date: Date, locale?: string): string {
  return date.toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HistoricalPlaybackScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const trackWidthRef = useRef(0);
  const trackLeftRef = useRef(0);
  const trackRef = useRef<View>(null);
  const progressRef = useRef(0);
  const playingRef = useRef(false);

  progressRef.current = progress;
  playingRef.current = playing;

  const locale = language === 'en' ? undefined : language;

  const displayDate = useMemo(
    () => formatPlaybackDate(dateAtProgress(progress), locale),
    [progress, locale]
  );

  const markerProgress = useMemo(
    () => Math.round(progress * MARKER_STEPS) / MARKER_STEPS,
    [progress]
  );

  const markers: MapMarker[] = useMemo(
    () =>
      PLAYBACK_CITIES.map((city, i) => {
        const category = categoryAtProgress(i, markerProgress);
        return {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          color: getAQIColor(category),
          weight: 0.25 + markerProgress * 0.5,
        };
      }),
    [markerProgress]
  );

  const seekTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    progressRef.current = clamped;
    setProgress(clamped);
  }, []);

  const seekFromX = useCallback(
    (x: number) => {
      const w = trackWidthRef.current;
      if (w <= 0) return;
      seekTo(x / w);
    },
    [seekTo]
  );

  const measureTrack = useCallback(() => {
    trackRef.current?.measureInWindow((x) => {
      trackLeftRef.current = x;
    });
  }, []);

  const onTrackLayout = useCallback(
    (e: LayoutChangeEvent) => {
      trackWidthRef.current = e.nativeEvent.layout.width;
      measureTrack();
    },
    [measureTrack]
  );

  const seekFromXRef = useRef(seekFromX);
  seekFromXRef.current = seekFromX;
  const measureTrackRef = useRef(measureTrack);
  measureTrackRef.current = measureTrack;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setPlaying(false);
        measureTrackRef.current();
        seekFromXRef.current(evt.nativeEvent.pageX - trackLeftRef.current);
      },
      onPanResponderMove: (evt) => {
        seekFromXRef.current(evt.nativeEvent.pageX - trackLeftRef.current);
      },
    })
  ).current;

  useEffect(() => {
    if (!playing) return;

    const interval = setInterval(() => {
      const next = progressRef.current + TICK_MS / PLAYBACK_DURATION_MS;
      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }
      progressRef.current = next;
      setProgress(next);
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [playing]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      setPlaying(false);
      return;
    }
    if (progressRef.current >= 1) {
      seekTo(0);
    }
    setPlaying(true);
  }, [seekTo]);

  const rangeStartLabel = useMemo(
    () =>
      RANGE_START.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
    [locale]
  );
  const rangeEndLabel = useMemo(
    () => RANGE_END.toLocaleDateString(locale, { month: 'short', year: 'numeric' }),
    [locale]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerSideLeft} />
        <MframapaLogo size="sm" />
        <TouchableOpacity style={styles.headerSide} accessibilityLabel={t('screen.historical.info')}>
          <Ionicons name="information-circle-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapArea}>
        <AfricaMapView markers={markers} isDark={isDark} onMapPress={() => {}} />
      </View>

      <View
        style={[
          styles.bottomPanel,
          { backgroundColor: isDark ? Colors.bgCard : '#fff', paddingBottom: insets.bottom + 16 },
        ]}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>{displayDate}</Text>

        <View
          ref={trackRef}
          style={styles.scrubberHit}
          onLayout={onTrackLayout}
          {...panResponder.panHandlers}
        >
          <View style={[styles.scrubberTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.scrubberFill, { width: `${progress * 100}%` }]} />
            <View
              style={[styles.scrubberThumb, { left: `${progress * 100}%` }]}
              accessibilityRole="adjustable"
              accessibilityLabel={t('screen.historical.scrubber')}
            />
          </View>
        </View>

        <View style={styles.rangeLabels}>
          <Text style={[styles.rangeLabel, { color: colors.subtext }]}>{rangeStartLabel}</Text>
          <Text style={[styles.rangeLabel, { color: colors.subtext }]}>{rangeEndLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={togglePlay}
          style={styles.playBtn}
          accessibilityLabel={playing ? t('screen.historical.pause') : t('screen.historical.play')}
        >
          <Ionicons name={playing ? 'pause' : 'play'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 2,
  },
  headerSide: { width: 36, alignItems: 'flex-end' },
  headerSideLeft: { width: 36 },
  mapArea: { flex: 1 },
  bottomPanel: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    zIndex: 2,
  },
  dateText: { fontSize: 24, fontWeight: '800' },
  scrubberHit: {
    width: '100%',
    paddingVertical: 14,
    justifyContent: 'center',
  },
  scrubberTrack: { width: '100%', height: 6, borderRadius: 3, position: 'relative' },
  scrubberFill: { height: 6, backgroundColor: Colors.brandGreen, borderRadius: 3 },
  scrubberThumb: {
    position: 'absolute',
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.brandGreen,
    marginLeft: -9,
  },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  rangeLabel: { fontSize: 12 },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
