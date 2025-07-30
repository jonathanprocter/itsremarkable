/**
 * Google OAuth Token Refresh System
 * Handles automatic token renewal and expiration detection
 */

export class TokenRefreshManager {
  private static refreshInProgress = false;

  /**
   * Check if a token is expired or near expiry
   */
  static isTokenExpired(accessToken: string): boolean {
    if (!accessToken) return true;
    
    try {
      // Basic check - in production you'd decode JWT
      // For now, assume tokens are valid for 1 hour
      const tokenAge = Date.now() - this.getTokenTimestamp(accessToken);
      return tokenAge > 55 * 60 * 1000; // Refresh 5 minutes before expiry
    } catch (error) {
      console.error('Token expiry check failed:', error);
      return true;
    }
  }

  /**
   * Get token timestamp (mock implementation)
   */
  private static getTokenTimestamp(token: string): number {
    // In a real implementation, decode the JWT to get timestamp
    // For now, return current time minus 30 minutes as approximation
    return Date.now() - (30 * 60 * 1000);
  }

  /**
   * Refresh Google OAuth tokens
   */
  static async refreshGoogleTokens(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  } | null> {
    if (this.refreshInProgress) {
      console.log('⏳ Token refresh already in progress, waiting...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return null;
    }

    this.refreshInProgress = true;

    try {
      console.log('🔄 Refreshing Google OAuth tokens...');

      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();

      if (credentials.access_token) {
        console.log('✅ Token refresh successful');
        return {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          expires_in: credentials.expiry_date ? 
            Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
        };
      }

      throw new Error('No access token received');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return null;
    } finally {
      this.refreshInProgress = false;
    }
  }

  /**
   * Update user session with new tokens
   */
  static async updateUserTokens(
    userId: number, 
    accessToken: string, 
    refreshToken?: string
  ): Promise<boolean> {
    try {
      const { storage } = await import('../storage');
      
      // Update environment variables
      process.env.GOOGLE_ACCESS_TOKEN = accessToken;
      if (refreshToken) {
        process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
      }

      console.log('✅ User tokens updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update user tokens:', error);
      return false;
    }
  }

  /**
   * Validate and refresh tokens if needed
   */
  static async ensureValidTokens(user: any): Promise<boolean> {
    try {
      const accessToken = user.accessToken || process.env.GOOGLE_ACCESS_TOKEN;
      const refreshToken = user.refreshToken || process.env.GOOGLE_REFRESH_TOKEN;

      if (!accessToken) {
        console.log('❌ No access token found');
        return false;
      }

      if (!this.isTokenExpired(accessToken)) {
        console.log('✅ Access token is still valid');
        return true;
      }

      if (!refreshToken) {
        console.log('❌ No refresh token available for renewal');
        return false;
      }

      console.log('🔄 Access token expired, attempting refresh...');
      const newTokens = await this.refreshGoogleTokens(refreshToken);

      if (!newTokens) {
        console.log('❌ Failed to refresh tokens');
        return false;
      }

      // Update tokens
      const updated = await this.updateUserTokens(
        user.id,
        newTokens.access_token,
        newTokens.refresh_token
      );

      return updated;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      return false;
    }
  }

  /**
   * Test Google Calendar access with current tokens
   */
  static async testGoogleCalendarAccess(): Promise<boolean> {
    try {
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      if (!accessToken) return false;

      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      await calendar.calendarList.list({ maxResults: 1 });

      console.log('✅ Google Calendar access verified');
      return true;
    } catch (error) {
      console.error('❌ Google Calendar access test failed:', error);
      return false;
    }
  }
}