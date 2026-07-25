# Store submission pack

Filled from what the app actually collects, verified against the code. Copy
these answers into Play Console and App Store Connect. Where a value is a
judgement call it is flagged.

Data the app collects, in full:

| Data | Where | Linked to identity? | Shared? | Why |
|---|---|---|---|---|
| Precise location (lat/lon) | sent to the API to fetch a reading; not stored raw | No | No | Show air quality for the user's point |
| Approximate area | sent with a push token so alerts are local | No | No | Deliver nearby episode alerts |
| Email address | only if the user signs up (optional) | Yes | No | Account, saved places, sync |
| Home city | only if chosen at sign up | Yes | No | Open the app on the user's city |
| Anonymous device id | random UUID the app generates; analytics | No | No | Count installs and retention |
| Country (coarse) | analytics only | No | No | Which countries use the app |
| Feedback message + optional email | only if the user sends feedback | Only if they add an email | No | Answer the report |

Nothing is sold or shared with third parties. No advertising identifiers. No
tracking across apps. No contacts, photos, messages, or files.

---

## Google Play — Data Safety form

**Does your app collect or share user data?** Yes, collects. Does not share.

**Location**
- Approximate location — collected, not shared. Purpose: App functionality.
  Not required (app works with city search). Not for tracking.
- Precise location — collected, not shared. Purpose: App functionality.
  Not required. Not for tracking.

**Personal info**
- Email address — collected, not shared. Purpose: Account management, App
  functionality. Optional (anonymous use is the default). Not for tracking.
- User IDs (the anonymous device id) — collected, not shared. Purpose:
  Analytics. Not for tracking. Not linked to the user.

**App activity**
- App interactions (screen views, prediction requests) — collected, not shared.
  Purpose: Analytics. Not for tracking. Not linked to the user.

**Messages / other**
- Feedback text — collected, not shared. Purpose: App functionality (support).
  Optional.

**Security practices**
- Data is encrypted in transit: **Yes** (HTTPS everywhere).
- Users can request data deletion: **Yes** — in-app, Profile → Delete account.
- Provide the deletion URL if asked: the in-app path plus
  `privacy@mframapa.live`.

**Data retention:** server logs up to 30 days, then aggregated or deleted (see
privacy policy).

---

## App Store — Privacy "nutrition labels"

For each, choose **"Data used to track you": No** for everything (we do not
track), and link to the account or not as marked.

**Data Linked to You** (only when signed in):
- Contact Info → Email Address — App Functionality
- User Content → Other (home city) — App Functionality

**Data Not Linked to You:**
- Location → Precise Location — App Functionality
- Location → Coarse Location — App Functionality
- Identifiers → Device ID (the anonymous UUID) — Analytics
- Usage Data → Product Interaction — Analytics
- User Content → Other (feedback text) — App Functionality (Support)

**Diagnostics** (if you enable Sentry crash reporting on mobile):
- Diagnostics → Crash Data — App Functionality. Not linked. Not tracking.

---

## App Store — review notes (paste into "Notes for Review")

> Mframapa works fully without an account — air quality, search, the map and
> alerts are all available anonymously, so no demo login is needed to evaluate
> the core app.
>
> To test the optional account features (saved places, cross-device sync), the
> reviewer can create an account with any email; a confirmation email is sent.
> Account deletion is at Profile → Delete account and removes the account
> immediately.
>
> Location is requested only to show air quality for the user's own area; the
> app degrades to city search if permission is denied. Notifications are for
> daily air quality episode alerts.
>
> Air quality figures are model-based **estimates** derived from satellite and
> weather data, not sensor measurements, and every reading is shown with its
> confidence range. The app is informational and is not a medical device.

---

## Age rating

Answer honestly. The app shows environmental data that can indicate poor air
quality, but no violence, no user-to-user content (community was removed), no
mature themes. Expected result: **Everyone / 4+**. Do not claim a rating without
answering the questionnaire.

---

## Content guidelines to respect in the listing copy

- Say **"estimates"**, never "accurate readings" or "measurements". The model
  catches roughly a third of genuinely unhealthy days, so any promise of
  reliable protection is a misleading health claim and a rejection risk.
- Do not imply the app replaces official monitoring or medical advice.
- The support email in the listing must actually receive mail (Resend setup).

---

## Support URL / contact

The listing needs a working support contact. Until the email stack is live,
`privacy@mframapa.live` and the in-app feedback form both need to reach someone.

**URLs for both stores**
- Privacy policy: `https://mframapa.live/privacy.html` (PWA) or marketing equivalent
- Terms: `https://mframapa.live/terms.html`
- Support / contact: `mailto:privacy@mframapa.live` and in-app feedback
- Marketing site: `https://www.mframapa.live` (or current www host)
- Product app: `https://mframapa.live`

---

## Package IDs (do not mix these up)

| Surface | Package / bundle | Store role |
|---|---|---|
| Expo native Android | `ai.mframapa.app` | **Google Play** primary listing (AAB from EAS) |
| Expo iOS (if ever) | `ai.mframapa.app` | App Store Connect — currently PWA-first; skip $99 unless strategy changes |
| TWA (Bubblewrap) | `ai.mframapa.pwa` | Galaxy Store / other free Android stores wrapping the PWA |

Play and Galaxy should not ship the same package id. Prefer native AAB on Play; TWA elsewhere.

---

## Google Play — listing copy (paste-ready)

**App name** (≤30 chars): `Mframapa`

**Short description** (≤80 chars):

```
Air quality estimates for African cities. Dust alerts. Works offline.
```

**Full description**:

```
Mframapa shows today’s air quality for cities across Africa — even where there is no local sensor on your street.

Open Accra, Lagos, Nairobi, or search another place. See a clear category for today, a short outlook for the next few days, and get a phone alert when dusty or smoky air is heading your way.

What you get
• City air quality estimates from satellite and weather data
• Map of cities across Africa
• Dust / episode alerts (optional notifications)
• Offline access for cities you save
• Optional account to sync saved places — or continue without signing in

Important
Figures are model-based estimates, not ground-sensor measurements. Every reading includes a confidence range. Mframapa is informational and is not a medical device. It does not replace official monitoring or medical advice.

Built in Accra, Ghana. Free for everyone.
```

**Category:** Weather (or Tools if Weather is unavailable)

**Tags / keywords** (internal notes; Play has limited keyword fields): air quality, Africa, dust, harmattan, AQI, Accra, PM2.5 estimate

**Contact email:** `privacy@mframapa.live`

**Default language:** English (en-US)

---

## App Store — listing copy (if submitting later)

**Name:** Mframapa  
**Subtitle** (≤30): `Air quality for African cities`

**Promotional text** (optional, updatable):

```
Know today’s air quality, plan the next few days, and get dust alerts — built for Africa.
```

**Description:** use the same full description as Play (estimates language unchanged).

**Keywords** (100 chars, comma-separated):

```
air quality,Africa,dust,AQI,harmattan,Accra,PM25,weather,alerts,offline
```

---

## Screenshots — shot list

Phone frames: 1080×1920 (Play phone) and 1290×2796 (iPhone 6.7") if iOS is submitted. Prefer light mode for store clarity; keep one dark set for marketing.

| # | Screen | Source / how | Caption (on-device text, optional) |
|---|---|---|---|
| 1 | Home — city reading | Capture from device or `website/public/mockups/home-light.png` | Today’s air quality for your city |
| 2 | Map — Africa cities | `website/public/mockups/map-light.png` or live Map tab | Browse cities across Africa |
| 3 | Alerts inbox | `website/public/mockups/alerts-light.png` | Dust and episode alerts |
| 4 | Search / city pick | Live Search screen | Find any city |
| 5 | Outlook / detail | City detail with multi-day strip | Plan the next few days |
| 6 | Offline / saved | Settings or saved cities with offline badge | Saved cities work offline |

**Do not** put “accurate measurements” or medical claims on screenshot captions.

Capture scripts (repo): `website/scripts/capture-*-mockup.mjs` for marketing stills. For store assets, prefer real device screenshots from a production or staging build so UI chrome matches the binary under review.

**Feature graphic** (Play, 1024×500): brand wordmark + one home mockup on atmospheric gradient — no fake AQI “100% accurate” badges.

**Icon:** `mobile/assets/icon.png` / adaptive icon (already in Expo config).

---

## EAS build (native Play AAB)

From `mobile/` after Expo account login (`eas login`):

```bash
# One-time: create Expo project + write extra.eas.projectId into app.json
npx eas-cli init

# Doctor should be clean (worklets 0.5.1 for SDK 54)
npx expo-doctor

# Internal APK for QA
npm run eas:preview
# → eas build --platform android --profile preview

# Play Store upload (AAB)
npm run eas:production
# → eas build --platform android --profile production

# Optional submit when Play Console app + service account are linked
npm run eas:submit
```

Profiles live in `mobile/eas.json` (`preview` = APK, `production` = app-bundle).

Production env must set `EXPO_PUBLIC_API_URL=https://api.mframapa.live` (or current API host), Mapbox, and Supabase public keys in EAS secrets — not only in local `.env`.

---

## TWA (Bubblewrap) for Galaxy / sideload

Config: `frontend-pwa/twa.config.json` — host and icons point at **`mframapa.live`**, package `ai.mframapa.pwa`.

```bash
cd frontend-pwa
# Requires Java 17+, Android SDK, bubblewrap-cli
bash scripts/build-apk.sh
```

Before first Play/Galaxy TWA upload:

1. PWA must be live HTTPS with valid `manifest.json` and icons at the URLs in `twa.config.json`.
2. Digital Asset Links: `frontend-pwa/public/.well-known/assetlinks.json` is deployed with the PWA. Replace the placeholder SHA-256 with the TWA keystore fingerprint (Bubblewrap prints it after keystore create; or `keytool -list -v -keystore mframapa-release.keystore`).
3. Do **not** upload this APK/AAB to the same Play listing as `ai.mframapa.app`.

---

## Parked (post-launch) — do not block store submit

| Item | Why parked |
|---|---|
| Model recall ~30% on unhealthy days | Needs real regional training + aerosol/MODIS provenance work; store copy already uses **estimates** language |
| Aerosol / MODIS pipeline hardening | Historical branch work (`aerosol-provenance-parked`); improve after launch |
| How-it-works videos | Marketing stills exist; video is polish |
| Apple paid developer program | Africa distribution is Android + PWA-first |

Launch acceptance for stores: honest Data Safety / privacy labels, working privacy URL, screenshots that match the binary, and no “accurate sensor” claims.

---

## Pre-launch automated checks

From the repo root (venv active):

```bash
python scripts/launch_checks.py          # local .env + repo + optional :8000
python scripts/launch_checks.py --prod   # also hit api.mframapa.live
pytest backend/tests -q
cd frontend-pwa && npm run lint
cd ../mobile && npm run doctor
```

Production must show `vapid-public-key` → `configured: true` and `ALERTS_ENABLED=1`.

---

## User-first prod checklist (do before promising alerts)

Until these are true, marketing and push prompts must not imply remote dust alerts work:

1. Deploy API with `/api/v1/vapid-public-key` (prod was 404 while PWA/health were 200)
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (one-line `\n`), `VAPID_SUBJECT`
3. Set `ALERTS_ENABLED=1` and `ALERTS_BASE_URL=https://api.mframapa.live`
4. Recreate the API container (env reload)
5. Confirm: `Invoke-RestMethod https://api.mframapa.live/api/v1/vapid-public-key` → `configured: true`
6. Bake `VITE_MAPBOX_TOKEN` into the PWA build so the map is not a city-list fallback
