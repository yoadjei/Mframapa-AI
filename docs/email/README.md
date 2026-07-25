# Resend email — what to do (step by step)

There are **two different email systems**. Only #1 is Resend.

| System | Used for | Where you configure it |
|--------|----------|------------------------|
| **1. Resend** (this doc) | Welcome email after first sign-in; feedback inbox mail | [resend.com](https://resend.com/) + API `.env` |
| **2. Supabase Auth** | Magic link, confirm signup, change email | Supabase → Authentication → Email Templates (`docs/deployment/email/`) |

You do **not** paste `welcome.html` into Resend’s template gallery for the app to work. The API already sends that HTML via Resend’s HTTP API.

---

## Resend in 6 steps

### Step 1 — Create a Resend account

Go to [resend.com](https://resend.com/) → sign up → dashboard.

### Step 2 — Verify your domain

1. Resend → **Domains** → **Add Domain** → `mframapa.live`
2. Resend shows DNS records (TXT / MX / CNAME). Add them at your DNS host (Cloudflare, etc.).
3. Wait until Resend shows the domain as **Verified** (can take minutes to hours).

Until this is Verified, Resend will reject production sends (or only allow their test sandbox).

### Step 3 — Create an API key

1. Resend → **API Keys** → **Create API Key**
2. Permission: send emails
3. Copy the key (`re_...`). You only see it once.

### Step 4 — Put secrets on the **API** server

On the machine that runs the Mframapa API (`docker compose`, env file next to `docker-compose.yml`), add:

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Mframapa <alerts@mframapa.live>
FEEDBACK_TO_EMAIL=privacy@mframapa.live
WELCOME_APP_URL=https://mframapa.live
```

Rules:

- The address inside `RESEND_FROM_EMAIL` must use the **verified** domain (e.g. `alerts@mframapa.live`).
- Same values can go in your local project `.env` for testing with uvicorn.

### Step 5 — Redeploy / restart the API

So the process picks up the new env:

```bash
# on the API host
docker compose up -d --force-recreate api
```

Locally: stop and start `uvicorn` again.

### Step 6 — Smoke test

1. **Welcome:** sign in (or restore session) once in the PWA/app as a user who has not received welcome yet → Resend dashboard → **Emails** → look for “Welcome to Mframapa”.
2. **Feedback:** send feedback from the app → email should arrive at `FEEDBACK_TO_EMAIL`.

If nothing appears: check Resend **Logs**, confirm domain Verified, confirm `RESEND_API_KEY` is on the **running** API container (not only in an old local file).

---

## What the backend sends

| Trigger | Template / code | Endpoint |
|---------|-----------------|----------|
| First signed-in session | `backend/email/templates/welcome.html` | `POST /api/v1/auth/welcome` |
| In-app Send Feedback | `backend/feedback/notify.py` | `POST /api/v1/feedback` |

Welcome is **one-shot per Supabase user id** (SQLite dedupe). Clients call `/api/v1/auth/welcome` after login / session restore.

## Template files in this folder

| File | Use |
|------|-----|
| `welcome.html` | Design reference (shipped copy lives under `backend/email/templates/`) |
| `feedback.html` | Design reference for feedback notify |
| `magic-link.html` | Reference for **Supabase** auth emails (not Resend) |

Ops copy of welcome also under `docs/deployment/email/` (may be gitignored).
