import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useStore } from '../store/useStore';
import { getColors, fontSize } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Map: undefined;
  Search: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  color: string;
}

function HomeIcon({ focused }: TabIconProps) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20 }}>{focused ? '🏠' : '🏡'}</Text>
  );
}

function MapIcon({ focused }: TabIconProps) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>🗺️</Text>;
}

function SearchIcon({ focused }: TabIconProps) {
  return (
    <Text style={{ fontSize: focused ? 22 : 20 }}>{focused ? '🔍' : '🔎'}</Text>
  );
}

function SettingsIcon({ focused }: TabIconProps) {
  return <Text style={{ fontSize: focused ? 22 : 20 }}>⚙️</Text>;
}

function SearchScreenWrapper() {
  const navigation = useNavigation<any>();

  function navigateToHome() {
    navigation.navigate('Home');
  }

  return <SearchScreen onNavigateHome={navigateToHome} />;
}

export function AppNavigator() {
  const isDark = useStore((s) => s.isDark);
  const colors = getColors(isDark);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.subtext,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: (props) => <HomeIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: (props) => <MapIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreenWrapper}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: (props) => <SearchIcon {...props} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: (props) => <SettingsIcon {...props} />,
        }}
      />
    </Tab.Navigator>
  );
}
