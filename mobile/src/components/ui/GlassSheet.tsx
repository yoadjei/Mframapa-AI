import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

const useNativeGlass =
  Platform.OS === 'ios' && isGlassEffectAPIAvailable();

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra styles on the sheet panel (e.g. maxHeight). */
  sheetStyle?: StyleProp<ViewStyle>;
  /** Overlay darkness; default matches notification sheets. */
  overlayOpacity?: number;
};

/**
 * Bottom sheet with liquid-glass panel (iOS GlassView / Android BlurView).
 * Matches GlassTabBar FAB menu treatment.
 */
export function GlassSheet({
  visible,
  onClose,
  children,
  sheetStyle,
  overlayOpacity = 0.4,
}: Props) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const fill = isDark ? 'rgba(12,18,26,0.42)' : 'rgba(255,255,255,0.48)';
  const border = isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.70)';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={[styles.overlay, { backgroundColor: `rgba(0,0,0,${overlayOpacity})` }]}
          onPress={onClose}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={10} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null}
        </Pressable>

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              borderColor: border,
            },
            sheetStyle,
          ]}
        >
          {useNativeGlass ? (
            <GlassView
              style={[StyleSheet.absoluteFill, styles.sheetRadius]}
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
            />
          ) : (
            <>
              <BlurView
                intensity={isDark ? 48 : 64}
                tint={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, styles.sheetRadius]}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  styles.sheetRadius,
                  { backgroundColor: fill },
                ]}
              />
            </>
          )}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  overlay: { ...StyleSheet.absoluteFillObject },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  sheetRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
