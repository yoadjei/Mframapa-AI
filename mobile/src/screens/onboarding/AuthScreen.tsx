import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { InputField } from '../../components/ui/InputField';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { TextLinkButton } from '../../components/ui/TextLinkButton';
import { useTheme } from '../../hooks/useTheme';
import { getColors, Colors } from '../../theme';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../hooks/useTranslation';
import { MframapaLogo } from '../../components/MframapaLogo';

type Tab = 'Login' | 'Signup' | 'Reset';

const TAB_KEYS: Record<Tab, string> = {
  Login: 'screen.auth.tab_login',
  Signup: 'screen.auth.tab_signup',
  Reset: 'screen.auth.tab_reset',
};

interface Props {
  onAuth: () => void;
}

export function AuthScreen({ onAuth }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuthenticated = useStore((s) => s.setAuthenticated);
  const setProfile = useStore((s) => s.setProfile);

  async function handleSubmit() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (tab === 'Signup') {
      setProfile({ fullName, email });
    }
    setAuthenticated(true);
    setLoading(false);
    onAuth();
  }

  const headingKey =
    tab === 'Login'
      ? 'screen.auth.welcome_back'
      : tab === 'Signup'
        ? 'screen.auth.create_account_heading'
        : 'screen.auth.reset_heading';

  const ctaLabel =
    tab === 'Login'
      ? t('screen.auth.sign_in_btn')
      : tab === 'Signup'
        ? t('screen.auth.create_btn')
        : t('screen.auth.send_reset_btn');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.root]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <MframapaLogo size="lg" />
        </View>

        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(['Login', 'Signup', 'Reset'] as Tab[]).map((tabKey) => (
            <TouchableOpacity key={tabKey} onPress={() => setTab(tabKey)} style={styles.tabBtn} accessibilityRole="tab">
              <Text
                style={[
                  styles.tabLabel,
                  { color: colors.muted },
                  tab === tabKey && { color: colors.text, fontWeight: '700' }]}
              >
                {t(TAB_KEYS[tabKey])}
              </Text>
              {tab === tabKey ? <View style={styles.tabUnderline} /> : null}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.heading, { color: colors.text }]}>{t(headingKey)}</Text>

        {tab === 'Signup' ? (
          <InputField
            label={t('screen.auth.full_name')}
            icon="person-outline"
            placeholder={t('screen.auth.placeholder_name')}
            value={fullName}
            onChangeText={setFullName}
            isDark={isDark}
            containerStyle={styles.field}
            autoCapitalize="words"
          />
        ) : null}

        <InputField
          label={t('screen.auth.email')}
          icon="mail-outline"
          placeholder={t('screen.auth.placeholder_email')}
          value={email}
          onChangeText={setEmail}
          isDark={isDark}
          containerStyle={styles.field}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {tab !== 'Reset' ? (
          <InputField
            label={t('screen.auth.password')}
            icon="lock-closed-outline"
            placeholder={t('screen.auth.placeholder_password')}
            value={password}
            onChangeText={setPassword}
            isDark={isDark}
            secure
            containerStyle={styles.field}
          />
        ) : null}

        {tab === 'Signup' ? (
          <InputField
            label={t('screen.auth.confirm_password')}
            icon="lock-closed-outline"
            placeholder={t('screen.auth.placeholder_confirm')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isDark={isDark}
            secure
            containerStyle={styles.field}
          />
        ) : null}

        <PrimaryButton label={ctaLabel} onPress={handleSubmit} loading={loading} style={styles.cta} />

        {tab === 'Login' ? (
          <>
            <TextLinkButton
              label={t('screen.auth.forgot')}
              onPress={() => setTab('Reset')}
              color={colors.subtext}
              style={styles.link}
            />
            <TextLinkButton label={t('screen.auth.sign_up')} onPress={() => setTab('Signup')} style={styles.link} />
          </>
        ) : tab === 'Signup' ? (
          <TextLinkButton
            label={t('screen.auth.have_account')}
            onPress={() => setTab('Login')}
            color={colors.subtext}
            style={styles.link}
          />
        ) : (
          <TextLinkButton
            label={t('screen.auth.back_login')}
            onPress={() => setTab('Login')}
            color={colors.subtext}
            style={styles.link}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 28 },
  tabBtn: { flex: 1, alignItems: 'center', paddingBottom: 12, position: 'relative' },
  tabLabel: { fontSize: 15, fontWeight: '500' },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: Colors.brandGreen,
    borderRadius: 1,
  },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  field: { marginBottom: 16 },
  cta: { marginTop: 8 },
  link: { marginTop: 16, alignSelf: 'center' },
});
