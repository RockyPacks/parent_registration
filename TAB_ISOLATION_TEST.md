# Tab Isolation Test Guide

## Expected Behavior with sessionStorage

With the current `sessionStorage` configuration in `/frontend/src/services/supabase.ts`, the system **SHOULD** behave as follows:

### ✅ Expected Tab Behavior

1. **New Tab Requires Login**
   - Open Tab A → Login → User is authenticated in Tab A
   - Open Tab B (new tab) → User is NOT authenticated, must login again
   - Each tab maintains its own independent session

2. **Refresh Preserves Session**
   - Tab A: Login → Refresh page → Still logged in
   - sessionStorage persists within the same tab across refreshes

3. **Logout is Tab-Specific**
   - Tab A: Logged in
   - Tab B: Logged in (separate session)
   - Tab A: Logout → Tab A shows login screen
   - Tab B: Still logged in (independent session)

4. **Close and Reopen Tab**
   - Close Tab A (logged in) → Session destroyed
   - Reopen browser → Open new tab → Must login again

## How to Test

### Test 1: New Tab Independence
```
1. Open browser → Navigate to app → Login
   ✓ Verify: You are logged in

2. Open NEW TAB (Cmd+T) → Navigate to same app URL
   ✓ Verify: You see login screen, NOT logged in automatically

3. Login in new tab with different account (or same)
   ✓ Verify: Second tab is logged in independently

4. Check first tab → Should still be logged in as original user
   ✓ Verify: Each tab maintains its own session
```

### Test 2: Refresh Behavior
```
1. Login in Tab A
   ✓ Verify: Logged in

2. Refresh Tab A (Cmd+R)
   ✓ Verify: Still logged in, session persists

3. Open new Tab B → Navigate to app
   ✓ Verify: Must login again, NOT using Tab A's session
```

### Test 3: Logout Independence
```
1. Tab A: Login as user1@example.com
2. Tab B: Login as user2@example.com (or same user)
3. Tab A: Click logout
   ✓ Verify: Tab A shows login screen
4. Check Tab B
   ✓ Verify: Tab B is still logged in
```

### Test 4: Close Tab Behavior
```
1. Login in Tab A
2. Close Tab A completely
3. Open new tab → Navigate to app
   ✓ Verify: Must login again (session was destroyed)
```

## Current Implementation

### sessionStorage Configuration
Location: `/frontend/src/services/supabase.ts`

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // Tab-specific storage
    persistSession: true,            // Survive refresh in same tab
    autoRefreshToken: true,          // Keep alive in current tab
    detectSessionInUrl: true,
  },
});
```

### Key Points:
- `storage: window.sessionStorage` → Tab-specific sessions (not shared across tabs)
- `persistSession: true` → Session survives page refresh within same tab
- `autoRefreshToken: true` → Keeps session alive in current tab
- Browser's sessionStorage is isolated per-tab by design

## Troubleshooting

### If tabs ARE sharing sessions (unexpected behavior):

1. **Check Browser Cache**
   ```bash
   # Clear browser cache and cookies
   # Chrome: Settings → Privacy → Clear browsing data
   # Check "Cached images and files" and "Cookies and site data"
   ```

2. **Verify sessionStorage Usage**
   - Open DevTools (F12)
   - Go to Application tab → Storage → Session Storage
   - Should see Supabase auth entries ONLY in current tab
   - Open new tab → Should NOT see same entries

3. **Check for localStorage Fallback**
   - Application tab → Local Storage
   - Should NOT see Supabase auth tokens here
   - If you do, there's a configuration issue

4. **Hard Refresh**
   ```
   # Force refresh without cache
   Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   ```

5. **Test in Incognito Mode**
   ```
   Open incognito window → Test tab behavior
   This eliminates cache/extension interference
   ```

## Technical Explanation

### Why sessionStorage Provides Tab Isolation:

Browser's sessionStorage API:
- **Scope**: Limited to current browser tab/window
- **Lifetime**: Destroyed when tab is closed
- **Isolation**: Cannot be accessed from other tabs
- **Persistence**: Survives page refresh within same tab

### Difference from localStorage:

| Feature | sessionStorage | localStorage |
|---------|---------------|--------------|
| Scope | Single tab only | All tabs/windows |
| Lifetime | Tab session | Until cleared |
| Shared across tabs | ❌ No | ✅ Yes |
| Survives refresh | ✅ Yes | ✅ Yes |
| Survives close/reopen | ❌ No | ✅ Yes |

## What Was Changed

### Previous Configuration (Shared Sessions):
```typescript
// OLD - shared across tabs
auth: {
  storage: window.localStorage, // ❌ Shared across all tabs
}
```

### Current Configuration (Isolated Sessions):
```typescript
// NEW - tab-specific
auth: {
  storage: window.sessionStorage, // ✅ Each tab independent
  persistSession: true,            // ✅ Refresh within tab works
  autoRefreshToken: true,          // ✅ Stay logged in (same tab)
}
```

## Verification Steps

1. **Verify Configuration**
   ```bash
   # Check supabase.ts has sessionStorage
   grep -n "sessionStorage" frontend/src/services/supabase.ts
   # Should show: storage: window.sessionStorage
   ```

2. **Build Fresh**
   ```bash
   cd frontend
   npm run build
   npm run preview
   # Or for development:
   npm run dev
   ```

3. **Clear All Storage**
   - DevTools → Application → Clear storage → Clear site data
   - Restart browser

4. **Test Again**
   - Follow Test 1 above
   - New tabs should require fresh login

## Expected Console Logs

### Tab A (Initial Login):
```
App.tsx: initializeAuth called
App.tsx: Setting up tab-specific auth state listener
AuthService: Auth state change event: SIGNED_IN true (tab-specific)
App.tsx: User became authenticated in this tab, loading application
```

### Tab B (New Tab):
```
App.tsx: initializeAuth called
App.tsx: Setting up tab-specific auth state listener
App.tsx: User is not authenticated
# Should see login screen
```

## Contact

If tabs are still sharing sessions after:
- Clearing cache
- Hard refresh
- Testing in incognito mode
- Rebuilding frontend

Then there may be a browser-specific issue or extension interference. Please provide:
1. Browser name and version
2. Console logs from both tabs
3. Screenshots of DevTools → Application → Session Storage
