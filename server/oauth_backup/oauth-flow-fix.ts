import { google } from 'googleapis';
import type { Request, Response } from 'express';

export class UnifiedGoogleAuth {
  private oauth2Client: any;
  private redirectUri: string;

  constructor() {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    const baseURL = domain.startsWith('https://') ? domain : `https://${domain}`;
    this.redirectUri = `${baseURL}/api/auth/callback`;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID?.trim(),
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
      this.redirectUri
    );
  }

  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ]
    });
  }

  async handleCallback(code: string, req: Request): Promise<boolean> {
    try {
      console.log('🔄 Processing OAuth callback with code:', code.substring(0, 10) + '...');
      
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        console.error('❌ No access token received from Google');
        return false;
      }

      console.log('✅ Tokens received successfully');

      // Test tokens immediately
      this.oauth2Client.setCredentials(tokens);
      
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        await calendar.calendarList.list({ maxResults: 1 });
        console.log('✅ Token validation successful');
      } catch (testError) {
        console.error('❌ Token validation failed:', testError);
        return false;
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

      // Get user info
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        
        const user = {
          id: '1',
          googleId: userInfo.data.id,
          email: userInfo.data.email,
          name: userInfo.data.name,
          displayName: userInfo.data.name,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          provider: 'google'
        };

        req.user = user;
        req.session.passport = { user };
        
        console.log('✅ User authenticated:', user.email);
      } catch (userError) {
        console.warn('⚠️ Could not fetch user info, using fallback');
        
        const user = {
          id: '1',
          email: 'authenticated@gmail.com',
          name: 'Authenticated User',
          displayName: 'Authenticated User',
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          provider: 'google'
        };

        req.user = user;
        req.session.passport = { user };
      }

      return true;
    } catch (error) {
      console.error('❌ OAuth callback processing failed:', error);
      return false;
    }
  }

  async hasValidTokens(req: Request): Promise<boolean> {
    try {
      const sessionTokens = req.session?.googleTokens;
      
      if (!sessionTokens?.access_token) {
        return false;
      }

      this.oauth2Client.setCredentials(sessionTokens);
      
      // Test token validity
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });
      
      return true;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      
      // Clear invalid tokens
      if (req.session?.googleTokens) {
        req.session.googleTokens = null;
        req.session.isGoogleAuthenticated = false;
      }
      
      return false;
    }
  }

  async refreshTokens(req: Request): Promise<boolean> {
    try {
      const sessionTokens = req.session?.googleTokens;
      const refreshToken = sessionTokens?.refresh_token;
      
      if (!refreshToken) {
        console.log('❌ No refresh token available');
        return false;
      }
      
      console.log('🔄 Refreshing access token...');
      
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
}

export const unifiedGoogleAuth = new UnifiedGoogleAuth();