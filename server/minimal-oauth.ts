import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Express, Request, Response } from 'express';

// Enhanced domain detection with multiple fallbacks
function getCurrentDomain(): string {
  // Try multiple environment variables for domain detection
  const domains = process.env.REPLIT_DOMAINS;
  const replId = process.env.REPL_ID;
  const replitUrl = process.env.REPLIT_URL;

  console.log('🌐 Domain detection:', {
    domains,
    replId,
    replitUrl,
    nodeEnv: process.env.NODE_ENV
  });

  // Try REPLIT_DOMAINS first
  if (domains) {
    const domain = `https://${domains.split(',')[0]}`;
    console.log('✅ Using REPLIT_DOMAINS:', domain);
    return domain;
  }

  // Try REPLIT_URL if available
  if (replitUrl) {
    console.log('✅ Using REPLIT_URL:', replitUrl);
    return replitUrl;
  }

  // Fallback to current known domain
  const fallbackDomain = 'https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev';
  console.log('⚠️ Using fallback domain:', fallbackDomain);
  return fallbackDomain;
}

// Initialize OAuth with minimal configuration
export function initializeMinimalOAuth() {
  console.log('🚀 Initializing minimal OAuth...');

  // Clear any invalid tokens on startup
  if (process.env.GOOGLE_ACCESS_TOKEN) {
    console.log('🧹 Clearing potentially invalid tokens from environment');
    delete process.env.GOOGLE_ACCESS_TOKEN;
    delete process.env.GOOGLE_REFRESH_TOKEN;
  }

  const redirectUri = `${getCurrentDomain()}/api/auth/callback`;

  console.log('🔗 Redirect URI:', redirectUri);
  console.log('🔑 Has Client ID:', !!process.env.GOOGLE_CLIENT_ID);
  console.log('🔐 Has Client Secret:', !!process.env.GOOGLE_CLIENT_SECRET);

  // Completely reset passport
  passport._strategies = {};
  passport._serializers = [];
  passport._deserializers = [];

  // Configure single Google strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: redirectUri,
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
  }, (accessToken: string, refreshToken: string, profile: any, done: any) => {
    console.log('✅ OAuth success for:', profile.emails?.[0]?.value);

    // Store tokens in environment
    process.env.GOOGLE_ACCESS_TOKEN = accessToken;
    if (refreshToken) {
      process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
    }

    const user = {
      id: 1,
      email: profile.emails?.[0]?.value || 'user@example.com',
      name: profile.displayName || 'User',
      accessToken: accessToken,
      refreshToken: refreshToken
    };

    console.log('🎯 Created user object:', { id: user.id, email: user.email, name: user.name, hasTokens: !!accessToken });
    return done(null, user);
  }));

  // Simple serialization
  passport.serializeUser((user: any, done) => {
    console.log('📝 Serializing user:', user);
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    console.log('🔍 Deserializing user:', user);
    done(null, user);
  });

  console.log('✅ Minimal OAuth configured');
}

// Add minimal OAuth routes
export function addMinimalOAuthRoutes(app: Express) {
  console.log('🛣️ Adding minimal OAuth routes...');

  // Start OAuth
  app.get('/api/auth/google', passport.authenticate('google'));

  // OAuth callback with enhanced error handling
  app.get('/api/auth/callback', (req: Request, res: Response, next) => {
    console.log('🔄 OAuth callback triggered');
    console.log('Query params:', req.query);

    // Check for OAuth error in query params
    if (req.query.error) {
      console.error('❌ OAuth error from Google:', req.query.error);
      console.error('Error description:', req.query.error_description);
      return res.redirect('/?error=oauth_error&details=' + encodeURIComponent(req.query.error_description || req.query.error));
    }

    passport.authenticate('google', { 
      failureRedirect: '/?error=auth_failed',
      session: true // Enable session for proper authentication
    })(req, res, (err) => {
      if (err) {
        console.error('❌ Passport authentication error:', err);
        return res.redirect('/?error=auth_failed&details=' + encodeURIComponent(err.message));
      }

      console.log('✅ OAuth callback successful for user:', req.user);
      
      // Store user in session manually to ensure persistence
      req.session.user = req.user;
      req.session.isAuthenticated = true;
      
      // Ensure session is saved before redirect
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error:', saveErr);
        }
        console.log('✅ Session saved with user data, redirecting to success page');
        res.redirect('/?auth=success');
      });
    });
  });

  // Auth status
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const isAuthenticated = req.isAuthenticated();
    const hasValidTokens = !!process.env.GOOGLE_ACCESS_TOKEN;
    const hasSessionUser = !!(req.session && req.session.user);

    console.log('🔍 Auth status check:', {
      isAuthenticated,
      hasValidTokens,
      hasSessionUser,
      sessionExists: !!req.session,
      userId: req.user?.id || req.session?.user?.id || 'none'
    });

    // Consider user authenticated if they have session data or are passport authenticated
    const userAuthenticated = isAuthenticated || hasSessionUser;
    const currentUser = req.user || req.session?.user || null;

    res.json({
      authenticated: userAuthenticated,
      hasValidTokens: hasValidTokens,
      user: currentUser,
      isAuthenticated: userAuthenticated // Add this for compatibility
    });
  });

  // Auth debug (separate from status for troubleshooting)
  app.get('/api/auth/debug', (req: Request, res: Response) => {
    res.json({
      authenticated: req.isAuthenticated(),
      hasValidTokens: !!process.env.GOOGLE_ACCESS_TOKEN,
      sessionId: req.sessionID,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  });

  // Configuration check with redirect URI validation
  app.get('/api/auth/config', (req: Request, res: Response) => {
    const redirectUri = `${getCurrentDomain()}/api/auth/callback`;
    res.json({
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
      redirectUri: redirectUri,
      currentDomain: getCurrentDomain(),
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...',
      instructions: [
        'Add this EXACT redirect URI to Google Cloud Console:',
        redirectUri,
        'Steps: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs',
        'After adding URI, try the OAuth flow again'
      ]
    });
  });

  // Test callback endpoint to verify redirect URI is working
  app.get('/api/auth/test-callback', (req: Request, res: Response) => {
    console.log('🧪 Test callback hit - redirect URI is reachable');
    res.json({
      success: true,
      message: 'Redirect URI is reachable',
      redirectUri: `${getCurrentDomain()}/api/auth/callback`,
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Minimal OAuth routes added');
}