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
import { getMapHistory, MapHistory } from '../services/api';

/** how far back we replay. the api caps this to what the archives can rebuild. */
const HISTORY_DAYS = 14;
/** one frame per day, slow enough to read the date as it changes. */
const FRAME_MS = 700;

function formatPlaybackDate(iso: string, locale?: string): string {
  return new Date(iso).toLocaleDateString(locale, {
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
  const [progress, setProgress] = useState(1);      // opens on today
  const [cities, setCities] = useState<MapHistory['cities']>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const trackWidthRef = useRef(0);
  const trackLeftRef = useRef(0);
  const trackRef = useRef<View>(null);
  const progressRef = useRef(0);
  const playingRef = useRef(false);

  progressRef.current = progress;
  playingRef.current = playing;

  const locale = language === 'en' ? undefined : language;

  const lastIndex = Math.max(0, dates.length - 1);
  const frame = Math.round(progress * lastIndex);
  const displayDate = dates[frame] ? formatPlaybackDate(dates[frame], locale) : '—';

  const markers: MapMarker[] = useMemo(() => {
    const day = dates[frame];
    if (!day) return [];
    return cities.flatMap((city) => {
      const row = city.days.find((d) => d.date === day);
      if (!row) return [];                 // a day we could not rebuild shows no dot
      return [{
        name: city.name,
        lat: city.lat,
        lon: city.lon,
        color: getAQIColor(row.aqi_category),
        weight: Math.max(0.2, Math.min(1, row.pm25 / 80)),
      }];
    });
  }, [cities, dates, frame]);

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
    let cancelled = false;
    getMapHistory(HISTORY_DAYS)
      .then((payload) => {
        if (cancelled) return;
        setCities(payload.cities);
        setDates(payload.dates);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!playing || dates.length < 2) return;

    const interval = setInterval(() => {
      const next = progressRef.current + 1 / lastIndex;
      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }
      progressRef.current = next;
      setProgress(next);
    }, FRAME_MS);

    return () => clearInterval(interval);
  }, [playing, dates.length, lastIndex]);

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

  const rangeStartLabel = dates[0] ? formatPlaybackDate(dates[0], locale) : '';
  const rangeEndLabel = dates[lastIndex] ? formatPlaybackDate(dates[lastIndex], locale) : '';

  return (
    <View style={[styles.root]}>
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
          { backgroundColor: isDark ? Colors.bgCard : '#fff', paddingBottom: insets.bottom + 16 }]}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>
          {loading ? t('common.loading') : displayDate}
        </Text>

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
