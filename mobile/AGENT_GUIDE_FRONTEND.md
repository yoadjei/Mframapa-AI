# Mframapa AI v2.0: Frontend & Mobile Super Prompt for AI Agents

**CONTEXT:** You are an autonomous AI coding assistant. This is the **ULTIMATE SYSTEM PROMPT AND REFERENCE** for the Client-side Applications (PWA and Mobile) of Mframapa AI v2.0. Do not invent UI patterns, do not guess API endpoints, and do not deviate from these constraints. 

The frontend and backend agents are working in parallel. Every offline behavior, API call, and App Store requirement described here MUST be strictly adhered to.

---

## 1. STRATEGY & APP STORE DISTRIBUTION
*   **Mission:** Deliver episodic alerts (Harmattan onset, dust) and city-scale predictions. Skip the $99/yr Apple App Store. The iOS experience is purely the PWA. The Android app targets the 88% African smartphone market via Free stores.
*   **Free for Individuals:** The Paywall (`PaywallScreen.tsx`) is ONLY for institutional data (heatmaps, batch CSV exports). Individual AQI/alerts are free.
*   **The 4 Distribution Channels (MUST EXECUTE ALL 4):**
    1.  **PWA (Vercel/Cloudflare):** `manifest.json` standalone mode, iOS Apple Touch Icons.
    2.  **Samsung Galaxy Store:** Reaches 31%. Requires 512x512 icon, 1080x1920 screenshots (4+), 1024x500 feature graphic.
    3.  **Huawei AppGallery:** Reaches 15%. No Google Mobile Services required. Needs Huawei developer identity verification.
    4.  **Direct APK / GitHub Releases:** Hosted on the PWA frontend. Create a download page with SHA-256 checksum and "Allow Unknown Sources" tutorial.

---

## 2. THE STRICT API CONTRACT & OFFLINE SYNC
Your Axios client (`mobile/src/services/api.ts` and `frontend-pwa/src/services/api.js`) MUST expect this JSON from `GET /api/v1/predict`:
```json
{
  "pm25": 42.5,
  "aqi_category": "Unhealthy for Sensitive Groups",
  "factors": {"aerosol_optical_depth": 0.45, "population_density": 450, "elevation": 120},
  "weather": {"temp": 32.1, "humidity": 45.0, "wind": 4.2},
  "uncertainty": {"pm25_lower": 35.0, "pm25_upper": 50.0, "half_width": 7.5},
  "location": {"name": "Accra", "lat": 5.60, "lon": -0.18}
}
```

*   **Offline Fallback:** Mobile uses `src/data/africanCities.ts` (~45KB, 500+ cities). If `NetInfo` detects no connection, search queries map locally to this file, and predictions load from AsyncStorage (`useStore.predictionHistory`).
*   **Push Notifications:** Mobile Expo push tokens and PWA Web Push tokens MUST be sent via `POST /api/v1/register-push-token` with `{ "token": "...", "platform": "android|web", "lat": 5.6, "lon": -0.1 }`. 
*   **27 Languages:** Translations live in `src/locales/`. If a string is missing, Axios hits `POST /api/v1/translate`.

---

## 3. EXACT DIRECTORY STRUCTURE & FILE MAP
Create or modify these exact files. Do not reorganize.

### Mobile App (`mobile/`)
*   `App.tsx` — Root shell. Initializes Zustand hydration and Expo Background tasks.
*   `app.json` / `app.config.js` — Loads `EXPO_PUBLIC_API_URL` (Use `http://10.0.2.2:8000` for Android emulator local dev, `https://api.mframapa.ai` for prod) and `EXPO_PUBLIC_MAPBOX_TOKEN`.
*   `eas.json` — Expo Application Services config for Android release APK builds.
*   `src/screens/onboarding/` — `SplashScreen.tsx`, `PermissionsScreen.tsx` (Critical: ask for Push/Location here).
*   `src/screens/system/` — `OfflineCityPickerScreen.tsx` (Loaded when NetInfo is false).
*   `src/screens/` (Core) — `HomeScreen.tsx`, `MapScreen.tsx` (Contains Mapbox WebView), `AlertsScreen.tsx`.
*   `src/screens/` (Pro/Deep-Dive) — `HistoricalPlaybackScreen.tsx`, `CompareCitiesScreen.tsx`.
*   `src/screens/` (Monetization) — `PaywallScreen.tsx` (For institutions/researchers), `PaystackCheckoutScreen.tsx`.
*   `src/components/charts/` — Uncertainty bounds visualizers (SVG).
*   `src/components/navigation/` — Glassmorphic bottom tab bar (`expo-blur`).
*   `src/services/api.ts` — Axios configured to append `EXPO_PUBLIC_API_KEY` (Internal key, e.g., `mframapa-internal-dev-key`).
*   `src/store/useStore.ts` — Zustand store. Keys: `themeMode`, `language`, `lastPrediction`, `predictionHistory` (cap at 20, dedupe lat/lon +- 0.01).
*   `src/data/africanCities.ts` — The 500+ offline cities bundle.

### Frontend PWA (`frontend-pwa/`)
*   `vite.config.js` — Must use `vite-plugin-pwa` with Workbox (CacheFirst for assets, NetworkFirst for `/api/*`).
*   `tailwind.config.js` — UI design tokens matching the Mobile theme.
*   `public/manifest.json` — PWA manifest (Icons, standalone mode, Apple Touch configurations).
*   `src/pages/DownloadPage.jsx` — The Direct APK download portal with SHA-256 instructions.

---

## 4. MOBILE BUILD & APK SIGNING (CRITICAL)
Agent, to distribute to the 3 Android stores (Samsung, Huawei, Direct APK), the APK must be < 15MB and signed.
1.  **Generate Keystore (Run once and save output):**
    `keytool -genkey -v -keystore mframapa-release.keystore -alias mframapa -keyalg RSA -keysize 2048 -validity 10000`
2.  **Optimize Size:** Ensure ProGuard/Hermes is enabled in `app.json`. Strip unused fonts. Compress SVGs.
3.  **Local Release Build (Free):**
    `npx expo run:android --variant release`
    *(Outputs APK to `android/app/build/outputs/apk/release/`)*

## 5. EXACT COMMANDS & WORKFLOWS
*   **Run Mobile Dev Server:** `cd mobile && npx expo start --android` (Ensure you set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000` if testing against local backend).
*   **Run PWA Dev Server:** `cd frontend-pwa && npm run dev` (Ensure Vite proxies `/api` to `http://127.0.0.1:8000`).

---

## 6. SUCCESS METRICS & DEFINITION OF DONE
An agent's task is only complete when it meets these exact quantifiable thresholds:

1. **PWA Lighthouse Score:** Must be **> 90** across Performance, Accessibility, Best Practices, and SEO.
2. **APK Size Limit:** The generated Android Release APK must be strictly **< 15 MB**.
3. **App Startup Performance:** The app must render the HomeScreen in **< 2 seconds** from a cold start on a mid-range Android device.
4. **Offline Capability (100%):** The app must allow searching the 500+ pre-bundled African cities and loading cached historical predictions while the device's Wifi/Data is turned completely off.
5. **Distribution Target:** Successfully submitted and live on at least **2 out of 3** free stores (Samsung Galaxy Store, Huawei AppGallery, Direct APK) by the end of September.
6. **Framerate:** The Mapbox WebView and glassmorphic UI tabs must maintain **60fps** scrolling without dropping frames.

---

## 7. EXACT IMPLEMENTATION SPECS (P0 CODE EXPECTATIONS)

### 1. Mobile App Scaffold Recovery (`mobile/`)
The `mobile/` directory is currently missing/deleted from the repository. You must restore it from scratch following these strict guidelines:
*   **Initialization:** Run `npx create-expo-app@latest mobile -t expo-template-blank-typescript`.
*   **Mandatory Dependencies:** You must install `@react-navigation/native`, `@react-navigation/bottom-tabs`, `zustand`, `react-native-mmkv` (or `@react-native-async-storage/async-storage`), `axios`, and `expo-blur` immediately.
*   **Folder Structure Sync:** You must recreate the exact folder structure defined in Section 2 (`src/screens/`, `src/store/`, `src/navigation/`, etc.) before beginning any feature work.

### 2. Dynamic Native Translation System (No Static LLM Dumps)
Static dictionaries translated by Gemini sound robotic. You must implement an Over-The-Air (OTA) sync system:
*   **OTA Dictionaries:** The mobile app must fetch the dictionary from `GET /api/v1/translations/sync` on startup in the background, cache it in MMKV, and use `i18next` to map the UI. If offline, gracefully use the last cached version.
*   **Community Corrections:** Build a `CommunityHubScreen.tsx` where native speakers can highlight a robotic translation and submit a natural correction via `POST /api/v1/translations/suggest`.

### 3. Graceful Rate Limiting
If the backend returns a `429 Too Many Requests`, it will include a `Retry-After` header. Do not just show a generic error. Capture the header, disable the refresh button, and show a visual countdown timer to the user.
