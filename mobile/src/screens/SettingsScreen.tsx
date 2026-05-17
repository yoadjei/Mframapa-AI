import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MframapaLogo } from '../components/MframapaLogo';
import { InfoModal } from '../components/InfoModal';
import { ThemeMode, useStore } from '../store/useStore';
import { getColors, spacing, borderRadius, fontSize } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
const LANGUAGE_GROUPS = [
  {
    regionKey: 'settings.region.international',
    items: [
      { code: 'en', label: 'English' },
      { code: 'fr', label: 'Français' },
      { code: 'pt', label: 'Português' },
      { code: 'es', label: 'Español' },
      { code: 'ar', label: 'العربية' },
    ],
  },
  {
    regionKey: 'settings.region.west_africa',
    items: [
      { code: 'ha', label: 'Hausa' },
      { code: 'yo', label: 'Yoruba' },
      { code: 'ig', label: 'Igbo' },
      { code: 'tw', label: 'Twi' },
      { code: 'wo', label: 'Wolof' },
      { code: 'ga', label: 'Ga' },
    ],
  },
  {
    regionKey: 'settings.region.east_africa',
    items: [
      { code: 'sw', label: 'Swahili' },
      { code: 'am', label: 'አማርኛ' },
      { code: 'ti', label: 'ትግርኛ' },
      { code: 'so', label: 'Somali' },
      { code: 'rw', label: 'Kinyarwanda' },
      { code: 'rn', label: 'Kirundi' },
    ],
  },
  {
    regionKey: 'settings.region.central_southern',
    items: [
      { code: 'zu', label: 'Zulu' },
      { code: 'xh', label: 'Xhosa' },
      { code: 'af', label: 'Afrikaans' },
      { code: 'sn', label: 'Shona' },
      { code: 'nd', label: 'Ndebele' },
      { code: 'st', label: 'Sesotho' },
      { code: 'tn', label: 'Tswana' },
      { code: 'ss', label: 'Swati' },
      { code: 'ny', label: 'Chichewa' },
      { code: 'mg', label: 'Malagasy' },
    ],
  },
] as const;

const ABOUT_LINKS = [
  { id: 'privacy', labelKey: 'settings.about.privacy' },
  { id: 'terms', labelKey: 'settings.about.terms' },
  { id: 'licenses', labelKey: 'settings.about.licenses' },
  { id: 'contact', labelKey: 'settings.about.contact' },
  { id: 'credits', labelKey: 'settings.about.credits' },
] as const;

export function SettingsScreen() {
  const { isDark, themeMode, setThemeMode, systemTheme } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [liteMode, setLiteMode] = useState(false);
  const [legalId, setLegalId] = useState<string | null>(null);

  const legalTitle = legalId ? t(`legal.${legalId}.title`) : '';
  const legalBody = legalId ? t(`legal.${legalId}.body`) : '';

  return (
    <>
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: insets.top }} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('settings.title').toUpperCase()}</Text>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.accentStrong }]}>{t('settings.appearance')}</Text>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
          <View style={[styles.segmented, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setThemeMode(mode)}
                style={[
                  styles.segment,
                  themeMode === mode && { backgroundColor: colors.accentStrong },
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: themeMode === mode ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {mode === 'system'
                    ? `${t('settings.system')} (${capitalize(systemTheme)})`
                    : t(`settings.${mode}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.accentStrong }]}>{t('settings.preferences')}</Text>
          <PreferenceRow
            label={t('settings.notifications')}
            sublabel={t('settings.notifications_sub')}
            colors={colors}
            control={
              <Switch
                value={alertsEnabled}
                onValueChange={setAlertsEnabled}
                trackColor={{ false: colors.border, true: colors.accent + '88' }}
                thumbColor={alertsEnabled ? colors.accent : colors.subtext}
              />
            }
          />
          <PreferenceRow
            label={t('settings.privacy')}
            sublabel={t('settings.privacy_sub')}
            colors={colors}
            control={
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
                trackColor={{ false: colors.border, true: colors.accent + '88' }}
                thumbColor={privacyMode ? colors.accent : colors.subtext}
              />
            }
          />
          <PreferenceRow
            label={t('settings.lite')}
            sublabel={t('settings.lite_sub')}
            colors={colors}
            control={
              <Switch
                value={liteMode}
                onValueChange={setLiteMode}
                trackColor={{ false: colors.border, true: colors.accent + '88' }}
                thumbColor={liteMode ? colors.accent : colors.subtext}
              />
            }
            last
          />
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionHeading, { color: colors.accentStrong }]}>{t('settings.language')}</Text>
          <LanguageSelector colors={colors} />
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aboutHeader}>
            <MframapaLogo size="lg" />
            <Text style={[styles.versionText, { color: colors.subtext }]}>{t('settings.version')}</Text>
          </View>

          {ABOUT_LINKS.map((link, index) => (
            <TouchableOpacity
              key={link.id}
              onPress={() => setLegalId(link.id)}
              style={[
                styles.aboutRow,
                index < ABOUT_LINKS.length - 1 && {
                  borderBottomWidth: 0.5,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.aboutLabel, { color: colors.text }]}>{t(link.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.subtext} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.madeWith, { color: colors.subtext }]}>{t('settings.made_with')}</Text>

        <TouchableOpacity style={[styles.signOutBtn, { borderColor: colors.danger + '33' }]}>
          <Text style={[styles.signOutText, { color: colors.danger }]}>{t('settings.sign_out')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <InfoModal
        visible={legalId != null}
        title={legalTitle}
        body={legalBody}
        onClose={() => setLegalId(null)}
      />
    </>
  );
}

function PreferenceRow({
  label,
  sublabel,
  colors,
  control,
  last,
}: {
  label: string;
  sublabel: string;
  colors: ReturnType<typeof getColors>;
  control: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.preferenceRow,
        !last && { borderBottomWidth: 0.5, borderBottomColor: colors.border },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.subtext }]}>{sublabel}</Text>
      </View>
      {control}
    </View>
  );
}

function LanguageSelector({ colors }: { colors: ReturnType<typeof getColors> }) {
  const { t } = useTranslation();
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);

  return (
    <View>
      {LANGUAGE_GROUPS.map((group, gi) => (
        <View key={group.regionKey} style={gi > 0 ? { marginTop: spacing.md } : undefined}>
          <Text style={[styles.langGroupLabel, { color: colors.subtext }]}>{t(group.regionKey)}</Text>
          <View style={[styles.langGrid]}>
            {group.items.map((item) => {
              const active = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => setLanguage(item.code)}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: active ? colors.accentStrong : colors.surface,
                      borderColor: active ? colors.accentStrong : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      { color: active ? '#FFFFFF' : colors.text },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionHeading: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  segmented: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 3,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: spacing.md,
  },
  rowTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 3,
  },
  aboutCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: spacing.xl,
    overflow: 'hidden',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  versionText: {
    fontSize: fontSize.sm,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
  },
  aboutLabel: {
    flex: 1,
    fontSize: fontSize.md,
  },
  madeWith: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  signOutBtn: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  langGroupLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  langChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  langChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
