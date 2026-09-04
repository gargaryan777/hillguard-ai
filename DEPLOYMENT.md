# ── HillGuard AI — Deployment Guide ──

Deploy the **full stack** (FastAPI backend + Next.js frontend) to free tiers.
Two services, ~15 minutes each, no credit card needed.

```
  Browser  →  Vercel (Next.js)  →  Render (FastAPI + ML model + DEM)
                  port 443               port 8000
```

---

## Part A — Backend → Render (free Docker web service)

The FastAPI app serves ML inference, terrain sampling, WebSocket alerts, and
SQLite (auto-seeds on boot). The `Dockerfile` installs GDAL for rasterio and
binds to Render's `$PORT`.

### Steps

1. Push the repo to GitHub (it already is — `ok-rupesh/hillguard-ai`).

2. Go to **https://dashboard.render.com** → **New +** → **Blueprint**.

3. Select the `hillguard-ai` repo. Render reads `render.yaml` and creates:
   - a web service `hillguard-ai-api` (free plan, Singapore region)
   - health check on `/api/health`

4. Click **Apply**. Build ~5 min (GDAL + pip install rasterio/scikit-learn).

5. When deploy finishes, copy the URL — looks like:
   `https://hillguard-ai-api.onrender.com`

6. Verify: open `https://hillguard-ai-api.onrender.com/api/health` in a browser.
   You should see `{"status":"healthy","model_loaded":true,"dem_available":true,...}`.

### Notes
- **Free tier sleeps** after 15 min idle. First request after sleep takes
  ~30s to spin up. For always-on, upgrade to a Starter plan ($7/mo).
- **Ephemeral filesystem**: SQLite + uploaded photos reset on each deploy.
  Fine for a demo. For persistence, attach a Render Disk (minimum paid) and
  set env vars `HILLGUARD_DB=/data/hillguard.db` and `UPLOAD_DIR=/data/uploads`.

---

## Part B — Frontend → Vercel (free)

1. Go to **https://vercel.com** → **Add New…** → **Project**.

2. Import the `hillguard-ai` GitHub repo.

3. **Root Directory**: set to `frontend` (click Edit, select the `frontend`
   folder — Vercel needs this because the Next.js app lives in a subfolder).

4. **Build & Output Settings**: leave defaults — Vercel auto-detects Next.js.
   Framework preset: **Next.js**.

5. **Environment Variables**: add one:
   ```
   NEXT_PUBLIC_API_URL = https://hillguard-ai-api.onrender.com
   ```
   (the URL you copied in Part A, no trailing slash)

6. **Deploy**. Build takes ~2 min.

7. After deploy, click **Visit**. You should see the HillGuard dashboard.
   Try the Risk Map tab — it should pull live data from the backend.

### Notes
- **WebSocket alerts** (`/ws/alerts`) need `wss://` — the frontend `api.ts`
  already handles this if `NEXT_PUBLIC_API_URL` is `https://...`.
- **CORS**: the backend sets `allow_origins=["*"]`, so no CORS config needed.
- To redeploy after code changes: push to GitHub → both Render and Vercel
  auto-deploy from `main`.

---

## Local development

```bash
# Terminal 1 — backend
cd hillguard-ai
pip install -r requirements.txt
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — frontend
cd hillguard-ai/frontend
npm install
npm run dev          # http://localhost:3000, auto-proxies to :8000
```

Frontend reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) — see
`frontend/.env.example`.

---

## Files added/changed for deployment

| File | Purpose |
|---|---|
| `Dockerfile` | Backend image: Python 3.11 + GDAL + rasterio + model/DEM |
| `.dockerignore` | Keeps node_modules, .git, *.db out of the image |
| `render.yaml` | Render Blueprint — one-click backend deploy |
| `frontend/Dockerfile` | Optional: Next.js as Docker (for Railway/Fly/VPS) |
| `frontend/.dockerignore` | Slim frontend image |
| `frontend/next.config.ts` | `output: "standalone"` for Docker builds |
| `frontend/.env.example` | Documents `NEXT_PUBLIC_API_URL` |
| `src/api/main.py` | Mounts `/uploads` as static files; `UPLOAD_DIR` env var |
| `DEPLOYMENT.md` | This guide |

---

## Troubleshooting

**Backend fails to start: "FileNotFoundError: src/models/..."**
→ The Dockerfile `COPY . .` copies from repo root. Make sure you're building
   from the repo root (where `requirements.txt` lives), not from `src/`.

**Frontend shows "API error" / blank dashboard**
→ Check `NEXT_PUBLIC_API_URL` in Vercel env vars. Must be the full Render URL
   including `https://`, no trailing slash. Redeploy after changing env vars.

**`/api/evaluate` returns 500**
→ The SRTM tile `data/terrain/N27E088.hgt` only covers Sikkim (27°N, 88°E).
   Coordinates outside that tile will error. This is expected.

**Render free tier cold starts**
→ First request after 15 min idle takes ~30s. For a hackathon demo, visit
   `/api/health` once before presenting to warm it up.
