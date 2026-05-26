import React, { useState } from 'react';
import { View, Platform, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Theme
import { getColors, Colors } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { useStore } from '../store/useStore';
import { useTranslation } from '../hooks/useTranslation';
import {
  clearSignOutSession,
  shouldStartOnboardingAtAuth,
} from '../session/authSession';

// Onboarding
import { SplashScreen } from '../screens/onboarding/SplashScreen';
import { OnboardingSlidesScreen } from '../screens/onboarding/OnboardingSlidesScreen';
import { PermissionsScreen } from '../screens/onboarding/PermissionsScreen';
import { LoginScreen } from '../screens/onboarding/LoginScreen';
import { SignUpScreen } from '../screens/onboarding/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/onboarding/ForgotPasswordScreen';
import { PaywallScreen } from '../screens/PaywallScreen';

// Core tab screens
import { HomeScreen } from '../screens/HomeScreen';
import { MapScreen } from '../screens/MapScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Shared detail screens
import { CityDetailScreen } from '../screens/CityDetailScreen';
import { HealthRiskScreen } from '../screens/HealthRiskScreen';

// Profile stack screens
import { SettingsScreen } from '../screens/SettingsScreen';
import { SavedLocationsScreen } from '../screens/SavedLocationsScreen';
import { ActivityFeedScreen } from '../screens/ActivityFeedScreen';
import { PricingScreen } from '../screens/PricingScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { AIInsightsScreen } from '../screens/AIInsightsScreen';
import { PredictionDashboardScreen } from '../screens/PredictionDashboardScreen';
import { LandingMarketingScreen } from '../screens/LandingMarketingScreen';
import { CountryExplorerScreen } from '../screens/CountryExplorerScreen';
import { AfricaHeatmapScreen } from '../screens/AfricaHeatmapScreen';
import { HistoricalPlaybackScreen } from '../screens/HistoricalPlaybackScreen';
import { CompareCitiesScreen } from '../screens/CompareCitiesScreen';
import { AnomalyAlertScreen } from '../screens/AnomalyAlertScreen';
import { CommunityHubScreen } from '../screens/CommunityHubScreen';
import { TrustTransparencyScreen } from '../screens/TrustTransparencyScreen';
import { ExportCentreScreen } from '../screens/ExportCentreScreen';
import { LanguageSelectorScreen } from '../screens/LanguageSelectorScreen';
import { DeleteAccountScreen } from '../screens/DeleteAccountScreen';
import { AboutLegalScreen } from '../screens/AboutLegalScreen';
import { FeedbackFormScreen } from '../screens/FeedbackFormScreen';

// System screens
import { OfflineCityPickerScreen } from '../screens/system/OfflineCityPickerScreen';
import { ErrorScreen } from '../screens/system/ErrorScreen';
import { ForceUpdateScreen } from '../screens/system/ForceUpdateScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ─── Home Stack ───────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} />
      <Stack.Screen name="HealthRisk" component={HealthRiskScreen} />
      <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
      <Stack.Screen name="PredictionDashboard" component={PredictionDashboardScreen} />
      <Stack.Screen name="AnomalyAlert" component={AnomalyAlertScreen} />
      <Stack.Screen name="HistoricalPlayback" component={HistoricalPlaybackScreen} />
    </Stack.Navigator>
  );
}

// ─── Map Stack ────────────────────────────────────────────────────────────────
function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Search Stack ─────────────────────────────────────────────────────────────
function SearchStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="CityDetail" component={CityDetailScreen} />
    </Stack.Navigator>
  );
}

// ─── Alerts Stack ─────────────────────────────────────────────────────────────
function AlertsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AlertsMain" component={AlertsScreen} />
    </Stack.Navigator>
  );
}

// ─── Profile Stack ────────────────────────────────────────────────────────────
function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="SavedLocations" component={SavedLocationsScreen} />
      <Stack.Screen name="ActivityFeed" component={ActivityFeedScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="AIInsights" component={AIInsightsScreen} />
      <Stack.Screen name="PredictionDashboard" component={PredictionDashboardScreen} />
      <Stack.Screen name="LandingMarketing" component={LandingMarketingScreen} />
      <Stack.Screen name="CountryExplorer" component={CountryExplorerScreen} />
      <Stack.Screen name="AfricaHeatmap" component={AfricaHeatmapScreen} />
      <Stack.Screen name="HistoricalPlayback" component={HistoricalPlaybackScreen} />
      <Stack.Screen name="CompareCities" component={CompareCitiesScreen} />
      <Stack.Screen name="AnomalyAlert" component={AnomalyAlertScreen} />
      <Stack.Screen name="CommunityHub" component={CommunityHubScreen} />
      <Stack.Screen name="TrustTransparency" component={TrustTransparencyScreen} />
      <Stack.Screen name="ExportCentre" component={ExportCentreScreen} />
      <Stack.Screen name="LanguageSelector" component={LanguageSelectorScreen} />
      <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
      <Stack.Screen name="AboutLegal" component={AboutLegalScreen} />
      <Stack.Screen name="FeedbackForm" component={FeedbackFormScreen} />
      <Stack.Screen name="OfflineCityPicker" component={OfflineCityPickerScreen} />
      <Stack.Screen name="Error" component={ErrorScreen} />
    </Stack.Navigator>
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────
function MainApp() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const insets = useSafeAreaInsets();
  const unreadCount = useStore((s) => s.notifications.filter((n) => !n.read).length);
  const { t } = useTranslation();

  type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

  function tabIcon(focused: boolean, active: IoniconName, inactive: IoniconName, color: string, size: number) {
    return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
  }

  const TAB_BAR_HEIGHT = 56;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: 'transparent',
          borderTopWidth: 0,
          marginHorizontal: Platform.OS === 'ios' ? 14 : 0,
          marginBottom: Platform.OS === 'ios' ? 16 : 0,
          borderRadius: Platform.OS === 'ios' ? 26 : 0,
          paddingTop: 0,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
          height: Platform.OS === 'ios' ? TAB_BAR_HEIGHT : TAB_BAR_HEIGHT + insets.bottom,
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.32 : 0.12,
          shadowRadius: 18,
          elevation: 10,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: TAB_BAR_HEIGHT,
          paddingVertical: 0,
        },
        tabBarActiveTintColor: Colors.brandGreen,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          marginBottom: 0,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: t('tab.home'),
          tabBarIcon: ({ focused, color, size }) => tabIcon(focused, 'home', 'home-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{
          tabBarLabel: t('tab.map'),
          tabBarIcon: ({ focused, color, size }) => tabIcon(focused, 'location', 'location-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchStack}
        options={{
          tabBarLabel: t('tab.search'),
          tabBarIcon: ({ focused, color, size }) => tabIcon(focused, 'search', 'search-outline', color, size),
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={{
          tabBarLabel: t('tab.alerts'),
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={size} color={color} />
              {unreadCount > 0 ? (
                <View style={{
                  position: 'absolute', top: -2, right: -4,
                  width: 14, height: 14, borderRadius: 7,
                  backgroundColor: Colors.danger,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarLabel: t('tab.profile'),
          tabBarIcon: ({ focused, color, size }) => tabIcon(focused, 'person', 'person-outline', color, size),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Auth Stack (Login → SignUp / ForgotPassword → Paywall) ──────────────────
const AuthStack = createNativeStackNavigator();

function AuthFlow() {
  const [showPaywall, setShowPaywall] = useState(false);
  const setAuthenticated = useStore((s) => s.setAuthenticated);

  function finishAuth() {
    setAuthenticated(true);
    clearSignOutSession();
  }

  if (showPaywall) {
    return <PaywallScreen onDone={finishAuth} />;
  }

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="Login"
        children={() => <LoginScreen onAuth={() => setShowPaywall(true)} />}
      />
      <AuthStack.Screen
        name="SignUp"
        children={() => <SignUpScreen onAuth={() => setShowPaywall(true)} />}
      />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Onboarding Stack ─────────────────────────────────────────────────────────
function OnboardingNavigator({ startAtAuth = false }: { startAtAuth?: boolean }) {
  type Phase = 'splash' | 'slides' | 'permissions' | 'auth';
  const [phase, setPhase] = useState<Phase>(startAtAuth ? 'auth' : 'splash');

  if (phase === 'splash') {
    return <SplashScreen onDone={() => setPhase('slides')} />;
  }
  if (phase === 'slides') {
    return <OnboardingSlidesScreen onDone={() => setPhase('permissions')} />;
  }
  if (phase === 'permissions') {
    return (
      <PermissionsScreen
        onAllow={() => setPhase('auth')}
        onSkip={() => setPhase('auth')}
      />
    );
  }
  return <AuthFlow />;
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export function AppNavigator() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <OnboardingNavigator startAtAuth={shouldStartOnboardingAtAuth()} />
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainApp" component={MainApp} />
      <Stack.Screen name="ForceUpdate" component={ForceUpdateScreen} />
      <Stack.Screen name="OfflineCityPicker" component={OfflineCityPickerScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Error" component={ErrorScreen} options={{ presentation: 'modal' }} />
    </Stack.Navigator>
  );
}
