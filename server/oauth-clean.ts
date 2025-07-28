import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { google } from 'googleapis';

// Get current domain for OAuth redirects
function getCurrentDomain(): string {
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    return `https://${replitDomains.split(',')[0]}`;
  }
  return 'https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev';
}

// Clean OAuth configuration
export function configureCleanOAuth() {
  const redirectUri = `${getCurrentDomain()}/api/auth/google/callback`;
  
  console.log('🔧 Configuring clean OAuth...');
  console.log('🌐 Current domain:', getCurrentDomain());
  console.log('🔗 Redirect URI:', redirectUri);
  console.log('🔑 Client ID present:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('🔐 Client Secret present:', !!process.env.GOOGLE_CLIENT_SECRET);

  // Clear any existing strategies to avoid conflicts
  passport._strategies = {};
  
  // Clear any existing serialization
  if (passport._serializers) {
    passport._serializers = [];
  }
  if (passport._deserializers) {
    passport._deserializers = [];
  }

  // Configure single Google strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: redirectUri,
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ]
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('✅ OAuth callback successful for:', profile.emails?.[0]?.value);
      
      // Store tokens globally for the app
      process.env.GOOGLE_ACCESS_TOKEN = accessToken;
      if (refreshToken) {
        process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
      }
      
      const user = {
        id: 1,
        email: profile.emails?.[0]?.value || 'user@example.com',
        name: profile.displayName || 'User',
        accessToken,
        refreshToken
      };
      
      return done(null, user);
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      return done(error, null);
    }
  }));

  // Configure Passport serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id: any, done) => {
    const user = {
      id: id,
      email: 'user@example.com',
      name: 'User'
    };
    done(null, user);
  });
}

// Test Google Calendar access
export async function testCalendarAccess(): Promise<boolean> {
  try {
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    if (!accessToken) {
      console.log('❌ No access token available for calendar test');
      return false;
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    // Test by listing calendars
    const calendars = await calendar.calendarList.list();
    console.log('✅ Calendar access test successful:', calendars.data.items?.length || 0, 'calendars');
    return true;
  } catch (error) {
    console.error('❌ Calendar access test failed:', error.message);
    return false;
  }
}

// Get OAuth configuration status
export function getOAuthStatus() {
  return {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
    hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
    redirectUri: `${getCurrentDomain()}/api/auth/google/callback`,
    currentDomain: getCurrentDomain()
  };
}