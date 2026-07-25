# Mframapa — full QA matrix (PWA · Android · iOS)

Authoritative test + fix reference. For each area: **what to check**, the exact
**PWA file**, the exact **mobile file** (Android + iOS share this — it is React
Native/Expo), and the **backend endpoint** it depends on. An agent can take any
row, reproduce it, and go straight to the file.

Legend:
- **PWA** = `frontend-pwa/src/…`
- **Mobile** = `mobile/src/…` (one codebase for Android and iOS)
- **API** = `backend/api/v1/router.py` route
- ⚠️ = known-fragile or recently rebuilt; test first

How to reproduce each platform:
- PWA: `cd frontend-pwa && npm run dev`, or the live site in a **private** window
  (avoids the service-worker cache).
- Android: `cd mobile && npx expo run:android` (Expo Go for UI only; map + push
  need a dev/EAS build).
- iOS: **Mac required** — `npx expo run:ios` or a TestFlight/EAS build.

---

## 0. Cross-cutting (check on every screen)

| Check | PWA | Mobile | Notes |
|---|---|---|---|
| No raw i18n keys visible (e.g. `notif_prefs.x`, `screen.y.z`) ⚠️ | `src/locales/en.json` + the screen | `src/locales/en.ts` + the screen | A raw key means it is referenced but missing from the locale |
| Back button does not cover the title ⚠️ | `src/app/App.jsx` (fixed back btn) + each screen header | native header | iOS Safari |
| Safe-area respected (status bar/notch/home indicator) ⚠️ | `env(safe-area-inset-*)` in each screen | `useSafeAreaInsets` | iOS especially |
| Screen fills the viewport, no dead space | `100dvh` not `100vh` | flex | iOS URL bar |
| Text scales with OS/large-text setting ⚠️ | rem units + `src/features/settings` | `allowFontScaling` | a11y |
| Light mode is readable (AQI colours) ⚠️ | `src/utils/colors.js` | `src/theme/colors.ts` | contrast |
| RTL for Arabic ⚠️ | `src/i18n/I18nProvider.jsx` | i18n layout | `ar` |
| No white screen on error ⚠️ | `src/components/feedback/AppErrorBoundary.jsx` | `src/components/AppErrorBoundary.tsx` | crash safety |

---

## 1. First launch / onboarding

| Check | PWA | Mobile | API |
|---|---|---|---|
| Splash: mark first, then wordmark wipes in | `src/features/onboarding/OnboardingScreen.jsx` | `src/screens/onboarding/SplashScreen.tsx` | — |
| Slides advance; **Back** returns to previous slide ⚠️ | same | `src/screens/onboarding/OnboardingSlidesScreen.tsx` | — |
| Dots are tappable | same | same | — |
| Location permission asked with a reason | `src/features/home/HomeScreen.jsx` | `src/screens/onboarding/PermissionsScreen.tsx` | — |
| No forced sign-in; reach app anonymously ⚠️ | `src/app/App.jsx` | `src/navigation/AppNavigator.tsx` | — |

---

## 2. Home

| Check | PWA | Mobile | API |
|---|---|---|---|
| Shows PM2.5 number + category + city | `src/features/home/HomeScreen.jsx` | `src/screens/HomeScreen.tsx` | `/predict` |
| Category has a **shape** next to colour ⚠️ | `src/utils/colors.js` `aqiSymbol` | `src/theme/colors.ts` `aqiSymbol` | — |
| "What to do" guidance shows | HomeScreen + `src/services/api.js` | HomeScreen + `src/services/api.ts` | `/generate-insight` |
| "Did you know" fact shows | HomeScreen `getDailyFact` | HomeScreen `getDailyFact` | `/daily-fact` |
| Same city refresh = **same** number ⚠️ | server snaps coords | server snaps coords | `/predict` (rounds lat/lon) |
| Denying location → **not blank** ⚠️ | HomeScreen `loadFallbackCity` | HomeScreen | `/predict` |
| No jargon (PM2.5/model/satellite as labels) ⚠️ | `src/locales/en.json` | `src/locales/en.ts` | — |
| **Tapping the reading opens its DETAIL, not the map** ⚠️ | HomeScreen line ~228 (`navigate("cityDetail")`) | `src/components/AQICard.tsx` | — |

---

## 3. Map

| Check | PWA | Mobile | API |
|---|---|---|---|
| Map renders (needs Mapbox token) | `src/features/core/CoreFeatureScreen.jsx` + `MapCanvas.jsx` | `src/screens/MapScreen.tsx` + `src/components/AfricaMapView.tsx` | — |
| Dots across **many countries**, not a few ⚠️ | CoreFeatureScreen (`summary.map`) | MapScreen (`summary.map`) | `/map-summary` |
| Every country has ≥1 dot ⚠️ | same | same | `/map-summary` (120 cities) |
| Dots are **different colours**, not all green ⚠️ | same | same | — |
| Tap a city → its reading | same | same | `/predict` |
| Search finds a city, moves map | CoreFeatureScreen | MapScreen + `src/services/mapboxGeocoding.ts` | `/resolve-location` |
| Blank map when token missing shows a fallback list | CoreFeatureScreen `NoCityListFallback` | MapScreen | — |

---

## 4. Auth — sign up → confirm → sign in ⚠️ (highest store risk)

| Check | PWA | Mobile | API/Service |
|---|---|---|---|
| Fields: first name, email, password, home city | `src/features/auth/AuthScreen.jsx` | `src/screens/onboarding/SignUpScreen.tsx` | — |
| City suggestions after **3 letters** | AuthScreen | `src/components/CityPicker.tsx` | — |
| Bad email rejected pre-submit | `src/utils/validators.js` | inline | — |
| Password < 8 rejected | validators.js | store | — |
| **Duplicate email → "already in use"** message ⚠️ | `src/services/authErrors.js` | `src/services/supabase.ts` | Supabase |
| Wrong password → clear message ⚠️ | authErrors.js | supabase.ts | — |
| After signup: "check your email" (not signed in) | AuthScreen + `src/services/authService.js` | SignUpScreen + `src/store/useStore.ts` | — |
| Confirmation email **arrives** ⚠️ | Supabase dashboard | same | Supabase SMTP/Resend |
| Email is themed, no "powered by Supabase" | `docs/deployment/email/*.html` | same | Supabase templates |
| Confirm link opens the app, **NOT localhost** ⚠️ | Supabase **Site URL** setting | same | Supabase URL config |
| **Sign in returns to Profile** ⚠️ | `src/state/appState.jsx` `LOGIN_SUCCESS` | AppNavigator | — |
| Profile shows **first name**, not email ⚠️ | `src/features/profile/ProfileScreen.jsx` | `src/screens/ProfileScreen.tsx` | — |
| Home opens on chosen home city | appState + HomeScreen | useStore + HomeScreen | `/predict` |

---

## 5. Forgot password ⚠️

| Check | PWA | Mobile | Service |
|---|---|---|---|
| Reset email **actually arrives** ⚠️ | `src/services/authService.js` `resetPassword` | `src/services/supabase.ts` | Supabase |
| Reset link works, sets new password | Supabase | same | — |
| Same message whether or not account exists | AuthScreen ForgotView | — | anti-enumeration |

---

## 6. Delete account ⚠️ (store-mandatory)

| Check | PWA | Mobile | API |
|---|---|---|---|
| Reachable when signed in | `src/features/deleteAccount/DeleteAccountScreen.jsx` | `src/screens/DeleteAccountScreen.tsx` | — |
| Requires typing DELETE | same | same | — |
| **Actually deletes** → signed out ⚠️ | `src/services/api.js` `deleteAccount` | `src/services/api.ts` | `DELETE /account` |
| Re-sign-in with same account **fails** ⚠️ | — | — | Supabase (needs `SUPABASE_SERVICE_ROLE_KEY` on server) |
| Failure shows a real error, not fake success ⚠️ | DeleteAccountScreen | DeleteAccountScreen | 502 path |
| **Grouped with Sign out** ⚠️ | ProfileScreen | ProfileScreen | — |

---

## 7. Sign out ⚠️

| Check | PWA | Mobile | — |
|---|---|---|---|
| Asks "are you sure?" first ⚠️ | `src/components/ui/ConfirmDialog.jsx` + ProfileScreen | `src/screens/ProfileScreen.tsx` (Alert) |
| Cancel keeps you in | same | same |
| Confirm signs out; app still works anon | same | same |

---

## 8. Feedback ⚠️

| Check | PWA | Mobile | API |
|---|---|---|---|
| Empty message refused | `src/features/feedback/FeedbackFormScreen.jsx` | `src/screens/FeedbackFormScreen.tsx` | — |
| Real message → success + **stored** ⚠️ | `src/services/api.js` `sendFeedback` | `src/services/api.ts` | `POST /feedback` |
| Failure shows real error | FeedbackFormScreen | FeedbackFormScreen | 502 path |

---

## 9. Notifications settings

| Check | PWA | Mobile | — |
|---|---|---|---|
| Category labels render (no raw keys) ⚠️ | `src/features/notifications/NotificationsScreen.jsx` + `en.json` | `src/components/NotificationSettingsSheet.tsx` + `en.ts` |
| Labels are sentence case, "and" not "&" | en.json | en.ts |
| Toggles persist | NotificationsScreen | useStore |
| Push permission asked in context (not on launch) | — | `src/services/notifications.ts` |

---

## 10. Settings

| Check | PWA | Mobile | — |
|---|---|---|---|
| Theme Light/Dark/System works | `src/features/settings/SettingsScreen.jsx` | `src/screens/SettingsScreen.tsx` |
| Language opens the picker (no placeholders) ⚠️ | `src/features/language/LanguageSelectorScreen.jsx` | `src/screens/LanguageSelectorScreen.tsx` |
| Text size Normal/Large/Larger scales all text ⚠️ | SettingsScreen + `src/index.css` | SettingsScreen |
| Lite mode disables animation | SettingsScreen + `src/components/background/MorphBackground.jsx` | SettingsScreen |
| Location sharing / analytics toggles persist | SettingsScreen + appState | SettingsScreen + useStore |

---

## 11. The menu screens (each must load, translate, and not overlap the title)

Each is a lazy stack screen on PWA; on iOS Safari a stale chunk makes them show
"This screen could not load" ⚠️ (see `docs/IOS_QA_FIXES.md` #5).

| Screen | PWA | Mobile | API |
|---|---|---|---|
| Saved Locations | `src/features/savedLocations/SavedLocationsScreen.jsx` | `src/screens/SavedLocationsScreen.tsx` | — |
| Activity Feed | `src/features/activity/ActivityScreen.jsx` | `src/screens/ActivityFeedScreen.tsx` | — |
| AI Insights | `src/features/aiInsights/AIInsightsScreen.jsx` | `src/screens/AIInsightsScreen.tsx` | `/generate-insight` |
| Prediction Dashboard | `src/features/predictionDashboard/PredictionDashboardScreen.jsx` | `src/screens/PredictionDashboardScreen.tsx` | `/forecast` |
| Country Explorer ⚠️ | `src/features/countryExplorer/CountryExplorerScreen.jsx` | `src/screens/CountryExplorerScreen.tsx` | `/predict` |
| Compare Cities | `src/features/compareCities/CompareCitiesScreen.jsx` | `src/screens/CompareCitiesScreen.tsx` | `/predict` |
| Trust & Transparency | `src/features/trust/TrustTransparencyScreen.jsx` | `src/screens/TrustTransparencyScreen.tsx` | — |
| Export Centre | `src/features/export/ExportCentreScreen.jsx` | `src/screens/ExportCentreScreen.tsx` | `/predict?format=csv` |
| About & Legal | `src/features/about/AboutLegalScreen.jsx` | `src/screens/AboutLegalScreen.tsx` | — |
| City Detail | `src/features/cityDetail/CityDetailScreen.jsx` | `src/screens/CityDetailScreen.tsx` | `/predict` + `/history` |
| Health Risk | `src/features/healthRisk/HealthRiskScreen.jsx` | `src/screens/HealthRiskScreen.tsx` | — |
| Anomaly Alert | `src/features/anomaly/AnomalyAlertScreen.jsx` | `src/screens/AnomalyAlertScreen.tsx` | — |

For each: (a) it loads, (b) no raw keys, (c) back button does not cover title,
(d) real data, no invented numbers, (e) works when signed out.

---

## 12. City Detail (has real data that used to be faked ⚠️)

| Check | PWA | Mobile | API |
|---|---|---|---|
| 7-day trend is **real history**, not multipliers ⚠️ | CityDetailScreen `getHistory` | CityDetailScreen `getHistory` | `/history` |
| No invented "Ghana EPA / 15% improved / hotspot" cards ⚠️ | CityDetailScreen | CityDetailScreen | — |
| Trend hidden when <2 days of data | same | same | — |

---

## 13. Export Centre

| Check | PWA | Mobile | API |
|---|---|---|---|
| CSV export produces a real file | `src/features/export/ExportCentreScreen.jsx` | `src/screens/ExportCentreScreen.tsx` | `/predict?format=csv` |
| Column headers are correct | same | same | — |

---

## 14. Offline / poor network

| Check | PWA | Mobile | — |
|---|---|---|---|
| Airplane mode → clear offline state, no crash | `src/hooks/useOnlineStatus.js` + `NetworkBanner.jsx` | `src/components/OfflineBanner.tsx` |
| Saved city still shows last reading | `src/services/cityPackService.js` | `src/services/offline.ts` |
| Back online recovers without restart | — | — |
| First load precache is small (fast on 3G) | `src/../vite.config.js` (473KB) | — |

---

## 15. Errors never white-screen ⚠️

| Check | PWA | Mobile | — |
|---|---|---|---|
| Thrown render → recovery screen with retry | `src/components/feedback/AppErrorBoundary.jsx` | `src/components/AppErrorBoundary.tsx` |
| Unhandled promise rejection logged/Sentry | `src/main.jsx` | `src/services/sentry.ts` |
| Lazy chunk fail recovers (reload once) ⚠️ | `src/app/App.jsx` `fallback` | n/a |

---

## 16. iOS-specific (Mac / TestFlight only)

| Check | File | — |
|---|---|---|
| Location prompt uses our wording | `mobile/app.config.js` `NSLocationWhenInUseUsageDescription` | ⚠️ |
| Privacy manifest present | `mobile/app.config.js` `privacyManifests` | store-mandatory |
| No unused permissions requested | `mobile/app.config.js` | — |
| Push works on a real build | `mobile/src/services/notifications.ts` | not Expo Go |
| Large text / rotation don't break layout | every screen | — |
| Safe-area on Profile header (tier pill under status bar) ⚠️ | `mobile` + `frontend-pwa/src/features/profile/ProfileScreen.jsx` | — |

---

## 17. Android-specific

| Check | File | — |
|---|---|---|
| `POST_NOTIFICATIONS` permission prompt (Android 13+) | `mobile/app.config.js` | — |
| Hardware back button pops the stack, not exits | `src/hooks/useHardwareBack.js` (PWA) / RN native (mobile) | — |
| Location permission flow | `mobile/src/services/location.ts` | — |
| Adaptive icon renders correctly | `mobile/app.config.js` `adaptiveIcon` | — |

---

## 18. Store-readiness spot checks

| Check | Where | — |
|---|---|---|
| `support@` and `privacy@` receive test mail | Cloudflare Email Routing | ⚠️ store review emails privacy@ |
| Privacy Policy + Terms open, themed | `frontend-pwa/public/{privacy,terms,licenses}.html` | — |
| Copy says "estimates", never "accurate readings" ⚠️ | all locales + listing | health-claim risk |
| Version in About matches build | `frontend-pwa/src/features/about/AboutLegalScreen.jsx` + `/version.json` | — |
| Data Safety / privacy labels filled | `docs/deployment/STORE_SUBMISSION.md` | — |

---

## 19. Backend (live E2E — no device needed)

Run against `https://api.mframapa.live/api/v1`:

| Endpoint | Expect | Route in `backend/api/v1/router.py` |
|---|---|---|
| `GET /health` | `models_loaded≥1, redis:true, auth:true` | `health` |
| `GET /predict?lat=6.69&lon=-1.62` | pm25 + category + uncertainty | `predict` |
| `GET /map-summary` | 120 cities | `map_summary` |
| `GET /forecast` | 4 days | `forecast` |
| `GET /history?days=7` | 7 days | `history` |
| `GET /daily-fact` | a fact | `daily_fact` |
| `POST /generate-insight` | guidance string | `generate_insight` |
| `DELETE /account` (no auth) | **401** not 404 ⚠️ | `delete_account` |
| `POST /feedback` | **200** not 404 ⚠️ | `submit_feedback` |
| `POST /batch-predict` (anon) | 401 | (mounted in app.py) |
| bad `lat=999` | 422 | validation |

---

## How to report a failure (so an agent can act on it)

For each miss give: **screen**, **platform**, **steps**, **expected**,
**actual**, **screenshot**, and — if known — the **file from the table above**.

Bad: "translations look off."
Good: "Settings → language Twi → Notifications screen (mobile
`src/components/NotificationSettingsSheet.tsx`): category rows still English."
