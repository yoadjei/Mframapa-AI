# Mframapa Mobile App — Scaffold Structure

**Framework**: React Native (Expo)  
**Distribution**: APK + free stores / direct download — details **`../docs/STORES.md`**.  
**Plan alignment**: **`../SPEC.md`** Phase 4 (Weeks 13–16); observe privacy-preserving **aggregate** analytics only (`../EXECUTION_PLAN_4MONTHS.md`).

---

## Directory Structure

```
mobile/
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── babel.config.js             # Babel configuration
├── metro.config.js             # Metro bundler config
├── eas.json                    # EAS Build config (free local builds)
│
├── src/
│   ├── App.tsx                 # Root component
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main AQI display (one-tap check)
│   │   ├── MapScreen.tsx       # Interactive map view
│   │   ├── AlertsScreen.tsx    # Push notification history
│   │   ├── SettingsScreen.tsx  # Language, notifications, offline
│   │   └── CitySearchScreen.tsx # Manual city selection (no GPS)
│   │
│   ├── components/
│   │   ├── AQICard.tsx         # Main air quality card
│   │   ├── AQIGauge.tsx        # Visual gauge/meter
│   │   ├── AQIColorBar.tsx     # Simple color indicator
│   │   ├── HealthAdvice.tsx    # Localized health guidance
│   │   ├── WeatherStrip.tsx    # Compact weather display
│   │   ├── CityPicker.tsx      # Offline-capable city selector
│   │   ├── LanguagePicker.tsx  # 35+ African languages
│   │   ├── OfflineBanner.tsx   # "Using cached data" indicator
│   │   └── LoadingSpinner.tsx  # Minimal loading state
│   │
│   ├── services/
│   │   ├── api.ts              # Backend API client
│   │   ├── offline.ts          # Offline data management
│   │   ├── notifications.ts    # Push notification handling
│   │   ├── location.ts         # GPS + manual location
│   │   └── analytics.ts        # Aggregate-only analytics (no raw GPS retention)
│   │
│   ├── stores/
│   │   ├── aqiStore.ts         # Air quality state (Zustand)
│   │   ├── settingsStore.ts    # User preferences
│   │   ├── offlineStore.ts     # Cached city data
│   │   └── locationStore.ts    # Current/saved locations
│   │
│   ├── i18n/
│   │   ├── index.ts            # i18n setup
│   │   ├── en.json             # English
│   │   ├── sw.json             # Swahili
│   │   ├── ha.json             # Hausa
│   │   ├── yo.json             # Yoruba
│   │   ├── am.json             # Amharic
│   │   ├── ar.json             # Arabic
│   │   ├── fr.json             # French
│   │   ├── tw.json             # Twi
│   │   └── ... (35+ languages)
│   │
│   ├── hooks/
│   │   ├── useAQI.ts           # Fetch AQI with caching
│   │   ├── useOffline.ts       # Offline state detection
│   │   ├── useLanguage.ts      # Language switching
│   │   └── useLocation.ts      # Location handling
│   │
│   ├── utils/
│   │   ├── aqi.ts              # AQI calculations & colors
│   │   ├── formatters.ts       # Number/date formatting
│   │   └── constants.ts        # App-wide constants
│   │
│   └── navigation/
│       └── AppNavigator.tsx    # Tab/stack navigation
│
├── assets/
│   ├── icons/
│   │   ├── aqi-good.svg
│   │   ├── aqi-moderate.svg
│   │   ├── aqi-unhealthy.svg
│   │   ├── aqi-hazardous.svg
│   │   └── mframapa-logo.svg
│   │
│   └── fonts/
│       └── (system fonts - no custom fonts to reduce size)
│
└── __tests__/
    └── (unit tests)
```

---

## Key Design Decisions (Cost-Optimized)

### 1. No Custom Fonts
- Use system fonts (Roboto/San Francisco)
- Reduces APK size significantly

### 2. No Heavy Map Library
- Use react-native-maps with OpenStreetMap tiles (free)
- Or simple static map images for ultra-low bandwidth

### 3. Offline-First Architecture
- Preload 500 African cities on first launch
- Cache last 7 days of AQI for saved locations
- App fully functional without internet

### 4. Minimal Dependencies
- Expo (managed workflow)
- Zustand (tiny state management, 1KB)
- MMKV (fast storage, 50KB)
- Avoid heavy libraries

### 5. Target APK Size: < 15MB
- Enables download on slow connections
- Reduces data costs for users

---

## Build & Distribution (All FREE)

### Local Development
```bash
npx expo start
```

### Build APK Locally (FREE)
```bash
# One-time setup
npm install -g eas-cli

# Build locally (no EAS account needed)
npx expo run:android --variant release
```

### Distribution Channels

| Channel | Cost | Setup |
|---------|------|-------|
| Direct APK download | FREE | Host on website |
| Samsung Galaxy Store | FREE | developer.samsung.com |
| Huawei AppGallery | FREE | developer.huawei.com |
| Amazon Appstore | FREE | developer.amazon.com |
| F-Droid | FREE | f-droid.org/contribute |
| PWA | FREE | Already have web app |

---

## PWA Enhancement (for iOS users)

Since we're skipping Apple App Store ($99/year), enhance the web app:

1. Add `manifest.json` for installability
2. Add service worker for offline
3. Add iOS-specific meta tags
4. Prompt users to "Add to Home Screen"

This gives iOS users an app-like experience for FREE.
