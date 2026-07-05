# Deployment Guide

Frontend → **Vercel** · Backend → **Render** · Database → **MongoDB Atlas**

## 1. MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → add a database user with a strong password.
3. **Network Access** → allow access from `0.0.0.0/0` (or Render's static IPs).
4. Copy the connection string (Drivers → Node.js):
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`

## 2. Backend on Render

1. Push this repository to GitHub.
2. On [render.com](https://render.com): **New → Web Service**, connect the repo.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Environment variables:

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | your Atlas connection string |
   | `MONGODB_DB` | `elevator_erp` |
   | `JWT_SECRET` | long random string (`openssl rand -hex 64`) |
   | `JWT_REFRESH_SECRET` | different long random string |
   | `JWT_EXPIRES_IN` | `15m` |
   | `JWT_REFRESH_EXPIRES_IN` | `7d` |
   | `CORS_ORIGINS` | `https://<your-app>.vercel.app` |
   | `FRONTEND_URL` | `https://<your-app>.vercel.app` |
   | `RATE_LIMIT_MAX` | `500` |

5. Deploy. Verify `https://<service>.onrender.com/api/health` returns `{"success":true}`.
6. Seed the first admin (Render → Shell): `node utils/seed.js`
   (set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` env vars first for custom credentials).

> Note: Render's free-tier disk is ephemeral — files in `uploads/` are lost on redeploy. Attach a persistent disk mounted at `/opt/render/project/src/backend/uploads` or use S3/Cloudinary for production file storage.

## 3. Frontend on Vercel

1. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo.
2. Settings:
   - **Root Directory**: `frontend`
   - Framework preset: Next.js (auto-detected)
3. Environment variable:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<service>.onrender.com/api` |

4. Deploy, then update the backend's `CORS_ORIGINS` / `FRONTEND_URL` with the final Vercel URL and redeploy the backend.

## 4. Post-deployment checklist

- [ ] `/api/health` returns ok
- [ ] Login with seeded admin works
- [ ] Change the seeded admin password (Users & Audit → Edit)
- [ ] Configure company info in **Settings**
- [ ] Generate notifications: **POST** `/api/notifications/generate` runs automatically-detectable alerts (AMC/warranty expiry, upcoming services, salary due) — schedule it via a cron job (e.g. Render Cron Job hitting the endpoint with an admin token) for daily automation.
