# Mframapa Mobile App

**Status**: Scaffold ready; implementation targets **`SPEC.md` Weeks 13–14**.  
**Framework**: React Native (Expo)  
**Distribution**: Free channels — see **`../docs/STORES.md`** (minimum **two** paths by Week 14).

## Directory Structure

```
mobile/
├── README.md           # This file
├── SCAFFOLD.md         # Detailed scaffold documentation
├── src/
│   ├── screens/        # App screens (Home, Map, Settings, etc.)
│   ├── components/     # Reusable UI components
│   ├── services/       # API, offline, notifications
│   ├── stores/         # State management (Zustand)
│   └── i18n/           # 35+ language translations
└── assets/
    ├── icons/          # App icons, AQI indicators
    └── fonts/          # (using system fonts to reduce size)
```

## Quick Start (When Ready to Build)

```bash
# Install Expo CLI
npm install -g expo-cli

# Initialize project
npx create-expo-app@latest mframapa-app --template blank-typescript

# Install dependencies
npm install zustand react-native-mmkv @react-navigation/native

# Start development
npx expo start
```

## Build Commands

```bash
# Local APK build (FREE - no EAS account needed)
npx expo run:android --variant release

# Or use EAS for cloud builds (has free tier)
eas build --platform android --profile preview
```

## Target Specifications

| Spec | Target |
|------|--------|
| APK Size | < 15 MB |
| Min Android | API 21 (Android 5.0) |
| Offline | Full functionality |
| Languages | 35+ African languages |
| Battery | Minimal background usage |

## Distribution Channels

All FREE:
- PWA (primary for iOS users)
- Samsung Galaxy Store
- Huawei AppGallery  
- Amazon Appstore
- Direct APK download
- F-Droid (open source)

See **`../docs/STORES.md`** for submission steps and the 16-week timeline.
