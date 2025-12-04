# Email Confirmation Setup Guide

## Problem
When users sign up, Supabase sends them a confirmation email. The link in that email needs to redirect them back to your application. However, the redirect URL is controlled by **both** your code AND Supabase settings.

## Solution

### 1. Configure Environment Variables

#### For Local Development (`.env`):
```env
VITE_APP_URL=http://localhost:5173
```

#### For Production (`.env.production`):
```env
VITE_APP_URL=https://your-production-domain.com
```

**Important:** Replace `https://your-production-domain.com` with your actual live URL.

### 2. Configure Supabase Dashboard

The redirect URL is **ALSO controlled by Supabase**. You must whitelist your URLs in the Supabase dashboard:

1. Go to: https://supabase.com/dashboard
2. Select your project: `guucarfnghsgisvdoxnt`
3. Navigate to: **Authentication** → **URL Configuration**
4. Find the **Redirect URLs** section
5. Add both URLs (one per line):
   ```
   http://localhost:5173/login
   https://your-production-domain.com/login
   ```

### 3. How It Works

When a user signs up:
1. Your code (`auth.ts`) sets `emailRedirectTo: ${VITE_APP_URL}/login`
2. Supabase sends an email with a confirmation link
3. User clicks the link
4. Supabase checks if the redirect URL is whitelisted
5. If whitelisted → redirects to your app with auth token
6. If NOT whitelisted → shows "Not Found" error

### 4. Current Issue Diagnosis

**Problem:** "Local signup redirects to live system, live signup shows 'not found'"

**Cause:** Your `.env` file has:
- ❌ Missing `VITE_APP_URL` → defaults to `window.location.origin`
- ❌ Supabase dashboard probably only has localhost whitelisted

**Fix:**
1. ✅ Add `VITE_APP_URL=http://localhost:5173` to `.env` (done)
2. ✅ Create `.env.production` with production URL (done)
3. ⚠️  **YOU MUST DO:** Add production URL to Supabase dashboard whitelist

### 5. Testing

#### Test Local Signup:
1. Run frontend: `npm run dev`
2. Sign up with a test email
3. Check email - link should go to `http://localhost:5173/login`

#### Test Production Signup:
1. Deploy with production environment variables
2. Sign up on live site
3. Check email - link should go to `https://your-domain.com/login`

### 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Email link goes to wrong domain | Check `VITE_APP_URL` in environment file |
| "Not Found" after clicking link | Add URL to Supabase dashboard whitelist |
| No email received | Check Supabase email provider settings |
| Link expired | Links expire after 24 hours by default |

### 7. Production Deployment Checklist

- [ ] Update `.env.production` with your live domain
- [ ] Add production URL to Supabase dashboard whitelist
- [ ] Deploy with production environment variables
- [ ] Test signup on live site
- [ ] Verify email link redirects correctly

## Visual Changes Made

The old alert has been replaced with a modern modal showing:
- ✅ Beautiful gradient success icon with pulse animation
- ✅ Clear instructions: "Check Your Email!"
- ✅ Shows the email address that was registered
- ✅ Warning box about confirming email
- ✅ Step-by-step next steps (1,2,3)
- ✅ "Go to Login" button
- ✅ "Didn't receive email?" link
- ✅ Mobile responsive design

## Files Modified

1. `frontend/.env` - Added `VITE_APP_URL` for local development
2. `frontend/.env.production` - Created for production config
3. `frontend/App.tsx` - Added email confirmation modal
4. `frontend/src/components/SignupPage.tsx` - Pass email to success handler
5. `frontend/src/services/auth.ts` - Already configured (uses `VITE_APP_URL`)
