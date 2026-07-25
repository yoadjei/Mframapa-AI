# Deploy marketing site on Cloudflare Pages (`www.mframapa.live`)

Product / PWA stays on apex: `https://mframapa.live`  
Marketing: `https://www.mframapa.live`

## 1. Create a second Cloudflare Pages project

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Select repo `yoadjei/Mframapa-AI` (or your fork)
3. Project name: e.g. `mframapa-marketing`
4. Build settings:
   - **Root directory:** `website`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node version:** `22` (or `20`) — set under Settings → Environment variables → `NODE_VERSION=22`
5. Save and deploy. You’ll get something like `mframapa-marketing.pages.dev`

SPA fallback is already in `public/_redirects` (`/* /index.html 200`).

## 2. Attach the custom domain `www`

1. Open the **marketing** Pages project → **Custom domains** → **Set up a custom domain**
2. Enter: `www.mframapa.live`
3. Cloudflare will add / confirm a **CNAME**: `www` → `mframapa-marketing.pages.dev` (or the target they show)
4. Wait until status is **Active**

If `mframapa.live` is already on Cloudflare DNS:

- DNS → Add record:
  - Type: **CNAME**
  - Name: `www`
  - Target: `<your-marketing-project>.pages.dev`
  - Proxy: **Proxied** (orange cloud)

## 3. Keep the PWA on the apex

Do **not** point the apex `@` / `mframapa.live` at this marketing project.  
Leave the existing Pages project (or host) for the PWA on `mframapa.live`.

## 4. Pitch / links

Use `https://www.mframapa.live` on the deck, LinkedIn, and emails.  
“Open the app” buttons still go to `https://mframapa.live`.

## 5. Optional: redirect old marketing domain

If `mframapaai.health` still works for a while, add a redirect rule there → `https://www.mframapa.live` so old links don’t die quietly.
