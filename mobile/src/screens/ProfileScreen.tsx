import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { AvatarPickerSheet, naviiUrl } from '../components/AvatarPickerSheet';
import { InputField } from '../components/ui/InputField';
import { MframapaLogo } from '../components/MframapaLogo';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import { PROFILE_MENU_ITEMS } from '../navigation/profileMenuItems';

export function ProfileScreen() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const profile       = useStore((s) => s.profile);
  const updateProfile = useStore((s) => s.updateProfile);
  const signOut       = useStore((s) => s.signOut);

  // Initialise from the actual signed-in profile. Effect below keeps these
  // in sync if profile is re-hydrated (e.g. after sign-in completes).
  const [email]                     = useState(profile.email); // read-only (auth identity)
  const [pickerVisible, setPickerVisible] = useState(false);



  function confirmSignOut() {
    Alert.alert(
      t('signout.confirm_title'),
      t('signout.confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('settings.sign_out'), style: 'destructive', onPress: () => void signOut() },
      ],
    );
  }

  function handleAvatarSelect(seed: string) {
    // Fire-and-forget — picker closes immediately, sync happens in background.
    void updateProfile({ avatarSeed: seed });
  }

  return (
    <View style={[styles.root]}>
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

        {/* Account: read-only. identity comes from the provider, and the app
            never used organization, so neither is an editable field here. */}
        <View style={styles.form}>
          <InputField
            label={t('screen.profile.email')}
            value={email}
            onChangeText={() => {}}
            editable={false}
            placeholder="email@example.com"
            isDark={isDark}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Profile links */}
        <View style={styles.links}>
          {PROFILE_MENU_ITEMS.map((item) => (
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

        <TouchableOpacity onPress={confirmSignOut} style={styles.signOut}>
          <Text style={styles.signOutText}>{t('settings.sign_out')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('DeleteAccount')} style={styles.deleteLink}>
          <Text style={[styles.deleteLinkText, { color: colors.subtext }]}>{t('screen.profile.delete_account')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <AvatarPickerSheet
        visible={pickerVisible}
        selected={profile.avatarSeed}
        onSelect={handleAvatarSelect}
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
  deleteLink: { alignItems: 'center', paddingVertical: 10, marginBottom: 8 },
  deleteLinkText: { fontSize: 13 },
  signOut: {
    marginTop: 32,
    marginBottom: 8,
    alignSelf: 'center',
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '500',
  },
});
