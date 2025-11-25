# 🎯 Environment Variables Checklist for Render Deployment

## Frontend Service (Render Static Site or Web Service)

### What You Need to Set:

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGc...` (long string) |
| `VITE_API_BASE_URL` | Your backend API URL | `https://parent-registration.onrender.com/api/v1` |

### Where to Set (in Render):
1. Go to Frontend Service
2. Click **Environment** tab
3. Add/Edit each variable
4. Click **Deploy** or **Manual Deploy**

### How to Get Values:
- **Supabase values:** Go to Supabase Project → Settings → API → Copy URL and anon key
- **Backend URL:** Go to Backend Service on Render, copy the URL, add `/api/v1`

---

## Backend Service (Render Web Service)

### What You Need to Set:

| Variable | Value | Source |
|----------|-------|--------|
| `SUPABASE_URL` | Supabase project URL | From Supabase Settings → API |
| `SUPABASE_ANON_KEY` | Supabase anon key | From Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | From Supabase Settings → API → Service Role Secret |
| `SUPABASE_JWT_SECRET` | Supabase JWT secret | From Supabase Settings → API → JWT Secret |
| `FRONTEND_URL` | Your frontend service URL | `https://parent-registration-frontend.onrender.com` |
| `RETURN_URL` | Backend API URL | `https://parent-registration.onrender.com/api/v1` |
| `WEBHOOK_URL` | Backend webhooks URL | `https://parent-registration.onrender.com/api/v1/webhooks` |

### Where to Set (in Render):
1. Go to Backend Service
2. Click **Environment** tab
3. Add/Edit each variable
4. Click **Deploy** or **Manual Deploy**

### How to Get Values:
- **Supabase values:** Go to Supabase Project → Settings → API
- **Service Role Secret:** Click "Show" under "service_role" secret (not anon key)
- **JWT Secret:** In Supabase Settings → API, copy from "JWT Secret" field
- **Frontend/Backend URLs:** From Render service dashboard

---

## Verification Checklist

### ✅ Quick Test (Do This First)

1. **Test Backend is Running:**
   - Open browser: `https://[your-backend].onrender.com/health`
   - Should see: `{"status": "healthy"}`
   - If error: Backend not deployed or has issues

2. **Test Frontend Can See Backend:**
   - Open browser Console (F12)
   - Go to Network tab
   - Try to submit a form on frontend
   - Look for request to `/api/v1/enrollment/submit`
   - If request fails: `VITE_API_BASE_URL` is wrong or not set

3. **Test Database Connection:**
   - Check backend logs (Render → Logs tab)
   - Should not see "SUPABASE" errors
   - Should not see connection refused errors

### 📋 Before You Submit a Form

- [ ] All 3 frontend variables are set
- [ ] All 7 backend variables are set
- [ ] Backend service health check returns `{"status": "healthy"}`
- [ ] Both services have been redeployed after setting variables
- [ ] Browser cache is cleared (Ctrl+Shift+Delete)

---

## Common Mistakes & Fixes

### ❌ "POST /api/v1/enrollment/submit 500"
**Likely cause:** `VITE_API_BASE_URL` not set or wrong

**Fix:**
- [ ] Set `VITE_API_BASE_URL` in frontend environment
- [ ] Value should be: `https://[backend-name].onrender.com/api/v1`
- [ ] Redeploy frontend
- [ ] Clear browser cache
- [ ] Try again

### ❌ "500 error" + Backend logs show Supabase errors
**Likely cause:** Missing or wrong Supabase variables in backend

**Fix:**
- [ ] Go to backend service → Environment
- [ ] Verify all `SUPABASE_*` variables are set
- [ ] Copy values directly from Supabase (no placeholders!)
- [ ] Redeploy backend
- [ ] Try again

### ❌ Backend URL doesn't work
**Likely cause:** Backend service not running or build failed

**Fix:**
- [ ] Go to backend service → Logs tab
- [ ] Look for errors or warnings
- [ ] Check build command: `pip install -r backend/requirements.txt`
- [ ] Check start command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Redeploy
- [ ] Check logs again

### ❌ CORS errors in console
**Likely cause:** `FRONTEND_URL` not set in backend or is wrong

**Fix:**
- [ ] Backend → Environment
- [ ] Set `FRONTEND_URL=https://[frontend-name].onrender.com`
- [ ] Redeploy backend
- [ ] Clear browser cache
- [ ] Try again

---

## Quick Reference: Where to Find Values

### Supabase Dashboard:
1. Log in to Supabase
2. Select your project
3. Go to **Settings** (gear icon)
4. Go to **API** tab
5. You'll see:
   - `Project URL` → Use as `SUPABASE_URL`
   - `anon public` (under "API Tokens") → Use as `SUPABASE_ANON_KEY`
   - `service_role` (click "Show") → Use as `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT Secret` → Use as `SUPABASE_JWT_SECRET`

### Render Dashboard:
1. Log in to Render
2. Select your service
3. Top of page shows URL like: `https://parent-registration.onrender.com`
4. Use this for `RETURN_URL`, `WEBHOOK_URL`, and frontend's `VITE_API_BASE_URL`

---

## Testing Sequence

1. **Set all variables** in Render Environment tabs
2. **Redeploy both services**
3. **Test health endpoint:** `curl https://[backend].onrender.com/health`
4. **Open frontend in browser**
5. **Fill out Step 1 form completely**
6. **Click Submit button**
7. **Expected result:** Success message and move to Step 2

---

## If Step 7 Fails

1. **Check browser console (F12):**
   - Look for error messages
   - Check Network tab → find POST request
   - Look at response body

2. **Check backend logs:**
   - Render → Backend Service → Logs
   - Search for "ERROR"
   - Read the error message

3. **Use this guide:**
   - `QUICK_FIX_500_ERROR.md` → Try these first
   - `TROUBLESHOOTING_500_ERROR.md` → Detailed solutions

---

## Success Indicators

✅ You'll know it's working when:
- Health endpoint returns `{"status": "healthy"}`
- Form submission completes without error
- Data appears in Supabase database (check in Supabase)
- You can proceed to Step 2
- Backend logs show no errors (only info messages)

---

**Save this file for reference during deployment!**
