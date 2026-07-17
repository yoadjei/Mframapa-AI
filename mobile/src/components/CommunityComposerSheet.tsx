import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { PrimaryButton } from './ui/PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MAX_LEN = 280;

export function CommunityComposerSheet({ visible, onClose }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const profile          = useStore((s) => s.profile);
  const lastPrediction   = useStore((s) => s.lastPrediction);
  const addCommunityPost = useStore((s) => s.addCommunityPost);

  const [body, setBody] = useState('');
  const [location, setLocation] = useState(
    lastPrediction?.location.name ?? '',
  );
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setBody('');
    setLocation(lastPrediction?.location.name ?? '');
    setSubmitting(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handlePost() {
    const cleanBody = body.trim();
    const cleanLoc  = location.trim();
    if (!cleanBody) {
      Alert.alert(t('screen.community.body_required'));
      return;
    }
    if (!profile.fullName) {
      Alert.alert(t('screen.community.profile_required'));
      return;
    }
    setSubmitting(true);
    addCommunityPost({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      author: profile.fullName,
      location: cleanLoc || t('screen.community.unknown_location'),
      body: cleanBody,
      verified: false,
      createdAt: new Date().toISOString(),
    });
    setSubmitting(false);
    reset();
    onClose();
  }

  const remaining = MAX_LEN - body.length;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t('screen.community.share_an_update')}
            </Text>
            <TouchableOpacity onPress={handleClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.subtext} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={[styles.label, { color: colors.subtext }]}>
              {t('screen.community.posting_as', { name: profile.fullName || t('screen.community.not_signed_in') })}
            </Text>

            <TextInput
              value={body}
              onChangeText={(v) => setBody(v.slice(0, MAX_LEN))}
              placeholder={t('screen.community.body_placeholder')}
              placeholderTextColor={colors.subtext}
              multiline
              style={[
                styles.bodyInput,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />
            <Text style={[styles.counter, { color: remaining < 20 ? Colors.danger : colors.muted }]}>
              {remaining}
            </Text>

            <Text style={[styles.label, { color: colors.subtext, marginTop: 8 }]}>
              {t('screen.community.location_label')}
            </Text>
            <View
              style={[
                styles.locRow,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="location-outline" size={16} color={colors.subtext} />
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder={t('screen.community.location_placeholder')}
                placeholderTextColor={colors.subtext}
                style={[styles.locInput, { color: colors.text }]}
              />
            </View>

            <PrimaryButton
              label={t('screen.community.post')}
              onPress={handlePost}
              loading={submitting}
              disabled={body.trim().length === 0}
              style={styles.postBtn}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '88%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  bodyInput: {
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 120,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locInput: { flex: 1, fontSize: 15 },
  postBtn: { marginTop: 20 },
});
