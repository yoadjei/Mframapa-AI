# Frontend PWA — Architecture & Structure

**Stack**: React 18 + Vite + Tailwind CSS
**API**: Proxies `/api` → `localhost:8000` in dev (see `vite.config.js`)
**PWA**: Custom service worker + manifest.json for installability and offline support

---

## Directory Layout

```
frontend-pwa/
├── index.html                      # App shell + PWA meta tags
├── vite.config.js                  # Vite config + PWA plugin + API proxy
├── tailwind.config.js              # Tailwind theme tokens
├── package.json
│
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── sw.js                       # Service worker (cache strategies)
│   ├── favicon.svg
│   ├── icons/
│   │   └── mframapa logo.png       # App icon
│   └── city-packs/
│       └── top-cities.v1.json      # Pre-cached city data (~27 KB)
│
└── src/
    ├── main.jsx                    # Entry point — renders App, registers SW
    ├── index.css                   # Global styles + Tailwind base
    │
    ├── app/
    │   └── App.jsx                 # Root component (routing, auth, screen dispatch)
    │
    ├── features/                   # Feature-based screen modules
    │   ├── home/
    │   │   └── HomeScreen.jsx      # Dashboard / main AQI display
    │   ├── core/
    │   │   ├── CoreFeatureScreen.jsx # Detailed AQI + map view
    │   │   └── MapCanvas.jsx       # Map rendering component
    │   ├── search/
    │   │   └── SearchScreen.jsx    # City search + discovery
    │   ├── auth/
    │   │   └── AuthScreen.jsx      # Login / signup
    │   ├── onboarding/
    │   │   └── OnboardingScreen.jsx # First-time user flow
    │   ├── activity/
    │   │   └── ActivityScreen.jsx  # Activity feed / history
    │   ├── notifications/
    │   │   └── NotificationsScreen.jsx
    │   ├── profile/
    │   │   └── ProfileScreen.jsx
    │   └── settings/
    │       └── SettingsScreen.jsx
    │
    ├── components/                 # Shared UI components
    │   ├── feedback/
    │   │   ├── NetworkBanner.jsx   # Online/offline status banner
    │   │   └── StateMessage.jsx    # Empty/error/loading states
    │   ├── layout/
    │   │   └── MobileShell.jsx     # App shell (header + bottom nav + content)
    │   └── navigation/
    │       └── BottomNav.jsx       # Bottom tab navigation
    │
    ├── services/                   # API + data services
    │   ├── api.js                  # Axios client (legacy, direct /api calls)
    │   ├── httpClient.js           # Configured Axios instance
    │   ├── authService.js          # Authentication service
    │   ├── predictionService.js    # AQI prediction API calls
    │   └── cityPackService.js      # Offline city pack loading
    │
    ├── state/
    │   └── appState.jsx            # Global state (React context + useReducer)
    │
    ├── hooks/
    │   ├── useCityPack.js          # Load/cache city pack data
    │   ├── useInstallPrompt.js     # PWA install prompt handling
    │   └── useOnlineStatus.js      # Online/offline detection
    │
    ├── data/
    │   └── africanCities.js        # 500+ African cities with coordinates (~20 KB)
    │
    ├── locales/                    # 28 translation files
    │   ├── en.json                 # English (baseline)
    │   ├── fr.json                 # French
    │   ├── sw.json                 # Swahili
    │   ├── ha.json                 # Hausa
    │   ├── yo.json                 # Yoruba
    │   ├── am.json                 # Amharic
    │   ├── ar.json                 # Arabic
    │   ├── tw.json                 # Twi
    │   └── ... (20 more languages)
    │
    └── pwa/
        └── registerServiceWorker.js # SW registration on app load
```

---

## App Architecture

### Screen Routing

`App.jsx` uses a simple screen dispatch pattern (no React Router):

```
onboardingComplete=false  →  OnboardingScreen
session.authenticated=false  →  AuthScreen
authenticated=true  →  MobileShell + ActiveScreen (from ui.activeScreen state)
```

Active screens: `home`, `core`, `activity`, `search`, `notifications`, `profile`, `settings`

### State Management

Single `AppStateProvider` using React context + `useReducer`:
- `onboardingComplete` — persisted to localStorage
- `session` — auth state
- `ui.activeScreen` — current screen key

### Service Layer

- `httpClient.js` — configured Axios instance with base URL
- `predictionService.js` — `getPrediction(lat, lon, name, day)` → backend `/api/v1/predict`
- `cityPackService.js` — loads `top-cities.v1.json` for offline city search
- `authService.js` — login/register/session management

---

## Service Worker Strategy

### Cache First (Static Assets)
- HTML, CSS, JS bundles
- Images and icons
- Font files

### Network First (API)
- `/api/*` endpoints
- 10 second timeout, falls back to cached response
- 6 hour stale cache, 50 entry cap

### Pre-cache (On Install)
- City pack data (`top-cities.v1.json`)
- All translation JSON files
- Core app shell

---

## Offline Indicators

### When Offline
- `NetworkBanner` shows "You're offline — showing cached data"
- Last updated timestamp visible
- Refresh operations disabled

### When Back Online
- Banner updates to "Back online — refreshing..."
- Auto-refresh active data
- Banner dismisses after sync

---

## Development

```bash
cd frontend-pwa
npm install
npm run dev          # Vite dev server (proxies /api → localhost:8000)
npm run build        # Production build
npm run lint         # ESLint
npm run preview      # Preview production build
```

**Proxy config** (in `vite.config.js`): All `/api` requests are forwarded to `http://127.0.0.1:8000` during development.
