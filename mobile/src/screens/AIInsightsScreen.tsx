import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';

type Card = {
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  title: string;
  desc: string;
  source?: string;
};

export function AIInsightsScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const lastPrediction = useStore((s) => s.lastPrediction);

  const cards: Card[] = (() => {
    if (!lastPrediction) return [];
    const out: Card[] = [];

    // Card 1 — the AI-generated insight, when the backend returned one.
    if (lastPrediction.insight) {
      out.push({
        icon: 'sparkles-outline',
        title: t('screen.ai_insights.headline', { city: lastPrediction.location.name }),
        desc: lastPrediction.insight,
        source: lastPrediction.model
          ? t('screen.ai_insights.powered_by', { model: lastPrediction.model })
          : undefined,
      });
    }

    // Card 2 — current reading + category, always shown when we have data.
    out.push({
      icon: 'analytics-outline',
      title: t('screen.ai_insights.current_reading'),
      desc: t('screen.ai_insights.reading_explanation', {
        pm25: lastPrediction.pm25.toFixed(0),
        category: t(`aqi.${lastPrediction.aqi_category}` as any) || lastPrediction.aqi_category,
        lower: lastPrediction.uncertainty.pm25_lower.toFixed(0),
        upper: lastPrediction.uncertainty.pm25_upper.toFixed(0),
      }),
    });

    // Card 3 — contributing factors, one card listing them.
    if (lastPrediction.factors && lastPrediction.factors.length > 0) {
      out.push({
        icon: 'list-outline',
        title: t('screen.ai_insights.what_drove_this'),
        desc: lastPrediction.factors.slice(0, 6).map((f) => `• ${f}`).join('\n'),
      });
    }

    return out;
  })();

  return (
    <View style={[styles.root]}>
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
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="sparkles-outline" size={48} color={colors.subtext} />
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {t('screen.ai_insights.no_insights_yet')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              style={[styles.emptyCta, { backgroundColor: Colors.brandGreen + '22' }]}
            >
              <Text style={[styles.emptyCtaText, { color: Colors.brandGreen }]}>
                {t('screen.ai_insights.check_a_city')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((c, i) => (
            <View key={i} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.iconWrap}>
                <Ionicons name={c.icon as any} size={28} color={Colors.brandGreen} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{c.title}</Text>
              <Text style={[styles.cardDesc, { color: colors.subtext }]}>{c.desc}</Text>
              {c.source ? (
                <View style={[styles.sourcePill, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.sourceText, { color: colors.subtext }]}>{c.source}</Text>
                </View>
              ) : null}
            </View>
          ))
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
  empty: { alignItems: 'center', paddingTop: 80, gap: 14 },
  emptyText: { fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  emptyCta: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  emptyCtaText: { fontSize: 14, fontWeight: '600' },
});
