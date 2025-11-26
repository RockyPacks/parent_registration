# Supabase Email Verification Configuration

## Overview
The system uses Supabase for authentication with email verification enabled. When users sign up, they receive a verification email with a link to confirm their account.

## Current Configuration

### Redirect URL
The email verification link redirects to:
```
https://parent-registration-frontend.onrender.com/login
```

## Setup Instructions

### 1. Configure Environment Variables

Add to your frontend `.env` or `.env.local` file:

```env
VITE_APP_URL=https://parent-registration-frontend.onrender.com
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

**For local development:**
```env
VITE_APP_URL=http://localhost:3000
```

### 2. Configure Supabase Redirect URLs

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add the following URLs to **Redirect URLs**:

   **For Production:**
   ```
   https://parent-registration-frontend.onrender.com/login
   https://parent-registration-frontend.onrender.com/**
   ```

   **For Local Development:**
   ```
   http://localhost:3000/login
   http://localhost:3000/**
   ```

4. Set the **Site URL** to:
   ```
   https://parent-registration-frontend.onrender.com
   ```

### 3. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Update the **Confirm signup** template if needed
3. The default template should work, but you can customize it

### 4. Email Provider Settings

By default, Supabase uses their email service. For production, consider:

1. Go to **Authentication** → **Providers** → **Email**
2. Optionally configure a custom SMTP provider for better deliverability
3. Recommended providers: SendGrid, AWS SES, Mailgun

## Email Verification Flow

1. **User signs up** with email and password
2. **Supabase sends verification email** to the user
3. **User clicks link** in email
4. **Redirected to** `https://parent-registration-frontend.onrender.com/login`
5. **User logs in** with their credentials
6. **Session created** and user can access the application

## Testing Email Verification

### Local Testing
For local development, you can:

1. **Disable email confirmation** (not recommended for production):
   - Go to Supabase Dashboard → Authentication → Providers → Email
   - Toggle "Confirm email" OFF
   - Users can log in immediately without verification

2. **Use Inbucket** (Supabase's email testing tool):
   - Available in your Supabase project
   - Captures all emails sent in development
   - Access via Supabase Dashboard

### Production Testing
1. Use a real email address
2. Check spam folder if email doesn't arrive
3. Verify the redirect URL matches your production domain
4. Check Supabase logs for any email delivery issues

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase logs: Dashboard → Logs → Auth Logs
- Verify SMTP settings if using custom provider

### Redirect Not Working
- Ensure `VITE_APP_URL` is set correctly in `.env`
- Verify redirect URLs are added in Supabase Dashboard
- Check browser console for errors
- Ensure the URL uses HTTPS in production

### "Invalid Redirect URL" Error
- Add the exact URL to Supabase redirect URLs list
- Include wildcard pattern: `https://your-domain.com/**`
- Rebuild and redeploy frontend after environment variable changes

## Deployment Checklist

- [ ] Set `VITE_APP_URL` environment variable in Render
- [ ] Add redirect URLs to Supabase Dashboard
- [ ] Set Site URL in Supabase
- [ ] Test signup flow end-to-end
- [ ] Verify email delivery
- [ ] Test email verification link
- [ ] Confirm redirect to login page works
- [ ] Test login after email verification

## Environment Variables on Render

When deploying to Render, add these environment variables:

```
VITE_APP_URL=https://parent-registration-frontend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

**Important:** After adding/changing environment variables in Render, trigger a new deployment for changes to take effect.

## Security Notes

- Email verification adds an extra security layer
- Users cannot access the system without verifying their email
- Sessions use `sessionStorage` for tab-specific isolation
- JWT tokens are managed securely by Supabase
- Never commit `.env` files with real credentials to Git

## Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify environment variables are set correctly
3. Test with a different email address
4. Contact Supabase support if emails aren't being delivered
