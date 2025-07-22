/**
 * Comprehensive Token Refresh System
 * This module provides a complete solution for refreshing Google Calendar authentication tokens
 * and ensuring calendar events are properly loaded and refreshed.
 */

import { google } from 'googleapis';
import { Request, Response } from 'express';

interface TokenRefreshResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
  needsReauth?: boolean;
}

/**
 * Comprehensive token refresh function that handles all edge cases
 */
export async function refreshGoogleTokens(req: Request): Promise<TokenRefreshResult> {
  console.log('🔄 Starting comprehensive token refresh...');

  try {
    // Get current tokens from session or environment
    const sessionTokens = req.session?.googleTokens;
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

    // Try session tokens first, then environment tokens
    let accessToken = sessionTokens?.access_token || envAccessToken;
    let refreshToken = sessionTokens?.refresh_token || envRefreshToken;

    console.log('🔍 Current token status:');
    console.log('- Session access token:', !!sessionTokens?.access_token);
    console.log('- Session refresh token:', !!sessionTokens?.refresh_token);
    console.log('- Environment access token:', !!envAccessToken);
    console.log('- Environment refresh token:', !!envRefreshToken);

    if (!refreshToken) {
      console.log('❌ No refresh token available - need fresh authentication');
      return {
        success: false,
        error: 'No refresh token available',
        needsReauth: true
      };
    }

    // Initialize OAuth2 client with trimmed credentials
    const clientId = process.env.GOOGLE_CLIENT_ID?.replace(/^\s+|\s+$/g, '');
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.replace(/^\s+|\s+$/g, '');

    if (!clientId || !clientSecret) {
      console.log('❌ Missing OAuth credentials');
      return {
        success: false,
        error: 'Missing OAuth credentials'
      };
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev'}/api/auth/callback`
    );

    // Set current tokens
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Attempt to refresh the access token
    console.log('🔄 Attempting token refresh...');
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      console.log('❌ Token refresh failed - no access token returned');
      return {
        success: false,
        error: 'Token refresh failed - no access token returned',
        needsReauth: true
      };
    }

    // Test the new token by making a simple API call
    console.log('🧪 Testing new access token...');
    const testClient = new google.auth.OAuth2(clientId, clientSecret);
    testClient.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken
    });

    const calendar = google.calendar({ version: 'v3', auth: testClient });
    
    try {
      await calendar.calendarList.list({ maxResults: 1 });
      console.log('✅ Token test successful - new token is valid');
    } catch (testError) {
      console.log('❌ Token test failed:', testError.message);
      return {
        success: false,
        error: 'New token is not valid',
        needsReauth: true
      };
    }

    // Update session with new tokens
    req.session.googleTokens = {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken,
      expiry_date: credentials.expiry_date,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events.readonly'
    };

    // Update user object if present
    if (req.user) {
      req.user.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        req.user.refreshToken = credentials.refresh_token;
      }
    }

    console.log('✅ Token refresh successful');
    return {
      success: true,
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken
    };

  } catch (error) {
    console.error('❌ Token refresh error:', error);
    
    // Handle specific error cases
    if (error.message.includes('invalid_grant') || error.message.includes('invalid_client')) {
      console.log('🔄 Refresh token expired or invalid - need fresh authentication');
      return {
        success: false,
        error: 'Refresh token expired - fresh authentication required',
        needsReauth: true
      };
    }

    return {
      success: false,
      error: error.message || 'Token refresh failed'
    };
  }
}

/**
 * Force refresh calendar events after token refresh
 */
export async function forceRefreshCalendarEvents(req: Request): Promise<boolean> {
  console.log('🔄 Force refreshing calendar events...');

  try {
    // First refresh tokens
    const tokenResult = await refreshGoogleTokens(req);
    
    if (!tokenResult.success) {
      console.log('❌ Token refresh failed, cannot refresh events');
      return false;
    }

    // Clear any cached calendar data
    if (req.session) {
      req.session.lastCalendarSync = null;
      req.session.cachedCalendars = null;
    }

    console.log('✅ Calendar events refresh initiated');
    return true;

  } catch (error) {
    console.error('❌ Calendar events refresh failed:', error);
    return false;
  }
}