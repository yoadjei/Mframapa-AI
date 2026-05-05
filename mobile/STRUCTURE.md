# Mobile App Structure

**Framework**: React Native (Expo)  
**Build**: Local release APK (free tier / local toolchain)  
**Distribution**: ≥**two** channels by **`SPEC.md` Week 14** — Samsung + (Huawei **or** Amazon **or** GitHub Releases APK).  
**API**: Backend **`/v1`** base URL, same contract as PWA; honour **rate limits** and **API keys** for institutional builds.

---

## Directory Layout

```
mobile/
├── app.json                    # Expo config
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript config
├── babel.config.js             # Babel config
│
├── src/
│   ├── App.tsx                 # Root component
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Main AQI display
│   │   ├── MapScreen.tsx       # Map with location picker
│   │   ├── SearchScreen.tsx    # City search
│   │   └── SettingsScreen.tsx  # User preferences
│   │
│   ├── components/
│   │   ├── AQICard.tsx         # Air quality card
│   │   ├── AQIGauge.tsx        # Visual meter
│   │   ├── HealthAdvice.tsx    # Health recommendations
│   │   ├── CityPicker.tsx      # City selector
│   │   ├── LanguagePicker.tsx  # Language selector
│   │   └── OfflineBanner.tsx   # Offline indicator
│   │
│   ├── services/
│   │   ├── api.ts              # Backend /v1 API calls + errors
│   │   ├── storage.ts          # MMKV local storage
│   │   └── location.ts         # GPS handling
│   │
│   ├── stores/
│   │   ├── aqiStore.ts         # AQI state (Zustand)
│   │   ├── settingsStore.ts    # User settings
│   │   └── offlineStore.ts     # Cached data
│   │
│   ├── i18n/
│   │   ├── index.ts            # i18n setup
│   │   └── *.json              # Translation files
│   │
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navigation setup
│   │
│   └── utils/
│       ├── aqi.ts              # AQI calculations
│       └── constants.ts        # App constants
│
└── assets/
    └── icons/                  # App icons
```

---

## Dependencies (Minimal)

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/bottom-tabs": "^6.0.0",
    "zustand": "^4.5.0",
    "react-native-mmkv": "^2.11.0",
    "expo-location": "~16.0.0"
  }
}
```

**Total dependencies**: ~6 (keep minimal for small APK)

---

## Screens Overview

### HomeScreen
- Large AQI number with color
- Health advice text
- Location name
- Last updated time
- Refresh button

### MapScreen
- Simple map view
- Tap to select location
- Current location button
- Saved locations

### SearchScreen
- Search input
- Recent searches
- Popular cities list
- Offline-capable

### SettingsScreen
- Language picker (35+ languages)
- Theme toggle (dark/light)
- Notifications toggle
- About section

---

## Offline Strategy

### Pre-cached Data
- 500 African cities with coordinates
- Last known AQI for each
- All translation files

### Storage
- MMKV for fast key-value storage
- ~5MB total cached data
- Auto-sync when online

---

## Build Commands

```bash
# Development
npx expo start

# Local APK build (FREE)
npx expo run:android --variant release

# Or generate unsigned APK for testing
npx expo build:android -t apk
```

---

## Target Specs

| Spec | Target |
|------|--------|
| Min Android | API 21 (5.0) |
| APK size | < 15 MB |
| Startup time | < 3 seconds |
| Offline | Full functionality |
| Languages | 35+ |
