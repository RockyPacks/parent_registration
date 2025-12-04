# Deployment Verification Checklist

## Current Deployment Status

**Frontend**: `https://parent-registration-frontend.onrender.com` (Static Site)
**Backend**: `https://parent-registration.onrender.com` (Web Service)

## ✅ Render Environment Variables - Verified

### Frontend (Static Site)
- ✅ `VITE_APP_URL` → Should be `https://parent-registration-frontend.onrender.com`
- ✅ `VITE_SUPABASE_URL` → Your Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key
- ✅ `VITE_API_BASE_URL` → `https://parent-registration.onrender.com/api/v1`

### Backend (Web Service)
- ✅ `FRONTEND_URL` → Should be `https://parent-registration-frontend.onrender.com`
- ✅ `SUPABASE_URL` → Your Supabase project URL
- ✅ `SUPABASE_ANON_KEY` → Your Supabase anon key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` → Your service role key (secret)
- ✅ `SUPABASE_JWT_SECRET` → Your JWT secret

## 🔧 Supabase Configuration - ACTION REQUIRED

### Step 1: Update Site URL

Go to: **Supabase Dashboard → Authentication → URL Configuration**

**Site URL** (change to):
```
https://parent-registration-frontend.onrender.com
```

### Step 2: Update Redirect URLs

**REMOVE these** (causing verification issues):
```
❌ https://parent-registration-frontend.onrender.com/login
❌ https://parent-registration-frontend.onrender.com/auth/callback
❌ http://localhost:5173/login
```

**KEEP only these**:
```
✅ https://parent-registration-frontend.onrender.com
✅ https://parent-registration-frontend.onrender.com/**
✅ http://localhost:5173
✅ http://localhost:5173/**
```

**Why?** The code now redirects to the root `/` path, allowing Supabase to automatically process the confirmation token via `detectSessionInUrl: true`. Adding specific paths like `/login` or `/auth/callback` interferes with this automatic detection.

### Step 3: Verify Email Provider Settings

Go to: **Supabase Dashboard → Authentication → Providers → Email**

Ensure:
- ✅ **Enable email provider** is checked
- ✅ **Confirm email** is checked
- ⚠️ **Mailer autoconfirm** is UNCHECKED (requires email confirmation)

## 🧪 Testing Email Confirmation

### Test Procedure

1. **Sign up** at `https://parent-registration-frontend.onrender.com/signup`
   - Use a real email address you can access
   - Fill in full name, email, password
   - Click "Sign Up"

2. **Verify toast notification**
   - Should see green toast in top-right: "Email Confirmation Sent!"
   - Toast auto-hides after 5 seconds
   - Can click "Go to Login" or X to close

3. **Check email inbox**
   - Look for email from Supabase (check spam)
   - Subject: "Confirm your signup"
   - Should arrive within 1-2 minutes

4. **Click confirmation link**
   - URL should be: `https://parent-registration-frontend.onrender.com/#access_token=...`
   - Browser automatically processes the token
   - Should see brief loading, then redirect to dashboard (logged in)

5. **Verify in Supabase**
   - Go to: **Supabase Dashboard → Authentication → Users**
   - Find your email
   - Check `email_confirmed_at` column → Should have a timestamp
   - Status should show "Confirmed"

### Expected Flow

```
User signs up
    ↓
Toast appears: "Email Confirmation Sent!"
    ↓
User checks email
    ↓
User clicks confirmation link
    ↓
Redirects to: https://parent-registration-frontend.onrender.com/#access_token=...
    ↓
Supabase client (detectSessionInUrl: true) processes token automatically
    ↓
User's email verified (email_confirmed_at set)
    ↓
User automatically logged in
    ↓
Dashboard loads
```

## 🐛 Troubleshooting

### Issue: Email not received

**Check:**
1. Spam/junk folder
2. Email provider settings (some block automated emails)
3. Supabase logs: **Dashboard → Logs → Auth Logs**
4. Verify email provider is enabled in Supabase

### Issue: "Invalid redirect URL" error

**Solution:**
1. Check Supabase redirect URLs match exactly
2. No trailing slashes
3. Include wildcard `/**` pattern
4. Verify Site URL is set

### Issue: Email confirmed but not logged in

**Check:**
1. Browser console for errors
2. Clear browser cache/cookies
3. Try incognito/private browsing
4. Verify `VITE_APP_URL` matches Site URL

### Issue: Token expired

**Solution:**
- Confirmation links expire after 24 hours
- Request new signup if link expired
- User can resend confirmation email (feature to add)

### Debug Commands

**Check session in browser console:**
```javascript
// Open DevTools → Console
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User:', data.session?.user);
console.log('Email confirmed:', data.session?.user?.email_confirmed_at);
```

**Expected output when working:**
- `Session`: Shows access_token, refresh_token
- `User`: Shows email and user_metadata
- `Email confirmed`: Shows timestamp (e.g., "2025-12-04T15:30:00Z")

## 📋 Deployment Steps (After Supabase Changes)

### 1. Verify Environment Variables

**Frontend** (`VITE_APP_URL`):
```bash
# Should output: https://parent-registration-frontend.onrender.com
echo $VITE_APP_URL
```

**Backend** (`FRONTEND_URL`):
```bash
# Should output: https://parent-registration-frontend.onrender.com
echo $FRONTEND_URL
```

### 2. Re-deploy Services (if needed)

If you made environment variable changes:

1. Go to Render Dashboard
2. Click on each service
3. Click "Manual Deploy" → "Clear build cache & deploy"
4. Wait for both deployments to complete

### 3. Test End-to-End

- [ ] Visit frontend URL
- [ ] Click "Sign Up"
- [ ] Fill form and submit
- [ ] Verify toast appears
- [ ] Check email inbox
- [ ] Click confirmation link
- [ ] Verify logged in automatically
- [ ] Check Supabase: `email_confirmed_at` is set

## 🔒 Security Checklist

- [x] `.env.production` in `.gitignore`
- [x] No sensitive keys in GitHub
- [x] HTTPS for production URLs
- [x] Email confirmation required
- [x] Password validation (8+ chars, uppercase, lowercase, special)
- [x] Rate limiting enabled (backend)
- [x] sessionStorage (tab-specific sessions)
- [x] CORS configured for frontend domain

## 📊 Current Code Status

### ✅ Code Changes Applied

1. **auth.ts** (Line 72):
   ```typescript
   const emailRedirectUrl = `${redirectUrl}/`;  // Root path, not /login
   ```

2. **supabase.ts**:
   ```typescript
   detectSessionInUrl: true,  // Auto-process confirmation tokens
   storage: sessionStorage,   // Tab-specific sessions
   flowType: 'pkce',         // Enhanced security
   ```

3. **App.tsx**:
   - Toast notification for email confirmation
   - Auto-hide after 5 seconds
   - initAuthListener handles token detection

4. **.gitignore**:
   - `.env.production` excluded
   - `.env.development` excluded

### 🔄 What Changed from Before

**Before**:
```typescript
emailRedirectTo: `${redirectUrl}/login`  // ❌ Wrong
```

**After**:
```typescript
emailRedirectTo: `${redirectUrl}/`  // ✅ Correct
```

**Why this fixes it**: Redirecting to `/login` meant the page loaded before Supabase could process the token in the URL hash. By redirecting to `/` (root), Supabase's `detectSessionInUrl` has time to extract and verify the token, setting `email_confirmed_at` before any UI renders.

## 📞 Support Contacts

**Supabase Docs**: https://supabase.com/docs/guides/auth/auth-email
**Render Docs**: https://render.com/docs
**GitHub Issues**: https://github.com/RockyPacks/parent_registration/issues

## ✅ Final Checklist

### Supabase Configuration
- [ ] Site URL set to `https://parent-registration-frontend.onrender.com`
- [ ] Redirect URLs cleaned up (only root and wildcard)
- [ ] Email provider enabled
- [ ] Email confirmation required

### Render Configuration
- [ ] `VITE_APP_URL` set in frontend environment
- [ ] `FRONTEND_URL` set in backend environment
- [ ] Both services deployed successfully

### Testing
- [ ] Signup creates user
- [ ] Toast notification appears
- [ ] Email received
- [ ] Confirmation link works
- [ ] User verified in Supabase
- [ ] Auto-login successful

### Production Ready
- [ ] All tests pass
- [ ] No console errors
- [ ] Email flow works end-to-end
- [ ] Security best practices followed

---

**Last Updated**: 2025-12-04
**Status**: Code deployed, awaiting Supabase configuration update
