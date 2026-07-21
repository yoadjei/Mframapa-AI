# Mframapa - Zero Cost Infrastructure Guide

**Total Monthly Cost**: $0  
**One-Time Cost**: $0-25 (optional Google Play)

---

## Free Tier Stack

### Backend Hosting

| Option | Free Tier | Best For |
|--------|-----------|----------|
| **Oracle Cloud** | Always Free ARM VM (4 Cores, 24GB RAM) | Current Setup ✓ |
| **Railway** | $5 credit | Backup/migration |
| **Render** | 750 hrs/mo | Alternative |
| **Fly.io** | 3 shared VMs | Edge deployment |

**Recommendation**: Oracle Cloud Always Free. It is extremely powerful (24GB RAM) and perfectly handles in-memory ML models (XGBoost/LightGBM) and local Redis.

### Frontend Hosting

| Option | Free Tier | Notes |
|--------|-----------|-------|
| **Vercel** | 100GB bandwidth | Current setup ✓ |
| **Netlify** | 100GB bandwidth | Alternative |
| **Cloudflare Pages** | Unlimited | With Cloudflare CDN |

**Recommendation**: Stay with Vercel (already configured).

### Database

| Option | Free Tier | Notes |
|--------|-----------|-------|
| **SQLite** | Unlimited | On Oracle VM, simplest ✓ |
| **Supabase** | 500MB PostgreSQL | If need cloud DB |
| **PlanetScale** | 1 billion reads/mo | MySQL |
| **Turso** | 9GB edge SQLite | Edge distributed |

**Recommendation**: SQLite hosted directly on the Oracle VM (with regular backups).

### Caching

| Option | Free Tier | Notes |
|--------|-----------|-------|
| **Redis Local** | Uses Oracle VM memory | Self-hosted ✓ |
| **Upstash Redis** | 10K commands/day | Serverless Redis (Deprecated) |

**Recommendation**: Run a Redis container locally on the Oracle VM. The 24GB RAM is more than enough and eliminates network latency.

### CDN

| Option | Free Tier | Notes |
|--------|-----------|-------|
| **Cloudflare** | Unlimited | Best free CDN ✓ |
| **Vercel Edge** | Included | Already have |

**Recommendation**: Add Cloudflare in front of the Oracle VM to hide the IP, handle TLS, and cache static responses.

### Monitoring & Analytics

| Option | Free Tier | Notes |
|--------|-----------|-------|
| **UptimeRobot** | 50 monitors | Uptime alerts |
| **Sentry** | 5K errors/mo | Error tracking |
| **Umami** | Self-host free | Privacy-focused Analytics |

---

## Deployment Architecture

```text
                     ┌─────────────────┐
                     │   Cloudflare    │
                     │   (CDN + DNS)   │
                     │      FREE       │
                     └────────┬────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │  Vercel   │   │ Oracle VM │   │  Cloud    │
      │ (Frontend)│   │ (Backend) │   │  (Assets) │
      │   FREE    │   │   FREE    │   │   FREE    │
      └───────────┘   └─────┬─────┘   └───────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ▼               ▼
              ┌─────────┐    ┌──────────┐
              │ SQLite  │    │  Redis   │
              │ (Local) │    │ (Docker) │
              │  FREE   │    │   FREE   │
              └─────────┘    └──────────┘
```

---

## Oracle Cloud Always Free Details

### What's Included (Forever)
- 4 ARM-based Ampere A1 cores
- 24 GB RAM total
- 200 GB block storage
- 10 TB/month outbound data
- Load balancer
- Object storage

### Setup Guide
1. Launch instance using `Canonical Ubuntu 22.04`.
2. Ensure you select the `Ampere A1` shape and allocate 4 OCPUs and 24GB memory.
3. Open ports 80 and 443 in the Oracle Virtual Cloud Network (VCN) security lists.
4. Install Docker and Docker Compose.
5. Setup Nginx reverse proxy + certbot for SSL, routing to FastAPI on port 8000.

---

## External APIs (All Free)

### Satellite Data

| API | Access | Limit |
|-----|--------|-------|
| Sentinel-5P | Free (Copernicus) | Unlimited |
| VIIRS | Free (NASA) | Unlimited |
| ERA5 | Free (CDS) | Rate limited |
| Open-Meteo | Free | 10K/day |

### Ground Truth

| API | Access | Limit |
|-----|--------|-------|
| OpenAQ | Free | 2K req/hr |
| AirQo | Partnership | Negotiate |

---

## Setup Checklist

### Oracle Cloud Account
- [ ] Create Oracle Cloud account (may require credit card for verification, but is free).
- [ ] Launch ARM Ampere instance in free tier region.
- [ ] SSH into instance and configure Docker.

### Cloudflare
- [ ] Create Cloudflare account.
- [ ] Add domain (`mframapa.ai`).
- [ ] Point DNS A record to the Oracle VM public IP (proxied).
- [ ] Configure Strict SSL.

### Vercel
- [ ] Already configured ✓
- [ ] Verify on free plan.

### Monitoring
- [ ] UptimeRobot account.
- [ ] Add backend URL monitor.
- [ ] Add frontend URL monitor.

---

*Zero Cost = Sustainable Forever*
