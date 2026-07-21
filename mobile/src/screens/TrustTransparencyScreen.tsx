import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

// how the model is built is not a user-facing detail; it invited scrutiny
// of internals without helping anyone decide whether to go outside.
const SECTION_IDS = ['calc', 'sources', 'disclaimers'] as const;

export function TrustTransparencyScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [open, setOpen] = useState<Record<string, boolean>>({
    calc: true,
    sources: true,
    disclaimers: false,
  });

  const sources = ['ERA5', 'Sentinel-5P', 'MODIS'];

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('screen.trust.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {SECTION_IDS.map((id) => (
          <View key={id} style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setOpen((prev) => ({ ...prev, [id]: !prev[id] }))}
              style={styles.sectionHeader}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t(`screen.trust.${id === 'disclaimers' ? 'disclaim' : id}_title`)}
              </Text>
              <Ionicons
                name={open[id] ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.subtext}
              />
            </TouchableOpacity>
            {open[id] ? (
              <View style={styles.sectionBody}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                {id === 'sources' ? (
                  <View style={{ gap: 8 }}>
                    {sources.map((src) => (
                      <View key={src} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: Colors.brandGreen,
                          }}
                        />
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{src}</Text>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.brandGreen} />
                        <Text style={{ color: Colors.brandGreen, fontSize: 14 }}>
                          {t('screen.trust.source_active')}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={{ color: colors.subtext, fontSize: 14, lineHeight: 20 }}>
                    {t(
                      `screen.trust.${
                        id === 'calc' ? 'calc' : 'disclaim'
                      }_body`
                    )}
                  </Text>
                )}
              </View>
            ) : null}
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
    paddingBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700' },
  content: { padding: 16, gap: 12 },
  section: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 8 },
});
