# Email Confirmation Setup for Live Site

## Production Environment Configuration

### 1. Supabase Email Settings (Production)

1. **Go to Supabase Dashboard** → Your Project → Authentication → URL Configuration

2. **Set the Site URL** (where users will be redirected after email confirmation):
   ```
   https://your-production-domain.com
   ```

3. **Add Redirect URLs** (allowed URLs for authentication):
   ```
   https://your-production-domain.com/**
   https://your-production-domain.com/login
   https://your-production-domain.com/auth/callback
   ```

4. **Email Templates** → Confirm signup
   - Edit the confirmation email template:
   ```html
   <h2>Confirm your signup</h2>
   <p>Follow this link to confirm your user:</p>
   <p><a href="{{ .ConfirmationURL }}">Confirm your email address</a></p>
   ```

5. **Important**: The `{{ .ConfirmationURL }}` will automatically redirect to:
   ```
   https://your-production-domain.com/auth/callback?token=...
   ```

### 2. Frontend Environment Variables (.env.production)

**Create/Update** `frontend/.env.production`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://guucarfnghsgisvdoxnt.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# CRITICAL: Set to your actual production domain
VITE_APP_URL=https://your-production-domain.com

# API Base URL
VITE_API_BASE_URL=https://your-production-backend-api.com/api/v1
```

**⚠️ IMPORTANT**: 
- Replace `your-production-domain.com` with your actual domain
- The `VITE_APP_URL` controls where users are redirected after email confirmation
- Never commit `.env.production` to GitHub (it's in `.gitignore`)

### 3. Backend Environment Variables (.env.production)

**Create/Update** `backend/.env.production`:

```env
# Supabase Configuration
SUPABASE_URL=https://guucarfnghsgisvdoxnt.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://your-production-domain.com

# Application Settings
DEBUG=false
SECRET_KEY=your-long-random-secret-key-min-32-chars

# CORS Settings
ALLOWED_HOSTS=your-production-domain.com;api.your-production-domain.com

# Logging
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=3600
```

### 4. Email Confirmation Flow (Production)

**How it works:**

1. **User Signs Up**:
   ```
   https://your-production-domain.com/signup
   ```
   - User fills in email, password, name
   - Backend calls Supabase auth.signUp()
   - Supabase sends confirmation email

2. **Confirmation Email Sent**:
   - Email contains link: `https://your-production-domain.com/auth/callback?token=...`
   - User clicks link in email

3. **Email Verification**:
   - User redirected to: `https://your-production-domain.com/auth/callback?token=...`
   - Supabase automatically verifies the token
   - If valid, user's `email_confirmed_at` is set

4. **Auto-Login Redirect**:
   - After verification, Supabase redirects to: `https://your-production-domain.com/login`
   - Toast notification shows: "Email Confirmation Sent!"
   - User can now log in with verified account

### 5. Toast Notification (Already Implemented)

The toast notification appears automatically after signup:
- **Position**: Top-right corner (fixed overlay)
- **Duration**: 5 seconds (auto-hide)
- **Actions**: "Go to Login" button, "Close" button, and X icon
- **Style**: Green success theme with checkmark icon
- **Non-intrusive**: Doesn't affect page layout

### 6. Testing Email Confirmation (Production)

1. **Sign up** with a real email address
2. **Check email** (and spam folder)
3. **Click confirmation link** - should redirect to:
   ```
   https://your-production-domain.com/login
   ```
4. **See toast notification** - confirms email was sent
5. **Login** with verified credentials

### 7. Deployment Checklist

- [ ] Update `VITE_APP_URL` in frontend `.env.production`
- [ ] Update `FRONTEND_URL` in backend `.env.production`
- [ ] Set Supabase Site URL to production domain
- [ ] Add production domain to Supabase Redirect URLs
- [ ] Test email confirmation flow end-to-end
- [ ] Verify toast notification appears after signup
- [ ] Confirm users can login after email verification
- [ ] Check that email links redirect to correct production URL

### 8. Common Issues & Solutions

**Issue**: Email links redirect to localhost
- **Solution**: Update Supabase Site URL to production domain

**Issue**: "Invalid redirect URL" error
- **Solution**: Add your domain to Supabase Redirect URLs list

**Issue**: Users don't receive confirmation email
- **Solution**: Check Supabase Authentication → Providers → Email is enabled

**Issue**: Toast doesn't appear
- **Solution**: Check browser console for errors, verify `showEmailConfirmation` state

**Issue**: Email confirmed but can't login
- **Solution**: Wait 1-2 minutes for Supabase to sync, or check user's `email_confirmed_at` in database

### 9. Security Best Practices

✅ **Do**:
- Use environment variables for all sensitive data
- Keep `.env.production` in `.gitignore`
- Use HTTPS for production domain
- Enable rate limiting on signup endpoint
- Validate email format on frontend and backend

❌ **Don't**:
- Commit `.env.production` to GitHub
- Use localhost URLs in production Supabase settings
- Store API keys in frontend code
- Allow unlimited signup attempts
- Skip email verification step

### 10. Monitoring & Logs

**Check these when troubleshooting:**

1. **Supabase Logs**:
   - Dashboard → Logs → Auth logs
   - Look for signup and email confirmation events

2. **Backend Logs**:
   ```bash
   # Check application logs
   tail -f /var/log/your-app/app.log
   ```

3. **Browser Console**:
   - Check for JavaScript errors
   - Look for API call responses
   - Verify Supabase initialization

4. **Email Delivery**:
   - Supabase → Authentication → Users
   - Check user's `email_confirmed_at` timestamp
   - Look for "Last Sign In" timestamp

---

## Quick Reference

**Supabase Site URL**: `https://your-production-domain.com`

**Redirect URLs**:
- `https://your-production-domain.com/**`
- `https://your-production-domain.com/login`
- `https://your-production-domain.com/auth/callback`

**Email Confirmation Flow**:
```
Signup → Email Sent → Click Link → Verify → Redirect to Login → Toast Shows → Login
```

**Environment Variables**:
- `VITE_APP_URL` (frontend)
- `FRONTEND_URL` (backend)
- Both should match your production domain

---

## Support

If you encounter issues:
1. Check Supabase documentation: https://supabase.com/docs/guides/auth
2. Review browser console for errors
3. Verify all environment variables are set correctly
4. Test with different email providers (Gmail, Outlook, etc.)

**Current Setup**:
- ✅ Toast notification implemented
- ✅ Email confirmation integrated with Supabase
- ✅ Auto-hide after 5 seconds
- ✅ Responsive design (mobile + desktop)
- ✅ Proper error handling
- ✅ Security best practices followed
