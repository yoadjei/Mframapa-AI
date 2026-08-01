# Accessibility & UI local checklist (50+ / review validation)

Run against local PWA + Expo before any production push.

## Contrast & type

- [ ] Light mode: body and secondary text readable on white cards (no washed grey)
- [ ] Dark mode: secondary/muted text still readable
- [ ] No meaningful label under ~13px
- [ ] System font size increase (browser zoom / iOS Dynamic Type) does not clip critical labels

## Patterns

- [ ] Cloud/rain watermark is faint; text feels on clean surfaces

## Home

- [ ] AQI category (“Unhealthy…”) is larger / more prominent than the µg/m³ number
- [ ] Location chip is easy to see and tap
- [ ] Check / Search action labels are readable

## Icons & nav

- [ ] Tab and action icons are larger
- [ ] FAB uses menu (not “+ create”); opens More
- [ ] Satellite/planet icon for air-quality updates is recognizable

## Search & notifications

- [ ] Placeholder reads “Search city”
- [ ] Notification rows: one type icon only; “Tap to mark read” / “Mark all as read”

## Chart & map

- [ ] 7-day trend: bars/dots use different AQI colours per day
- [ ] Map shows “heat map… 10–15 seconds” while loading

## Keep as-is (spot-check)

- [ ] Clean layout / hierarchy still intact
- [ ] Onboarding unchanged in spirit
- [ ] VoiceOver / TalkBack still announces AQI and location
