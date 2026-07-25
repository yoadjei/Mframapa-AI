import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Keyboard,
  Modal,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, getColors } from '../../theme';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { FAB_MORE_ITEMS } from '../../navigation/profileMenuItems';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BAR_HEIGHT = 56;
const CAPSULE_RADIUS = 28;
const FAB_SIZE = 56;
const BAR_GAP = 12;

const useNativeGlass =
  Platform.OS === 'ios' && isGlassEffectAPIAvailable();

/** React Navigation + Expo Router route names for the left capsule. */
const MAIN_TAB_CONFIG: {
  names: string[];
  labelKey: string;
  icons: { active: IoniconName; inactive: IoniconName };
}[] = [
  { names: ['Home', 'index'], labelKey: 'tab.home', icons: { active: 'home', inactive: 'home-outline' } },
  { names: ['Map', 'map'], labelKey: 'tab.map', icons: { active: 'map', inactive: 'map-outline' } },
  { names: ['Profile', 'profile'], labelKey: 'tab.profile', icons: { active: 'person', inactive: 'person-outline' } },
];

function glassFill(isDark: boolean) {
  return isDark ? 'rgba(12,18,26,0.38)' : 'rgba(255,255,255,0.42)';
}

function glassBorder(isDark: boolean) {
  return isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.70)';
}

function BarChrome({
  children,
  style,
  isDark,
}: {
  children: React.ReactNode;
  style?: object;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        style,
        {
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: glassBorder(isDark),
        },
      ]}
    >
      {useNativeGlass ? (
        <GlassView
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
        />
      ) : (
        <>
          <BlurView
            intensity={isDark ? 48 : 64}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: glassFill(isDark) }]}
          />
        </>
      )}
      {children}
    </View>
  );
}

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { t } = useTranslation();
  const isIOS = Platform.OS === 'ios';

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const mainRoutes = MAIN_TAB_CONFIG.map((cfg) =>
    state.routes.find((r) => cfg.names.includes(r.name)),
  ).filter((r): r is (typeof state.routes)[number] => !!r);

  const activeRoute = state.routes[state.index];

  useEffect(() => {
    const show = Keyboard.addListener(
      isIOS ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(
      isIOS ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, [isIOS]);

  function navigateToMainTab(route: (typeof state.routes)[number]) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (state.routes[state.index].key !== route.key && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }

  function openFabItem(item: (typeof FAB_MORE_ITEMS)[number]) {
    setMenuOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.viaProfile) {
      navigation.navigate('Profile', { screen: item.route });
      return;
    }
    navigation.navigate(item.route);
  }

  if (keyboardVisible) return null;

  const bottom = Math.max(16, insets.bottom + 8);
  const rowDivider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
          )}
          <Pressable
            style={[styles.menuPanel, { bottom: bottom + BAR_HEIGHT + 16, right: 16 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <BarChrome isDark={isDark} style={styles.menuChrome}>
              {FAB_MORE_ITEMS.map((item, i) => {
                const last = i === FAB_MORE_ITEMS.length - 1;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.menuRow,
                      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: rowDivider },
                    ]}
                    onPress={() => openFabItem(item)}
                  >
                    <Ionicons name={item.icon} size={18} color={Colors.brandGreen} />
                    <Text style={[styles.menuRowText, { color: colors.text }]}>
                      {t(item.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </BarChrome>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={[styles.barRow, { bottom, paddingHorizontal: 16 }]}>
        <View
          style={[
            styles.capsuleShadow,
            { shadowOpacity: isDark ? 0.32 : 0.12 },
          ]}
        >
          <BarChrome isDark={isDark} style={styles.capsule}>
            <View style={styles.capsuleInner}>
              {MAIN_TAB_CONFIG.map((cfg, i) => {
                const route = mainRoutes[i];
                if (!route) return null;
                const focused = cfg.names.includes(activeRoute?.name ?? '');
                const icons = cfg.icons;
                const iconColor = focused ? Colors.brandGreen : Colors.textMuted;
                const options = descriptors[route.key].options;
                const rawLabel = options.tabBarLabel ?? options.title;
                const label =
                  typeof rawLabel === 'string' ? rawLabel : t(cfg.labelKey);
                const pillBg = isDark ? 'rgba(74, 222, 128, 0.22)' : '#D6F5EC';

                return (
                  <Pressable
                    key={route.key}
                    style={styles.capsuleTab}
                    onPress={() => navigateToMainTab(route)}
                    onLongPress={() =>
                      navigation.emit({ type: 'tabLongPress', target: route.key })
                    }
                    accessibilityRole="tab"
                    accessibilityState={{ selected: focused }}
                    accessibilityLabel={label}
                  >
                    <View
                      style={[
                        styles.tabPill,
                        focused && { backgroundColor: pillBg },
                      ]}
                    >
                      <Ionicons
                        name={focused ? icons.active : icons.inactive}
                        size={22}
                        color={iconColor}
                      />
                      {focused ? (
                        <Text style={[styles.tabLabel, { color: iconColor }]} numberOfLines={1}>
                          {label}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </BarChrome>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.fabShadow,
            styles.fab,
            pressed && styles.fabPressed,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setMenuOpen((open) => !open);
          }}
          accessibilityRole="button"
          accessibilityLabel={menuOpen ? 'Close menu' : 'More options'}
        >
          <Ionicons
            name={menuOpen ? 'close' : 'add'}
            size={28}
            color="#fff"
          />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  barRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: BAR_GAP,
  },
  capsuleShadow: {
    height: BAR_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    alignSelf: 'flex-start',
  },
  capsule: {
    height: BAR_HEIGHT,
    borderRadius: CAPSULE_RADIUS,
  },
  capsuleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  capsuleTab: {
    height: BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    minHeight: 36,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fabShadow: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.brandGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.22)' : 'transparent',
  },
  menuPanel: {
    position: 'absolute',
    width: 256,
  },
  menuChrome: {
    borderRadius: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
