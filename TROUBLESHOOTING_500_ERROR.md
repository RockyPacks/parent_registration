# Troubleshooting 500 Internal Server Error

## Error: POST https://parent-registration.onrender.com/api/v1/enrollment/submit 500 (Internal Server Error)

This guide helps you debug and fix the 500 error when submitting Step 1 of the application.

---

## Root Causes & Solutions

### 1. Missing Environment Variables in Frontend ⭐ MOST COMMON

**Symptom:** Frontend works but can't reach backend API.

**Check:**
1. Open your frontend service on Render
2. Go to **Environment** tab
3. Look for `VITE_API_BASE_URL` variable

**Solution:**
If missing or incorrect, add or update:
```
VITE_API_BASE_URL=https://parent-registration.onrender.com/api/v1
```

Replace `parent-registration` with your actual backend service name.

**Redeploy:**
1. Click the deploy button or manually redeploy
2. Clear browser cache (Ctrl+Shift+Delete)
3. Try the submission again

---

### 2. Backend Can't Connect to Supabase

**Symptom:** Backend logs show Supabase connection errors.

**Check Render Logs:**
1. Go to backend service on Render
2. Click **Logs** tab
3. Look for errors like:
   - "Failed to connect to Supabase"
   - "Invalid API key"
   - "Missing SUPABASE_URL"

**Solution:**
1. Go to backend service → **Environment**
2. Verify ALL of these are set:
   ```
   SUPABASE_URL=your_actual_url
   SUPABASE_ANON_KEY=your_actual_key
   SUPABASE_SERVICE_ROLE_KEY=your_actual_key
   SUPABASE_JWT_SECRET=your_actual_secret
   ```

3. Values should NOT contain angle brackets like `<your_url>`
4. Copy values directly from Supabase dashboard
5. Redeploy backend

---

### 3. Database Schema Issues

**Symptom:** Backend logs show table not found or column errors.

**Check:**
1. Backend logs mention errors like:
   - "table 'students' does not exist"
   - "column 'next_of_kin_id_number' does not exist"

**Solution:**
1. Ensure migrations have been run in Supabase
2. Check `backend/db/migrations/` folder for SQL files
3. Run migrations in Supabase SQL editor:
   - Go to Supabase dashboard → SQL Editor
   - Run each SQL file from the migrations folder
   - Order typically: schema tables → relationships → policies

**Key tables needed:**
- `applications`
- `students`
- `medical_info`
- `family_info`
- `fee_responsibility`

---

### 4. CORS Configuration Error

**Symptom:** Browser console shows CORS error, not 500 from API.

**Check:**
- Frontend URL differs from what's in backend config

**Solution:**
1. Backend service → **Environment**
2. Update `FRONTEND_URL` to match your frontend service URL:
   ```
   FRONTEND_URL=https://parent-registration-frontend.onrender.com
   ```
3. Redeploy backend
4. Clear browser cache

---

### 5. Validation Error in Request Data

**Symptom:** Backend logs show validation errors for specific fields.

**Check:**
1. Backend logs mention field validation failures
2. Look for errors like:
   - "ensure this value has at least 1 character"
   - "value is not a valid email"
   - "ensure this value is a valid integer"

**Solution:**
Check frontend is sending correct data format:

**Required Fields for Step 1:**
- **Student:**
  - `surname` - not empty
  - `first_name` - not empty
  - `date_of_birth` - format: YYYY-MM-DD
  - `gender` - lowercase: male/female/other
  - `home_language` - not empty
  - `id_number` - exactly 13 digits (no spaces)
  - `previous_grade` - not empty
  - `grade_applied_for` - not empty
  - `previous_school` - not empty

- **Family:** (at least one parent required)
  - `father_surname`, `father_first_name`, `father_id_number`, `father_mobile`, `father_email`
  - OR
  - `mother_surname`, `mother_first_name`, `mother_id_number`, `mother_mobile`, `mother_email`

- **Fee:**
  - `fee_person` - not empty
  - `relationship` - not empty
  - `fee_terms_accepted` - must be true

**Note:** Optional fields like `middle_name`, `preferred_name`, `next_of_kin_*` can be empty.

---

### 6. Invalid ID Number Format

**Symptom:** Backend logs show regex validation error for ID numbers.

**Check:**
- ID numbers must be exactly 13 digits
- No spaces, letters, or special characters allowed

**Example Valid:** `1234567890123`
**Example Invalid:** `123456789 012` (has space)

**Solution:**
Frontend should strip spaces from ID numbers before sending.

---

### 7. Database Migration Issues

**Symptom:** Backend logs show "missing column" or "table not found" errors.

**Solution - Check which tables exist:**
1. Go to Supabase dashboard
2. Navigate to **SQL Editor**
3. Run this query to check existing tables:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

4. If tables are missing, run the migrations:
   ```sql
   -- From backend/db/migrations/ folder
   -- Run all SQL files in order
   ```

---

## How to Debug Further

### Step 1: Check Frontend Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for error messages with details
4. Check **Network** tab → POST request to `/api/v1/enrollment/submit`
5. Click on the failed request → see response body for error details

### Step 2: Check Backend Logs
1. Go to Render backend service
2. Click **Logs** tab
3. Search for "submit" or "error"
4. Look for stack traces

### Step 3: Test Backend Directly
Use curl or Postman to test if backend is working:

```bash
# First, get an auth token (requires setting up test user)
# Then test the endpoint:
curl -X POST https://parent-registration.onrender.com/health
```

Should return `{"status": "healthy"}`

### Step 4: Check Environment Variables Match

Create a checklist:

**Frontend (.env or Render Environment):**
- [ ] `VITE_SUPABASE_URL` - set to your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - set to your anon key
- [ ] `VITE_API_BASE_URL` - set to `https://parent-registration.onrender.com/api/v1`

**Backend (.env or Render Environment):**
- [ ] `SUPABASE_URL` - matches frontend's URL
- [ ] `SUPABASE_ANON_KEY` - matches frontend's key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - from Supabase
- [ ] `SUPABASE_JWT_SECRET` - from Supabase
- [ ] `FRONTEND_URL` - your frontend URL
- [ ] `RETURN_URL` - backend URL with `/api/v1`
- [ ] `WEBHOOK_URL` - backend URL with `/api/v1/webhooks`

---

## Common Error Messages & Fixes

### "Failed to submit enrollment: Invalid API key"
- Fix: Check `SUPABASE_ANON_KEY` is correct
- Redeploy backend

### "Failed to submit enrollment: database connection failed"
- Fix: Check `SUPABASE_URL` is correct and network accessible
- Verify Supabase project is active

### "Failed to submit enrollment: table 'students' does not exist"
- Fix: Run database migrations in Supabase
- Check all tables are created

### "Failed to submit enrollment: Invalid request data"
- Fix: Check ID numbers are 13 digits, dates in YYYY-MM-DD format
- Ensure required fields are not empty

### "Cannot POST /api/v1/enrollment/submit"
- Fix: Backend service not running
- Check backend build/start command
- Redeploy backend

---

## Need More Help?

1. **Check Render Logs:**
   - Backend service → Logs tab
   - Search for "ERROR" or "Traceback"

2. **Check Frontend Console:**
   - Press F12 in browser
   - Console tab shows frontend errors
   - Network tab shows API responses

3. **Test Connectivity:**
   - Open `https://parent-registration.onrender.com/health`
   - Should return `{"status": "healthy"}`

4. **Verify Supabase:**
   - Login to Supabase dashboard
   - Check project is active
   - Test database connection with SQL query

---

## Deployment Checklist

Before submitting again, verify:

- [ ] Backend service is running (check Logs)
- [ ] Frontend can reach backend (`VITE_API_BASE_URL` set correctly)
- [ ] All Supabase environment variables are set in backend
- [ ] Database migrations are applied
- [ ] No CORS errors in browser console
- [ ] ID numbers are exactly 13 digits
- [ ] Date format is YYYY-MM-DD
- [ ] All required fields in Step 1 are filled
- [ ] Browser cache is cleared (Ctrl+Shift+Delete)

---

## Still Having Issues?

1. **Capture the full error:**
   - Take screenshot of backend logs showing the error
   - Take screenshot of browser Network tab response
   - Note exact error message

2. **Verify setup:**
   - Run through RENDER_DEPLOYMENT_GUIDE.md again
   - Double-check environment variables
   - Redeploy both services

3. **Test locally first:**
   - Run frontend and backend locally
   - Test submission works
   - Then deploy to Render

---

Remember: Most 500 errors are due to missing/incorrect environment variables. Start with the checklist above!
