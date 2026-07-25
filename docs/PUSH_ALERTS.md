# Closed-app alerts (Web Push + daily scan)

Two separate switches must both be on for PWA users to get alerts when the app is closed:

| Piece | Env | What it does |
|-------|-----|----------------|
| **VAPID keys** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Lets the browser subscribe; API can send Web Push |
| **Daily scanner** | `ALERTS_ENABLED=1` | Scheduler runs dust / “Did you know” and calls push delivery |

Mobile (Expo) push uses Expo tokens and does **not** need VAPID. The iOS/Android permission sheet talks to Expo; the PWA sheet talks to VAPID.

## 1. Generate keys (once)

On your machine (repo root, venv on):

```bash
python scripts/generate_vapid_keys.py
```

Copy the three printed lines. Keep the private key secret (do not commit it).

## 2. Put them on the API host

Production loads env from the server `.env` (`docker-compose.yml` → `env_file: .env`).

On the VPS / host that runs `docker compose`:

1. Open the `.env` next to `docker-compose.yml`.
2. Paste:

```bash
ALERTS_ENABLED=1
ALERTS_BASE_URL=https://api.mframapa.live
VAPID_PUBLIC_KEY=...paste from script...
VAPID_PRIVATE_KEY=...paste from script (one line with \n)...
VAPID_SUBJECT=mailto:alerts@mframapa.live
```

3. Recreate the API container so it reloads env:

```bash
docker compose up -d --force-recreate api
```

## 3. Verify

```bash
# Should return JSON with "configured": true and a publicKey
curl -sS https://api.mframapa.live/api/v1/vapid-public-key

# Or from the repo:
python scripts/launch_checks.py --prod
```

If you see **503**, keys are missing in the running process.  
If you see **403**, Cloudflare/WAF is blocking the path — allow `/api/v1/vapid-public-key` (or test from an allowlisted IP).  
If you see **404**, redeploy a backend build that includes the Web Push route.

## 4. User smoke test (PWA)

1. Open https://mframapa.live → Allow notifications.
2. Confirm no “local only / VAPID” error.
3. In browser DevTools → Application → Service Workers / Push, subscription should exist.
4. Next day (or after a manual alert run), a system notification should appear when the tab is closed.

## Local dev

Same keys in project-root `.env`, then restart uvicorn. `ALERTS_ENABLED=0` is fine locally unless you want the scheduler firing.
