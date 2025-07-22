# OAuth Configuration Update Instructions

## Current Problem
The OAuth callback receives no authorization code, indicating Google is blocking the request before it reaches our server.

## Required Configuration in Google Cloud Console

### Step 1: OAuth Client Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your OAuth client ID: `839967078225-sjhemk0h654iv9jbc58lears67ntt877.apps.googleusercontent.com`
4. Click to edit it
5. **Authorized redirect URIs**: Add this EXACT URL (copy-paste to avoid typos):
   ```
   https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/callback
   ```
6. Click "Save"

### Step 2: OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. **Application name**: Change from "Voice Journal" to "Calendar App" (or your preferred name)
3. **User support email**: `jonathan.procter@gmail.com`
4. **Developer contact**: `jonathan.procter@gmail.com`
5. **Authorized domains**: LEAVE EMPTY (don't add anything)
6. **Scopes**: Should include:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `../auth/calendar.readonly`
   - `../auth/calendar.events.readonly`

### Step 3: Test Users (CRITICAL!)
1. Still in "OAuth consent screen"
2. Scroll down to "Test users" section
3. Click "Add users"
4. Add: `jonathan.procter@gmail.com`
5. Click "Save"

### Step 4: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Search and enable:
   - Google Calendar API
   - Google Drive API (if needed)

## Verification Steps
After configuration, run this test script in the browser console:
```javascript
// Test OAuth configuration
fetch('/api/auth/google', { method: 'GET', redirect: 'manual' })
  .then(response => {
    console.log('OAuth Status:', response.status);
    return response.headers.get('Location');
  })
  .then(location => {
    console.log('OAuth URL:', location);
    const url = new URL(location);
    console.log('Client ID:', url.searchParams.get('client_id'));
    console.log('Redirect URI:', url.searchParams.get('redirect_uri'));
  });
```

## Expected Results
- OAuth should redirect to Google with your correct client ID
- After Google authentication, you should be redirected back to the app
- The callback should receive an authorization code (not empty query parameters)

## Common Issues
1. **Redirect URI mismatch**: Must match exactly with https://
2. **Not added as test user**: You must be in the test users list
3. **Wrong client ID**: Make sure you're using the correct OAuth client
4. **Missing APIs**: Google Calendar API must be enabled

## Test the Fix
After making these changes, test at:
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google