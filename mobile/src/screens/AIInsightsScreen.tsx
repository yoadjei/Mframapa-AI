import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

const INSIGHT_KEYS = [
  {
    icon: 'hardware-chip-outline' as const,
    titleKey: 'screen.ai_insights.seasonal_title',
    descKey: 'screen.ai_insights.seasonal_desc',
    sourceKey: 'screen.ai_insights.seasonal_source',
  },
  {
    icon: 'trending-up-outline' as const,
    titleKey: 'screen.ai_insights.trend_title',
    descKey: 'screen.ai_insights.trend_desc',
    sourceKey: null,
  },
  {
    icon: 'warning-outline' as const,
    titleKey: 'screen.ai_insights.hotspot_title',
    descKey: 'screen.ai_insights.hotspot_desc',
    sourceKey: 'screen.ai_insights.hotspot_source',
  },
];

export function AIInsightsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t('screen.ai_insights.title').toUpperCase()}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {INSIGHT_KEYS.map((insight, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={insight.icon} size={28} color={Colors.brandGreen} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t(insight.titleKey)}</Text>
            <Text style={[styles.cardDesc, { color: colors.subtext }]}>{t(insight.descKey)}</Text>
            {insight.sourceKey ? (
              <View style={[styles.sourcePill, { backgroundColor: colors.surface }]}>
                <Text style={[styles.sourceText, { color: colors.subtext }]}>{t(insight.sourceKey)}</Text>
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
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  content: { padding: 16, gap: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.brandGreen + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 18, fontWeight: '700' },
  cardDesc: { fontSize: 14, lineHeight: 20 },
  sourcePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  sourceText: { fontSize: 12, fontWeight: '500' },
});
