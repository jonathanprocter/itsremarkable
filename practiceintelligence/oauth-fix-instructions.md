# Google OAuth Configuration Fix

## Problem
Google OAuth is showing "Access blocked: Authorization Error" because the app doesn't comply with Google's OAuth 2.0 policy.

## Solution Steps

### 1. Google Cloud Console Configuration
You need to configure the OAuth consent screen in Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Configure the consent screen:
   - **Application type**: External (for testing) or Internal (if G Suite)
   - **Application name**: "reMarkable Pro Digital Planner"
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - **Authorized domains**: Add `kirk.replit.dev` (without https://)

### 2. OAuth Client Configuration
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "reMarkable Pro Planner"
5. **Authorized redirect URIs**: Add these URLs:
   ```
   https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/callback
   http://localhost:5000/api/auth/callback
   ```

### 3. Required APIs
Enable these APIs in "APIs & Services" > "Library":
- Google Calendar API
- Google Drive API
- Google+ API (for user info)

### 4. Test Users (if External)
If using "External" user type during development:
1. Go to "OAuth consent screen"
2. Add test users in the "Test users" section
3. Add your email address as a test user

### 5. Environment Variables
Update your environment variables with the new OAuth client credentials:
```
GOOGLE_CLIENT_ID=your_new_client_id
GOOGLE_CLIENT_SECRET=your_new_client_secret
```

## Alternative: Development Mode
For immediate testing, I can implement a development mode that bypasses OAuth temporarily while you configure Google Cloud Console.