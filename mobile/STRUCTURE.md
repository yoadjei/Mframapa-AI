# Mobile App — Architecture

**Framework**: React Native (Expo) + TypeScript
**Build**: Local release APK (free — no EAS account required)
**Distribution**: ≥ **two** channels by **`SPEC.md` Week 14** — Samsung + (Huawei **or** Amazon **or** GitHub Releases APK)
**API**: Backend **`/v1`** base URL, same contract as PWA; honours **rate limits** and **API keys**

---

## Architecture Overview

```
App.tsx (root)
  └── AppNavigator.tsx (bottom tabs)
        ├── HomeScreen      — Main AQI display with AQICard, AQIGauge, HealthAdvice
        ├── MapScreen       — Interactive map with location picker
        ├── SearchScreen    — City search, recent searches, offline-capable
        ├── AlertsScreen    — Notification history
        └── SettingsScreen  — Language, theme, notifications, about
```

### State Management

Single Zustand store (`store/useStore.ts`) persisted to MMKV:
- Theme (dark/light), language, last prediction, prediction history (20 cap), offline cities

### Data Flow

```
User action → useAQI hook → api.ts (Axios) → /api/v1/predict
                                            → Response: pm25, aqi_category, uncertainty, weather
                         → useStore (persist to MMKV)
                         → UI update (AQICard, AQIGauge, HealthAdvice)
```

### Offline Strategy

- `africanCities.ts` (~45 KB) — 500+ cities pre-bundled in the app
- MMKV stores last-known AQI for all viewed locations
- `useOffline` hook detects network state
- `OfflineBanner` component shows cached-data indicator
- Auto-sync when connectivity returns

---

## Key Design Decisions

### 1. System Fonts Only
- Uses Roboto (Android) / San Francisco (iOS) — no custom font bundles
- Reduces APK size

### 2. Lightweight Map
- Mapbox GL JS via `AfricaMapView` WebView (`EXPO_PUBLIC_MAPBOX_TOKEN`)
- No heavy commercial map SDKs

### 3. Minimal Dependencies
- Expo (managed workflow)
- Zustand (~1 KB) for state
- MMKV (~50 KB) for fast persistent storage
- React Navigation for routing
- Axios for HTTP

### 4. Single Store Pattern
- One Zustand store instead of multiple stores
- Cleaner persistence, simpler debugging
- MMKV middleware handles serialisation

---

## Theme System

`src/theme/index.ts` exports:
- `getColors(isDark)` — full color palette for dark/light themes
- `getAQIColor(category)` — semantic AQI colors (good → hazardous)
- `spacing` — 4px-based spacing scale
- `fontSize` — typography scale

---

## Screens Detail

### HomeScreen
- Large AQI number with category color
- AQI gauge (visual meter)
- Health advice text (localised)
- Weather strip (temperature, humidity, wind)
- Location name + last updated timestamp
- Pull-to-refresh

### MapScreen
- Interactive map view
- Tap to select location
- Current location button (GPS)
- Saved locations markers

### SearchScreen
- Text search input with debounce
- Recent searches (persisted)
- Popular cities list
- Offline-capable (searches `africanCities.ts`)

### AlertsScreen
- Push notification history
- AQI change alerts
- Severity indicators

### SettingsScreen
- Language picker (English, French)
- Theme toggle (dark/light)
- Notification preferences
- About section with version info

---

## Build Commands

```bash
# Development
npx expo start

# Local release APK (free, no cloud build)
npx expo run:android --variant release

# EAS cloud build (optional, has free tier)
eas build --platform android --profile preview
```

---

## Target Specs

| Spec | Target |
|------|--------|
| Min Android | API 21 (5.0) |
| APK size | < 15 MB |
| Startup time | < 3 seconds |
| Offline | Full functionality with cached data |
| Languages | English, French (extensible to more) |
