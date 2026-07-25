# Mframapa — end-to-end test checklist

For a full pre-launch pass on a real device. iOS items need a Mac (TestFlight or
`expo run:ios`); everything else applies to both platforms. Tick each, and note
anything that does not behave as described — that is a real bug, not a "maybe".

The items marked ⚠️ are things that were broken or faked earlier this cycle and
were rebuilt, so they are the most important to actually confirm.

---

## 1. First launch (fresh install, no account)

- [ ] Splash shows the rain-cloud mark, then the "Mframapa" wordmark wipes in
- [ ] Onboarding slides advance, and **Back** returns to the previous slide ⚠️
- [ ] The dots under the slides are tappable and jump to that slide
- [ ] Location permission is requested with a clear reason
- [ ] If you **allow** location: home opens on your actual city ⚠️
- [ ] If you **deny** location: home still shows a real reading (not blank) ⚠️
- [ ] You reach the app without being forced to create an account ⚠️

## 2. Home screen

- [ ] Shows a PM2.5 number, a category (Good/Moderate/…), and your city
- [ ] The category has a **shape/symbol** next to the colour (not colour alone) ⚠️
- [ ] "What to do" guidance appears and reads naturally, not like jargon
- [ ] "Did you know" fact card shows a fact
- [ ] Weather values (humidity, wind, temp) look real, not zeros
- [ ] Pulling / refreshing the same city gives the **same** reading, not a new
      number each time ⚠️
- [ ] No text reads "PM2.5", "model", "satellite feed", "API" as a user label ⚠️

## 3. Map

- [ ] The map renders (needs the Mapbox token; blank map = token missing)
- [ ] Coloured dots appear across **many countries**, not just a few ⚠️
- [ ] Every country you can see has at least one dot ⚠️
- [ ] Dots are different colours (not all green) ⚠️
- [ ] Tapping a city shows its reading
- [ ] Search finds a city and moves the map to it

## 4. Sign up → confirm → sign in (the big one) ⚠️

- [ ] Sign up asks for **first name, email, password, home city**
- [ ] Home city suggestions appear after **3 letters**
- [ ] A bad email (no @, no domain) is rejected before submit
- [ ] A password under 8 characters is rejected
- [ ] After sign up, you are told to check your email (not signed in yet)
- [ ] **The confirmation email arrives** ⚠️
- [ ] The email is light-themed with the rain-cloud logo, no "powered by Supabase"
- [ ] **Tapping the confirm link opens the app / mframapa.live, NOT localhost** ⚠️
- [ ] After confirming, you can sign in
- [ ] Signed-in home opens on the **home city you chose at signup** ⚠️
- [ ] Profile shows your **first name** (not your email in the name slot) ⚠️

## 5. Forgot password ⚠️

- [ ] "Forgot password" sends a reset email that **actually arrives** ⚠️
- [ ] The reset link works and lets you set a new password
- [ ] It says the same thing whether or not the email has an account

## 6. Delete account (store-mandatory) ⚠️

- [ ] Profile → Delete account exists and is reachable when signed in
- [ ] It requires typing DELETE (or equivalent confirmation)
- [ ] Confirming **actually deletes** — you are signed out ⚠️
- [ ] Trying to sign in again with the same account **fails** (proof it is gone) ⚠️

## 7. Sign out ⚠️

- [ ] Sign out asks "are you sure?" first (does not sign out on one tap) ⚠️
- [ ] Cancelling keeps you signed in
- [ ] Confirming signs you out; the app still works anonymously

## 8. Feedback ⚠️

- [ ] Profile/menu → send feedback
- [ ] Submitting an **empty** message is refused
- [ ] Submitting a real message shows a success confirmation ⚠️
- [ ] (Ops check, not on device: the message appears in the feedback store)

## 9. Translations

- [ ] Settings → change language to **Swahili**, then **French**, then **Arabic**
- [ ] Screens are translated, not half English ⚠️
- [ ] Arabic lays out **right-to-left** ⚠️
- [ ] Numbers, "Mframapa", and PM2.5 stay as-is inside translated text
- [ ] The daily fact and guidance appear in the chosen language

## 10. Accessibility

- [ ] Settings → Text size → Larger makes **all** text grow, nothing clips ⚠️
- [ ] With the OS screen reader on (VoiceOver/TalkBack), the home reading is
      announced as a sentence ("…17 micrograms, moderate"), not just "17" ⚠️
- [ ] Category is distinguishable without colour (the shape) ⚠️
- [ ] In **light mode**, category text is readable (not washed out) ⚠️
- [ ] Every button is comfortably tappable (nothing tiny)

## 11. Offline / poor network

- [ ] Turn on airplane mode → the app shows a clear offline state, not a crash
- [ ] A previously viewed city still shows its last reading
- [ ] Coming back online recovers without a manual restart

## 12. Errors don't white-screen

- [ ] Deny location, kill the network, tap around — no blank/white screens ⚠️
- [ ] If something does fail, you see a message with a way out (reload/retry) ⚠️

## 13. iOS-specific (Mac / TestFlight only)

- [ ] Location prompt shows our wording, not a generic string ⚠️
- [ ] Denying location is handled gracefully (city search still works)
- [ ] Notification permission is requested with context, not blindly on launch
- [ ] Push: with alerts on, an episode alert can be received (needs a real build)
- [ ] The app does not ask for anything it does not use (no contacts, photos)
- [ ] Rotating the device / large text does not break any screen

## 14. Store-readiness spot checks

- [ ] Support email in the app/listing (`support@mframapa.live`) receives a test mail
- [ ] Privacy contact (`privacy@mframapa.live`) receives a test mail
- [ ] Privacy Policy and Terms open and are readable, themed like the app
- [ ] Nothing claims "accurate readings" — it says "estimates"
- [ ] Version shown in About matches the build

---

## How to report a failure

For each miss: the screen, what you did, what you expected, what happened, and a
screenshot. A one-line "translations look off" is not actionable; "Settings set
to Twi, but the Profile screen headers are still English" is.
