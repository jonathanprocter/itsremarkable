# Authentication Fix Guide

## Current Issue
The Google OAuth tokens have expired and the token refresh is failing with "invalid_grant" error. This causes:
- Export functionality to fail
- System to fall back to development mode
- Unable to access real Google Calendar data

## Solution Steps

### 1. Re-authenticate with Google
1. Visit your app at: https://HowreMarkable.replit.app
2. Click the blue "Fix Authentication" button in the interface
3. Complete the Google OAuth flow
4. Grant all requested permissions

### 2. Force Google Calendar Sync
After authentication, use the new sync feature:
1. Click the green "Force Google Calendar Sync" button
2. This will fetch and sync ALL events from your Google Calendar
3. Events will be properly categorized as Google Calendar or SimplePractice events
4. All events will be saved to the database for persistent access

### 3. Verify Synchronization
After sync completion, you should see:
- Success message with event count statistics
- All SimplePractice events displaying in the calendar
- All Google Calendar events properly loaded
- Export functionality working with real data

### 4. If Authentication Still Fails
The refresh token may be permanently expired. This happens when:
- The app hasn't been used for 7 days
- Google revoked the refresh token
- OAuth consent screen was modified

**Solution**: Complete fresh authentication by clicking "Fix Authentication"

## Technical Details
- The app is configured for domain: https://HowreMarkable.replit.app
- OAuth callback URL: https://HowreMarkable.replit.app/api/auth/google/callback
- Required scopes: calendar.readonly, drive.file, profile, email

## After Fix
Once authentication is restored:
- ✅ Google Calendar events will load properly
- ✅ PDF exports will work with real data
- ✅ No more "invalid_grant" errors
- ✅ System will stop falling back to dev mode

## Test Commands
You can test authentication status by running in browser console:
```javascript
fetch('/api/auth/status').then(r => r.json()).then(console.log)
```

Should show `isAuthenticated: true` and `hasTokens: true` with real tokens.