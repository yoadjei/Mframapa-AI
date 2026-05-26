import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

type FormatKey = 'CSV' | 'GeoJSON' | 'PDF';

export function ExportCentreScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [format, setFormat] = useState<FormatKey>('CSV');
  const [generating, setGenerating] = useState(false);

  const formats: { key: FormatKey; labelKey: string }[] = [
    { key: 'CSV', labelKey: 'screen.export.format_csv' },
    { key: 'GeoJSON', labelKey: 'screen.export.format_geojson' },
    { key: 'PDF', labelKey: 'screen.export.format_pdf' },
  ];

  async function handleGenerate() {
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setGenerating(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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

        <View>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('screen.export.date_range')}</Text>
          <TouchableOpacity style={[styles.datePill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={16} color={colors.subtext} />
            <Text style={[styles.dateText, { color: colors.text }]}>{t('screen.export.date_sample')}</Text>
          </TouchableOpacity>
        </View>

        <View>
          <Text style={[styles.label, { color: colors.subtext }]}>{t('screen.export.city_multiselect')}</Text>
          <View style={styles.cityRow}>
            {['Accra', 'Lagos', 'Nairobi'].map((c) => (
              <View key={c} style={[styles.cityChip, { backgroundColor: Colors.brandGreen + '22' }]}>
                <Text style={[styles.cityChipText, { color: Colors.brandGreen }]}>{c}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.addChip, { borderColor: colors.border }]}>
              <Ionicons name="chevron-down" size={14} color={colors.subtext} />
            </TouchableOpacity>
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
                    { borderColor: f.key === format ? Colors.brandGreen : colors.border },
                  ]}
                >
                  {f.key === format ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={[styles.radioLabel, { color: colors.text }]}>{t(f.labelKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <PrimaryButton label={t('screen.export.generate')} onPress={handleGenerate} loading={generating} />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('screen.export.recent')}</Text>
        {[
          { key: 'screen.export.file_recent' },
          { key: 'screen.export.file_export' },
        ].map((file) => (
          <View key={file.key} style={[styles.fileRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="document-outline" size={20} color={colors.subtext} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.fileName, { color: colors.text }]}>{t(file.key)}</Text>
              <Text style={[styles.fileSub, { color: colors.subtext }]}>{t('screen.export.download')}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="download-outline" size={20} color={Colors.brandGreen} />
            </TouchableOpacity>
          </View>
        ))}
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
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  dateText: { fontSize: 15 },
  cityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  cityChipText: { fontSize: 14, fontWeight: '500' },
  addChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7 },
  radioRow: { flexDirection: 'row', gap: 24 },
  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.brandGreen },
  radioLabel: { fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  fileName: { fontSize: 14, fontWeight: '600' },
  fileSub: { fontSize: 12, marginTop: 2 },
});
