# Mframapa Mobile App — Technical Documentation & README

Detailed overview of the current implementation, codebase structure, and features of the React Native mobile application.

---

## 🛠️ Technology Stack
*   **Core Framework**: [React Native](https://reactnative.dev/) (Expo SDK 54) + [TypeScript](https://www.typescriptlang.org/)
*   **Navigation**: [@react-navigation/native](https://reactnavigation.org/) (Bottom Tab Navigator + Native Stack Navigator)
*   **Global State**: [Zustand](https://github.com/pmndrs/zustand)
*   **Persistent Storage**: [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) (Persisted via Zustand middleware, initialized for 500+ offline-capable African cities and caching local prediction results)
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Auth Integration**: [Supabase Auth](https://supabase.com/docs/guides/auth)
*   **Monetization**: [Paystack](https://paystack.com/) Payment Gateway (integrated via WebViews)
*   **Map Integration**: Mapbox GL JS embedded inside a WebView wrapper (`AfricaMapView.tsx`) using `EXPO_PUBLIC_MAPBOX_TOKEN`
*   **UI/Visuals**: Expo Blur (`expo-blur`), Linear Gradient (`expo-linear-gradient`), custom glassmorphic tab bars, SVG visuals (`react-native-svg`), and dynamic background overlays.

---

## 📂 Directory Structure

```
mobile/
├── App.tsx                   # Root shell component, wraps AppNavigator, registers background & bootstrap logic
├── app.config.js             # Native Expo configuration (Bundle IDs, icons, plugins)
├── app.config.js             # Dynamic configuration (loads .env, translates local IP for devices, configures iOS personal provisioning)
├── package.json              # Scripts, dependencies, and type definitions
├── tsconfig.json             # TypeScript rules and compiler configuration
├── babel.config.js           # Babel preset loader
├── eas.json                  # EAS Build Profiles configuration
└── src/
    ├── screens/              # 40 application screens structured by domain
    │   ├── onboarding/       # Sign-up, login, permissions, and intros
    │   ├── system/           # Fallback cities, force update, system share, and errors
    │   └── [screens].tsx     # Main application and settings screens
    ├── components/           # Reuseable UI elements, maps, forms, and charts
    │   ├── charts/           # Prediction line charts and uncertainty waves
    │   ├── navigation/       # Custom Glassmorphic tab navigation bar
    │   ├── ui/               # Primary UI toolkit (buttons, badges, inputs, lists)
    │   └── [components].tsx  # Main interactive components (AQICard, HealthAdvice, etc.)
    ├── services/             # API clients, offline data synchronizers, and auth managers
    ├── store/                # Zustand global state definition and persistence configuration
    ├── navigation/           # AppNavigator declaration with tab/stack configurations
    ├── theme/                # Universal design system (colors, scales, spacings, AQI colors)
    ├── hooks/                # Custom React hooks (location, translations, network status, etc.)
    ├── locales/              # Localized strings file for 27 African & international languages
    ├── data/                 # Static GeoJSON mapping, pre-bundled African cities index
    ├── content/              # Legal agreements, policies, and transparency documents
    └── utils/                # AQI scales, helper formatters, pricing definitions, coordinates
```

---

## 📱 Screens Directory (40 Screens)

The application flow comprises 40 functional screens organized across six navigational categories:

### 1. Onboarding & Authentication Stack (`src/screens/onboarding/`)
*   `SplashScreen.tsx`: Renders the app branding during bootstrap initialization.
*   `OnboardingSlidesScreen.tsx`: Horizontal multi-slide walkthrough introducing Mframapa features.
*   `PermissionsScreen.tsx`: Prompts the user to allow core system permissions (Location, Push Notifications).
*   `AuthScreen.tsx`: Unified entry container for user accounts.
*   `LoginScreen.tsx`: Standard email/password authentication screen.
*   `SignUpScreen.tsx`: Sign-up screen capturing full name, email, and organization.
*   `ForgotPasswordScreen.tsx`: Flow to trigger email password resets.

### 2. Main Navigation Tab Stack (`src/navigation/AppNavigator.tsx`)
*   `HomeScreen.tsx`: Shows current local AQI, gauge, localized health recommendations, and current weather.
*   `MapScreen.tsx`: Visualizes air quality map pins across Africa using an interactive WebView map.
*   `SearchScreen.tsx`: Search bar for locating cities (both online and from bundled files).
*   `AlertsScreen.tsx`: Notifications log for severe AQI changes and tips.
*   `ProfileScreen.tsx`: Account profile dashboard, listing membership tiers, saved locations overview, and settings.

### 3. Detail & Deep-Dive Screens (`src/screens/`)
*   `CityDetailScreen.tsx`: Deep insights for a selected city: real-time PM2.5, conformal bounds, forecasts, and hourly weather metrics.
*   `HistoricalPlaybackScreen.tsx`: Slider navigation to playback AQI trends over historic intervals.
*   `PredictionDashboardScreen.tsx`: Focused forecasting analysis cards.
*   `AIInsightsScreen.tsx`: Generates a dynamic explanation of air quality indices and physical factors using Gemini integrations.
*   `CountryExplorerScreen.tsx`: Regional metrics comparisons across African borders.
*   `AfricaHeatmapScreen.tsx`: Full continental heatmap overview.
*   `CompareCitiesScreen.tsx`: Multi-city side-by-side air quality metrics visualizer.
*   `AnomalyAlertScreen.tsx`: Highlights anomalous readings (such as extreme sudden spikes).

### 4. Monetization & Checkout (`src/screens/`)
*   `PricingScreen.tsx`: Tier comparison dashboard displaying pricing plans.
*   `PaywallScreen.tsx`: High-impact overlay to prompt researchers or institutions to upgrade.
*   `SubscriptionScreen.tsx`: Explains current active subscription details, renewal periods, and trials.
*   `PaystackCheckoutScreen.tsx`: Checkout portal incorporating Paystack processing.

### 5. Settings, Profiles & Support (`src/screens/`)
*   `SavedLocationsScreen.tsx`: Lists starred cities for direct dashboard access.
*   `ActivityFeedScreen.tsx`: History log of user actions (e.g. city queries, subscription modifications).
*   `SettingsScreen.tsx`: Central configuration for toggling push alerts, default currency, and location precision.
*   `LanguageSelectorScreen.tsx`: Configures preferred translations.
*   `DeleteAccountScreen.tsx`: User profile deletion dialog.
*   `AboutLegalScreen.tsx`: Direct links to legal documentation.
*   `FeedbackFormScreen.tsx`: Form for filing issue reports or suggestions.
*   `TrustTransparencyScreen.tsx`: Discloses source materials, licenses, and AI model parameters.
*   `CommunityHubScreen.tsx`: Local crowdsourced citizen science forum.

### 6. System & Fallback Stack (`src/screens/system/`)
*   `ErrorScreen.tsx`: Catch-all display to prevent application crashes during structural exceptions.
*   `ForceUpdateScreen.tsx`: Blocking view to guide users to update when their client version is deprecated.
*   `OfflineCityPickerScreen.tsx`: Fallback city selector available during lack of internet access.
*   `ShareSheetScreen.tsx`: Social network and system share formatting.

---

## 🗃️ Global State (Zustand + AsyncStorage)

A centralized Zustand store handles application state persistence (`src/store/useStore.ts`) with custom migration logic:
*   `themeMode`: System / Dark / Light theme.
*   `language`: Active locale key.
*   `isAuthenticated`: Controls Onboarding/App routing stacks.
*   `profile`: Object capturing user information (email, tier, initials, etc.).
*   `lastPrediction`: Most recent successfully queried prediction result.
*   `predictionHistory`: Capped array of the last 20 queries, auto-deduplicated by coordinates ($\pm 0.01^\circ$ lat/lon variance).
*   `savedLocations`: Stored list of user-starred locations.
*   `notifications`: Cached notifications registry.
*   `activityFeed`: Automatically pushes logs of actions to track app usage.
*   `offlineCities`: Stores pre-bundled list of cities.
*   `subscriptionPlan` & `trial`: Tracks trials (7-day duration), paystack reference, start dates, and activation structures.
*   `notifPrefs`: Slices controlling categories (alert, summary, updates, tips).
*   `locationSharing` & `liteMode`: Performance optimization options.

---

## 🗺️ Offline & Local Cache Design

1.  **Static Data Bundle**: `africanCities.ts` (~45 KB) contains over 500 cities and coordinates. It is indexed and loaded into the local search index at boot time.
2.  **Network State Detection**: Leverages NetInfo inside `useOffline` to dynamically swap headers, display the `OfflineBanner`, and switch API requests to local cache readouts.
3.  **Local Storage**: AsyncStorage is used to cache both location indexes and recent prediction responses, avoiding network roundtrips for previously visited cities.

---

## 🌍 Extensive Localization (27 Languages)

The app offers comprehensive support for native African and international languages configured under `src/locales/`:
*   **Major African Languages**: Swahili (`sw`), Yoruba (`yo`), Hausa (`ha`), Amharic (`am`), Afrikaans (`af`), Igbo (`ig`), Malagasy (`mg`), Shona (`sn`), Zulu (`zu`), Somali (`so`), Wolof (`wo`), Xhosa (`xh`), Twi (`tw`), Zulu (`zu`), Northern Ndebele (`nd`), Kinyarwanda (`rw`), Kirundi (`rn`), Sesotho (`st`), Setswana (`tn`), Tigrinya (`ti`), SiSwati (`ss`), Chichewa (`ny`).
*   **International Languages**: English (`en`), French (`fr`), Spanish (`es`), Portuguese (`pt`), Arabic (`ar`).

Translation is managed via the `useTranslation` hook, which falls back to translating on-the-fly via `/api/v1/translate` (connected to a backend translator) when a string is missing in the local dictionary.

---

## 🔌 API Client Integration (`src/services/api.ts`)

Queries the backend at `/api/v1/` using the following endpoints:
*   `GET /api/v1/predict?lat=&lon=&name=`: Assembles air quality indicators, PM2.5, conformal limits, and weather forecasts.
*   `POST /api/v1/generate-insight`: Calls the ML translation/Gemini service to generate localized textual descriptions of air quality risks.
*   `POST /api/v1/translate`: Sends raw UI terms for translating on the fly when offline dictionaries lack matching entries.
*   `GET /api/v1/resolve-location?city=`: Geocodes typed text into physical coordinates.
*   `GET /api/v1/health`: Server health check.

---

## 💻 Development Commands

### Running Locally
```bash
cd mobile
npm install

# Start Expo dev server
npx expo start

# Run on Android emulator/device
npx expo start --android

# Run on iOS emulator/device
npx expo start --ios
```

### Local Build Releases (Free)
Generate a local standalone release APK without an EAS cloud account:
```bash
npx expo run:android --variant release
```
*(The resulting APK will be saved directly into `android/app/build/outputs/apk/release/`)*
