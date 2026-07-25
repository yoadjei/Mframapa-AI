import React, { useState } from 'react';
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

  const [email] = useState(profile.email);
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
    void updateProfile({ avatarSeed: seed });
  }

  return (
    <View style={[styles.root]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <MframapaLogo size="sm" markOnly />
        </View>
        <Text style={[styles.pageTitle, { color: colors.text }]}>{t('screen.profile.title')}</Text>

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

        <View style={styles.tierRow}>
          <Text style={[styles.tierLabel, { color: colors.subtext }]}>{t('screen.profile.account_tier')}</Text>
          <Badge label={profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)} variant={profile.tier as any} />
        </View>

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
          <Text style={[styles.managedNote, { color: colors.muted }]}>
            {t('screen.profile.managed_note')}
          </Text>
        </View>

        {/* Product screens — same discoverability as PWA Profile */}
        <View style={[styles.links, { borderTopColor: colors.border }]}>
          {PROFILE_MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              onPress={() => navigation.navigate(item.screen)}
              style={[styles.link, { borderBottomColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={t(item.labelKey)}
            >
              <Text style={[styles.linkText, { color: colors.text }]}>{t(item.labelKey)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
            </TouchableOpacity>
          ))}
        </View>

        {/*
          HCI: frequent session end (Sign out) is primary; irreversible Delete is
          separated below a divider with quieter type so the two aren’t one tap-cluster.
        */}
        <View style={[styles.accountActions, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.accountActionsLabel, { color: colors.subtext }]}>
            {t('screen.profile.account_actions')}
          </Text>

          <TouchableOpacity
            onPress={confirmSignOut}
            style={styles.signOutRow}
            accessibilityRole="button"
            accessibilityLabel={t('settings.sign_out')}
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.signOutText}>{t('settings.sign_out')}</Text>
          </TouchableOpacity>

          <View style={[styles.dangerDivider, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            onPress={() => navigation.navigate('DeleteAccount')}
            style={styles.deleteLink}
            accessibilityRole="button"
            accessibilityLabel={t('screen.profile.delete_account')}
          >
            <Text style={[styles.deleteLinkText, { color: Colors.danger }]}>
              {t('screen.profile.delete_account')}
            </Text>
          </TouchableOpacity>
        </View>
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
  form: { gap: 14, marginBottom: 8 },
  managedNote: { fontSize: 12, marginTop: 4, lineHeight: 16 },
  links: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkText: { fontSize: 15 },
  accountActions: {
    marginTop: 40,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'stretch',
  },
  accountActionsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 12,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
  dangerDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
    marginHorizontal: 24,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.72,
  },
});
