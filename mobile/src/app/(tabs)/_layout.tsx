import { Tabs } from 'expo-router';
import { GlassTabBar } from '@/components/navigation/GlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // tabBarHideOnKeyboard is handled inside GlassTabBar via Keyboard events
        tabBarHideOnKeyboard: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Home' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="search" options={{ href: null, tabBarButton: () => null }} />
      <Tabs.Screen name="alerts" options={{ href: null, tabBarButton: () => null }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  );
}
