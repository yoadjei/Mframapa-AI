# QA Report — PWA vs Mobile (iOS) Parity Differences

**Prepared by:** QA
**Date:** 2026-07-26
**Convention in this doc:** For every pair, the **PWA** screenshot is described first, then the **iOS (mobile)** screenshot.

## Source-of-truth rule (read before fixing)

- **Pair 1 (City Detail) is the exception:** the **mobile** app has the newer/better version. **Update the PWA to match mobile** here.
- **Every other pair:** the **PWA** has the latest updates. **Update the mobile app to match the PWA.**
- Do not change data values that are obviously just test-account state (e.g. Free vs Pro tier, different demo emails, PM2.5 18 vs 22). Those are flagged as "data only", not defects.

---

## Pair 1 — City Detail  *(exception: PWA should adopt mobile's version)*

**Screens:** PWA `frontend-pwa/src/features/cityDetail/CityDetailScreen.jsx` · Mobile `mobile/src/screens/CityDetailScreen.tsx`

What mobile has that the PWA is missing (bring these INTO the PWA):

1. **"Contributing factors" section** — mobile lists *Population Density* and *Elevation*. The PWA has no contributing-factors block. Add it to the PWA.
2. **"View health risk breakdown ›" link** — mobile has a link into the Health Risk screen. The PWA does not. Add it to the PWA.
3. **Tighter estimated range** — mobile shows `Estimated range: 12–33 µg/m³`; PWA shows a generic `0–40 µg/m³`. Adopt the tighter, model-driven range on the PWA.

QA notes / do NOT copy blindly (these are mobile-side bugs, keep the PWA's correct behaviour):

- Mobile's weather tiles read **0°C / 0% / 0km/h** — weather is not loading on the mobile City Detail screen. The **PWA's real values (28°C / 76% / 9km/h) are correct.** Keep the PWA weather; separately fix the mobile weather fetch.
- Mobile's AI Insight is stuck on **"Generating insight for this city…"** (spinner never resolves). Do not port that state; the PWA insight renders fine.

---

## Pair 2 — Home

**Screens:** PWA `frontend-pwa/src/features/home/HomeScreen.jsx` · Mobile `mobile/src/screens/HomeScreen.tsx`
**Direction:** update mobile to match PWA.

Missing on mobile (present on PWA):

1. **"WHAT TO DO" guidance card** — PWA shows *"Air quality is fair. Sensitive people may prefer indoor exercise."* Mobile has no equivalent card. Add it.
2. **"DID YOU KNOW" tip card** — PWA shows *"Living close to an unpaved road usually means more dust indoors, especially in the dry season."* Missing on mobile. Add it.
3. **Weather tiles row** — PWA shows Humidity 76% / Wind 8.6 m/s / Temperature 28°C at the bottom. Mobile has no weather tiles on Home. Add them.
4. **Notification bell unread badge** — PWA bell shows a red "1" unread badge; mobile bell has no badge. Add the unread-count badge on mobile.

Extra on mobile that PWA does not have (remove/align to PWA):

5. **"AQI LEVEL" card and "MAIN POLLUTANT PM2.5" card** — these two cards exist only on mobile. PWA does not show them. Remove them (or fold into the hero) to match PWA layout.

Label / branding mismatches:

6. **Hero card header label** — PWA hero is titled **"AIR RIGHT NOW"**; mobile hero is titled **"PM2.5"**. Change mobile to "AIR RIGHT NOW".
7. **Header logo** — the PWA Home header now shows the **cloud-rain icon only**. Mobile still shows the **cloud-rain icon + "Mframapa" wordmark**. Remove the "Mframapa" text on mobile so the Home header is icon-only, matching the PWA.

---

## Pair 3 — Notifications

**Screens:** PWA `frontend-pwa/src/features/notifications/NotificationsScreen.jsx` · Mobile notifications sheet (`mobile/src/screens/AlertsScreen.tsx` / notifications component)
**Direction:** update mobile to match PWA.

Toggles and categories are identical (All notifications, Air quality alerts, Daily summaries, Air quality updates, Tips and guidance). One difference:

1. **Empty-state copy** — PWA says **"Nothing unread"**; mobile says **"No unread notifications"**. Change mobile to **"Nothing unread"** to match PWA.

---

## Pair 4 — Profile

**Screens:** PWA `frontend-pwa/src/features/profile/ProfileScreen.jsx` · Mobile `mobile/src/screens/ProfileScreen.tsx`
**Direction:** update mobile to match PWA.

1. **Product links are missing from the mobile Profile screen.** PWA lists them all inline as rows: *Settings, Saved Locations, Activity Feed, AI Insights, Prediction Dashboard, Country Explorer, Compare Cities, Trust & Transparency, About & Legal.* On mobile the Profile screen only shows **Settings** + the Account card, because the rest were moved into the "+" menu (`mobile/src/navigation/profileMenuItems.ts` → `MORE_MENU_ITEMS`). **Restore all these links inline on the mobile Profile screen** so it matches the PWA. (See Pair 6 — the "+" menu should be brought back in line with PWA too.)
2. **Missing helper text** — PWA shows *"These come from your account and cannot be changed here."* under the email field. Mobile does not. Add it.
3. **Data only (not a defect):** Account Tier Free (PWA) vs Pro (mobile), and different demo emails (opokudavis141@gmail.com vs kofi.antwi@email.com). These are just the accounts each was signed into.

---

## Pair 5 — Account card (Sign out / Delete account)

**Screens:** Account section of the Profile screens above (PWA `ProfileScreen.jsx` · Mobile `ProfileScreen.tsx`)
**Direction:** update mobile to match PWA.

1. **"Sign out" icon missing on mobile.** PWA shows a logout (arrow-out) icon to the left of the "Sign out" label; mobile has the label with no icon. Add the sign-out icon on mobile. "Delete account" matches on both.

---

## Pair 6 — "+" Quick-action menu (FAB)

**Screens:** PWA FAB menu (rendered from `HomeScreen.jsx` / core layout) · Mobile FAB menu (`mobile/src/navigation/AppNavigator.tsx` + `mobile/src/navigation/profileMenuItems.ts`)
**Direction:** update mobile to match PWA.

1. **The "+" menus contain completely different items.**
   - PWA "+" shows: **Search, Alerts, Activity, Settings** (each with an icon).
   - Mobile "+" shows: **Saved Locations, Activity Feed, AI Insights, Prediction Dashboard, Country Explorer, Compare Cities, Trust & Transparency, Export Centre** (no icons, chevron rows).
   - **Fix:** change the mobile "+" menu to the PWA set — *Search, Alerts, Activity, Settings* — and move the product screens back onto the Profile screen (see Pair 4). This is one connected change: mobile currently uses the "+" as a product-screen drawer, whereas the PWA keeps product screens on Profile and uses "+" for quick actions.
2. **Missing icons** — PWA "+" items each have a leading icon (magnifier / bell / activity pulse / gear). Mobile "+" rows have no leading icons. Add icons to match.

---

## Pair 7 — Settings

**Screens:** PWA `frontend-pwa/src/features/settings/SettingsScreen.jsx` · Mobile `mobile/src/screens/SettingsScreen.tsx`
**Direction:** update mobile to match PWA.

1. **Missing ACCESSIBILITY section on mobile.** PWA has an **Accessibility → Text size** control with options **Normal / Large / Larger** and the subtitle *"Makes all text in the app bigger."* Mobile has no Accessibility section at all. Add it.
2. **Data Analytics default differs** — PWA toggle is **ON**, mobile toggle is **OFF**. Confirm the intended default and align mobile to PWA (ON) unless product says otherwise.

All other Settings rows match: Theme (Light/Dark/System), Language (English), Enable Alerts, Location Sharing (Balanced), Lite mode (off).

---

## Quick fix checklist (for the agent)

**Update PWA (Pair 1 only):**
- [ ] City Detail: add "Contributing factors" (Population Density, Elevation)
- [ ] City Detail: add "View health risk breakdown ›" link
- [ ] City Detail: use tighter model estimated range (e.g. 12–33) instead of 0–40

**Update mobile to match PWA (Pairs 2–7):**
- [ ] Home: add "WHAT TO DO" card
- [ ] Home: add "DID YOU KNOW" card
- [ ] Home: add weather tiles (Humidity / Wind / Temperature)
- [ ] Home: add unread badge on the notification bell
- [ ] Home: remove "AQI LEVEL" + "MAIN POLLUTANT" cards
- [ ] Home: rename hero header from "PM2.5" to "AIR RIGHT NOW"
- [ ] Home: make the header logo icon-only (remove "Mframapa" wordmark) to match PWA
- [ ] Notifications: change empty state to "Nothing unread"
- [ ] Profile: restore inline product links (Saved Locations, Activity Feed, AI Insights, Prediction Dashboard, Country Explorer, Compare Cities, Trust & Transparency, About & Legal)
- [ ] Profile: add "These come from your account and cannot be changed here." helper text
- [ ] Profile: add logout icon next to "Sign out"
- [ ] "+" menu: change items to Search / Alerts / Activity / Settings (with icons)
- [ ] Settings: add Accessibility → Text size (Normal / Large / Larger)
- [ ] Settings: confirm Data Analytics default (PWA is ON)

**Separately fix on mobile (bugs surfaced during this review — not parity items):**
- [ ] City Detail weather loading returns 0°C / 0% / 0km/h
- [ ] City Detail AI Insight stuck on "Generating insight for this city…"
