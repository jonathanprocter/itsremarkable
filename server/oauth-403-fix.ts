import { Express, Request, Response } from 'express';
import { google } from 'googleapis';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

// Get current domain
function getCurrentDomain(): string {
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) {
    return `https://${replitDomains.split(',')[0]}`;
  }
  return 'https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev';
}

const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
  clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
  redirectUri: `${getCurrentDomain()}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events', 
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ]
};

// Initialize OAuth client
function createOAuth2Client() {
  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

// Configure Passport with fixed strategy
export function configure403FixStrategy() {
  console.log('🔧 Configuring OAuth 403 fix strategy...');
  console.log('📋 Redirect URI:', OAUTH_CONFIG.redirectUri);
  
  passport.use('google-403-fix', new GoogleStrategy({
    clientID: OAUTH_CONFIG.clientId!,
    clientSecret: OAUTH_CONFIG.clientSecret!,
    callbackURL: OAUTH_CONFIG.redirectUri,
    scope: OAUTH_CONFIG.scopes,
    passReqToCallback: true
  }, async (req: Request, accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      console.log('✅ OAuth callback successful for user:', profile.emails?.[0]?.value);
      
      // Store tokens in environment
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
}

// Add 403 fix routes
export function add403FixRoutes(app: Express) {
  // OAuth initiation with explicit configuration
  app.get('/api/auth/google/403-fix', (req: Request, res: Response) => {
    const oauth2Client = createOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_CONFIG.scopes,
      prompt: 'consent',
      include_granted_scopes: true,
      state: 'security_token_' + Date.now()
    });
    
    console.log('🔗 Redirecting to OAuth URL:', authUrl);
    res.redirect(authUrl);
  });

  // Manual OAuth callback handler
  app.get('/api/auth/google/callback/403-fix', async (req: Request, res: Response) => {
    try {
      const { code, error } = req.query;
      
      if (error) {
        console.error('❌ OAuth error:', error);
        return res.redirect('/?error=oauth_error&details=' + encodeURIComponent(error as string));
      }
      
      if (!code) {
        console.error('❌ No authorization code received');
        return res.redirect('/?error=no_code');
      }
      
      console.log('📝 Processing OAuth callback with code...');
      
      const oauth2Client = createOAuth2Client();
      const { tokens } = await oauth2Client.getToken(code as string);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }
      
      // Store tokens
      process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
      if (tokens.refresh_token) {
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      }
      
      // Get user info
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      
      // Set session
      req.session.userId = 1;
      req.session.user = {
        id: 1,
        email: userInfo.data.email,
        name: userInfo.data.name
      };
      
      console.log('✅ OAuth 403 fix successful for:', userInfo.data.email);
      res.redirect('/?auth=success&fixed=true');
      
    } catch (error) {
      console.error('❌ OAuth callback error:', error);
      res.redirect('/?error=callback_failed&details=' + encodeURIComponent(error.message));
    }
  });
  
  // Configuration checker
  app.get('/api/auth/403-check', (req: Request, res: Response) => {
    res.json({
      hasClientId: !!OAUTH_CONFIG.clientId,
      hasClientSecret: !!OAUTH_CONFIG.clientSecret,
      redirectUri: OAUTH_CONFIG.redirectUri,
      currentDomain: getCurrentDomain(),
      requiredSetup: {
        googleCloudConsole: 'https://console.cloud.google.com/apis/credentials',
        addRedirectUri: OAUTH_CONFIG.redirectUri,
        enabledApis: ['Google Calendar API', 'Google+ API']
      },
      testUrl: `${getCurrentDomain()}/api/auth/google/403-fix`
    });
  });
}

// Test OAuth configuration
export async function test403Fix() {
  console.log('🧪 Testing OAuth 403 fix configuration...');
  
  const checks = {
    hasClientId: !!OAUTH_CONFIG.clientId,
    hasClientSecret: !!OAUTH_CONFIG.clientSecret,
    redirectUri: OAUTH_CONFIG.redirectUri,
    domain: getCurrentDomain()
  };
  
  console.log('📊 OAuth Configuration:', checks);
  
  if (!checks.hasClientId || !checks.hasClientSecret) {
    console.log('❌ Missing OAuth credentials');
    return false;
  }
  
  console.log('✅ OAuth 403 fix configuration complete');
  console.log('🔗 Test URL:', `${checks.domain}/api/auth/google/403-fix`);
  
  return true;
}