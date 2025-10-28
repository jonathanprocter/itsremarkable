// ===== 1. OAuth Configuration and Setup =====
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from './db';
import { users, oauthTokens } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

interface UserTokens {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

interface User {
  id: string;
  email: string;
  tokens?: UserTokens;
}

export class GoogleOAuthManager {
  private oauth2Client: OAuth2Client;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  constructor() {
    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
    const currentDomain = domains[0] || "474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev";
    const redirectUri = `https://${currentDomain}/api/auth/google/callback`;
    
    console.log('🔧 OAuth Manager initialized with domain:', currentDomain);
    console.log('🔗 Redirect URI:', redirectUri);

    // NEVER use dev tokens in production - only real OAuth credentials
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID?.trim(),
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
      redirectUri
    );
  }

  // ===== 2. Generate OAuth URL (Force Fresh Consent) =====
  generateAuthUrl(userId: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline', // Required for refresh_token
      prompt: 'consent',      // FORCE new refresh_token every time
      scope: this.SCOPES,
      state: userId,          // Pass user ID for callback
      include_granted_scopes: true
    });
  }

  // ===== 3. OAuth Callback Handler (Save Real Tokens) =====
  async handleOAuthCallback(code: string, userId: string): Promise<UserTokens> {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Validate we got a refresh token
      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. User must grant offline access.');
      }

      // Validate required tokens
      if (!tokens.access_token) {
        throw new Error('No access token received from Google OAuth.');
      }

      console.log('✅ Successfully obtained OAuth tokens:', {
        has_refresh_token: !!tokens.refresh_token,
        has_access_token: !!tokens.access_token,
        expires_in: tokens.expiry_date,
        user_id: userId
      });

      // Save tokens to storage
      await this.saveUserTokens(userId, tokens as UserTokens);

      return tokens as UserTokens;
    } catch (error) {
      console.error('❌ OAuth callback failed:', error);
      throw new Error(`OAuth authentication failed: ${error.message}`);
    }
  }

  // ===== 4. Token Storage (Database-based) =====
  private async saveUserTokens(userId: string, tokens: UserTokens): Promise<void> {
    try {
      // Check if tokens already exist for this user and provider
      const existingToken = await db
        .select()
        .from(oauthTokens)
        .where(
          and(
            eq(oauthTokens.userId, parseInt(userId)),
            eq(oauthTokens.provider, 'google')
          )
        )
        .limit(1);

      const tokenData = {
        userId: parseInt(userId),
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope || this.SCOPES.join(' '),
        updatedAt: new Date(),
      };

      if (existingToken.length > 0) {
        // Update existing tokens
        await db
          .update(oauthTokens)
          .set(tokenData)
          .where(
            and(
              eq(oauthTokens.userId, parseInt(userId)),
              eq(oauthTokens.provider, 'google')
            )
          );
      } else {
        // Insert new tokens
        await db.insert(oauthTokens).values({
          ...tokenData,
          createdAt: new Date(),
        });
      }

      console.log(`✅ Tokens saved to database for user ${userId}`);
    } catch (error) {
      console.error(`❌ Failed to save tokens for user ${userId}:`, error);
      throw error;
    }
  }

  // ===== 5. Token Retrieval (From Database) =====
  private async getUserTokens(userId: string): Promise<UserTokens | null> {
    try {
      const result = await db
        .select()
        .from(oauthTokens)
        .where(
          and(
            eq(oauthTokens.userId, parseInt(userId)),
            eq(oauthTokens.provider, 'google')
          )
        )
        .limit(1);
      
      if (result.length === 0) {
        console.log(`No tokens found in database for user ${userId}`);
        return null;
      }

      const token = result[0];
      return {
        access_token: token.accessToken,
        refresh_token: token.refreshToken || '',
        expiry_date: token.expiresAt ? new Date(token.expiresAt).getTime() : undefined,
        token_type: token.tokenType || 'Bearer',
        scope: token.scope || this.SCOPES.join(' '),
      };
    } catch (error) {
      console.error(`Failed to retrieve tokens for user ${userId}:`, error);
      return null;
    }
  }

  // ===== 6. Token Refresh Logic (Handle Invalid Grants) =====
  async refreshTokensIfNeeded(userId: string): Promise<OAuth2Client> {
    const tokens = await this.getUserTokens(userId);
    
    if (!tokens) {
      throw new Error('AUTHENTICATION_REQUIRED: No tokens found for user');
    }

    this.oauth2Client.setCredentials(tokens);

    try {
      // Check if access token is expired and refresh if needed
      if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
        console.log('🔄 Access token expired, refreshing...');
        
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Save refreshed tokens
        const updatedTokens = { ...tokens, ...credentials };
        await this.saveUserTokens(userId, updatedTokens);
        
        console.log('✅ Tokens refreshed successfully');
      }

      return this.oauth2Client;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // If refresh fails with invalid_grant, tokens are completely invalid
      if (error.message.includes('invalid_grant')) {
        console.log('🔑 Refresh token invalid, requiring re-authentication');
        
        // Delete invalid tokens
        await this.clearUserTokens(userId);
        
        throw new Error('REAUTHENTICATION_REQUIRED: Refresh token is invalid');
      }
      
      throw error;
    }
  }

  // ===== 7. Clear Invalid Tokens =====
  private async clearUserTokens(userId: string): Promise<void> {
    try {
      await db
        .delete(oauthTokens)
        .where(
          and(
            eq(oauthTokens.userId, parseInt(userId)),
            eq(oauthTokens.provider, 'google')
          )
        );
      console.log(`🗑️ Cleared invalid tokens from database for user ${userId}`);
    } catch (error) {
      console.error(`Failed to clear tokens for user ${userId}:`, error);
      // Continue even if deletion fails
    }
  }

  // ===== 8. Calendar Sync with Proper Authentication =====
  async syncCalendarEvents(userId: string, calendarId: string = 'primary') {
    try {
      // Get authenticated client (will refresh tokens if needed)
      const authClient = await this.refreshTokensIfNeeded(userId);
      
      // Create calendar instance
      const calendar = google.calendar({ version: 'v3', auth: authClient });
      
      // Fetch events
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 100
      });

      console.log(`✅ Successfully synced ${response.data.items?.length || 0} calendar events`);
      return response.data.items || [];

    } catch (error) {
      console.error('❌ Calendar sync failed:', error);
      
      if (error.message.includes('AUTHENTICATION_REQUIRED') || 
          error.message.includes('REAUTHENTICATION_REQUIRED')) {
        throw error; // Let the frontend handle re-auth
      }
      
      throw new Error(`Calendar sync failed: ${error.message}`);
    }
  }

  // ===== 9. Check Authentication Status =====
  async checkAuthStatus(userId: string): Promise<{ isAuthenticated: boolean; hasValidTokens: boolean }> {
    try {
      const tokens = await this.getUserTokens(userId);
      
      if (!tokens || !tokens.refresh_token) {
        return { isAuthenticated: false, hasValidTokens: false };
      }

      // Try to refresh tokens to verify they're valid
      await this.refreshTokensIfNeeded(userId);
      return { isAuthenticated: true, hasValidTokens: true };
      
    } catch (error) {
      if (error.message.includes('AUTHENTICATION_REQUIRED') || 
          error.message.includes('REAUTHENTICATION_REQUIRED')) {
        return { isAuthenticated: false, hasValidTokens: false };
      }
      
      // Other errors
      console.error('Auth status check failed:', error);
      return { isAuthenticated: false, hasValidTokens: false };
    }
  }

  // Get current redirect URI
  getCurrentRedirectURI(): string {
    const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
    const currentDomain = domains[0] || "474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev";
    return `https://${currentDomain}/api/auth/google/callback`;
  }
}

// Export singleton instance
export const oauthManager = new GoogleOAuthManager();