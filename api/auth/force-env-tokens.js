
/**
 * Force Environment Tokens Endpoint
 * This endpoint forces the application of environment tokens for OAuth authentication
 */

import { google } from 'googleapis';

// Simple OAuth2 client configuration
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    getRedirectURI(),
  );
}

function getRedirectURI() {
  // Get current domain for redirect URI
  const baseURL = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev";

  return `${baseURL}/api/auth/google/callback`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔧 Force Environment Tokens endpoint called');

  try {
    // Get environment tokens
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN?.trim();
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

    console.log('🔍 Environment token status:');
    console.log('- Access token exists:', !!accessToken);
    console.log('- Refresh token exists:', !!refreshToken);
    console.log('- Access token valid:', !!accessToken && !accessToken.startsWith('dev-'));
    console.log('- Refresh token valid:', !!refreshToken && !refreshToken.startsWith('dev-'));

    if (!accessToken || !refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing environment tokens',
        details: 'GOOGLE_ACCESS_TOKEN and GOOGLE_REFRESH_TOKEN must be set'
      });
    }

    // Check if tokens are dev tokens
    if (accessToken.startsWith('dev-') || refreshToken.startsWith('dev-')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid environment tokens',
        details: 'Environment tokens appear to be development placeholders'
      });
    }

    // Test the tokens by creating OAuth client and making a test call
    console.log('🧪 Testing environment tokens...');
    
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    // Test token validity with a simple calendar list call
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.calendarList.list({ maxResults: 1 });
      
      console.log('✅ Environment tokens are valid');
      
      // Create user object with environment tokens
      const user = {
        id: "1",
        googleId: "108011271571830226042",
        email: "jonathan.procter@gmail.com",
        name: "Jonathan Procter",
        displayName: "Jonathan Procter",
        accessToken: accessToken,
        refreshToken: refreshToken,
        provider: "google",
      };

      // Force apply to session if it exists
      if (req.session) {
        req.session.passport = { user };
        req.user = user;
        console.log('✅ Environment tokens applied to session');
      }

      // Return success response
      return res.json({
        success: true,
        message: 'Environment tokens applied successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider
        },
        tokenStatus: {
          hasAccessToken: true,
          hasRefreshToken: true,
          tokensValid: true
        },
        testResults: {
          calendarApiWorking: true,
          calendarsFound: response.data.items?.length || 0
        }
      });

    } catch (tokenError) {
      console.log('❌ Environment tokens failed validation:', tokenError.message);
      
      // If access token expired, try to refresh
      if (tokenError.message.includes('invalid_grant') || tokenError.message.includes('unauthorized')) {
        console.log('🔄 Attempting token refresh...');
        
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          if (credentials.access_token) {
            console.log('✅ Token refresh successful');
            
            // Create user with refreshed tokens
            const user = {
              id: "1",
              googleId: "108011271571830226042",
              email: "jonathan.procter@gmail.com",
              name: "Jonathan Procter",
              displayName: "Jonathan Procter",
              accessToken: credentials.access_token,
              refreshToken: credentials.refresh_token || refreshToken,
              provider: "google",
            };

            // Apply to session
            if (req.session) {
              req.session.passport = { user };
              req.user = user;
            }

            return res.json({
              success: true,
              message: 'Environment tokens applied after refresh',
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                provider: user.provider
              },
              tokenStatus: {
                hasAccessToken: true,
                hasRefreshToken: true,
                tokensValid: true,
                refreshed: true
              }
            });
          }
        } catch (refreshError) {
          console.log('❌ Token refresh failed:', refreshError.message);
          
          return res.status(401).json({
            success: false,
            error: 'Environment tokens invalid and refresh failed',
            details: refreshError.message,
            needsReauth: true
          });
        }
      }

      return res.status(401).json({
        success: false,
        error: 'Environment tokens validation failed',
        details: tokenError.message,
        needsReauth: true
      });
    }

  } catch (error) {
    console.error('❌ Force environment tokens error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to apply environment tokens',
      details: error.message
    });
  }
}
