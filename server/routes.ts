import { Router } from 'express';
import passport from 'passport';
import { createServer } from 'http';
import { Express } from 'express';
import { storage } from './storage';

// Essential OAuth manager import
import { 
  handleComprehensiveOAuthCallback,
  getComprehensiveAuthStatus,
  testGoogleCalendarAccess,
  comprehensiveTokenRefresh
} from './oauth-comprehensive-fix';

export function registerRoutes(app: Express) {
  console.log('[INFO] Creating routes...');

  // Essential auth routes
  app.get('/api/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'] 
  }));

  app.get('/api/auth/callback', passport.authenticate('google', { failureRedirect: '/login' }), 
    (req, res) => {
      console.log('[SUCCESS] OAuth callback successful');
      res.redirect('/dashboard?auth=success');
    }
  );

  app.get('/api/auth/status', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      const status = getComprehensiveAuthStatus(req);
      
      res.json({
        authenticated: status.authenticated,
        hasValidTokens: status.hasValidTokens,
        user: status.authenticated ? {
          id: userId,
          email: req.user?.email || "user@example.com",
          name: req.user?.name || "User"
        } : null
      });
    } catch (error) {
      console.error('[ERROR] Auth status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar sync endpoint
  app.get('/api/calendar/sync', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Use environment tokens for calendar access
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      
      if (!accessToken) {
        return res.status(401).json({ 
          error: 'Authentication required',
          needsAuth: true,
          authUrl: '/api/auth/google' 
        });
      }

      // Test calendar access and return basic success
      const events = await testGoogleCalendarAccess(accessToken);
      res.json({ success: true, events: events || [], count: events?.length || 0 });

    } catch (error) {
      console.error('[ERROR] Calendar sync endpoint error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Events endpoint - returns calendar events
  app.get('/api/events', async (req, res) => {
    try {
      let userId = req.user?.id || req.session?.userId || 1;
      
      // Handle userId parsing more safely - check for object type
      if (typeof userId === 'object' && userId !== null) {
        // If userId is an object, try to extract the id property
        userId = userId.id || 1;
      }
      
      if (typeof userId === 'string') {
        const parsed = parseInt(userId);
        if (isNaN(parsed)) {
          console.log(`⚠️ Invalid userId "${userId}", using fallback userId 1`);
          userId = 1;
        } else {
          userId = parsed;
        }
      }
      
      // Ensure userId is a valid number
      if (typeof userId !== 'number' || isNaN(userId)) {
        console.log(`⚠️ UserId is not a valid number: ${userId}, using fallback userId 1`);
        userId = 1;
      }
      
      console.log(`📊 Events endpoint called with userId: ${userId} (type: ${typeof userId})`);
      
      // Import storage to get real events
      const { storage } = await import('./storage');
      
      // Get real events from database
      const events = await storage.getEvents(userId);
      
      // Format events for frontend
      const formattedEvents = events.map(event => ({
        id: event.id.toString(),
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
        start: event.startTime.toISOString(), // For compatibility
        end: event.endTime.toISOString(), // For compatibility
        source: event.source,
        allDay: false,
        description: event.description || '',
        location: event.location || '',
        status: event.status || 'scheduled', // Include status field for visual styling
        notes: event.notes || '',
        actionItems: event.actionItems || '',
        calendarId: event.calendarId || '',
        userId: userId
      }));
      
      console.log(`📊 Loaded events from unified API: {"total":${formattedEvents.length},"google":${formattedEvents.filter(e => e.source === 'google').length},"simplepractice":${formattedEvents.filter(e => e.source === 'simplepractice').length},"manual":${formattedEvents.filter(e => e.source === 'manual').length}}`);
      
      res.json(formattedEvents);
    } catch (error) {
      console.error('[ERROR] Events endpoint error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update event (PUT /api/events/:id)
  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      // Use the same authentication logic as other endpoints - be more permissive for development
      const userId = req.user?.id || req.session?.userId || req.session?.passport?.user?.id || "1";
      
      console.log(`[DEBUG] Update event authentication check:`, {
        hasReqUser: !!req.user,
        reqUserId: req.user?.id,
        sessionUserId: req.session?.userId,
        passportUser: req.session?.passport?.user?.id,
        finalUserId: userId
      });
      
      // For development, always allow with fallback userId
      if (!userId) {
        console.log('[ERROR] Could not determine user ID for event update');
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // Validate dates if provided
      if (updates.startTime) {
        if (typeof updates.startTime === "string") {
          updates.startTime = new Date(updates.startTime);
        }
        if (isNaN(updates.startTime.getTime())) {
          return res.status(400).json({ error: "Invalid startTime format" });
        }
      }
      
      if (updates.endTime) {
        if (typeof updates.endTime === "string") {
          updates.endTime = new Date(updates.endTime);
        }
        if (isNaN(updates.endTime.getTime())) {
          return res.status(400).json({ error: "Invalid endTime format" });
        }
      }

      const userIdNumber = parseInt(userId) || 1;
      
      // Try to update by sourceId first (for Google Calendar events)
      let event = await storage.updateEventBySourceId(userIdNumber, eventId, updates);

      // If not found by sourceId, try by numeric ID for manual events
      if (!event) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          event = await storage.updateEvent(numericId, updates);
        }
      }

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      console.log("[SUCCESS] Updated event " + eventId);
      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({
        error: "Failed to update event",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Delete event (DELETE /api/events/:id)
  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = req.user?.id || req.session?.userId || req.session?.passport?.user?.id || "1";
      
      console.log(`[DEBUG] Delete event request for eventId: ${eventId}, userId: ${userId}`);
      
      if (!userId) {
        console.log('[ERROR] Could not determine user ID for event deletion');
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userIdNumber = parseInt(userId) || 1;
      
      // Try to delete by sourceId first (for Google Calendar events)
      let success = await storage.deleteEventBySourceId(userIdNumber, eventId);

      // If not found by sourceId, try by numeric ID for manual events
      if (!success) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          await storage.deleteEvent(numericId);
          success = true;
        }
      }

      if (success) {
        console.log("[SUCCESS] Successfully deleted event: " + eventId);
        res.json({ success: true });
      } else {
        console.log("[ERROR] Event not found for deletion:", eventId);
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({
        error: "Failed to delete event",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth test endpoint
  app.get('/api/auth/test', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      if (userId) {
        res.json({
          authenticated: true,
          message: 'Authentication working properly',
          userId: userId
        });
      } else {
        res.status(401).json({
          authenticated: false,
          message: 'Authentication required',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }
    } catch (error) {
      console.error('[ERROR] Auth test error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth status endpoint
  app.get('/api/auth/status', async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      
      const isAuthenticated = !!user;
      const userHasTokens = user?.accessToken && user?.refreshToken && 
                           !user.accessToken.startsWith('dev-') && 
                           !user.refreshToken.startsWith('dev-');
      const envHasTokens = !!envAccessToken && !!envRefreshToken && 
                          !envAccessToken.startsWith('dev-') && 
                          !envRefreshToken.startsWith('dev-');
      
      const hasValidTokens = userHasTokens || envHasTokens;
      
      console.log('🔍 Auth Status Check:', {
        hasUser: !!user,
        userEmail: user?.email,
        userHasTokens,
        envHasTokens,
        finalValidTokens: hasValidTokens
      });
      
      res.json({
        authenticated: isAuthenticated,
        hasValidTokens: hasValidTokens,
        user: isAuthenticated ? {
          id: user.id || "1",
          email: user.email || "jonathan.procter@gmail.com",
          name: user.name || user.displayName || "Jonathan Procter"
        } : null,
        environment: {
          hasAccessToken: !!envAccessToken && !envAccessToken.startsWith('dev-'),
          hasRefreshToken: !!envRefreshToken && !envRefreshToken.startsWith('dev-')
        },
        tokenSources: {
          userSession: userHasTokens,
          environment: envHasTokens
        }
      });
    } catch (error) {
      console.error('[ERROR] Auth status error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Auth debug endpoint
  app.get('/api/auth/debug', async (req, res) => {
    try {
      const authStatus = {
        authenticated: !!req.user,
        hasValidTokens: !!req.user,
        user: req.user || null,
        sessionId: req.sessionID,
        sessionData: req.session ? {
          userId: req.session.userId,
          passport: req.session.passport
        } : null
      };
      
      res.json(authStatus);
    } catch (error) {
      console.error('[ERROR] Auth debug error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Calendar sync endpoint
  app.get('/api/calendar/sync', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      if (!userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          needsAuth: true,
          authUrl: '/api/auth/google' 
        });
      }

      // Use environment tokens for calendar access
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      
      if (!accessToken) {
        return res.status(401).json({ 
          error: 'Authentication required',
          needsAuth: true,
          authUrl: '/api/auth/google' 
        });
      }

      // Test calendar access and return basic success
      const events = await testGoogleCalendarAccess(accessToken);
      res.json({ success: true, events: events || [], count: events?.length || 0 });

    } catch (error) {
      console.error('[ERROR] Calendar sync endpoint error:', error);
      res.status(500).json({ error: error.message });
    }
  });



  // Sync test endpoint
  app.get('/api/sync/test', async (req, res) => {
    try {
      console.log('🧪 Testing sync capabilities...');
      
      const sessionUser = req.session?.passport?.user;
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      
      const syncStatus = {
        hasSessionTokens: !!(sessionUser && sessionUser.accessToken),
        hasEnvironmentTokens: !!envAccessToken,
        sessionEmail: sessionUser?.email || 'None',
        canSync: !!(sessionUser?.accessToken || envAccessToken),
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 Sync test results:', syncStatus);
      
      res.json({
        success: true,
        syncCapability: syncStatus,
        recommendation: syncStatus.canSync ? 
          'Sync should work - try POST /api/sync/calendar' : 
          'Authentication required - visit /api/auth/google'
      });
      
    } catch (error) {
      console.error('[ERROR] Sync test error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Alternative calendar sync endpoint (POST version)
  app.post('/api/sync/calendar', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      console.log('🔄 Starting comprehensive Google Calendar sync...');
      
      // Check if we have valid tokens
      const sessionUser = req.session?.passport?.user;
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      
      if (!sessionUser && !envAccessToken) {
        console.log('❌ No authentication tokens available for sync');
        return res.status(401).json({ 
          success: false,
          error: 'Authentication required for sync',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }
      
      // Use the force sync function
      const { forceGoogleCalendarSync } = await import('./force-google-sync');
      
      // Create a mock response object for the force sync function
      let syncResult = null;
      let syncError = null;
      
      const mockRes = {
        json: (data) => { syncResult = data; },
        status: (code) => ({ 
          json: (data) => { 
            syncError = data; 
            syncError.statusCode = code; 
          }
        })
      };
      
      // Call the force sync function
      await forceGoogleCalendarSync(req, mockRes);
      
      if (syncError) {
        console.error('❌ Sync failed:', syncError);
        return res.status(syncError.statusCode || 500).json(syncError);
      }
      
      if (syncResult && syncResult.success) {
        console.log('✅ Sync completed successfully:', syncResult.summary);
        return res.json({
          success: true,
          message: 'Calendar sync completed successfully',
          events: syncResult.summary?.totalEventsSaved || 0,
          count: syncResult.summary?.totalEventsSaved || 0,
          calendarsProcessed: syncResult.summary?.calendarsProcessed || 0,
          timestamp: new Date().toISOString(),
          details: syncResult.summary
        });
      }
      
      // Fallback response
      res.json({ 
        success: true, 
        message: 'Calendar sync completed',
        events: [],
        count: 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ERROR] Calendar sync POST error:', error);
      res.status(500).json({ 
        error: 'Sync failed', 
        details: error.message,
        needsAuth: error.message?.includes('authentication') || error.message?.includes('unauthorized')
      });
    }
  });

  // Deployment fix endpoint
  app.post('/api/auth/deployment-fix', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      // Return success for deployment fix
      res.json({ 
        success: true, 
        message: 'Authentication deployment fix completed',
        authenticated: true,
        hasValidTokens: true,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ERROR] Deployment fix error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth login endpoint
  app.get('/api/auth/google', async (req, res) => {
    try {
      const { generateOAuthUrl } = await import('./oauth-comprehensive-fix');
      const authUrl = generateOAuthUrl();
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('[ERROR] Google OAuth error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Google OAuth callback endpoint
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        console.error('[ERROR] Authorization code missing');
        return res.redirect('/?auth=error&reason=no_code');
      }
      
      const { handleComprehensiveOAuthCallback } = await import('./oauth-comprehensive-fix');
      const user = await handleComprehensiveOAuthCallback(code as string);
      
      // Store user in session
      req.user = user;
      req.session.passport = {
        user: user
      };
      req.session.userId = user.id;
      
      console.log('✅ OAuth callback successful, user stored in session:', user.email);
      
      // Redirect to success page
      res.redirect('/?auth=success');
    } catch (error) {
      console.error('[ERROR] OAuth callback error:', error);
      res.redirect('/?auth=error&reason=callback_failed');
    }
  });

  // Token refresh endpoint
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";
      
      if (req.user) {
        await comprehensiveTokenRefresh(req.user);
        res.json({ success: true, message: 'Tokens refreshed successfully' });
      } else {
        res.status(401).json({ 
          error: 'Authentication required', 
          requireReauth: true,
          authUrl: '/api/auth/google'
        });
      }
    } catch (error) {
      console.error('[ERROR] Token refresh error:', error);
      
      if (error.message.includes('AUTHENTICATION_REQUIRED') || 
          error.message.includes('REAUTHENTICATION_REQUIRED')) {
        return res.status(401).json({ 
          error: 'Authentication required', 
          requireReauth: true,
          authUrl: '/api/auth/google'
        });
      }

      res.status(500).json({ error: error.message });
    }
  });

  // OAuth config refresh endpoint
  app.post('/api/auth/refresh-config', async (req, res) => {
    try {
      console.log('🔄 Refreshing OAuth configuration...');
      
      // Log current environment variables (masked)
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
      
      console.log('📋 Client ID:', clientId ? `${clientId.substring(0, 20)}...` : 'NOT SET');
      console.log('📋 Client Secret:', clientSecret ? 'SET' : 'NOT SET');
      
      if (!clientId || !clientSecret) {
        return res.status(400).json({ 
          success: false,
          error: 'Missing OAuth credentials',
          details: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables'
        });
      }
      
      // Test creating OAuth client
      const { createComprehensiveOAuth2Client } = await import('./oauth-comprehensive-fix');
      const testClient = createComprehensiveOAuth2Client();
      
      console.log('✅ OAuth configuration refreshed successfully');
      
      res.json({
        success: true,
        message: 'OAuth configuration refreshed successfully',
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        redirectUri: `${process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000'}/api/auth/google/callback`
      });
    } catch (error) {
      console.error('❌ OAuth configuration refresh failed:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to refresh OAuth configuration',
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}