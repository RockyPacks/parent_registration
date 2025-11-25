# Render Deployment Guide for Parent Registration App

## Overview
This guide walks you through deploying the Parent Registration application to Render.com, including both the frontend and backend services.

## Prerequisites
- GitHub account with repository pushed
- Render account (render.com)
- Supabase project with:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`

---

## Part 1: Deploy Backend to Render

### 1. Create a New Web Service

1. Go to [Render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository containing your project

### 2. Configure Backend Service

Fill in the following settings:

| Field | Value |
|-------|-------|
| **Name** | `parent-registration` (or your preferred name) |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r backend/requirements.txt` |
| **Start Command** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000` |
| **Root Directory** | `/` (leave empty for root) |

### 3. Set Environment Variables

Click on **Environment** and add these variables:

```
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=https://parent-registration-frontend.onrender.com
RETURN_URL=https://your-backend-url.onrender.com/api/v1
WEBHOOK_URL=https://your-backend-url.onrender.com/api/v1/webhooks
```

**Important Notes:**
- Replace `your_supabase_*` values with your actual Supabase credentials
- Replace `your-backend-url` with the actual Render service URL (visible after first deployment)
- The backend URL will typically be: `https://parent-registration.onrender.com`
- The frontend URL should match your frontend service URL

### 4. Deploy

Click **Deploy** and wait for the build to complete. Note the service URL (e.g., `https://parent-registration.onrender.com`).

---

## Part 2: Deploy Frontend to Render

### 1. Create a New Static Site or Web Service

**Option A: Static Site (Recommended)**
1. Click **New +** → **Static Site**
2. Connect your GitHub repository
3. Select the repository

**Option B: Web Service (If Static Site doesn't work)**
1. Click **New +** → **Web Service**
2. Connect your GitHub repository

### 2. Configure Frontend

#### For Static Site:
| Field | Value |
|-------|-------|
| **Name** | `parent-registration-frontend` |
| **Build Command** | `cd frontend && npm install && npm run build` |
| **Publish Directory** | `frontend/dist` |

#### For Web Service:
| Field | Value |
|-------|-------|
| **Name** | `parent-registration-frontend` |
| **Environment** | `Node` |
| **Build Command** | `cd frontend && npm install && npm run build && npm install -g serve` |
| **Start Command** | `serve -s frontend/dist -l 3000` |

### 3. Set Environment Variables

**Very Important:** Add these environment variables in **Environment** tab:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=https://parent-registration.onrender.com/api/v1
```

**Critical:** Replace `parent-registration.onrender.com` with your actual backend service URL from Part 1.

### 4. Deploy

Click **Deploy** and wait for the build to complete.

---

## Part 3: Update Backend Environment Variables

After the frontend is deployed, go back to the backend service settings and update:

```
FRONTEND_URL=https://parent-registration-frontend.onrender.com
```

Replace `parent-registration-frontend` with your actual frontend service name.

**Then redeploy the backend** by:
1. Going to backend service settings
2. Click the menu → **Manual Deploy** → **Deploy Latest Commit**

---

## Troubleshooting

### Frontend shows "API request failed: 500 Internal Server Error"

**Cause:** `VITE_API_BASE_URL` is not set or incorrect in the frontend environment.

**Solution:**
1. Go to frontend service on Render
2. Go to **Environment**
3. Verify `VITE_API_BASE_URL` is set to your backend URL
4. Redeploy by clicking the deploy button again

### Backend shows "500 Internal Server Error"

**Cause:** Missing Supabase environment variables.

**Solution:**
1. Go to backend service on Render
2. Go to **Environment**
3. Verify all Supabase variables are set:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`
4. Redeploy

### "Cannot POST /api/v1/enrollment/submit"

**Cause:** Backend is not running or the route is not found.

**Solution:**
1. Check backend logs: Go to backend service → Logs tab
2. Verify build command includes `backend/` prefix
3. Verify start command is correct: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`

### CORS errors in browser console

**Cause:** Frontend URL not added to CORS allowed origins in backend.

**Solution:**
1. Update `FRONTEND_URL` in backend environment variables
2. Redeploy backend
3. Clear browser cache (Ctrl+Shift+Delete)

---

## Monitoring

### View Logs
1. Go to service on Render
2. Click **Logs** tab to see real-time logs

### View Metrics
1. Go to service on Render
2. Click **Metrics** tab to see CPU, memory, and request metrics

### Update Environment Variables
1. Go to service → **Environment**
2. Edit variables
3. Changes take effect on next deploy or manual redeploy

---

## Important URLs Reference

After deployment, your URLs will be:

- **Backend API:** `https://parent-registration.onrender.com/api/v1`
- **Frontend:** `https://parent-registration-frontend.onrender.com`
- **Health Check:** `https://parent-registration.onrender.com/health`

Use these URLs when configuring:
- Frontend's `VITE_API_BASE_URL`
- Backend's `FRONTEND_URL`
- Any third-party integrations

---

## Next Steps

1. Test the application end-to-end
2. Monitor logs for errors
3. Set up error tracking (e.g., Sentry) for production
4. Configure database backups
5. Set up automated deployments if needed

---

## Support

If you encounter issues:
1. Check Render logs for detailed error messages
2. Verify all environment variables are correctly set
3. Ensure Supabase is accessible from Render (check network settings)
4. Check CORS configuration if frontend can't reach backend
