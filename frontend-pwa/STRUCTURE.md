# PWA Enhancement Structure

**Current**: React + Vite (already exists)  
**Enhancement**: Full PWA with offline support

---

## Files to Add

```
frontend/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── apple-touch-icon.png    # iOS icon
│   └── icons/
│       ├── icon-72.png
│       ├── icon-96.png
│       ├── icon-128.png
│       ├── icon-144.png
│       ├── icon-152.png
│       ├── icon-192.png
│       ├── icon-384.png
│       ├── icon-512.png
│       └── maskable-icon.png
│
├── src/
│   ├── sw-register.ts          # Service worker registration
│   └── components/
│       └── InstallPrompt.tsx   # Install banner
│
└── index.html                  # Add PWA meta tags
```

---

## manifest.json

```json
{
  "name": "Mframapa - Air Quality for Africa",
  "short_name": "Mframapa",
  "description": "Real-time air quality for 1.4 billion Africans",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#10b981",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-icon.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## Service Worker Strategy

### Cache First (Static Assets)
- HTML, CSS, JS bundles
- Images and icons
- Font files

### Network First (API)
- `/api/*` endpoints
- Fall back to cached response if offline

### Pre-cache (On Install)
- 500 cities data
- All translation JSON files
- Core app shell

---

## index.html Additions

```html
<!-- PWA -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#10b981">

<!-- iOS -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mframapa">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```

---

## InstallPrompt Component

Shows install prompt when:
1. User has visited 2+ times
2. User hasn't dismissed before
3. Browser supports installation

For iOS:
- Shows manual instructions
- "Tap Share → Add to Home Screen"

---

## Offline Indicators

### When Offline
- Banner: "You're offline - showing cached data"
- Last updated timestamp visible
- Refresh button disabled with tooltip

### When Back Online
- Banner: "Back online - refreshing..."
- Auto-refresh data
- Banner dismisses after sync

---

## Testing Checklist

- [ ] Install works on Android Chrome
- [ ] Install works on iOS Safari
- [ ] App works fully offline
- [ ] Service worker updates correctly
- [ ] Lighthouse PWA score > 90
