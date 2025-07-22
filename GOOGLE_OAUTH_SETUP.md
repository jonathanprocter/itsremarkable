# Google OAuth Setup Instructions

## Current Issue
OAuth redirect URI mismatch error - Google Cloud Console needs to be updated with current domain.

## Current Domain Information
- **Current Domain**: `474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev`
- **Required Redirect URI**: `https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev/api/auth/google/callback`

## Steps to Fix OAuth Configuration

### 1. Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to "APIs & Services" → "Credentials"

### 2. Update OAuth 2.0 Client Configuration
1. Find your OAuth 2.0 Client ID (currently: `839967078225-sjhemk0h654iv9jbc58lears67ntt877.apps.googleusercontent.com`)
2. Click on the client ID to edit it
3. In the "Authorized redirect URIs" section, add:
   ```
   https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev/api/auth/google/callback
   ```

### 3. Required OAuth Scopes
Ensure the following scopes are configured:
- `https://www.googleapis.com/auth/calendar.readonly`
- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/drive.file`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/userinfo.email`
- `openid`

### 4. Authorized Origins
Add this to authorized JavaScript origins:
```
https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev
```

## Testing After Configuration
After updating the Google Cloud Console configuration:
1. Try the OAuth flow again by clicking "Fix Authentication" in the app
2. The system should redirect to Google OAuth properly
3. After successful authentication, the app will have access to Google Calendar

## Alternative: Environment Token Method
If OAuth setup is complex, you can use environment tokens:
1. Get tokens from [Google OAuth Playground](https://developers.google.com/oauthplayground/)
2. Set environment variables:
   - `GOOGLE_ACCESS_TOKEN`
   - `GOOGLE_REFRESH_TOKEN`
3. The app will use these tokens automatically

## Current System Status
- ✅ Authentication endpoints working
- ✅ OAuth flow configured
- ❌ OAuth redirect URI mismatch (needs Google Cloud Console update)
- ✅ Fallback to environment tokens working
- ✅ System functional with proper tokens