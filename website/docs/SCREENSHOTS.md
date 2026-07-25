# How it works videos — interactive capture brief

The phone in **How it works** shows three **real screen recordings** of [mframapa.live](https://mframapa.live). Each clip must be **interactive**: a person using the app, not a static screenshot, not a zoom/pan on a PNG, not a rebuilt fake UI.

Copy source of truth: `website/src/content/copy.ts` → `copy.how.steps`.

| Step | Title (on site) | File (deliver both) |
|------|-----------------|---------------------|
| 1 | Open a city | `public/mockups/step-1-city.webm` + `step-1-city.mp4` |
| 2 | Browse the map | `public/mockups/step-2-map.webm` + `step-2-map.mp4` |
| 3 | Turn on dust alerts | `public/mockups/step-3-alerts.webm` + `step-3-alerts.mp4` |

Hero may keep one still (`home-light.png`). How it works uses these three clips only.

**Not allowed:** Ken Burns / slow zoom on stills, React mock UIs, stock phone templates, dark Home for step 3, unrelated screens, silent idle holds with no taps.

---

## Setup (do this once before any clip)

1. iPhone, **light theme** (Profile → Settings → Light, or system light). Language: English.
2. Open **https://mframapa.live** → Share → **Add to Home Screen**. Launch from the icon (full-screen PWA, no Safari URL bar).
3. Stable Wi‑Fi. Wait until readings finish loading (no `--`, no spinners).
4. DND on. No banners, Control Center, or iOS notification shade during record.
5. Screen Recording from Control Center. Portrait. Mute mic (site plays silent video later).
6. Prefer Accra or Kumasi as the “home” city for all three clips so the story feels continuous.

---

## Shared technical specs

| Spec | Value |
|------|--------|
| Orientation | Portrait only |
| Length | **8–12 seconds** per clip (trim after record) |
| Loop | Must loop cleanly — end state should feel ready to restart, or fade is handled in edit |
| Audio | None (strip in export) |
| Resolution | Native iPhone is fine; export ~720px wide (`scale=720:-2`) |
| Formats | **WebM (VP9) + MP4 (H.264)** for every step |
| Chrome | PWA only — no Safari chrome, no desktop browser |

```bash
# From each trimmed .mov:
ffmpeg -i step-1.mov -an -vf "scale=720:-2" -c:v libvpx-vp9 -b:v 1.2M public/mockups/step-1-city.webm
ffmpeg -i step-1.mov -an -vf "scale=720:-2" -c:v libx264 -pix_fmt yuv420p public/mockups/step-1-city.mp4
# repeat for step-2-map and step-3-alerts
```

---

## Step 1 — Open a city

**On-site copy:** “Pick Accra, Kumasi, or search another place. You see today’s air quality and a short note on what to do.”

**Must prove:** search → pick a city → land on Home with a real reading + “What to do”.

### Beat sheet (record this exact flow)

| Time | Action | What the viewer must see |
|------|--------|---------------------------|
| 0:00–0:01 | Start on **Home** (any city already loaded is fine) | Bottom tab bar visible; not a blank/loading home |
| 0:01–0:02 | Tap **Search** (bottom tab) | Search screen opens |
| 0:02–0:05 | Tap the search field, type **`Accra`** or **`Kumasi`** (one city only) | Keyboard + matching results |
| 0:05–0:07 | Tap the city result | Transition back to Home for that city |
| 0:07–0:12 | Hold / light scroll on Home | City name, **Air right now** with a finished number, **What to do** visible. No menus open |

### Pass / fail

- Pass: typing + tap result + Home reading clearly readable in the last 3–4s.
- Fail: already on Accra with no search; loading/`--`; offline banner; wrong tab; ends on Search.

---

## Step 2 — Browse the map

**On-site copy:** “Move across Africa, search a city, or tap a place to open its air quality reading.”

**Must prove:** Map tab → move the map → search or tap a place → reading opens (sheet or navigate to Home). Interactive map motion is required.

### Beat sheet (record this exact flow)

| Time | Action | What the viewer must see |
|------|--------|---------------------------|
| 0:00–0:01 | Start on **Map** tab | Africa / West Africa in view; search bar: “Search for a city”; city dots if visible |
| 0:01–0:05 | **Pan** slowly (finger drag) across the map | Map tiles move; not a freeze-frame |
| 0:05–0:08 | Either **A)** tap search → type a city → select, **or B)** tap a city/dot on the map | Search results or place selected |
| 0:08–0:12 | Reading appears (bottom sheet and/or Home for that place) | Air quality for the chosen place — not an empty map |

Pick **one** of A or B and do it cleanly. Prefer A (search) if taps on the map are flaky on your build.

### Pass / fail

- Pass: visible pan + a deliberate select that produces a reading.
- Fail: static map with no finger motion; ocean-only / error toast; sheet covering everything for the whole clip with no map motion first.

---

## Step 3 — Turn on dust alerts

**On-site copy:** “We send a phone notification when dusty air is coming to your city.”

**Must prove:** Alerts / Notifications → open notification settings → turn alerts **on** (or turn Air quality alerts on). This is **not** dark Home and **not** theme settings.

### Beat sheet (record this exact flow)

| Time | Action | What the viewer must see |
|------|--------|---------------------------|
| 0:00–0:01 | Start on **Alerts** tab (label: Alerts; screen title: Notifications) | Notifications list or empty state — still Alerts |
| 0:01–0:03 | Tap the **settings / gear** (notification settings) | Sheet: “Notifications” with **All notifications** toggle |
| 0:03–0:05 | If **All notifications** is already on, turn it **off** briefly so the next tap is visible | Toggle clearly moves |
| 0:05–0:08 | Turn **All notifications** **on** (green). Optionally ensure **Air quality alerts** category is on | Toggle on = the story beat |
| 0:08–0:12 | Hold on the sheet (or close and show list) | Settings still readable; no jump to Home/Map |

If the OS shows a push-permission dialog, allow it once **before** the marketing take, then re-record without the system dialog covering the UI.

### Pass / fail

- Pass: Alerts tab → settings sheet → toggle interaction clearly on.
- Fail: dark Home; Profile theme toggle; Settings language screen; no toggle motion; ends on Map.

---

## Director checklist (all three)

- [ ] Full-screen PWA (Add to Home Screen)
- [ ] Light theme, English
- [ ] Real taps / typing / pan — not idle screens
- [ ] No loading skeletons in the final third of the clip
- [ ] No offline / error / “map not configured” states
- [ ] No iOS chrome, Control Center, or incoming calls
- [ ] Same “home” city story (Accra or Kumasi) across clips when possible
- [ ] Trimmed to 8–12s, silent, both WebM + MP4 dropped in `website/public/mockups/`

---

## After files land

Wire `PhoneMockup` to play these clips (`autoplay muted loop playsInline`, WebM + MP4 source). Point How it works step 3 at the alerts clip — not `home-dark.png`.

Until then, do not ship fake motion; keep stills only as a temporary placeholder, and replace step 3’s still with a real **Alerts** frame if you must show something before video is ready.
