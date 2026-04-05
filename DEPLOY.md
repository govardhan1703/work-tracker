# Deploy checklist (daily-tracker + backend)

## 1. MongoDB Atlas

- **Network Access:** allow **`0.0.0.0/0`** (or your host’s IPs).
- **Database user** + connection string with database path (e.g. `/track`).

## 2. Backend (e.g. Render)

Set environment variables:

| Variable | Value |
|----------|--------|
| `MONGODB_URI` | Full Atlas URI (see `backend/.env.example`) |
| `CORS_ORIGIN` | Your **frontend** origin only, e.g. `https://your-app.vercel.app` (comma-separated for multiple) |
| `PORT` | Usually set automatically by the host |

Start command: `npm start` (runs `node src/index.js`).

After deploy, open `https://YOUR-API/api/health` — expect `"mongo":"connected"` when Atlas is reachable.

## 3. Frontend (e.g. Vercel / Netlify)

1. Set **`VITE_API_URL`** to your **public API base** (same as browser would use: `https://YOUR-API.onrender.com`, no `/api`, no trailing slash).
   - Either add `daily-tracker/.env.production` (see `.env.production.example`) **or** set `VITE_API_URL` in the host’s build settings.
2. Build: `npm run build` from `daily-tracker/`.
3. Publish the `dist/` folder (or connect the repo and let the host run the build).

## 4. Smoke test (production)

- Open the **live** frontend URL (not localhost).
- DevTools → **Network:** API calls must go to **`https://YOUR-API...`**, not `localhost`.
- No **CORS** errors in the console.
- Edit the table; reload — data should persist (MongoDB).

## If something breaks

| Symptom | Likely fix |
|---------|------------|
| Requests to `localhost` from live site | Rebuild frontend with correct `VITE_API_URL`. |
| CORS errors | Add your exact frontend URL to backend `CORS_ORIGIN`. |
| API up but `mongo` disconnected | Atlas network access, or wrong `MONGODB_URI` on the host. |
