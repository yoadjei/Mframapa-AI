import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { Badge } from '../components/ui/Badge';
import { MframapaLogo } from '../components/MframapaLogo';
import { useTranslation } from '../hooks/useTranslation';
import { useStore } from '../store/useStore';
import { CommunityComposerSheet } from '../components/CommunityComposerSheet';

export function CommunityHubScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const posts = useStore((s) => s.communityPosts);
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <View style={[styles.root]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <MframapaLogo size="sm" />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t('screen.community.title')}
        </Text>
        <TouchableOpacity
          onPress={() => setComposerOpen(true)}
          style={[styles.shareBtn, { backgroundColor: Colors.brandGreen + '22' }]}
        >
          <Ionicons name="create-outline" size={16} color={Colors.brandGreen} />
          <Text style={[styles.shareBtnText, { color: Colors.brandGreen }]}>
            {t('screen.community.share')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.post, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: Colors.brandGreen }]}>
                <Text style={styles.avatarText}>{item.author.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: colors.text }]}>{item.author}</Text>
                  <Badge
                    label={item.verified ? t('screen.community.verified') : t('screen.community.pending')}
                    variant={item.verified ? 'verified' : 'pending'}
                  />
                </View>
                <View style={styles.locRow}>
                  <Ionicons name="location-outline" size={12} color={colors.subtext} />
                  <Text style={[styles.locText, { color: colors.subtext }]}>{item.location}</Text>
                </View>
              </View>
            </View>
            <Text style={[styles.postText, { color: colors.text }]}>{item.body}</Text>
            {item.photoUri ? (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="image-outline" size={32} color={colors.subtext} />
                <Text style={[styles.photoLabel, { color: colors.subtext }]}>{t('screen.community.photo_in')}</Text>
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.subtext} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('screen.community.no_posts_yet')}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.subtext }]}>
              {t('screen.community.first_to_share')}
            </Text>
            <TouchableOpacity
              onPress={() => setComposerOpen(true)}
              style={[styles.emptyCta, { backgroundColor: Colors.brandGreen }]}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.emptyCtaText}>{t('screen.community.share_an_update')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <CommunityComposerSheet
        visible={composerOpen}
        onClose={() => setComposerOpen(false)}
      />
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
  headerTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginLeft: 12 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  shareBtnText: { fontSize: 13, fontWeight: '600' },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    marginTop: 8,
  },
  emptyCtaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  post: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  postHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  userName: { fontSize: 14, fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  locText: { fontSize: 12 },
  postText: { fontSize: 14, lineHeight: 20 },
  photoPlaceholder: { borderRadius: 10, height: 80, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoLabel: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 14, textAlign: 'center' },
});
