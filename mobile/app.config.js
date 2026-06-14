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

const appJson = require('./app.json');

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
  let url = process.env.EXPO_PUBLIC_API_URL || 'https://mframapa.ai';
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
    ...appJson.expo,
    extra: {
      mapboxToken,
      apiUrl,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '',
      paystackPublicKey: process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    },
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...(appJson.expo.ios?.infoPlist ?? {}),
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
        },
      },
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      stripPushEntitlement,
    ],
  },
};
