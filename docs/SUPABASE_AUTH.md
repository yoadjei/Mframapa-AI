# Supabase auth — production checklist

Code already sends confirmation and password-reset links to
`window.location.origin` (see `frontend-pwa/src/services/authService.js`).
That only works if the Supabase project trusts those origins.

## Env vars

| Client | Variables |
|--------|-----------|
| PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Mobile | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

Production builds log an error if `VITE_SUPABASE_URL` contains `localhost`.

## Required dashboard settings

In **Supabase → Authentication → URL configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://mframapa.live` (PWA product) — **never leave as localhost in prod** |
| **Redirect URLs** (allow list) | `https://mframapa.live/**` |
| | `https://www.mframapa.live/**` (if auth is ever opened from marketing) |
| | `http://localhost:5173/**` and `http://localhost:5174/**` (local Vite) |

If Site URL is still `http://localhost:5173`, confirmation emails open localhost
on the user’s phone — the #1 store-blocker from iOS QA.

## Email deliverability

- Prefer custom SMTP / Resend with a domain you control (`mframapa.live`).
- Confirm templates: light theme, rain-cloud mark, **no** “powered by Supabase”.
- Test: fresh signup → email arrives → link opens `https://mframapa.live`, not
  localhost → sign-in works → Profile shows first name.

## After changing Site URL

1. Send a new confirmation to a fresh address (old links keep the old redirect).
2. Test forgot-password the same way.
3. Tick §4–§5 in `docs/QA_CHECKLIST.md`.
