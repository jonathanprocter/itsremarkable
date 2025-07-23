
# IMMEDIATE FIX for Google OAuth 403 Error

## Current Issue
OAuth callback is succeeding but still getting 403 errors during API calls.

## Your Current Domain
`https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev`

## IMMEDIATE FIXES NEEDED

### 1. Publish OAuth Consent Screen (CRITICAL)
1. Go to https://console.cloud.google.com/apis/credentials/consent
2. Find your OAuth consent screen
3. **Click "PUBLISH APP"** (this is the most common cause of 403 errors)
4. Confirm publishing to move from "Testing" to "In production"

### 2. Verify Authorized Redirect URIs
1. Go to https://console.cloud.google.com/apis/credentials
2. Edit your OAuth 2.0 Client ID
3. Ensure this EXACT URL is in "Authorized redirect URIs":
   ```
   https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev/api/auth/google/callback
   ```

### 3. Check Required API Enablement
Enable these APIs at https://console.cloud.google.com/apis/library:
- ✅ Google Calendar API
- ✅ Google Drive API  
- ✅ Google People API

### 4. Verify OAuth Scopes
In OAuth consent screen, ensure these scopes are added:
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

## Test After Changes
1. Wait 5-10 minutes for Google's changes to propagate
2. Try authentication again in incognito/private browser
3. Check browser developer tools for specific 403 error details

## If Still Getting 403
The error logs should show more specific details. Common remaining issues:
- Domain verification required for certain scopes
- Project quotas exceeded
- Service account configuration needed

Let me know the exact 403 error message from browser dev tools for more specific help.
