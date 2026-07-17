import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore, SavedLocation, PredictionResult } from '../store/useStore';

// Lazy-require so a missing native module just disables the export instead
// of crashing the entire app at module-load time. If you ever see
// `nativeBridgeAvailable === false` after a build, the iOS app needs a
// native rebuild (`npx expo prebuild --clean && npx expo run:ios`).
type FileSystemModule = typeof import('expo-file-system/legacy');
type SharingModule    = typeof import('expo-sharing');

let FileSystem: FileSystemModule | null = null;
let Sharing:    SharingModule    | null = null;

try { FileSystem = require('expo-file-system/legacy'); } catch { /* native module missing */ }
try { Sharing    = require('expo-sharing'); }            catch { /* native module missing */ }

const nativeBridgeAvailable = !!FileSystem && !!Sharing;

type FormatKey = 'CSV' | 'GeoJSON' | 'PDF';

// ─── Format builders ──────────────────────────────────────────────────────────
function escapeCsv(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(saved: SavedLocation[], history: PredictionResult[]): string {
  const rows: string[] = [];
  rows.push('source,name,country,lat,lon,pm25,aqi_category,checked_at');
  for (const loc of saved) {
    rows.push([
      escapeCsv('saved'),
      escapeCsv(loc.name),
      escapeCsv(loc.country),
      escapeCsv(loc.lat),
      escapeCsv(loc.lon),
      escapeCsv(loc.lastPm25),
      escapeCsv(loc.lastAqiCategory),
      escapeCsv(loc.lastChecked),
    ].join(','));
  }
  for (const p of history) {
    rows.push([
      escapeCsv('history'),
      escapeCsv(p.location.name),
      escapeCsv(''),
      escapeCsv(p.location.lat),
      escapeCsv(p.location.lon),
      escapeCsv(p.pm25.toFixed(1)),
      escapeCsv(p.aqi_category),
      escapeCsv(p.timestamp ?? ''),
    ].join(','));
  }
  return rows.join('\n');
}

function buildGeoJson(saved: SavedLocation[], history: PredictionResult[]): string {
  const features: unknown[] = [];
  for (const loc of saved) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [loc.lon, loc.lat] },
      properties: {
        source: 'saved',
        name: loc.name,
        country: loc.country,
        pm25: loc.lastPm25 ?? null,
        aqi_category: loc.lastAqiCategory ?? null,
        checked_at: loc.lastChecked ?? null,
      },
    });
  }
  for (const p of history) {
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.location.lon, p.location.lat] },
      properties: {
        source: 'history',
        name: p.location.name,
        pm25: p.pm25,
        aqi_category: p.aqi_category,
        uncertainty: p.uncertainty,
        weather: p.weather,
        timestamp: p.timestamp,
      },
    });
  }
  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
}

function buildPdfHtml(saved: SavedLocation[], history: PredictionResult[]): string {
  // expo-print isn't installed, so the "PDF" format ships as HTML the user
  // can open and Save-as-PDF from any modern viewer. Keeps the export menu
  // functional without adding another native dep.
  const escape = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  const savedRows = saved.map((l) =>
    `<tr><td>${escape(l.name)}</td><td>${escape(l.country)}</td><td>${l.lastPm25 ?? '-'}</td><td>${escape(l.lastAqiCategory ?? '-')}</td></tr>`,
  ).join('');
  const historyRows = history.map((p) =>
    `<tr><td>${escape(p.location.name)}</td><td>${p.pm25.toFixed(1)}</td><td>${escape(p.aqi_category)}</td><td>${escape(p.timestamp ?? '')}</td></tr>`,
  ).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Mframapa Export</title>
    <style>body{font-family:-apple-system,system-ui,sans-serif;padding:24px;color:#111}
    h1{font-size:22px} h2{font-size:16px;margin-top:24px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#f5f5f5}</style></head><body>
    <h1>Mframapa Air Quality Export</h1>
    <p>Generated ${new Date().toLocaleString()}</p>
    <h2>Saved locations (${saved.length})</h2>
    <table><tr><th>Name</th><th>Country</th><th>PM2.5</th><th>Category</th></tr>${savedRows}</table>
    <h2>Recent checks (${history.length})</h2>
    <table><tr><th>City</th><th>PM2.5</th><th>Category</th><th>Time</th></tr>${historyRows}</table>
  </body></html>`;
}

export function ExportCentreScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const savedLocations    = useStore((s) => s.savedLocations);
  const predictionHistory = useStore((s) => s.predictionHistory);

  const [format, setFormat] = useState<FormatKey>('CSV');
  const [generating, setGenerating] = useState(false);

  const formats: { key: FormatKey; labelKey: string }[] = [
    { key: 'CSV', labelKey: 'screen.export.format_csv' },
    { key: 'GeoJSON', labelKey: 'screen.export.format_geojson' },
    { key: 'PDF', labelKey: 'screen.export.format_pdf' }];

  async function handleGenerate() {
    if (generating) return;
    if (!FileSystem || !Sharing) {
      Alert.alert(t('screen.export.rebuild_required'));
      return;
    }
    if (savedLocations.length === 0 && predictionHistory.length === 0) {
      Alert.alert(t('screen.export.nothing_to_export'));
      return;
    }
    setGenerating(true);
    try {
      const dir = FileSystem.cacheDirectory;
      if (!dir) throw new Error('No cache directory');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      let path: string;
      let mime: string;
      let body: string;

      if (format === 'CSV') {
        path = `${dir}mframapa-${stamp}.csv`;
        mime = 'text/csv';
        body = buildCsv(savedLocations, predictionHistory);
      } else if (format === 'GeoJSON') {
        path = `${dir}mframapa-${stamp}.geojson`;
        mime = 'application/geo+json';
        body = buildGeoJson(savedLocations, predictionHistory);
      } else {
        path = `${dir}mframapa-${stamp}.html`;
        mime = 'text/html';
        body = buildPdfHtml(savedLocations, predictionHistory);
      }

      await FileSystem.writeAsStringAsync(path, body, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, { mimeType: mime, dialogTitle: t('screen.export.share_dialog_title') });
      } else {
        Alert.alert(t('screen.export.file_saved_to', { path }));
      }
    } catch (err) {
      Alert.alert(t('screen.export.could_not_generate'), err instanceof Error ? err.message : '');
    } finally {
      setGenerating(false);
    }
  }

  const totalRecords = savedLocations.length + predictionHistory.length;

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.export.title')}</Text>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtext }]}>
              {t('screen.export.saved_locations_count')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{savedLocations.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtext }]}>
              {t('screen.export.recent_checks_count')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{predictionHistory.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.subtext }]}>
              {t('screen.export.total_records_count')}
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.brandGreen }]}>{totalRecords}</Text>
          </View>
        </View>

        <View>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('screen.export.format')}</Text>
          <View style={styles.radioRow}>
            {formats.map((f) => (
              <TouchableOpacity key={f.key} onPress={() => setFormat(f.key)} style={styles.radioItem}>
                <View
                  style={[
                    styles.radioCircle,
                    { borderColor: f.key === format ? Colors.brandGreen : colors.border }]}
                >
                  {f.key === format ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>{t(f.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PrimaryButton
          label={t('screen.export.generate')}
          onPress={handleGenerate}
          loading={generating}
          disabled={totalRecords === 0 || !nativeBridgeAvailable}
        />

        {!nativeBridgeAvailable ? (
          <Text style={[styles.hint, { color: Colors.danger }]}>
            {t('screen.export.rebuild_required')}
          </Text>
        ) : (
          <Text style={[styles.hint, { color: colors.muted }]}>
            {format === 'PDF' ? t('screen.export.pdf_format_explainer') : t('screen.export.share_sheet_explainer')}
          </Text>
        )}
      </ScrollView>
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
    paddingBottom: 4,
  },
  content: { paddingHorizontal: 16, gap: 20 },
  title: { fontSize: 26, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  radioRow: { flexDirection: 'row', gap: 24 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandGreen },
  radioLabel: { fontSize: 14, fontWeight: '500' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
