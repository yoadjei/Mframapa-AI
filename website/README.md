# Mframapa marketing site

Standalone animated marketing site.  
Deployed at **[www.mframapa.live](https://www.mframapa.live)** (Cloudflare Pages).  
Product / PWA stays at **[mframapa.live](https://mframapa.live)**.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy (Cloudflare Pages)

See [docs/CLOUDFLARE.md](./docs/CLOUDFLARE.md).

Summary:

| Surface | URL |
|---------|-----|
| Marketing | `www.mframapa.live` |
| App (PWA) | `mframapa.live` |

- Root directory: `website`
- Build: `npm run build`
- Output: `dist`

## Notes

- Store badge URLs are placeholders in `src/lib/constants.ts` until listings go live.
- Device screenshots: `docs/SCREENSHOTS.md`
- Design spec: `../docs/superpowers/specs/2026-07-25-marketing-website-design.md`
