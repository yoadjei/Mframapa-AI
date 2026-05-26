import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  FlatList, Image, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';

const SEEDS = [
  'amara', 'kofi', 'zuri', 'kwame', 'abena', 'efua', 'adjoa', 'yaw',
  'akosua', 'fiifi', 'nana', 'esi', 'baaba', 'araba', 'adwoa', 'akua',
  'sena', 'edem', 'dela', 'mawuli', 'dzifa', 'selorm', 'eyram', 'kafui',
];

const NUM_COLS = 4;
const ITEM_SIZE = (Dimensions.get('window').width - 32 - (NUM_COLS - 1) * 12) / NUM_COLS;

export function naviiUrl(seed: string, size = 96) {
  return `https://api.navii.dev/avatar/${encodeURIComponent(seed)}.png?size=${size}&background=none`;
}

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (seed: string) => void;
  onClose: () => void;
}

export function AvatarPickerSheet({ visible, selected, onSelect, onClose }: Props) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('profile.pick_avatar')}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.subtext} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={SEEDS}
          numColumns={NUM_COLS}
          keyExtractor={(s) => s}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: seed }) => {
            const active = seed === selected;
            return (
              <TouchableOpacity
                onPress={() => { onSelect(seed); onClose(); }}
                activeOpacity={0.8}
                style={[
                  styles.avatarBtn,
                  { width: ITEM_SIZE, height: ITEM_SIZE, backgroundColor: colors.surface },
                  active && { borderColor: Colors.brandGreen, borderWidth: 2.5 },
                ]}
              >
                <Image
                  source={{ uri: naviiUrl(seed) }}
                  style={styles.avatarImg}
                  resizeMode="contain"
                />
                {active ? (
                  <View style={styles.checkBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.brandGreen} />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 12, paddingHorizontal: 16 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 17, fontWeight: '700' },
  grid: { paddingBottom: 8 },
  row: { gap: 12, marginBottom: 12 },
  avatarBtn: { borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '85%', height: '85%' },
  checkBadge: { position: 'absolute', bottom: 4, right: 4 },
});
