# Google Cloud Console Configuration Fix

## The Domain Issue
Google Cloud Console is rejecting `kirk.replit.dev` because it's not a "top private domain". Replit subdomains don't qualify as top private domains in Google's system.

## Solution: Configure Without Domain Restriction

### 1. OAuth Consent Screen Configuration
- **Application name**: Your app name (e.g., "Calendar App")
- **User support email**: `jonathan.procter@gmail.com`
- **Developer contact**: `jonathan.procter@gmail.com`
- **Authorized domains**: **LEAVE THIS EMPTY** (don't add kirk.replit.dev)

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
- **Authorized redirect URIs**: Add this exact URL:
  ```
  https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/callback
  ```

### 4. Required APIs
Enable these APIs in "APIs & Services" > "Library":
- Google Calendar API
- Google Drive API

## Key Points
1. **Don't add authorized domains** - leave that section empty
2. **Add yourself as a test user** - this is the most critical step
3. **Use the exact redirect URI** - must match exactly with https://

## Test After Configuration
Once you've made these changes, test the OAuth flow:
https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google

The OAuth should work without domain restrictions as long as you're added as a test user and the redirect URI matches exactly.