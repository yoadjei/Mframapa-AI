const fs = require('fs');
const os = require('os');
const path = require('path');
const { withEntitlementsPlist } = require('expo/config-plugins');

/**
 * Free Apple Developer teams can't sign Push Notifications.
 * expo-notifications adds aps-environment automatically during prebuild —
 * this strips it so local builds can sign with a personal team.
 * Local notifications still work; only remote push is disabled (which a free
 * team can't use anyway).
 */
const stripPushEntitlement = (config) =>
  withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });

/** Load repo-root .env so EXPO_PUBLIC_* matches PWA (VITE_*). */
const rootEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(rootEnv)) {
  for (const line of fs.readFileSync(rootEnv, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const mapboxToken =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ||
  process.env.VITE_MAPBOX_TOKEN ||
  '';

/** First non-loopback IPv4 (same network Expo shows in exp://<ip>:8081). */
function getLanIPv4() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

/**
 * Physical iPhones cannot reach the Mac via 127.0.0.1 — rewrite to LAN IP at config time.
 */
function resolveApiUrl() {
  let url = process.env.EXPO_PUBLIC_API_URL || 'https://api.mframapa.live';
  try {
    const parsed = new URL(url);
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      const lan = getLanIPv4();
      if (lan) {
        parsed.hostname = lan;
        url = parsed.toString().replace(/\/$/, '');
        console.log(`[Mframapa] EXPO_PUBLIC_API_URL rewritten for device: ${url}`);
      }
    }
  } catch {
    /* keep url */
  }
  return url;
}

const apiUrl = resolveApiUrl();

module.exports = {
  expo: {
    name: 'Mframapa',
    slug: 'mframapa',
    scheme: 'mframapa',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#FFFFFF',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: 'ai.mframapa.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'POST_NOTIFICATIONS',
      ],
    },
    ios: {
      bundleIdentifier: 'ai.mframapa.app',
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Mframapa uses your location to show the air quality where you are. You can also search for a city instead.',
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
      privacyManifests: {
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType:
              'NSPrivacyCollectedDataTypePreciseLocation',
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
          {
            NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypeEmailAddress',
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              'NSPrivacyCollectedDataTypePurposeAppFunctionality',
            ],
          },
        ],
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType:
              'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
        ],
      },
    },
    plugins: [
      'expo-location',
      [
        'expo-notifications',
        {
          icon: './assets/adaptive-icon.png',
          color: '#00C896',
        },
      ],
      '@sentry/react-native',
      stripPushEntitlement,
    ],
    extra: {
      ...(process.env.EAS_PROJECT_ID
        ? { eas: { projectId: process.env.EAS_PROJECT_ID } }
        : {}),
      mapboxToken,
      apiUrl,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '',
      paystackPublicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    },
  },
};
