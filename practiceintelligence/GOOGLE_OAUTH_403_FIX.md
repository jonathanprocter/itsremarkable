# Fix Google OAuth 403 Error - Complete Setup Guide

## Current Issue
Getting 403 error when trying to log into Google account via OAuth flow.

## Current OAuth Configuration
**Your current Replit domain:** `https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`

## Google Cloud Console Configuration Required

### Step 1: Go to Google Cloud Console
1. Visit https://console.cloud.google.com/
2. Select your project or create a new one

### Step 2: Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose **External** user type
3. Fill in required fields:
   - App name: "reMarkable Calendar Planner"
   - User support email: your email
   - Developer contact information: your email
4. **IMPORTANT**: Set publishing status to "In production" (not testing)
5. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### Step 3: Configure OAuth 2.0 Client
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application"
4. Add these **exact** URLs:

**Authorized JavaScript origins:**
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev
```

**Authorized redirect URIs:**
```
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback
```

### Step 4: Enable Required APIs
1. Go to "APIs & Services" > "Library"
2. Enable these APIs:
   - Google Calendar API
   - Google Drive API
   - Google People API (for user info)

### Step 5: Check Your Current Client ID/Secret
Your current environment variables should match the OAuth client you created:
- `GOOGLE_CLIENT_ID` - from the OAuth client
- `GOOGLE_CLIENT_SECRET` - from the OAuth client

## Common 403 Error Causes

### Issue 1: App in Testing Mode
**Problem:** OAuth consent screen is in "Testing" mode
**Solution:** 
- Go to OAuth consent screen
- Click "PUBLISH APP" to move to production
- Or add your email to "Test users" if keeping in testing

### Issue 2: Incorrect Redirect URI
**Problem:** Redirect URI doesn't match exactly
**Solution:** 
- Ensure exact match (no trailing slashes, correct protocol)
- Use the exact URL above

### Issue 3: Missing Scopes
**Problem:** Required scopes not added to consent screen
**Solution:**
- Add all scopes listed in Step 2 above

### Issue 4: APIs Not Enabled
**Problem:** Required APIs not enabled for the project
**Solution:**
- Enable all APIs listed in Step 4 above

## Testing the Fix

After updating Google Cloud Console settings:

1. Visit your app: `https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`
2. Click "Login with Google"
3. Should redirect to Google OAuth consent screen
4. Grant permissions
5. Should redirect back to your app with successful authentication

## If Still Getting 403

1. **Check the exact error message** in browser developer tools
2. **Verify domain matches** - Sometimes Replit domains can change
3. **Wait 5-10 minutes** after making changes (Google caches OAuth settings)
4. **Try incognito/private browsing** to avoid cached auth states

## Alternative: Use Google OAuth Playground for Testing

If you need immediate testing access, you can use Google OAuth Playground:
1. Go to https://developers.google.com/oauthplayground/
2. Select scopes: Calendar API v3, Drive API v3
3. Get fresh tokens
4. Use those tokens temporarily while fixing the OAuth setup

The main issue is likely that your OAuth consent screen is in testing mode or the redirect URI doesn't match exactly.