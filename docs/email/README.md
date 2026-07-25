# Mframapa email templates (Resend)

Modern HTML templates for Resend. Paste into the Resend dashboard or send via the API with `html` from these files.

## Setup

1. Create a Resend account and verify `mframapa.live` (or your sending domain).
2. Set in `.env` / production secrets:

```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Mframapa <alerts@mframapa.live>
FEEDBACK_TO_EMAIL=privacy@mframapa.live
```

3. In-app feedback (`POST /api/v1/feedback`) stores every report in SQLite, then best-effort emails `FEEDBACK_TO_EMAIL` using the feedback template body in `backend/feedback/notify.py` (aligned with `feedback.html` below).

## Templates

| File | Use |
|------|-----|
| `feedback.html` | Internal notify when a user submits Send Feedback |
| `magic-link.html` | Supabase / auth magic link (branded) |
| `welcome.html` | Optional post-signup welcome |

Placeholders use Resend / Handlebars-style `{{name}}` tokens. Replace or map them in your send call.
