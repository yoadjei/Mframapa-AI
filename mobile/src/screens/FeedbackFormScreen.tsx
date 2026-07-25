import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { sendFeedback } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

const CATEGORY_SLUGS = ['bug', 'feature', 'data', 'general'] as const;

const CATEGORY_KEYS = [
  'screen.feedback.cat_bug',
  'screen.feedback.cat_feature',
  'screen.feedback.cat_data',
  'screen.feedback.cat_general',
] as const;

export function FeedbackFormScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [category, setCategory] = useState<(typeof CATEGORY_SLUGS)[number]>('general');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attachmentName, setAttachmentName] = useState('');

  async function handleAttach() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t('screen.feedback.attach'), t('error.location')); // reuse generic denial tone
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setAttachmentName(asset.fileName || asset.uri.split('/').pop() || 'screenshot.jpg');
  }

  async function handleSubmit() {
    if (submitting) return;
    if (!message.trim()) {
      Alert.alert(t('screen.feedback.message_required'));
      return;
    }
    setSubmitting(true);
    try {
      await sendFeedback({
        category,
        message: attachmentName
          ? `${message.trim()}\n\n[Screenshot attached: ${attachmentName}]`
          : message,
        email: email || null,
      });
      Alert.alert(t('screen.feedback.thanks_title'), t('screen.feedback.thanks_body'));
      navigation.goBack();
    } catch {
      Alert.alert(t('screen.feedback.failed'));
    } finally {
      setSubmitting(false);
    }
  }

  const categoryLabel = t(CATEGORY_KEYS[CATEGORY_SLUGS.indexOf(category)] ?? CATEGORY_KEYS[3]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background === 'transparent' ? undefined : colors.background }]}>
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
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={t('screen.feedback.category')}
            >
              <Text style={[styles.dropdownText, { color: colors.text }]}>{categoryLabel}</Text>
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

          <TouchableOpacity
            style={[styles.attachBtn, { borderColor: Colors.brandGreen }]}
            onPress={handleAttach}
            accessibilityRole="button"
          >
            <Ionicons name="camera-outline" size={18} color={Colors.brandGreen} />
            <Text style={styles.attachText}>
              {attachmentName || t('screen.feedback.attach')}
            </Text>
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

        <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('screen.feedback.category')}</Text>
              {CATEGORY_SLUGS.map((slug, i) => (
                <TouchableOpacity
                  key={slug}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.border },
                    i === CATEGORY_SLUGS.length - 1 && styles.modalOptionLast,
                  ]}
                  onPress={() => {
                    setCategory(slug);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={{ color: category === slug ? Colors.brandGreen : colors.text, fontSize: 16, fontWeight: category === slug ? '700' : '500' }}>
                    {t(CATEGORY_KEYS[i])}
                  </Text>
                  {category === slug ? (
                    <Ionicons name="checkmark" size={18} color={Colors.brandGreen} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionLast: { borderBottomWidth: 0 },
});
