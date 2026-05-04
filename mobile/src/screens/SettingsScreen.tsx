import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useStore } from '../store/useStore';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTranslation } from '../hooks/useTranslation';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
];

export function SettingsScreen() {
  const isDark = useStore((s) => s.isDark);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  const colors = getColors(isDark);
  const { t } = useTranslation();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View
        style={{
          paddingTop: spacing.xl,
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.md,
        }}
      >
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize.xl,
            fontWeight: '700',
          }}
        >
          {t('settings.title')}
        </Text>
      </View>

      {/* Theme Section */}
      <SectionHeader title={t('settings.theme')} colors={colors} />
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ fontSize: fontSize.lg, marginRight: spacing.md }}>
            {isDark ? '🌙' : '☀️'}
          </Text>
          <Text
            style={{
              flex: 1,
              color: colors.text,
              fontSize: fontSize.md,
              fontWeight: '500',
            }}
          >
            {isDark ? t('settings.dark') : t('settings.light')} Mode
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.accent + '66' }}
            thumbColor={isDark ? colors.accent : colors.subtext}
          />
        </View>
      </View>

      {/* Language Section */}
      <SectionHeader title={t('settings.language')} colors={colors} />
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing.md,
          marginBottom: spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {LANGUAGES.map((lang, index) => (
          <TouchableOpacity
            key={lang.code}
            onPress={() => setLanguage(lang.code)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.md,
              borderBottomWidth: index < LANGUAGES.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              backgroundColor:
                language === lang.code ? colors.accent + '11' : 'transparent',
            }}
          >
            <Text style={{ fontSize: fontSize.lg, marginRight: spacing.md }}>
              {lang.code === 'en' ? '🇬🇧' : '🇫🇷'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize.md,
                  fontWeight: language === lang.code ? '700' : '500',
                }}
              >
                {lang.native}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>
                {lang.label}
              </Text>
            </View>
            {language === lang.code && (
              <Text style={{ color: colors.accent, fontSize: fontSize.lg }}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* About Section */}
      <SectionHeader title={t('settings.about')} colors={colors} />
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: borderRadius.lg,
          marginHorizontal: spacing.md,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
          <Text style={{ fontSize: 32, marginRight: spacing.md }}>🌍</Text>
          <View>
            <Text
              style={{
                color: colors.accent,
                fontSize: fontSize.lg,
                fontWeight: '800',
              }}
            >
              Mframapa
            </Text>
            <Text style={{ color: colors.subtext, fontSize: fontSize.xs }}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: colors.subtext,
            fontSize: fontSize.sm,
            lineHeight: 20,
            marginBottom: spacing.md,
          }}
        >
          Mframapa is an African air quality intelligence platform powered by a
          universal machine-learning model trained on satellite, meteorological,
          and ground sensor data across the continent.
        </Text>

        <InfoRow
          label="API"
          value={process.env.EXPO_PUBLIC_API_URL ?? 'https://mframapa.ai'}
          colors={colors}
        />
        <InfoRow label="Model" value="Universal African PM2.5" colors={colors} />
        <InfoRow label="Coverage" value="54 African countries" colors={colors} />
        <InfoRow label="Resolution" value="~1 km spatial" colors={colors} />
      </View>
    </ScrollView>
  );
}

interface SectionHeaderProps {
  title: string;
  colors: ReturnType<typeof getColors>;
}

function SectionHeader({ title, colors }: SectionHeaderProps) {
  return (
    <Text
      style={{
        color: colors.subtext,
        fontSize: fontSize.xs,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
        marginTop: spacing.xs,
      }}
    >
      {title}
    </Text>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof getColors>;
}

function InfoRow({ label, value, colors }: InfoRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      }}
    >
      <Text style={{ color: colors.subtext, fontSize: fontSize.sm }}>{label}</Text>
      <Text
        style={{ color: colors.text, fontSize: fontSize.sm, fontWeight: '500', flex: 1, textAlign: 'right' }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
