# Mframapa Marketing Website — Design Spec & Super Prompt

**Date:** 2026-07-25  
**Status:** Approved for build (iterative ship)  
**Location:** `website/` (standalone Vite app)

---

## Domain recommendation (read first)

| Surface | Intended URL | Risk |
|---------|--------------|------|
| Marketing site | `mframapa.ai` | Domain expires **October 2026**; pitch is **November 2026** |
| PWA / product | `mframapa.live` | Durable; already live |

**Do this:**

1. **Renew `mframapa.ai` immediately** if the brand URL matters for Copenhagen. Losing it weeks before the pitch is worse than unfinished animations.
2. **Pitch deck primary URL = `https://mframapa.live`** until `.ai` renewal is paid and DNS is confirmed. Judges click what you print; do not print a domain that might be dark.
3. **Long-term split (target):**
   - `mframapa.ai` → this marketing site
   - `mframapa.live` → PWA
4. **Bridge until renewal is sure:** deploy the same `website/` build to a backup host on `.live` if needed (e.g. `www.mframapa.live`), so marketing never depends on one registrar invoice.
5. All “Open the app” / web fallbacks point to `https://mframapa.live`.

---

## Super prompt (implementation contract)

Build a modern, animated marketing website for **Mframapa** — satellite-backed air quality intelligence for African cities. The product helps people know when the air turns: city-scale daily estimates, multi-day outlook, offline saved cities, and episode-style alerts. Free for every individual. Institutions fund the platform.

### Stack

- Vite + React + TypeScript
- Tailwind CSS
- Framer Motion (scroll + entrance + mockup motion)
- React Router for multi-page
- Folder: `website/` at repo root
- Deployable as static site (e.g. Cloudflare Pages / Netlify / same host as `.ai`)

### Visual system (hybrid)

- Light marketing chrome: off-white / soft gray background (`#F4F5F7` or `#F7F8FA`), black headlines, muted gray body
- Brand accent: mint `#00C896`
- Product mockups: dark frames (`#0A0D12`) with mint accents so the site feels like the app
- Typography: distinctive modern sans (not Inter/Roboto/Arial as the hero face). Use something like **Syne** or **Outfit** for display + **DM Sans** or **Geist** for body via Google Fonts / fontshare
- Generous whitespace, large radii on cards (~16–24px), Mentismint-level calm — not a dashboard
- Avoid: purple gradients, cream+terracotta cliché, emoji clusters, dense pill rows, AI-sounding copy

### Copy rules

- Short, clear, human. No “revolutionary,” “seamless,” “next-gen,” “leverage,” “empower.”
- No awkward mid-word hyphenation in headlines; control line breaks with deliberate copy, not CSS hyphenation
- Honest claims only (align with `SCOPE_V2_REFINED.md`):
  - Say **city-scale daily** estimates, not “real-time hyperlocal”
  - Say **episode / dust / harmattan alerts** as the reason to care
  - Do **not** invent death tolls, monitor counts, or accuracy % without a verified source
  - Do **not** claim “AI insights” for hardcoded sentences
  - Continental ambition OK; Ghana is the anchor location story

### Primary conversion

- Hero + footer: **four store badges** (placeholders until real URLs exist)
  - Apple App Store
  - Google Play
  - Huawei AppGallery
  - Samsung Galaxy Store
- Placeholder hrefs: `#` or `/#download` with `aria-disabled` / clear “Coming soon” title until URLs are wired
- Secondary: **Open in browser** → `https://mframapa.live`
- Nav CTA: “Open the app →” → `https://mframapa.live`

### Pages

1. **Home** (`/`) — long scroll (see sections below)
2. **About** (`/about`) — Ghana origin, mission, continental aim, institutional one-liner
3. **Support** (`/support`) — General + Support cards (Mentismint pattern); contact email placeholder
4. **Privacy** (`/privacy`) — adapt existing policy content from `frontend-pwa/public/privacy.html` to the light marketing chrome
5. **Terms** (`/terms`) — same treatment from `frontend-pwa/public/terms.html`

### Home sections (in order)

1. **Nav** — Logo (cloud mark + Mframapa) · About · Support · Open the app →
2. **Hero** — One composition: brand-forward, one headline, one supporting line, store badge row + Open in browser. Animated iPhone mockup (not a static dump). Optional soft abstract field behind phone (CSS/gradient motion, not heavy 3D required for v1).
3. **How it works** — Steps 1–3 with scroll-triggered animation; dark device panel per step  
   - Step 1: Check your city  
   - Step 2: See the outlook  
   - Step 3: Get alerts when air turns  
4. **Features bento** — 4 cards: Daily AQI · Outlook · Works offline · Episode alerts
5. **Dark band** — “Know when the air turns” + three short columns (accounts metaphor → for us: saved places, auto guidance, smart tips → rewrite to air: saved cities, clear categories, alerts)
6. **Locations** — Ghana / Accra card + image card (placeholder photo OK)
7. **Closing CTA** — headline + store badges + Open in browser
8. **Footer** — © year · About · Support · Privacy · Terms · Open in browser

**Cut for v1:** “In numbers” until we have verified metrics.

### Motion requirements (not static)

- Page load: hero text + mockup stagger
- Phone mockup: gentle float / parallax on scroll; UI layers inside frame stagger in
- Steps: scroll-linked crossfade or slide between step mockups
- Cards: fade/slide up on enter; subtle hover lift
- Store badges: slight hover scale
- Honor `prefers-reduced-motion: reduce` (fade only, no float)

### Mockups

- iPhone-style device chrome (CSS or SVG frame)
- Inner UI built in React (animated), not a frozen PNG of the whole screen — so it never feels static
- Placeholder screen content: Accra, AQI category, outlook strip, alert banner — brand-faithful, not fintech clone

### Content seeds (editable)

**Hero headline:** Know the air before it turns.  
**Hero sub:** City-scale air quality for African cities. Free for everyone. Works in the browser and on your phone.  
**About spine:** Built in Ghana. Aimed at every African city that still has no nearby monitor.  
**Support:** Contact our team. We read every message.

### Out of scope (v1)

- Waitlist / email capture backend
- Live API-powered AQI widget (optional later)
- Careers / Resources pages
- Full i18n of marketing (English only)
- Real store URLs (placeholders; wire when ready)

### Acceptance checks

- [ ] `npm run dev` in `website/` shows animated home, not a static brochure
- [ ] About, Support, Privacy, Terms all route
- [ ] Store buttons visible with placeholders; browser CTA hits `mframapa.live`
- [ ] Reduced motion respected
- [ ] Mobile + desktop first viewport reads as one composition
- [ ] No false accuracy / real-time / AI claims

---

## Locked product decisions

| Decision | Choice |
|----------|--------|
| Scope | Standalone marketing site |
| Stack | Vite + React + TS + Tailwind + Framer Motion |
| Visual | Hybrid (light chrome, dark mockups, mint) |
| Pages | Home, About, Support, Privacy, Terms |
| Geography | Africa in hero; Ghana locations section |
| Stores | 4 badges, placeholder URLs for now |
| App URL | `https://mframapa.live` |
| Marketing URL | `https://mframapa.ai` (renew before Oct; pitch backup = `.live`) |
| Ship mode | Iterative — keep shipping |

---

## Reference aesthetic

User-supplied Mentismint samples: light SaaS, phone-forward hero, step sections, bento features, dark feature band, locations cards, minimal footer, clear store/download CTAs. Translate that language to air quality + Mframapa brand green — do not copy fintech copy or purple UI chrome.
