import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { getColors } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Search: undefined;
  Map: undefined;
  Alerts: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

function SearchScreenWrapper() {
  const navigation = useNavigation<any>();
  return <SearchScreen onNavigateHome={() => navigation.navigate('Home')} />;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(
  focused: boolean,
  active: IoniconName,
  inactive: IoniconName,
  color: string,
  size: number
) {
  return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
}

export function AppNavigator() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          marginHorizontal: 14,
          marginBottom: Platform.OS === 'ios' ? 12 : 10,
          borderRadius: 26,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          paddingTop: 10,
          height: 66 + (Platform.OS === 'ios' ? insets.bottom : 10),
          position: 'absolute',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.32 : 0.12,
          shadowRadius: 18,
          elevation: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tab.home'),
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'home', 'home-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreenWrapper}
        options={{
          tabBarLabel: t('tab.search'),
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'search', 'search-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: t('tab.map'),
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'location', 'location-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: t('tab.alerts'),
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'notifications', 'notifications-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('tab.settings'),
          tabBarIcon: ({ focused, color, size }) =>
            tabIcon(focused, 'settings', 'settings-outline', color, size),
        }}
      />
    </Tab.Navigator>
  );
}
