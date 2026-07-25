# How to capture better app photos for the marketing site

Replace files in `website/public/mockups/` with the same names.

## What to capture (3 shots)

| File | Screen | Theme |
|------|--------|--------|
| `home-light.png` | Home (Kumasi or Accra with a real reading) | Light |
| `map-light.png` | Map tab, Africa in view, search bar visible | Light |
| `home-dark.png` | Same Home layout | Dark |

Optional later: `map-dark.png` (already supported if you add it in `PhoneMockup.tsx`).

## Exact place in the app

1. Open **https://mframapa.live** on an **iPhone** (Safari).
2. Prefer **Add to Home Screen** (Share → Add to Home Screen) so Safari chrome is gone. That is the cleanest marketing shot.
3. If you stay in Safari, we crop the URL bar in CSS, but Add to Home Screen is better.

### Shot 1: `home-light.png`
- Theme: light (Profile → Settings → theme Light, or system light).
- City: Kumasi or Accra with a finished reading (not `--` / loading).
- Scroll so you see: city pill, **Air right now**, **What to do**, the three actions, part of **Did you know**.
- Do not open menus. Hide the keyboard.

### Shot 2: `map-light.png`
- Tap **Map** in the bottom bar.
- Zoom so West Africa / Ghana is clear. City dots visible.
- Search bar empty: “Search for a city”.
- No bottom sheet open.

### Shot 3: `home-dark.png`
- Same as shot 1, theme Dark.
- Same city and scroll position if you can.

## How to screenshot (iPhone)

1. **Add to Home Screen** first (recommended).
2. Open the icon (full screen PWA).
3. Volume Up + Side button (or Home + Side on older phones).
4. AirDrop / cable to your computer.
5. Overwrite the three files in `website/public/mockups/`.
6. Keep portrait, full phone frame is fine. We mask them in the site bezel.

## Tips for a “premium” look

- Wait until the number has finished counting up.
- Avoid offline banners and error toasts.
- Same time of day / same city across light and dark helps the story.
- Do not include the system Control Center or notifications.

After replacing files, hard refresh the marketing site. The hero and How it works steps will pick them up automatically.
