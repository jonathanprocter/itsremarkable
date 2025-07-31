# OAuth Resolution Guide

## Current Issue
The OAuth callback is receiving no authorization code, which means Google is blocking the request before it even reaches the callback. This indicates a configuration issue in Google Cloud Console.

## Required Google Cloud Console Configuration

### 1. OAuth Consent Screen
- **Application name**: Set to your desired app name (NOT "Voice Journal")
- **User support email**: `jonathan.procter@gmail.com`
- **Developer contact**: `jonathan.procter@gmail.com`
- **Authorized domains**: Add `kirk.replit.dev` (without https://)

### 2. Test Users (Critical!)
- Go to "OAuth consent screen"
- Scroll to "Test users" section
- Click "Add users"
- Add: `jonathan.procter@gmail.com`
- Click "Save"

### 3. OAuth Client Configuration
- Go to "APIs & Services" > "Credentials"
- Find your OAuth client ID: `839967078225-sjhemk0h654iv9jbc58lears67ntt877.apps.googleusercontent.com`
- Click to edit it
- **Authorized redirect URIs**: Add these exact URLs:
  ```
  https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/callback
  https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback
  ```

### 4. Required APIs
Enable these APIs in "APIs & Services" > "Library":
- Google Calendar API
- Google Drive API
- Google+ API (for user info)

## Common Issues
1. **Domain mismatch**: The current domain is `ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev`
2. **Missing test user**: You MUST add yourself as a test user
3. **Wrong redirect URI**: Must match exactly with protocol (https://)

## Test the Configuration
After making these changes, test the OAuth flow:
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google

## If Still Blocked
If you're still getting "Access blocked", the most likely issue is:
1. Your email is not added as a test user
2. The redirect URI doesn't match exactly
3. The OAuth consent screen isn't properly configured

Double-check these three items in Google Cloud Console.