# Deployment Guide: Mframapa AI

## Architecture

```
Frontend (Vercel) ──/api/──> Backend (Render)
     ↓                           ↓
  Static React              FastAPI + XGBoost
```

---

## Step 1: Deploy Backend on Render (Free)

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **New → Web Service**
3. Connect your GitHub repo: `yoadjei/Mframapa-AI`
4. Configure:
   - **Name**: `mframapa-api`
   - **Region**: Frankfurt (closest to Africa)
   - **Branch**: `main`
   - **Root Directory**: (leave empty)
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Click **Advanced** → Add Environment Variable:
   - `GEMINI_API_KEY` = your Gemini API key
6. Click **Create Web Service**

Your backend URL will be: `https://mframapa-api.onrender.com`

**Note**: Free tier sleeps after 15 min of inactivity. First request takes ~30 seconds to wake up.

---

## Step 2: Deploy Frontend on Vercel (Free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **New Project**
3. Import your GitHub repo: `yoadjei/Mframapa-AI`
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**

Your frontend URL will be: `https://mframapa-ai.vercel.app`

---

## Step 3: Connect Your Porkbun Domain

### For Frontend (Vercel)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain: `mframapa.com` (or whatever you bought)
3. Vercel will show you DNS records to add

### In Porkbun DNS:

```
Type    Host    Value/Answer                TTL
A       @       76.76.21.21                 300
CNAME   www     cname.vercel-dns.com        300
```

---

## Step 4: Update Backend URL (After Render Deploy)

Once Render gives you your URL (e.g., `https://mframapa-api.onrender.com`):

1. Edit `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/api/:path*"
       }
     ]
   }
   ```

2. Commit and push - Vercel will auto-redeploy

---

## Testing

After deployment:

1. Visit your domain
2. Search for "Accra" or any African city
3. Check console (F12) for any errors

---

## Costs

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Render | Free | Free (sleeps after 15min) |
| Porkbun Domain | Yearly | ~$10/year |

**Total: ~$10/year** (domain only)
