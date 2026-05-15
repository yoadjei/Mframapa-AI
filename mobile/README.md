# Mframapa Mobile App

**Framework**: React Native (Expo) + TypeScript
**Distribution**: Free channels — Samsung Galaxy Store, Huawei AppGallery, Amazon Appstore, direct APK
**API**: Backend `/api/v1/` — same contract as PWA
**Status**: Scaffold implemented with 5 screens, 9 components, navigation, persistent store, i18n

---

## Directory Structure

```
mobile/
├── App.tsx                 # Root component (wraps AppNavigator)
├── app.json                # Expo configuration
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── eas.json                # EAS Build config
│
└── src/
    ├── screens/
    │   ├── HomeScreen.tsx       # Main AQI display
    │   ├── MapScreen.tsx        # Interactive map + location picker
    │   ├── SearchScreen.tsx     # City search (offline-capable)
    │   ├── AlertsScreen.tsx     # Push notification history
    │   └── SettingsScreen.tsx   # Language, theme, notifications
    │
    ├── components/
    │   ├── AQICard.tsx          # Main air quality card
    │   ├── AQIGauge.tsx         # Visual gauge/meter
    │   ├── AQIColorBar.tsx      # Color indicator bar
    │   ├── HealthAdvice.tsx     # Localised health guidance
    │   ├── WeatherStrip.tsx     # Compact weather display
    │   ├── CityPicker.tsx       # Offline-capable city selector
    │   ├── LanguagePicker.tsx   # Language selector
    │   ├── OfflineBanner.tsx    # "Using cached data" indicator
    │   └── LoadingSpinner.tsx   # Loading state
    │
    ├── services/
    │   ├── api.ts               # Backend /v1 API client (Axios)
    │   ├── offline.ts           # Offline data management
    │   ├── notifications.ts     # Push notification handling
    │   ├── location.ts          # GPS + manual location
    │   └── analytics.ts         # Aggregate-only analytics
    │
    ├── store/
    │   └── useStore.ts          # Zustand + MMKV persistent store
    │
    ├── navigation/
    │   └── AppNavigator.tsx     # Bottom tab navigation (React Navigation)
    │
    ├── theme/
    │   └── index.ts             # Colors, spacing, typography, AQI colors
    │
    ├── hooks/
    │   ├── useAQI.ts            # Fetch AQI with caching
    │   ├── useOffline.ts        # Offline state detection
    │   ├── useLanguage.ts       # Language switching
    │   ├── useLocation.ts       # Location handling
    │   └── useTranslation.ts    # Translation hook
    │
    ├── i18n/
    │   └── index.ts             # i18n configuration
    │
    ├── locales/
    │   ├── en.ts                # English
    │   └── fr.ts                # French
    │
    ├── data/
    │   └── africanCities.ts     # 500+ African cities with coordinates (~45 KB)
    │
    └── utils/
        ├── aqi.ts               # AQI category calculations + colors
        ├── formatters.ts        # Number/date formatting
        └── constants.ts         # App-wide constants
```

---

## Development

```bash
cd mobile
npm install
npx expo start                           # Dev server
npx expo start --android                 # Dev on Android
npx expo run:android --variant release   # Local release APK build (free)
```

---

## Store (Zustand + MMKV)

Single store at `src/store/useStore.ts`, persisted to MMKV (`mframapa-persist`):

| Slice | Data |
|-------|------|
| `theme` | `isDark` toggle |
| `language` | Current locale key |
| `lastPrediction` | Most recent AQI result |
| `predictionHistory` | Last 20 results (deduplicated by lat/lon ±0.01°) |
| `offlineCities` | Pre-cached city data for offline use |

---

## Target Specifications

| Spec | Target |
|------|--------|
| Min Android | API 21 (Android 5.0) |
| APK size | < 15 MB |
| Startup time | < 3 seconds |
| Offline | Full functionality with cached data |
| Languages | English, French (extensible) |

---

## Build & Distribution

### Local APK (Free)

```bash
npx expo run:android --variant release
```

### Distribution Channels (All Free)

| Channel | Cost | Status |
|---------|------|--------|
| Direct APK download | $0 | Pending |
| Samsung Galaxy Store | $0 | Pending |
| Huawei AppGallery | $0 | Pending |
| Amazon Appstore | $0 | Pending |
| GitHub Releases | $0 | CI workflow ready (`.github/workflows/android-release.yml` planned) |

See `EXECUTION_PLAN.md` for distribution timeline (Week 12).
