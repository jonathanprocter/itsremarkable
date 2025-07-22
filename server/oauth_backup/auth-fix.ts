/**
 * Comprehensive Authentication Fix
 * Fixes Google OAuth authentication issues including:
 * 1. Trimming client ID spaces
 * 2. Proper token exchange
 * 3. Robust session management
 */

import { google } from 'googleapis';
import type { Request, Response } from 'express';

export class AuthFix {
  private oauth2Client: any;
  private redirectUri: string;

  constructor() {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    const baseURL = domain.startsWith('https://') ? domain : `https://${domain}`;
    this.redirectUri = `${baseURL}/api/auth/callback`;

    // CRITICAL: Trim client ID to remove leading/trailing spaces
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Google OAuth credentials');
      throw new Error('Google OAuth credentials are required');
    }

    console.log('✅ OAuth Client ID:', clientId.substring(0, 20) + '...');
    console.log('✅ OAuth Redirect URI:', this.redirectUri);

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri
    );
  }

  getAuthUrl(): string {
    const authUrl = this.oauth2Client.generateAuthUrl({
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

    console.log('🔗 Generated OAuth URL:', authUrl);
    return authUrl;
  }

  async handleCallback(code: string, req: Request): Promise<boolean> {
    try {
      console.log('🔄 Processing OAuth callback...');
      console.log('🔍 Authorization code received:', code.substring(0, 20) + '...');
      
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        console.error('❌ No access token received from Google');
        return false;
      }

      console.log('✅ Tokens received successfully');
      console.log('🔍 Token info:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
      });

      // Validate tokens immediately
      this.oauth2Client.setCredentials(tokens);
      
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        const testResponse = await calendar.calendarList.list({ maxResults: 1 });
        console.log('✅ Token validation successful - found', testResponse.data.items?.length || 0, 'calendar(s)');
      } catch (testError) {
        console.error('❌ Token validation failed:', testError);
        return false;
      }

      // Get user info
      let userInfo;
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
        const userResponse = await oauth2.userinfo.get();
        userInfo = userResponse.data;
        console.log('✅ User info retrieved:', userInfo.email);
      } catch (userError) {
        console.warn('⚠️ Could not fetch user info:', userError);
        userInfo = { id: 'unknown', email: 'authenticated@gmail.com', name: 'Authenticated User' };
      }

      // Store tokens in session with comprehensive info
      req.session.googleTokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
        scope: tokens.scope
      };

      req.session.isGoogleAuthenticated = true;

      // Set user object
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

      console.log('✅ Session and user set successfully');
      return true;

    } catch (error) {
      console.error('❌ OAuth callback processing failed:', error);
      return false;
    }
  }

  async validateAndRefreshTokens(req: Request): Promise<boolean> {
    try {
      const sessionTokens = req.session?.googleTokens;
      
      if (!sessionTokens?.access_token) {
        console.log('❌ No access token found in session');
        return false;
      }

      // Set credentials
      this.oauth2Client.setCredentials(sessionTokens);
      
      // Test token validity
      try {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        await calendar.calendarList.list({ maxResults: 1 });
        console.log('✅ Existing tokens are valid');
        return true;
      } catch (error) {
        console.log('⚠️ Token validation failed, attempting refresh...');
        
        // Try to refresh tokens
        if (sessionTokens.refresh_token) {
          try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            
            // Update session with new tokens
            req.session.googleTokens = {
              access_token: credentials.access_token,
              refresh_token: credentials.refresh_token || sessionTokens.refresh_token,
              expiry_date: credentials.expiry_date,
              token_type: credentials.token_type || 'Bearer',
              scope: credentials.scope
            };
            
            // Update user object
            if (req.user) {
              req.user.accessToken = credentials.access_token;
              if (credentials.refresh_token) {
                req.user.refreshToken = credentials.refresh_token;
              }
            }
            
            console.log('✅ Token refresh successful');
            return true;
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            
            // Clear invalid tokens
            req.session.googleTokens = null;
            req.session.isGoogleAuthenticated = false;
            req.user = null;
            
            return false;
          }
        } else {
          console.log('❌ No refresh token available');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  }

  async testGoogleConnection(req: Request): Promise<any> {
    try {
      const sessionTokens = req.session?.googleTokens;
      
      if (!sessionTokens?.access_token) {
        return { 
          success: false, 
          error: 'No access token found',
          needsAuth: true 
        };
      }

      this.oauth2Client.setCredentials(sessionTokens);
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      const response = await calendar.calendarList.list({ maxResults: 10 });
      
      const calendars = response.data.items || [];
      
      return {
        success: true,
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor
        })),
        tokenInfo: {
          hasAccessToken: !!sessionTokens.access_token,
          hasRefreshToken: !!sessionTokens.refresh_token,
          expiryDate: sessionTokens.expiry_date ? new Date(sessionTokens.expiry_date).toISOString() : null
        }
      };
    } catch (error) {
      console.error('❌ Google connection test failed:', error);
      return {
        success: false,
        error: error.message,
        needsAuth: true
      };
    }
  }
}

export const authFix = new AuthFix();