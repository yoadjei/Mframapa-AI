# Mframapa AI — AWS EC2 Deployment Runbook

Deploys the backend **Cloudflare (TLS) → EC2 → nginx → uvicorn (FastAPI) → Redis** with Docker Compose. Simpler than Oracle: one firewall (security group), no capacity issues.

**Instance size**
| Option | RAM | Cost | Config |
|---|---|---|---|
| `t3.micro` / `t2.micro` | 1 GB | free (12-mo tier) | `WORKERS=1` + 3 GB swap — tight but works for a pilot |
| **`t3.small` (recommended)** | 2 GB | ~$15/mo or free-tier credits | `WORKERS=2`, comfortable |
| `t4g.small` (ARM) | 2 GB | ~$12/mo | same; the image is multi-arch |

**You need**: an AWS account, a domain on Cloudflare, trained bundles (`ml/exports/…`) + `ml/data/static_grid.csv` locally.

---

## 1. Launch the EC2 instance (console)

EC2 → **Launch instance**:
1. **Name:** `mframapa`
2. **AMI:** Ubuntu Server 22.04 LTS. (For `t4g` pick the **arm64** Ubuntu AMI; for `t3` the **x86_64** one.)
3. **Instance type:** `t3.small` (or `t3.micro` for strictly-free).
4. **Key pair:** create/download one (`.pem`) — this is your SSH key.
5. **Network settings → Edit → Security group** — create one, inbound rules:
   - SSH **22** — source **My IP**
   - HTTP **80** — source **0.0.0.0/0**
   - HTTPS **443** — source **0.0.0.0/0**
6. **Storage:** 20–30 GB gp3 (free tier allows 30 GB).
7. Confirm **Auto-assign public IP = Enable** (default VPC does).
8. **Launch instance.**

**Give it a stable IP (recommended):** EC2 → **Elastic IPs** → Allocate → Associate to the instance. (Free while attached to a running instance.) Use this IP for DNS.

---

## 2. Connect

```powershell
# lock down the key (Windows)
icacls "C:\path\to\mframapa.pem" /inheritance:r /grant:r "$($env:USERNAME):(R)"
# connect (Ubuntu AMI user = ubuntu)
ssh -i "C:\path\to\mframapa.pem" ubuntu@<PUBLIC_IP>
```

---

## 3. Server setup + Docker

```bash
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && newgrp docker
docker compose version

# swap — essential on t3.micro (1 GB), still a good safety net on 2 GB
sudo fallocate -l 3G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

> AWS Ubuntu AMIs do **not** ship a default-DROP firewall — the security group (§1) is the only firewall. No iptables step needed (unlike Oracle).

---

## 4. Code + models + .env

```bash
git clone <YOUR_REPO_URL> mframapa && cd mframapa
```
From your laptop, copy the gitignored artifacts up:
```powershell
scp -i "C:\path\to\mframapa.pem" -r ml/exports ubuntu@<PUBLIC_IP>:~/mframapa/ml/
scp -i "C:\path\to\mframapa.pem" ml/data/static_grid.csv ubuntu@<PUBLIC_IP>:~/mframapa/ml/data/
```
Minimal runtime `.env` on the instance (satellite/pipeline keys are **not** needed to serve):
```bash
printf 'MFRAMAPA_INTERNAL_KEY=%s\nALLOWED_ORIGINS=https://yourdomain\nENVIRONMENT=production\n' "$(openssl rand -hex 32)" > .env
```
> `REDIS_URL` is set by compose. See the Oracle runbook's env table for the full variable reference — the serving box needs only `MFRAMAPA_INTERNAL_KEY` + `ALLOWED_ORIGINS`.

**If on t3.micro (1 GB):** set `WORKERS: "1"` in `docker-compose.yml` (under the `api` service).

---

## 5. Deploy

```bash
docker compose up -d --build          # first ARM/x86 build: a few minutes
docker compose ps                     # redis, api, nginx running
docker compose logs -f api            # expect "inference: loaded N model bundle(s)"
curl -s localhost/api/health          # {"status":"ok",...}
curl -s -H "X-API-Key: <your key>" localhost/api/v1/health   # models_loaded>0, redis:true
```

---

## 6. Cloudflare TLS + domain

1. Cloudflare → DNS → **A record** → `app` → `<ELASTIC_IP>`, **Proxy ON**.
2. **SSL/TLS → Full**. Cloudflare does HTTPS; nginx serves plain :80.
3. Verify: `curl -s https://app.yourdomain/api/health`.

> No domain yet? You can test directly on the instance's public DNS over HTTP first, then add Cloudflare.

---

## 7. Operations

```bash
# update code
cd ~/mframapa && git pull && docker compose up -d --build
# update model (no rebuild — ml/exports is a volume)
# (scp new ml/exports up, then:)
docker compose restart api
# logs / memory
docker compose logs -f api
free -h && docker stats --no-stream
```

---

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| Can't SSH | Security group 22 open to your IP? Key perms locked (`icacls`)? User = `ubuntu`? |
| Site unreachable | Security group 80/443 open to `0.0.0.0/0`. |
| `api` OOM-killed / restarts | 1 GB too tight — set `WORKERS=1`, ensure 3 GB swap, or move to `t3.small`. |
| `models_loaded:0` | `ml/exports/<region>/<segment>/` bundles missing — re-`scp`, `docker compose restart api`. |
| `redis:false` | Redis container down, or `REDIS_URL` wrongly set in `.env` (remove it). |
| build fails on a dep | add the package to `requirements-api.txt`, rebuild. |
| 522 from Cloudflare | origin down on :80 — check nginx / security group. |

---

## 9. Go-live checklist
- [ ] Security group: 22 (my IP), 80 + 443 (0.0.0.0/0)
- [ ] Elastic IP associated (stable address)
- [ ] `docker compose ps` → redis + api + nginx running
- [ ] `/api/v1/health` → `models_loaded>0`, `redis:true`
- [ ] `WORKERS=1` if on 1 GB; 3 GB swap on
- [ ] Cloudflare A record proxied, SSL = Full
- [ ] `/predict` returns `source: model_ensemble`
- [ ] Benchmark reviewed
