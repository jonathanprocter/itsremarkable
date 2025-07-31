# Google OAuth 403 Error - Immediate Fix

## Problem
Getting 403 "access_denied" or "invalid_client" errors when trying to authenticate with Google OAuth.

## Root Cause
The redirect URI configured in Google Cloud Console doesn't match the actual Replit domain.

## Immediate Solution

### Step 1: Update Google Cloud Console
1. Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID
3. Click "Edit" 
4. Under "Authorized redirect URIs", add:
   ```
   https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev/api/auth/google/callback
   ```
5. Save the configuration

### Step 2: Enable Required APIs
1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Search and enable:
   - Google Calendar API
   - Google+ API (for user info)

### Step 3: Test the Fix
Use the new fixed OAuth endpoint:
```
https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev/api/auth/google/403-fix
```

### Step 4: Check Configuration
Visit this endpoint to verify setup:
```
https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev/api/auth/403-check
```

## What Was Fixed
1. **Correct Redirect URI**: Updated to match current Replit domain
2. **Proper OAuth Flow**: Added manual callback handler with better error handling
3. **Enhanced Debugging**: Added configuration checker endpoint
4. **Explicit Scopes**: Properly configured required scopes for calendar access

## Expected Result
After updating Google Cloud Console:
1. OAuth should redirect to Google login successfully
2. User grants permissions for calendar access
3. Redirects back to app with authentication success
4. Google Calendar integration should work properly

## Troubleshooting
If still getting 403 errors:
1. Double-check the redirect URI exactly matches
2. Ensure you're added as a test user in OAuth consent screen
3. Make sure required APIs are enabled
4. Check browser console for specific error messages

## Test Commands
Run in browser console:
```javascript
// Test configuration
fetch('/api/auth/403-check').then(r => r.json()).then(console.log);

// Test OAuth flow
window.location.href = '/api/auth/google/403-fix';
```