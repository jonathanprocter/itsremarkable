import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Comprehensive OAuth Configuration
const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID?.trim(),
  clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim(),
  redirectUri: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/auth/google/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ]
};

// Create OAuth2 client with comprehensive configuration
export function createComprehensiveOAuth2Client(): OAuth2Client {
  if (!OAUTH_CONFIG.clientId || !OAUTH_CONFIG.clientSecret) {
    throw new Error('Missing Google OAuth credentials');
  }

  return new google.auth.OAuth2(
    OAUTH_CONFIG.clientId,
    OAUTH_CONFIG.clientSecret,
    OAUTH_CONFIG.redirectUri
  );
}

// Generate OAuth URL with proper parameters
export function generateOAuthUrl(): string {
  const oauth2Client = createComprehensiveOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: OAUTH_CONFIG.scopes,
    prompt: 'consent', // Always prompt for consent to get refresh token
    include_granted_scopes: true,
    approval_prompt: 'force' // Legacy parameter for extra safety
  });
}

// Handle OAuth callback with comprehensive error handling
export async function handleComprehensiveOAuthCallback(code: string) {
  try {
    const oauth2Client = createComprehensiveOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Use existing refresh token if new one not provided
    const refreshToken = tokens.refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

    const user = {
      id: "1",
      googleId: userInfo.data.id,
      email: userInfo.data.email,
      name: userInfo.data.name,
      displayName: userInfo.data.name,
      accessToken: tokens.access_token,
      refreshToken: refreshToken,
      provider: "google",
      tokenExpiry: tokens.expiry_date
    };

    // Store tokens in environment for immediate use
    process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
    if (tokens.refresh_token) {
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
    }

    console.log('✅ OAuth callback successful:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!refreshToken,
      userEmail: userInfo.data.email
    });

    return user;
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
}

// Comprehensive token refresh with fallback
export async function comprehensiveTokenRefresh(user: any) {
  try {
    const oauth2Client = createComprehensiveOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: user.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token received from refresh');
    }

    // Update environment tokens
    process.env.GOOGLE_ACCESS_TOKEN = credentials.access_token;
    if (credentials.refresh_token) {
      process.env.GOOGLE_REFRESH_TOKEN = credentials.refresh_token;
    }

    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || user.refreshToken,
      tokenExpiry: credentials.expiry_date
    };
  } catch (error) {
    console.error('Token refresh failed:', error);
    
    // Fallback to environment tokens
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    if (envAccessToken && envRefreshToken && 
        !envAccessToken.startsWith('dev-') && 
        !envRefreshToken.startsWith('dev-')) {
      
      console.log('Using environment tokens as fallback');
      return {
        accessToken: envAccessToken,
        refreshToken: envRefreshToken,
        tokenExpiry: null
      };
    }
    
    throw error;
  }
}

// Test Google Calendar API access
export async function testGoogleCalendarAccess(accessToken: string) {
  try {
    const oauth2Client = createComprehensiveOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    
    return {
      success: true,
      calendarCount: response.data.items?.length || 0,
      calendars: response.data.items?.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        primary: cal.primary
      })) || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Comprehensive authentication status
export function getComprehensiveAuthStatus(req: any) {
  const user = req.user || req.session?.passport?.user;
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const hasValidEnvTokens = !!envAccessToken && !!envRefreshToken && 
                            !envAccessToken.startsWith('dev-') && 
                            !envRefreshToken.startsWith('dev-');

  const hasValidUserTokens = user?.accessToken && user?.refreshToken && 
                            !user.accessToken.startsWith('dev-') && 
                            !user.refreshToken.startsWith('dev-');

  return {
    authenticated: !!user || hasValidEnvTokens,
    hasValidTokens: hasValidUserTokens || hasValidEnvTokens,
    user: user || (hasValidEnvTokens ? {
      id: "1",
      email: "jonathan.procter@gmail.com",
      name: "Jonathan Procter",
      provider: "google"
    } : null),
    tokenSources: {
      userSession: hasValidUserTokens,
      environment: hasValidEnvTokens
    },
    environment: {
      hasAccessToken: !!envAccessToken && !envAccessToken.startsWith('dev-'),
      hasRefreshToken: !!envRefreshToken && !envRefreshToken.startsWith('dev-')
    },
    needsReauth: !hasValidUserTokens && !hasValidEnvTokens
  };
}

// Ensure authentication with comprehensive fallback
export function ensureComprehensiveAuth(req: any, res: any, next: any) {
  const authStatus = getComprehensiveAuthStatus(req);
  
  if (authStatus.authenticated) {
    // Auto-authenticate with environment tokens if needed
    if (!req.user && authStatus.tokenSources.environment) {
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      
      const fallbackUser = {
        id: "1",
        email: "jonathan.procter@gmail.com",
        name: "Jonathan Procter",
        displayName: "Jonathan Procter",
        accessToken: envAccessToken,
        refreshToken: envRefreshToken,
        provider: "google",
      };

      req.user = fallbackUser;
      req.session.passport = { user: fallbackUser };
      console.log('Auto-authenticated with environment tokens');
    }
    
    return next();
  }

  res.status(401).json({
    error: 'Not authenticated',
    needsAuth: true,
    authUrl: '/api/auth/google',
    oauthUrl: generateOAuthUrl()
  });
}