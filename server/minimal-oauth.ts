import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Express, Request, Response } from 'express';

// Simple domain detection
function getCurrentDomain(): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    return `https://${domains.split(',')[0]}`;
  }
  return 'https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev';
}

// Initialize OAuth with minimal configuration
export function initializeMinimalOAuth() {
  console.log('🚀 Initializing minimal OAuth...');
  
  const redirectUri = `${getCurrentDomain()}/api/auth/google/callback`;
  
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

  // OAuth callback
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req: Request, res: Response) => {
      console.log('✅ OAuth callback successful for user:', req.user);
      
      // Ensure session is saved properly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        }
        res.redirect('/?auth=success');
      });
    }
  );

  // Auth status
  app.get('/api/auth/status', (req: Request, res: Response) => {
    const isAuthenticated = req.isAuthenticated();
    const hasValidTokens = !!process.env.GOOGLE_ACCESS_TOKEN;
    
    res.json({
      authenticated: isAuthenticated,
      hasValidTokens: hasValidTokens,
      user: isAuthenticated ? req.user : null
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

  // Configuration check
  app.get('/api/auth/config', (req: Request, res: Response) => {
    res.json({
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
      redirectUri: `${getCurrentDomain()}/api/auth/google/callback`,
      currentDomain: getCurrentDomain(),
      instructions: [
        'If OAuth fails, verify Google Cloud Console configuration',
        'Ensure redirect URI is authorized',
        'Check that Calendar API is enabled'
      ]
    });
  });

  console.log('✅ Minimal OAuth routes added');
}