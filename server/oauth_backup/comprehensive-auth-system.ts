import { google } from 'googleapis';
import type { Request, Response } from 'express';

export class ComprehensiveAuthSystem {
  private oauth2Client: any;
  private redirectUri: string;
  private scopes: string[];

  constructor() {
    // Dynamic domain detection for OAuth callback
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    const baseURL = domain.startsWith('https://') ? domain : `https://${domain}`;
    this.redirectUri = `${baseURL}/api/auth/callback`;

    // Required scopes for Google Calendar access
    this.scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ];

    // Initialize OAuth2 client with trimmed credentials
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID?.trim(),
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
      this.redirectUri
    );
  }

  /**
   * Generate authentication URL for Google OAuth
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: this.scopes
    });
  }

  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(code: string, req: Request): Promise<boolean> {
    try {
      console.log('🔄 Processing OAuth callback with code:', code.substring(0, 10) + '...');

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);

      if (!tokens.access_token) {
        console.error('❌ No access token received from Google');
        return false;
      }

      console.log('✅ Tokens received successfully');

      // Set credentials and test immediately
      this.oauth2Client.setCredentials(tokens);

      // Test token validity with Calendar API
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        await calendar.calendarList.list({ maxResults: 1 });
        console.log('✅ Token validation successful');
      } catch (testError) {
        console.error('❌ Token validation failed:', testError);
        return false;
      }

      // Get user information
      let userInfo = { id: 'unknown', email: 'authenticated@gmail.com', name: 'Authenticated User' };
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const userResponse = await oauth2.userinfo.get();
        userInfo = userResponse.data;
        console.log('✅ User info retrieved:', userInfo.email);
      } catch (userError) {
        console.warn('⚠️ Could not fetch user info, using fallback');
      }

      // Store tokens in session
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope
      };

      req.session.isGoogleAuthenticated = true;

      // Set user object for session
      const user = {
        id: '1',
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        displayName: userInfo.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        provider: 'google'
      };

      req.user = user;
      req.session.passport = { user };

      console.log('✅ User authenticated and session established:', user.email);
      return true;

    } catch (error) {
      console.error('❌ OAuth callback processing failed:', error);
      return false;
    }
  }

  /**
   * Check if user has valid Google tokens
   */
  async hasValidTokens(req: Request): Promise<boolean> {
    try {
      const sessionTokens = req.session?.googleTokens;
      const envTokens = {
        access_token: process.env.GOOGLE_ACCESS_TOKEN?.trim(),
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN?.trim()
      };

      // Check session tokens first
      let tokensToTest = sessionTokens;
      let tokenSource = 'session';

      // Fall back to environment tokens if session tokens unavailable
      if (!tokensToTest?.access_token && envTokens.access_token) {
        tokensToTest = envTokens;
        tokenSource = 'environment';
      }

      if (!tokensToTest?.access_token) {
        console.log('❌ No access tokens available');
        return false;
      }

      // Test token validity
      this.oauth2Client.setCredentials(tokensToTest);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });

      console.log(`✅ Token validation successful (source: ${tokenSource})`);
      return true;

    } catch (error) {
      console.error('❌ Token validation failed:', error);

      // Clear invalid session tokens
      if (req.session?.googleTokens) {
        req.session.googleTokens = null;
        req.session.isGoogleAuthenticated = false;
      }

      return false;
    }
  }

  /**
   * Refresh expired tokens
   */
  async refreshTokens(req: Request): Promise<boolean> {
    try {
      const sessionTokens = req.session?.googleTokens;
      const refreshToken = sessionTokens?.refresh_token || process.env.GOOGLE_REFRESH_TOKEN?.trim();

      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }

      console.log('🔄 Refreshing access token...');

      // Set refresh token and refresh
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update session with new tokens
      req.session.googleTokens = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || refreshToken,
        expiry_date: credentials.expiry_date,
        token_type: credentials.token_type || 'Bearer',
        scope: credentials.scope
      };

      // Update user object if present
      if (req.user) {
        req.user.accessToken = credentials.access_token;
        if (credentials.refresh_token) {
          req.user.refreshToken = credentials.refresh_token;
        }
      }

      console.log('✅ Token refresh successful');
      return true;

    } catch (error) {
      console.error('❌ Token refresh failed:', error);

      // Clear invalid tokens
      if (req.session?.googleTokens) {
        req.session.googleTokens = null;
        req.session.isGoogleAuthenticated = false;
      }

      return false;
    }
  }

  /**
   * Get comprehensive authentication status
   */
  async getAuthStatus(req: Request): Promise<any> {
    const user = req.user || req.session?.passport?.user;
    const sessionTokens = req.session?.googleTokens;
    const envTokens = {
      hasAccessToken: !!process.env.GOOGLE_ACCESS_TOKEN,
      hasRefreshToken: !!process.env.GOOGLE_REFRESH_TOKEN,
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
    };

    // Test token validity
    const hasValidTokens = await this.hasValidTokens(req);

    return {
      isAuthenticated: !!user,
      hasValidTokens,
      user: user ? {
        id: user.id,
        email: user.email,
        displayName: user.displayName || user.name,
        provider: user.provider || 'google'
      } : null,
      session: {
        hasSession: !!req.session,
        sessionId: req.sessionID,
        hasGoogleTokens: !!sessionTokens,
        hasPassport: !!req.session?.passport,
        tokenExpiry: sessionTokens?.expiry_date ? new Date(sessionTokens.expiry_date).toISOString() : null
      },
      environment: envTokens,
      authUrl: !hasValidTokens ? this.getAuthUrl() : null,
      recommendations: !hasValidTokens ? [
        'Click "Google OAuth Login" to authenticate',
        'Ensure Google Cloud Console OAuth is configured correctly',
        'Check that redirect URI matches your domain'
      ] : [
        'Authentication is working correctly',
        'Google Calendar sync should be functional'
      ]
    };
  }

  /**
   * Get authenticated OAuth2 client for API calls
   */
  getAuthenticatedClient(req: Request): any {
    const sessionTokens = req.session?.googleTokens;
    const envTokens = {
      access_token: process.env.GOOGLE_ACCESS_TOKEN?.trim(),
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN?.trim()
    };

    // Use session tokens first, fall back to environment
    const tokensToUse = sessionTokens || envTokens;

    if (!tokensToUse.access_token) {
      throw new Error('No access token available');
    }

    this.oauth2Client.setCredentials(tokensToUse);
    return this.oauth2Client;
  }

  /**
   * Force Google Calendar sync with comprehensive error handling
   */
  async forceGoogleCalendarSync(req: Request): Promise<any> {
    try {
      console.log('🔄 Starting comprehensive Google Calendar sync...');

      // Get authenticated client
      const oauth2Client = this.getAuthenticatedClient(req);
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Get all calendars
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      console.log(`📅 Found ${calendars.length} calendars to sync`);

      // Fetch events from all calendars
      const allEvents = [];
      const timeMin = new Date('2025-01-01').toISOString();
      const timeMax = new Date('2025-12-31').toISOString();

      for (const cal of calendars) {
        try {
          console.log(`🔍 Syncing calendar: ${cal.summary} (${cal.id})`);

          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin,
            timeMax,
            maxResults: 2500,
            singleEvents: true,
            orderBy: 'startTime'
          });

          const events = eventsResponse.data.items || [];

          const formattedEvents = events.map(event => ({
            id: event.id,
            title: event.summary || 'Untitled Event',
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            description: event.description || '',
            location: event.location || '',
            source: event.summary?.toLowerCase().includes('appointment') ? 'simplepractice' : 'google',
            calendarId: cal.id
          }));

          allEvents.push(...formattedEvents);

          console.log(`✅ Synced ${formattedEvents.length} events from ${cal.summary}`);

        } catch (calendarError) {
          console.warn(`⚠️ Could not sync calendar ${cal.summary}: ${calendarError.message}`);
        }
      }

      console.log(`🎯 Total events synced: ${allEvents.length}`);

      return {
        success: true,
        eventsCount: allEvents.length,
        calendarsCount: calendars.length,
        events: allEvents,
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor || '#4285f4'
        })),
        syncTime: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Google Calendar sync failed:', error);

      // Check if it's an authentication error
      if (error.code === 401 || error.message.includes('invalid_grant')) {
        return {
          success: false,
          error: 'Authentication failed',
          needsReauth: true,
          authUrl: this.getAuthUrl(),
          message: 'Google tokens have expired. Please re-authenticate.'
        };
      }

      return {
        success: false,
        error: 'Sync failed',
        message: error.message,
        details: error.code || 'unknown'
      };
    }
  }
}

// Export singleton instance
export const comprehensiveAuthSystem = new ComprehensiveAuthSystem();