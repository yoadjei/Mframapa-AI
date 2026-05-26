import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { AvatarPickerSheet, naviiUrl } from '../components/AvatarPickerSheet';
import { InputField } from '../components/ui/InputField';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { MframapaLogo } from '../components/MframapaLogo';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const profile    = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const [fullName, setFullName]     = useState(profile.fullName || 'Kofi Antwi');
  const [email, setEmail]           = useState(profile.email || 'kofi.antwi@email.com');
  const [organization, setOrg]      = useState(profile.organization || 'University of Ghana');
  const [saving, setSaving]         = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setProfile({ fullName, email, organization });
    setSaving(false);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <MframapaLogo size="sm" />
        </View>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('screen.profile.title')}</Text>

        {/* Avatar */}
        <TouchableOpacity style={styles.avatarWrap} onPress={() => setPickerVisible(true)} activeOpacity={0.8}>
          {profile.avatarSeed ? (
            <Image
              source={{ uri: naviiUrl(profile.avatarSeed, 176) }}
              style={[styles.naviiAvatar, { backgroundColor: colors.surface }]}
              resizeMode="contain"
            />
          ) : (
            <Avatar initials={profile.initials || 'YA'} size={88} />
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="pencil" size={13} color={colors.subtext} />
          </View>
        </TouchableOpacity>

        {/* Tier badge */}
        <View style={styles.tierRow}>
          <Text style={[styles.tierLabel, { color: colors.subtext }]}>{t('screen.profile.account_tier')}</Text>
          <Badge label={profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} variant={profile.tier as any} />
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <InputField
            label={t('screen.profile.full_name')}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Kofi Antwi"
            isDark={isDark}
          />
          <InputField
            label={t('screen.profile.email')}
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            isDark={isDark}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label={t('screen.profile.organization')}
            value={organization}
            onChangeText={setOrg}
            placeholder="Organization"
            isDark={isDark}
          />
        </View>

        <PrimaryButton label={t('screen.profile.save')} onPress={handleSave} loading={saving} style={styles.saveBtn} />

        {/* Profile links */}
        <View style={styles.links}>
          {[
            { labelKey: 'screen.profile.link_saved_locations', screen: 'SavedLocations' },
            { labelKey: 'screen.profile.link_activity_feed', screen: 'ActivityFeed' },
            { labelKey: 'screen.profile.link_pricing', screen: 'Pricing' },
            { labelKey: 'screen.profile.link_ai_insights', screen: 'AIInsights' },
            { labelKey: 'screen.profile.link_prediction', screen: 'PredictionDashboard' },
            { labelKey: 'screen.profile.link_country', screen: 'CountryExplorer' },
            { labelKey: 'screen.profile.link_heatmap', screen: 'AfricaHeatmap' },
            { labelKey: 'screen.profile.link_historical', screen: 'HistoricalPlayback' },
            { labelKey: 'screen.profile.link_compare', screen: 'CompareCities' },
            { labelKey: 'screen.profile.link_community', screen: 'CommunityHub' },
            { labelKey: 'screen.profile.link_trust', screen: 'TrustTransparency' },
            { labelKey: 'screen.profile.link_export', screen: 'ExportCentre' },
            { labelKey: 'screen.profile.link_language', screen: 'LanguageSelector' },
            { labelKey: 'screen.profile.link_settings', screen: 'Settings' },
            { labelKey: 'screen.profile.link_about', screen: 'AboutLegal' },
            { labelKey: 'screen.profile.link_feedback', screen: 'FeedbackForm' },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={[styles.link, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.linkText, { color: colors.text }]}>{t(item.labelKey)}</Text>
              <Text style={[styles.linkChevron, { color: colors.subtext }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <AvatarPickerSheet
        visible={pickerVisible}
        selected={profile.avatarSeed}
        onSelect={(seed) => setProfile({ avatarSeed: seed })}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: { alignItems: 'center', marginBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  avatarWrap: { alignItems: 'center', marginBottom: 12, alignSelf: 'center' },
  naviiAvatar: { width: 88, height: 88, borderRadius: 44 },
  editBadge: {
    position: 'absolute', bottom: 0, right: -4,
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 },
  tierLabel: { fontSize: 14 },
  form: { gap: 14, marginBottom: 24 },
  saveBtn: {},
  links: { marginTop: 24 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkText: { fontSize: 15 },
  linkChevron: { fontSize: 22, fontWeight: '300' },
});
