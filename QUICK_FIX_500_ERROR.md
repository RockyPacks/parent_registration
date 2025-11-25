# Quick Fix Checklist for 500 Error

## 🚨 Your Issue
Frontend getting "500 Internal Server Error" when submitting Step 1 enrollment.

## ⚡ Quick Fixes (Try These First)

### 1. Frontend Environment Variable ⭐ LIKELY CULPRIT
Go to Render → Your Frontend Service → Environment

**Add or Update:**
```
VITE_API_BASE_URL=https://parent-registration.onrender.com/api/v1
```

Then: **Redeploy** → Clear browser cache → Try again

---

### 2. Backend Environment Variables
Go to Render → Your Backend Service → Environment

**Verify these are ALL set:**
```
SUPABASE_URL=your_url_from_supabase
SUPABASE_ANON_KEY=your_key_from_supabase
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://parent-registration-frontend.onrender.com
RETURN_URL=https://parent-registration.onrender.com/api/v1
WEBHOOK_URL=https://parent-registration.onrender.com/api/v1/webhooks
```

**Note:** Replace service names with YOUR actual names from Render.

Then: **Redeploy** → Try again

---

### 3. Check Backend is Running
Open in browser: `https://parent-registration.onrender.com/health`

Should see: `{"status":"healthy"}`

If not, redeploy backend.

---

### 4. Check Logs for Real Error
1. Go to backend service on Render
2. Click **Logs** tab
3. Look for "ERROR" or "Traceback"
4. Read the error message carefully

Common errors:
- `SUPABASE_URL not set` → Fix: Add to Environment
- `table 'students' does not exist` → Fix: Run database migrations
- `Failed to connect` → Fix: Check Supabase URL and keys

---

## 🔍 Verify Your URLs

**Get your actual URLs:**
1. Go to Render dashboard
2. Find your services:
   - Backend service name (e.g., `parent-registration`)
   - Frontend service name (e.g., `parent-registration-frontend`)

**Your URLs will be:**
```
Backend: https://[your-backend-name].onrender.com
Frontend: https://[your-frontend-name].onrender.com
API: https://[your-backend-name].onrender.com/api/v1
```

---

## 📋 Complete Setup Steps

### If You Haven't Deployed Yet:

1. **Backend Deployment:**
   - Create Web Service on Render
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - Add all Supabase env vars
   - Deploy & note the URL

2. **Frontend Deployment:**
   - Create Static Site or Web Service on Render
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist` (if Static Site)
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=your_url
     VITE_SUPABASE_ANON_KEY=your_key
     VITE_API_BASE_URL=https://[backend-name].onrender.com/api/v1
     ```
   - Deploy & note the URL

3. **Update Backend FRONTEND_URL:**
   - Go back to backend service
   - Add/Update: `FRONTEND_URL=https://[frontend-name].onrender.com`
   - Redeploy backend

---

## 🧪 Test It Works

1. Go to frontend: `https://[frontend-name].onrender.com`
2. Fill in Step 1 form completely
3. Click Submit
4. Should see success message
5. Should move to Step 2

If still 500 error, check logs (see step above).

---

## 🆘 If Still Failing

1. **Take a screenshot** of:
   - Render backend logs (Logs tab)
   - Browser DevTools Network tab (F12 → Network)
   - The error response body

2. **Verify checklist:**
   - [ ] `VITE_API_BASE_URL` set on frontend
   - [ ] All Supabase vars set on backend
   - [ ] Backend service URL correct in frontend env var
   - [ ] Frontend service URL set in backend `FRONTEND_URL`
   - [ ] Browser cache cleared
   - [ ] Both services redeployed

3. **Check connectivity:**
   - Open: `https://[backend-name].onrender.com/health`
   - Should return: `{"status":"healthy"}`

---

## 📚 Full Guides

- **Detailed Setup:** See `RENDER_DEPLOYMENT_GUIDE.md`
- **Full Troubleshooting:** See `TROUBLESHOOTING_500_ERROR.md`

---

**95% of 500 errors = Missing or wrong environment variable. Focus there first!**
