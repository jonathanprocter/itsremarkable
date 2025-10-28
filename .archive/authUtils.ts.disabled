import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { storage } from './storage';

// Create OAuth2 client with dynamic domain support
export function createOAuth2Client() {
  const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
  const currentDomain = domains[0] || "474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev";
  const redirectUri = `https://${currentDomain}/api/auth/google/callback`;

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    redirectUri
  );
}

// Get authentication status
export async function getTokenStatus(req: any) {
  const user = req.user || req.session?.passport?.user;
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!user) {
    // Check if we have valid environment tokens as fallback
    const hasValidEnvTokens = !!envAccessToken && !!envRefreshToken && 
                              !envAccessToken.startsWith('dev-') && 
                              !envRefreshToken.startsWith('dev-');

    return { 
      authenticated: hasValidEnvTokens, 
      hasValidTokens: hasValidEnvTokens,
      user: hasValidEnvTokens ? {
        id: "1",
        email: "jonathan.procter@gmail.com",
        name: "Jonathan Procter",
        provider: "google"
      } : null,
      environment: {
        hasAccessToken: !!envAccessToken && !envAccessToken.startsWith('dev-'),
        hasRefreshToken: !!envRefreshToken && !envRefreshToken.startsWith('dev-')
      }
    };
  }

  // Check if tokens are valid (not dev tokens)
  const hasValidTokens = user.accessToken && 
                        user.refreshToken && 
                        !user.accessToken.startsWith('dev-') && 
                        !user.refreshToken.startsWith('dev-');

  return {
    authenticated: true,
    hasValidTokens,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.provider,
    },
    needsReauth: !hasValidTokens,
    environment: {
      hasAccessToken: !!envAccessToken && !envAccessToken.startsWith('dev-'),
      hasRefreshToken: !!envRefreshToken && !envRefreshToken.startsWith('dev-')
    }
  };
}

// Middleware to ensure authentication
export function ensureAuthenticated(req: any, res: any, next: any) {
  const user = req.user || req.session?.passport?.user;
  const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
  const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (user) {
    return next();
  }

  // Check if we have valid environment tokens as fallback
  const hasValidEnvTokens = !!envAccessToken && !!envRefreshToken && 
                            !envAccessToken.startsWith('dev-') && 
                            !envRefreshToken.startsWith('dev-');

  if (hasValidEnvTokens) {
    // Auto-authenticate with environment tokens
    const fallbackUser = {
      id: "1",
      email: "jonathan.procter@gmail.com",
      name: "Jonathan Procter",
      displayName: "Jonathan Procter",
      accessToken: envAccessToken,
      refreshToken: envRefreshToken,
      provider: "google",
    };

    req.user = fallbackUser;
    req.session.passport = { user: fallbackUser };
    console.log(`✅ Auto-authenticated with environment tokens for ${req.path}`);
    return next();
  }

  res.status(401).json({ 
    error: 'Not authenticated',
    needsAuth: true,
    authUrl: '/api/auth/google'
  });
}

// Check if token is expired
export function isTokenExpired(token: any): boolean {
  if (!token || !token.expiry_date) return true;
  return Date.now() >= token.expiry_date;
}

// Refresh Google token if needed
export async function refreshGoogleTokenIfNeeded(req: any, res: any) {
  const user = req.user || req.session?.passport?.user;

  if (!user || !user.refreshToken) {
    throw new Error('No stored refresh token');
  }

  // Check if we have dev/invalid tokens - skip refresh for these
  if (user.refreshToken === 'dev-refresh' || user.refreshToken.startsWith('dev-')) {
    console.log('⚠️ Dev/invalid refresh token detected, cannot refresh');
    throw new Error('Invalid or dev refresh token - authentication required');
  }

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  try {
    // Test current token
    await oauth2Client.getAccessToken();
    console.log('✅ Token is still valid');
    return user;
  } catch (error) {
    console.log('⚠️ Token expired, refreshing...');

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Validate the new tokens
      if (!credentials.access_token) {
        throw new Error('No access token received from refresh');
      }

      // Update user tokens
      user.accessToken = credentials.access_token;
      if (credentials.refresh_token) {
        user.refreshToken = credentials.refresh_token;
      }

      // Update session
      if (req.session?.passport?.user) {
        req.session.passport.user = user;
      }

      // Update environment for immediate use
      if (credentials.access_token) {
        process.env.GOOGLE_ACCESS_TOKEN = credentials.access_token;
      }
      if (credentials.refresh_token) {
        process.env.GOOGLE_REFRESH_TOKEN = credentials.refresh_token;
      }

      console.log('✅ Token refresh successful');
      return user;
    } catch (refreshError) {
      console.error('❌ Token refresh failed:', refreshError);
      
      // Check if it's an invalid_grant error and try environment tokens
      if (refreshError.message && refreshError.message.includes('invalid_grant')) {
        console.log('🔄 Attempting to use environment tokens as fallback');
        const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
        const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
        
        if (envAccessToken && envRefreshToken && 
            !envAccessToken.startsWith('dev-') && 
            !envRefreshToken.startsWith('dev-')) {
          
          // Update user with environment tokens
          user.accessToken = envAccessToken;
          user.refreshToken = envRefreshToken;
          
          // Update session
          if (req.session?.passport?.user) {
            req.session.passport.user = user;
          }
          
          console.log('✅ Fallback to environment tokens successful');
          return user;
        }
      }
      
      // If refresh fails, user needs to re-authenticate
      throw new Error('Token refresh failed - authentication required');
    }
  }
}

// Fetch all Google Calendar events
export async function fetchAllGoogleCalendarEvents(user: any) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Get all calendars
  const calendarListResponse = await calendar.calendarList.list();
  const calendars = calendarListResponse.data.items || [];

  console.log(`📅 Found ${calendars.length} calendars to fetch from`);

  const allEvents = [];

  // Fetch events from all calendars
  for (const cal of calendars) {
    try {
      console.log(`🔍 Fetching from calendar: ${cal.summary} (${cal.id})`);

      const eventsResponse = await calendar.events.list({
        calendarId: cal.id,
        timeMin: new Date('2025-01-01').toISOString(),
        timeMax: new Date('2025-12-31').toISOString(),
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = eventsResponse.data.items || [];

      // Categorize events properly
      const categorizedEvents = events.map((event) => {
        const title = event.summary || '';
        const description = event.description || '';

        // Enhanced SimplePractice detection
        const isSimplePractice = 
          cal.id === '0np7sib5u30o7oc297j5pb259g' || // Known SimplePractice calendar ID
          title.toLowerCase().includes('appointment') ||
          title.toLowerCase().includes('assessment') ||
          title.toLowerCase().includes('patient') ||
          title.toLowerCase().includes('session') ||
          title.toLowerCase().includes('therapy') ||
          title.toLowerCase().includes('consultation') ||
          description.toLowerCase().includes('simplepractice') ||
          /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
          title.toLowerCase().includes('counseling') ||
          title.toLowerCase().includes('supervision') ||
          title.toLowerCase().includes('intake');

        return {
          id: event.id,
          title: event.summary || 'Untitled Event',
          startTime: event.start?.dateTime || event.start?.date,
          endTime: event.end?.dateTime || event.end?.date,
          description: event.description || '',
          location: event.location || '',
          source: isSimplePractice ? 'simplepractice' : 'google',
          calendarId: cal.id
        };
      });

      allEvents.push(...categorizedEvents);

      console.log(`✅ Found ${categorizedEvents.length} events in ${cal.summary}`);
    } catch (calendarError) {
      console.warn(`⚠️ Could not access calendar ${cal.summary}: ${calendarError.message}`);
    }
  }

  return allEvents;
}

// Save events to database
export async function saveEventsToDb(events: any[], userId: number) {
  let savedCount = 0;
  let simplePracticeCount = 0;
  let googleCount = 0;

  for (const evt of events) {
    try {
      await storage.upsertEvent(userId, evt.id, {
        title: evt.title,
        startTime: new Date(evt.startTime),
        endTime: new Date(evt.endTime),
        description: evt.description,
        location: evt.location,
        source: evt.source,
        calendarId: evt.calendarId
      });

      savedCount++;

      if (evt.source === 'simplepractice') {
        simplePracticeCount++;
      } else {
        googleCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to save event ${evt.title}:`, error);
    }
  }

  console.log(`✅ Saved ${savedCount} events (${simplePracticeCount} SimplePractice, ${googleCount} Google)`);

  return {
    total: savedCount,
    simplePractice: simplePracticeCount,
    google: googleCount
  };
}

// Get current redirect URI
export function getCurrentRedirectURI() {
  const domains = process.env.REPLIT_DOMAINS?.split(",") || [];
  const currentDomain = domains[0] || "474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev";
  return `https://${currentDomain}/api/auth/google/callback`;
}

export async function refreshGoogleTokens(refreshToken: string): Promise<any> {
  try {
    // Skip refresh if using dev token
    if (refreshToken === 'dev-refresh' || !refreshToken) {
      console.log('⚠️ Invalid or dev refresh token, skipping refresh');
      throw new Error('Invalid refresh token');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BASE_URL}/api/auth/google/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Validate the new tokens
    if (!credentials.access_token) {
      throw new Error('No access token received');
    }

    console.log('✅ Tokens refreshed successfully');
    return credentials;
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    throw error;
  }
}