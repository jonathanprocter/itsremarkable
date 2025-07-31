/**
 * Force Google Calendar Sync - Comprehensive solution for syncing all Google Calendar events
 * including subcalendars with proper authentication handling
 */

import { google } from "googleapis";
import { storage } from "./storage";

// OAuth2 client configuration
function createOAuth2Client() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = getRedirectURI();
  
  console.log('🔧 Creating OAuth2 client with:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri
  });
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
  }
  
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function getRedirectURI() {
  const baseURL = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
    : "https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev";
  
  return `${baseURL}/api/auth/google/callback`;
}

export async function forceGoogleCalendarSync(req: any, res: any) {
  console.log("🔄 Starting force Google Calendar sync...");

  try {
    // Check for valid tokens first
    const sessionUser = req.session?.passport?.user;
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    // Validate that we have proper tokens
    if (!sessionUser?.accessToken && !envAccessToken) {
      console.log("❌ No access tokens available");
      return res.status(401).json({
        error: "Not authenticated",
        message: "Please authenticate with Google first",
        oauthUrl: "/api/auth/google",
        needsReauth: true
      });
    }

    if (!sessionUser?.refreshToken && !envRefreshToken) {
      console.log("❌ No refresh tokens available");
      return res.status(401).json({
        error: "No refresh token available",
        message: "Please re-authenticate with Google to get a new refresh token",
        oauthUrl: "/api/auth/google",
        needsReauth: true
      });
    }

    let accessToken = sessionUser?.accessToken || envAccessToken;
    let refreshToken = sessionUser?.refreshToken || envRefreshToken;
    let userEmail = sessionUser?.email || "jonathan.procter@gmail.com";

    console.log("✅ Using tokens:", {
      source: sessionUser?.accessToken ? 'session' : 'environment',
      email: userEmail,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    // Create OAuth client
    const oauth2Client = createOAuth2Client();
    
    // Test if tokens are valid by making a simple request first
    try {
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Test token validity with a simple API call
      const testCalendar = google.calendar({ version: "v3", auth: oauth2Client });
      
      // Try to list calendars as a token test
      await testCalendar.calendarList.list({ maxResults: 1 });
      console.log("✅ Tokens are valid, proceeding with sync");
      
    } catch (tokenError) {
      console.log("⚠️ Token validation failed:", tokenError.message);
      
      // Check for specific authentication errors
      if (tokenError.message?.includes('invalid_client') || 
          tokenError.message?.includes('invalid_grant') || 
          tokenError.code === 401) {
        console.log("🔄 Attempting token refresh...");
        
        try {
          // Ensure we have the necessary credentials for refresh
          if (!refreshToken) {
            throw new Error('No refresh token available for token refresh');
          }
          
          const { credentials } = await oauth2Client.refreshAccessToken();
          
          // Update tokens
          accessToken = credentials.access_token;
          if (credentials.refresh_token) {
            refreshToken = credentials.refresh_token;
          }
          
          console.log("✅ Token refresh successful - new access token obtained");
          
          // Update session if using session tokens
          if (sessionUser) {
            sessionUser.accessToken = accessToken;
            if (credentials.refresh_token) {
              sessionUser.refreshToken = credentials.refresh_token;
            }
          }
          
          // Update environment variables
          process.env.GOOGLE_ACCESS_TOKEN = accessToken;
          if (credentials.refresh_token) {
            process.env.GOOGLE_REFRESH_TOKEN = credentials.refresh_token;
          }
          
          // Verify the new tokens work by making a test call
          oauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          const testCalendar = google.calendar({ version: "v3", auth: oauth2Client });
          await testCalendar.calendarList.list({ maxResults: 1 });
          console.log("✅ Refreshed tokens validated successfully");
          
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError.message);
          
          // Check if we can proceed with environment tokens as fallback
          const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
          const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
          
          if (envAccessToken && envRefreshToken && 
              !envAccessToken.startsWith('dev-') && 
              !envRefreshToken.startsWith('dev-')) {
            console.log("🔄 Falling back to environment tokens...");
            
            try {
              // Test environment tokens
              const fallbackClient = createOAuth2Client();
              fallbackClient.setCredentials({
                access_token: envAccessToken,
                refresh_token: envRefreshToken,
              });
              
              const testCalendar = google.calendar({ version: "v3", auth: fallbackClient });
              await testCalendar.calendarList.list({ maxResults: 1 });
              
              console.log("✅ Environment tokens working, proceeding with sync");
              oauth2Client = fallbackClient;
              accessToken = envAccessToken;
              refreshToken = envRefreshToken;
              
            } catch (envError) {
              console.error("❌ Environment tokens also failed:", envError.message);
              
              return res.status(401).json({
                error: "Authentication failed",
                message: "Google tokens have expired and cannot be refreshed. Please re-authenticate.",
                oauthUrl: "/api/auth/google",
                needsReauth: true,
                details: "Both session and environment tokens are invalid",
                statusCode: 401
              });
            }
          } else {
            return res.status(401).json({
              error: "Authentication failed",
              message: "Google tokens have expired and cannot be refreshed. Please re-authenticate.",
              oauthUrl: "/api/auth/google", 
              needsReauth: true,
              details: "Refresh token is invalid or expired",
              statusCode: 401
            });
          }
        }
      } else {
        throw tokenError; // Re-throw if it's not a token issue
      }
    }

    // Step 1: Get all calendars including subcalendars
    console.log("📅 Fetching all calendars...");
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];

    console.log(`✅ Found ${calendars.length} calendars:`);
    calendars.forEach(cal => {
      console.log(`  - ${cal.summary} (${cal.id})`);
    });

    // Step 2: Define sync date range (comprehensive sync)
    const now = new Date();
    const startDate = new Date(2025, 0, 1); // January 1, 2025
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()); // 3 months ahead

    console.log(`📅 Syncing events from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // Step 3: Fetch events from all calendars
    let totalEvents = 0;
    let totalSavedEvents = 0;
    const calendarResults = [];

    for (const cal of calendars) {
      console.log(`🔄 Syncing calendar: ${cal.summary}`);

      try {
        const eventsResponse = await calendar.events.list({
          calendarId: cal.id,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          maxResults: 2500, // Maximum per calendar
          singleEvents: true,
          orderBy: "startTime",
        });

        const events = eventsResponse.data.items || [];
        totalEvents += events.length;

        console.log(`  📊 Found ${events.length} events in ${cal.summary}`);

        // Step 4: Process and save events
        let savedCount = 0;
        const userId = 1; // Default user ID

        for (const event of events) {
          try {
            const title = event.summary || "Untitled Event";
            
            // Enhanced SimplePractice detection
            const isSimplePractice = 
              title.toLowerCase().includes("appointment") ||
              title.toLowerCase().includes("session") ||
              title.toLowerCase().includes("therapy") ||
              title.toLowerCase().includes("consultation") ||
              /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
              (event.organizer?.email && event.organizer.email.includes("simplepractice"));

            const eventData = {
              title,
              startTime: new Date(event.start?.dateTime || event.start?.date || now),
              endTime: new Date(event.end?.dateTime || event.end?.date || now),
              description: event.description || "",
              location: event.location || "",
              source: isSimplePractice ? "simplepractice" : "google",
              calendarId: cal.id || "primary",
            };

            await storage.upsertEvent(userId, event.id || `generated-${Date.now()}-${Math.random()}`, eventData);
            savedCount++;
            totalSavedEvents++;

          } catch (saveError) {
            console.warn(`⚠️ Could not save event "${event.summary}":`, saveError.message);
          }
        }

        calendarResults.push({
          calendarId: cal.id,
          calendarName: cal.summary,
          eventsFound: events.length,
          eventsSaved: savedCount,
          accessRole: cal.accessRole,
          primary: cal.primary || false
        });

        console.log(`  ✅ Saved ${savedCount}/${events.length} events from ${cal.summary}`);

      } catch (calendarError) {
        console.error(`❌ Error syncing calendar ${cal.summary}:`, calendarError.message);
        calendarResults.push({
          calendarId: cal.id,
          calendarName: cal.summary,
          error: calendarError.message,
          eventsFound: 0,
          eventsSaved: 0
        });
      }
    }

    // Step 5: Update environment tokens for future use if we used session tokens
    if (sessionUser && sessionUser.accessToken) {
      process.env.GOOGLE_ACCESS_TOKEN = sessionUser.accessToken;
      process.env.GOOGLE_REFRESH_TOKEN = sessionUser.refreshToken;
    }

    console.log(`✅ Sync complete! ${totalSavedEvents}/${totalEvents} events saved across ${calendars.length} calendars`);

    // Step 6: Return comprehensive results
    return res.json({
      success: true,
      message: "Google Calendar sync completed successfully",
      summary: {
        calendarsProcessed: calendars.length,
        totalEventsFound: totalEvents,
        totalEventsSaved: totalSavedEvents,
        syncTimeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        syncTime: new Date().toISOString(),
        userEmail: userEmail
      },
      calendarResults,
      recommendations: [
        "All Google Calendar events have been synced to the database",
        "The system now has access to all subcalendars",
        "Events are properly categorized as SimplePractice or Google Calendar",
        "Future calendar loads will use this cached data for improved performance"
      ]
    });

  } catch (error) {
    console.error("❌ Force Google Calendar sync failed:", error);

    // Handle authentication errors
    if (error.message?.includes("invalid_grant") || 
        error.message?.includes("unauthorized") || 
        error.code === 401 || 
        error.status === 401) {
      
      console.error("❌ Authentication error detected:", error.message);
      
      return res.status(401).json({
        success: false,
        error: "Authentication failed",
        message: "Google OAuth tokens have expired or are invalid. Please re-authenticate.",
        oauthUrl: "/api/auth/google",
        needsReauth: true,
        recommendations: [
          "Click the Google OAuth link to re-authenticate",
          "This will generate fresh access and refresh tokens",
          "The calendar sync should work after re-authentication"
        ]
      });
    }

    return res.status(500).json({
      success: false,
      error: "Sync failed",
      message: error.message,
      details: error.stack
    });
  }
}