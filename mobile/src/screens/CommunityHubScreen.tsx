import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { getColors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { Badge } from '../components/ui/Badge';
import { MframapaLogo } from '../components/MframapaLogo';
import { useTranslation } from '../hooks/useTranslation';

const POSTS = [
  { id: '1', user: 'Juan Marira', location: 'Accra, Kaneshie', verified: true, photo: false },
  { id: '2', user: 'Jona Muua', location: 'Accra, Kaneshie', verified: false, photo: true },
  { id: '3', user: 'Mma Filax', location: 'Accra, Kaneshie', verified: false, photo: true },
];

export function CommunityHubScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <MframapaLogo size="sm" />
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={POSTS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.post, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: Colors.brandGreen }]}>
                <Text style={styles.avatarText}>{item.user.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: colors.text }]}>{item.user}</Text>
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
            <Text style={[styles.postText, { color: colors.text }]}>{t('screen.community.post_sample')}</Text>
            {item.photo ? (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface }]}>
                <Ionicons name="image-outline" size={32} color={colors.subtext} />
                <Text style={[styles.photoLabel, { color: colors.subtext }]}>{t('screen.community.photo_in')}</Text>
              </View>
            ) : null}
          </View>
        )}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 80 }]}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  headerIcons: { flexDirection: 'row', gap: 14 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
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
  fab: {
    position: 'absolute',
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.brandGreen,
    shadowRadius: 12,
    shadowOpacity: 0.4,
    elevation: 8,
  },
});
