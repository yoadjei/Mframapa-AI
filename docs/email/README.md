# Mframapa email templates (Resend)

## What the backend sends

| Trigger | Template | Endpoint / code |
|---------|----------|-----------------|
| In-app Send Feedback | feedback body in `backend/feedback/notify.py` (see `feedback.html`) | `POST /api/v1/feedback` |
| First signed-in session | `welcome.html` / `backend/email/templates/welcome.html` | `POST /api/v1/auth/welcome` |

Welcome is **one-shot per Supabase user id** (SQLite dedupe). The PWA and mobile apps call `/api/v1/auth/welcome` after login, signup-with-session, or session restore (including email confirm).

## Resend setup (do this once)

1. Create an account at [resend.com](https://resend.com/) and open **API Keys** → create a key with send permission.
2. **Domains** → add `mframapa.live` (or your sending domain) → add the DNS records Resend shows → wait until status is **Verified**.
3. Optionally create a sender display name. Production from-address must be on that verified domain, e.g. `alerts@mframapa.live`.
4. Put secrets in `.env` / production:

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Mframapa <alerts@mframapa.live>
FEEDBACK_TO_EMAIL=privacy@mframapa.live
# optional:
# RESEND_WELCOME_FROM=Mframapa <alerts@mframapa.live>
# WELCOME_APP_URL=https://mframapa.live
```

5. Redeploy / restart the API so it picks up the env vars.
6. Smoke test:
   - Sign in once on the app → check Resend **Emails** dashboard for “Welcome to Mframapa”.
   - Submit feedback → you should see a message to `FEEDBACK_TO_EMAIL`.

You do **not** need to paste the welcome HTML into the Resend template gallery for the app to work; the API loads `backend/email/templates/welcome.html` and sends it via the Resend HTTP API. Pasting into Resend’s UI is optional if you prefer editing there later.

## Supabase auth emails (separate)

Magic link / confirm signup / change email still use **Supabase → Authentication → Email Templates** (see `docs/deployment/email/`). Those are not Resend welcome mails.

## Template files

| File | Use |
|------|-----|
| `feedback.html` | Reference design for internal feedback notify |
| `magic-link.html` | Reference for Supabase magic link |
| `welcome.html` | Same layout as `docs/deployment/email/change-email.html`; mirrored for ops |

Also: `docs/deployment/email/welcome.html` (local ops copy; `docs/deployment/*` may be gitignored except store docs).
