# iOS QA round — fixes to make

Found during real iOS testing of the **PWA** (the screenshots are the PWA in
iOS Safari — the "could not load" screen and the Profile menu are PWA-only).
Each item below has: the symptom, the root cause verified in the code, the
files to touch, the fix, which platforms it applies to, and a commit message.

Platforms: **PWA** = `frontend-pwa`, **iOS/Android** = `mobile` (React Native).
Most of these are PWA; where the same bug exists in `mobile`, it is marked.

Order is by severity. Do them top to bottom.

---

## 1. Notification settings show raw keys (`notif_prefs.*`) — CRITICAL

**Symptom:** the four category rows read `notif_prefs.air_quality_alerts`,
`notif_prefs.daily_summaries`, `notif_prefs.air_quality_updates`,
`notif_prefs.tips_and_guidance` instead of their labels.

**Root cause:** all ten `notif_prefs.*` keys are **referenced** in
`frontend-pwa/src/features/notifications/NotificationsScreen.jsx` but **none are
defined** in `frontend-pwa/src/locales/en.json`. (Mobile `en.ts` already has
them, so mobile is fine — but its translated bundles need the keys too.)

**Files:** `frontend-pwa/src/locales/en.json`

**Fix:** add these keys to `en.json`, then run the translation pipeline so the
other 27 bundles get them:
```json
"notif_prefs.title": "Notifications",
"notif_prefs.all_notifications": "All notifications",
"notif_prefs.all_notifications_explainer": "Turn off to stop receiving all in-app alerts.",
"notif_prefs.categories": "Categories",
"notif_prefs.air_quality_alerts": "Air quality alerts",
"notif_prefs.daily_summaries": "Daily summaries",
"notif_prefs.air_quality_updates": "Air quality updates",
"notif_prefs.tips_and_guidance": "Tips and guidance",
"notif_prefs.mark_count_as_read": "Mark {{count}} as read",
"notif_prefs.nothing_unread": "Nothing unread"
```
Then: `venv/Scripts/python -m ml.scripts.export_missing` → run the agent task in
`docs/TRANSLATION_AGENT_TASK.md` → `merge_translations`.

**Platforms:** PWA (add to en.json). Mobile has them but re-run its bundle sync.

**Commit:** `fix(i18n): add the missing notif_prefs keys so notification settings stop showing raw keys`

---

## 2. Sign in does not return to Profile — HIGH

**Symptom:** after a successful sign in the user is not taken back to the
Profile screen.

**Root cause:** `frontend-pwa/src/features/auth/AuthScreen.jsx` dispatches
`LOGIN_SUCCESS`, but the `LOGIN_SUCCESS` reducer in
`frontend-pwa/src/state/appState.jsx` only sets the session; it does not pop the
auth stack screen or switch the active tab. Auth is a stack screen opened over
Profile, so nothing navigates after login.

**Files:** `frontend-pwa/src/state/appState.jsx` (LOGIN_SUCCESS case)

**Fix:** in the `LOGIN_SUCCESS` reducer, also clear the stack and set the active
screen to profile:
```js
ui: { ...state.ui, activeScreen: "profile", screenStack: [] },
```
(RESET the stack so the auth screen closes and the user lands on Profile.)

**Platforms:** PWA. On mobile verify the equivalent: after `signIn` succeeds the
onboarding navigator swaps to the main stack — confirm it lands on Profile/Home,
not back on the auth screen.

**Commit:** `fix(auth): return to the profile screen after a successful sign in`

---

## 3. Tapping the AQI card opens the Map, not the reading — HIGH

**Symptom:** tapping the home AQI card takes the user to the map tab first,
then they must tap again to see the detail.

**Root cause:** `frontend-pwa/src/features/home/HomeScreen.jsx` line ~228:
`onClick={() => pred && dispatch({ type: "SET_ACTIVE_SCREEN", payload: "core" })}`
sends the user to `core` (the map).

**Files:** `frontend-pwa/src/features/home/HomeScreen.jsx`

**Fix:** navigate straight to the city detail with the current prediction:
```js
onClick={() => pred && navigate("cityDetail", { prediction: pred, city: pred.city })}
```
(`navigate` from `useNavigation`; `cityDetail` is already a registered stack
screen.)

**Platforms:** PWA. Mobile: `AQICard.tsx` — confirm its tap opens
`CityDetail`, not the Map.

**Commit:** `fix(home): tapping the reading opens its details, not the map`

---

## 4. Floating back button overlaps the screen title — HIGH

**Symptom:** the back arrow sits on top of the screen name ("Settings" reads as
"ttings", titles are partly hidden).

**Root cause:** the global back button in `frontend-pwa/src/app/App.jsx` is
`position: fixed` at top-left (`top: safe-area+8px, left: 12px`, 44×44), and each
stack screen renders its own title at the same top-left position, so they
collide.

**Files:** the stack screens' headers/titles (Settings, Country Explorer,
Compare Cities, Export Centre, About & Legal, Trust, Prediction Dashboard,
AI Insights, Saved Locations, Feedback, Delete Account, City Detail). The
shared pattern is a title `<p>`/`<h1>` near the top of each screen.

**Fix (pick one, apply consistently):**
- Preferred: give each stack screen's scroll container top padding that clears
  the button (`paddingTop: calc(env(safe-area-inset-top) + 64px)`), and left
  padding on the title row (`paddingLeft: 56px`) so a left-aligned title starts
  after the button. The button stays floating and content scrolls behind it.
- Or: centre the titles (they then never sit under a left-aligned button).

Keep the button `position: fixed` (the requirement is that it floats and content
scrolls behind it — that part is already correct).

**Platforms:** PWA. Mobile uses native headers; verify no custom header overlaps.

**Commit:** `fix(nav): stop the floating back button from covering screen titles`

---

## 5. Country Explorer (and other lazy screens) fail to load on iOS — HIGH

**Symptom:** Country Explorer shows "This screen could not load. Pull to
refresh." (the lazy-load fallback). Reported also as "placeholders not
rendering" on the Language screen.

**Root cause:** these screens are `React.lazy` dynamic imports
(`frontend-pwa/src/app/App.jsx`). On iOS Safari a dynamic `import()` fails when
the service worker holds an old `index.html` that points at chunk hashes the new
deploy replaced, so the chunk 404s and the `.catch(fallback(...))` fires. This
is the same stale-SW class we hit before; iOS Safari is the strictest about it.

**Files:** `frontend-pwa/src/app/App.jsx` (the `fallback` helper and the lazy
imports), `frontend-pwa/vite.config.js` (workbox), `frontend-pwa/src/pwa/`.

**Fix:**
1. Add a one-time reload-on-chunk-error: when a dynamic import rejects, if we
   have not already retried this session, `window.location.reload()` once (a
   fresh load fetches the current index + chunks). Guard with a sessionStorage
   flag so it cannot loop.
2. Confirm `vite-plugin-pwa` uses `cleanupOutdatedCaches: true` (it does) and
   that the HTML entry is `no-cache` (it is, from the earlier `_headers` fix),
   so a new deploy is picked up. The reload in (1) is the safety net for the
   window between SW update and first navigation.

**Platforms:** PWA only (mobile has no lazy web chunks).

**Commit:** `fix(pwa): recover from a stale-chunk dynamic import failure with a single reload`

---

## 6. Delete account and Sign out should sit together — MEDIUM

**Symptom:** the two destructive account actions are not visually grouped; only
Sign out is obvious.

**Root cause:** in `frontend-pwa/src/features/profile/ProfileScreen.jsx` the
sign-out button and the delete-account link are both in the authenticated block
but styled as separate loose items.

**Files:** `frontend-pwa/src/features/profile/ProfileScreen.jsx`,
`mobile/src/screens/ProfileScreen.tsx`

**Fix:** put both inside one clearly separated "account actions" group at the
bottom, with a divider above it, Sign out then Delete account, both in the
destructive colour treatment (delete slightly muted vs sign out). Confirm the
delete link actually renders when signed in (it is conditional on
`state.session.authenticated`).

**Platforms:** PWA and Mobile.

**Commit:** `fix(profile): group sign out and delete account as one account-actions block`

---

## 7. iOS interface differences — MEDIUM

**Symptom:** "the iOS interface is different a bit."

**Root cause:** iOS Safari PWA quirks — safe-area insets, the URL bar affecting
`100vh`, momentum scroll, and font rendering differ from Android Chrome.

**Files:** `frontend-pwa/src/index.css`, any screen using `100vh`.

**Fix:** audit for `100vh` and switch to `100dvh` (dynamic viewport) where a
screen must fill the view; most were already converted — confirm none remain.
Verify `env(safe-area-inset-*)` is honoured on the notification sheet and the
Profile top bar (the "Account Tier" pill sits under the status bar in the
screenshot — it needs `safe-area-inset-top` padding). The iOS smoothness CSS is
already in place; this is a spot-check.

**Files to check specifically:** the Profile header (the tier pill overlapped the
status bar in testing).

**Platforms:** PWA.

**Commit:** `fix(ios): honour the safe area on the profile header and audit remaining 100vh`

---

## 8. Notification settings copy — LOW (naming)

**Symptom:** "fix the naming conventions" in notification settings.

**Root cause:** once (1) is done the labels render, but confirm the wording is
consistent sentence case: "Air quality alerts", "Daily summaries", "Air quality
updates", "Tips and guidance" (no ampersand, no title case). The English source
in (1) already uses this; just verify the final render.

**Platforms:** PWA + Mobile (mobile `en.ts` currently has "Tips & guidance" with
an ampersand — change to "Tips and guidance" for consistency and to match the
no-em-dash/clean-punctuation rule).

**Files:** `mobile/src/locales/en.ts`

**Commit:** `fix(copy): consistent sentence-case notification category labels`

---

## After all fixes

- PWA: `cd frontend-pwa && npm run build && npm run lint` (0 errors)
- Mobile: `cd mobile && npx tsc --noEmit`
- Re-run the translation pipeline for any new/changed en keys (items 1, 8).
- Redeploy Pages, hard-refresh in a private window, re-test the exact flows on
  iOS: notifications labels, sign-in → profile, tap reading → detail, back
  button clears titles, Country Explorer loads, delete+signout grouped.
