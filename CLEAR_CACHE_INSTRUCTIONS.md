# Clear Browser Cache Instructions

If you're seeing incorrect completion states (like step 6 being marked green when it shouldn't be), follow these steps:

## Option 1: Clear Application Storage (Recommended)

1. Open your browser's Developer Tools (F12 or Right-click → Inspect)
2. Go to the **Application** tab (Chrome) or **Storage** tab (Firefox)
3. In the left sidebar, find **Local Storage**
4. Click on your site (e.g., `http://localhost:5173`)
5. Click **"Clear All"** button or delete specific keys:
   - Look for keys containing `completedSteps`
   - Delete all user-specific keys (those with email prefixes)
6. Refresh the page (F5 or Cmd+R)

## Option 2: Hard Refresh

1. Hold **Shift** and click the Refresh button
2. Or use keyboard shortcuts:
   - **Windows/Linux**: Ctrl + Shift + R
   - **Mac**: Cmd + Shift + R

## Option 3: Clear Browser Data

### Chrome:
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cookies and other site data" and "Cached images and files"
3. Choose "All time" from the time range
4. Click "Clear data"

### Firefox:
1. Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
2. Select "Cookies" and "Cache"
3. Choose "Everything" from the time range
4. Click "Clear Now"

### Safari:
1. Go to Safari → Preferences → Privacy
2. Click "Manage Website Data"
3. Remove localhost or all data
4. Restart Safari

## Verify the Fix

After clearing cache:
1. Log in to your application
2. Check the sidebar - only completed steps should be green
3. Open browser console (F12) and look for logs:
   ```
   App.tsx: Backend completed steps: [1, 2]  // Example
   App.tsx: Completed steps set from backend: [1, 2]
   ```

## Why This Happens

The application stores progress in localStorage. Sometimes old data from previous sessions can cause incorrect states to display. The latest code now prioritizes backend data over localStorage, but existing cached data may need to be manually cleared once.
