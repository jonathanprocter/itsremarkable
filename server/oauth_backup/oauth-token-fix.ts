import { google } from 'googleapis';

/**
 * OAuth Token Fix System
 * Handles Google OAuth token refresh and authentication issues
 */
export class OAuthTokenFix {
  private oauth2Client: any;
  private redirectUri: string;

  constructor() {
    // Clean credentials to remove any whitespace
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    
    // Dynamic domain detection
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    const baseURL = domain.startsWith('https://') ? domain : `https://${domain}`;
    this.redirectUri = `${baseURL}/api/auth/callback`;

    console.log('🔧 OAuth Client initialized with:', {
      clientId: clientId?.substring(0, 20) + '...',
      redirectUri: this.redirectUri,
      hasSecret: !!clientSecret
    });

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri
    );
  }

  /**
   * Test and refresh tokens using environment variables
   */
  async testAndRefreshTokens(): Promise<{success: boolean, tokens?: any, error?: string}> {
    try {
      console.log('🔄 Testing environment tokens...');

      const accessToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available in environment'
        };
      }

      // Set refresh token and try to refresh
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      console.log('🔄 Attempting token refresh...');
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      console.log('✅ Token refresh successful:', {
        hasAccessToken: !!credentials.access_token,
        hasRefreshToken: !!credentials.refresh_token,
        expiryDate: credentials.expiry_date ? new Date(credentials.expiry_date).toISOString() : null
      });

      // Test the new token
      this.oauth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });

      console.log('✅ Token validation successful');

      return {
        success: true,
        tokens: {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || refreshToken,
          expiry_date: credentials.expiry_date,
          token_type: credentials.token_type || 'Bearer'
        }
      };

    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return {
        success: false,
        error: error.message || 'Token refresh failed'
      };
    }
  }

  /**
   * Apply fresh tokens to session
   */
  async applyTokensToSession(req: any): Promise<boolean> {
    try {
      const result = await this.testAndRefreshTokens();
      
      if (!result.success) {
        console.error('❌ Cannot apply tokens:', result.error);
        return false;
      }

      // Store fresh tokens in session
      req.session.googleTokens = result.tokens;
      req.session.isGoogleAuthenticated = true;

      // Update user object if present
      if (req.user) {
        req.user.accessToken = result.tokens.access_token;
        req.user.refreshToken = result.tokens.refresh_token;
      }

      console.log('✅ Fresh tokens applied to session');
      return true;

    } catch (error) {
      console.error('❌ Failed to apply tokens to session:', error);
      return false;
    }
  }

  /**
   * Get authentication URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ]
    });
  }

  /**
   * Force Google Calendar sync with fresh tokens
   */
  async forceGoogleCalendarSync(req: any): Promise<any> {
    try {
      console.log('🔄 Starting force Google Calendar sync...');

      // Apply fresh tokens first
      const tokensApplied = await this.applyTokensToSession(req);
      if (!tokensApplied) {
        return {
          success: false,
          error: 'Failed to refresh tokens',
          needsReauth: true,
          authUrl: this.getAuthUrl()
        };
      }

      // Use fresh tokens for calendar sync
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // Get calendar list
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      console.log(`📅 Found ${calendars.length} calendars`);

      // Sync events from all calendars
      const allEvents = [];
      const timeMin = new Date('2025-01-01').toISOString();
      const timeMax = new Date('2025-12-31').toISOString();

      for (const cal of calendars) {
        try {
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
export const oauthTokenFix = new OAuthTokenFix();