import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { sendFeedback } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

// the slugs the api stores, in the same order as the labels below
const CATEGORY_SLUGS = ['bug', 'feature', 'data', 'general'];

const CATEGORY_KEYS = [
  'screen.feedback.cat_bug',
  'screen.feedback.cat_feature',
  'screen.feedback.cat_data',
  'screen.feedback.cat_general'] as const;

export function FeedbackFormScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;
    if (!message.trim()) {
      Alert.alert(t('screen.feedback.message_required'));
      return;
    }
    setSubmitting(true);
    try {
      // really send it; this used to wait 800ms and drop the message.
      await sendFeedback({
        category: CATEGORY_SLUGS[categoryIdx] ?? 'general',
        message,
        email: email || null,
      });
      // confirm before leaving, so it is clear the report actually went
      Alert.alert(t('screen.feedback.thanks_title'), t('screen.feedback.thanks_body'));
      navigation.goBack();
    } catch {
      Alert.alert(t('screen.feedback.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  const category = t(CATEGORY_KEYS[categoryIdx]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root]}>
        <View style={[styles.navBar, { paddingTop: insets.top + 8, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>{t('screen.feedback.nav_title')}</Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Text style={styles.submitText}>{t('screen.feedback.submit')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>{t('screen.feedback.title')}</Text>

          <View>
            <Text style={[styles.label, { color: colors.subtext }]}>{t('screen.feedback.category')}</Text>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setCategoryIdx((categoryIdx + 1) % CATEGORY_KEYS.length)}
            >
              <Text style={[styles.dropdownText, { color: Colors.brandGreen }]}>{category}</Text>
              <Ionicons name="chevron-down" size={16} color={Colors.brandGreen} />
            </TouchableOpacity>
          </View>

          <View style={[styles.textAreaWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={t('screen.feedback.message_placeholder')}
              placeholderTextColor={colors.muted}
              style={[styles.textArea, { color: colors.text }]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={[styles.attachBtn, { borderColor: Colors.brandGreen }]}>
            <Ionicons name="camera-outline" size={18} color={Colors.brandGreen} />
            <Text style={styles.attachText}>{t('screen.feedback.attach')}</Text>
          </TouchableOpacity>

          <View>
            <Text style={[styles.label, { color: colors.subtext }]}>{t('screen.feedback.your_email')}</Text>
            <View style={[styles.emailInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder={t('screen.feedback.email_placeholder')}
                placeholderTextColor={colors.muted}
                style={[styles.emailText, { color: colors.text }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
            disabled={submitting}
          >
            <Text style={styles.submitBtnText}>{t('screen.feedback.submit_btn')}</Text>
          </TouchableOpacity>

          <Text style={[styles.privacy, { color: colors.muted }]}>{t('screen.feedback.privacy_note')}</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navTitle: { fontSize: 17, fontWeight: '600' },
  submitText: { color: Colors.brandGreen, fontSize: 16, fontWeight: '600' },
  content: { paddingHorizontal: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  dropdownText: { fontSize: 15, fontWeight: '500' },
  textAreaWrap: { borderRadius: 12, borderWidth: 1, padding: 14, minHeight: 140 },
  textArea: { fontSize: 15, minHeight: 120 },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  attachText: { color: Colors.brandGreen, fontSize: 15, fontWeight: '600' },
  emailInput: { borderRadius: 12, borderWidth: 1, padding: 14 },
  emailText: { fontSize: 15 },
  submitBtn: {
    height: 52,
    borderRadius: 999,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  privacy: { fontSize: 12, textAlign: 'center' },
});
