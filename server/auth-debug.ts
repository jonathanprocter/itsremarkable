import { Request, Response } from 'express';

export function addAuthDebugRoutes(app: any) {
  // Debug OAuth configuration
  app.get('/api/auth/debug', (req: Request, res: Response) => {
    const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
    const currentDomain = domain ? `https://${domain}` : `https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev`;
    
    res.json({
      authenticated: !!req.user,
      hasValidTokens: !!(process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN),
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      currentDomain: currentDomain,
      redirectUri: `${currentDomain}/api/auth/google/callback`,
      clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
      session: {
        id: req.sessionID,
        userId: req.user?.id,
        hasUser: !!req.user
      }
    });
  });

  // Force authentication refresh
  app.post('/api/auth/deployment-fix', (req: Request, res: Response) => {
    console.log('🔧 Deployment authentication fix triggered');
    
    // Clear any stale session data and reinitialize
    if (req.session) {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Authentication system refreshed'
    });
  });
}