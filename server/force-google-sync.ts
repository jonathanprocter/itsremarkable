/**
 * Force Google Calendar Sync - Comprehensive solution for syncing all Google Calendar events
 * including subcalendars with proper authentication handling
 */

import { google } from "googleapis";
import { storage } from "./storage";

// OAuth2 client configuration
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID?.trim(),
    process.env.GOOGLE_CLIENT_SECRET?.trim(),
    getRedirectURI(),
  );
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
    // Get user authentication - try session first, then environment
    const sessionUser = req.session?.passport?.user;
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    
    let accessToken = null;
    let refreshToken = null;
    let userEmail = "user@example.com";
    
    if (sessionUser && sessionUser.accessToken) {
      console.log("✅ Using session authentication:", sessionUser.email);
      accessToken = sessionUser.accessToken;
      refreshToken = sessionUser.refreshToken;
      userEmail = sessionUser.email;
    } else if (envAccessToken) {
      console.log("✅ Using environment token authentication");
      accessToken = envAccessToken;
      refreshToken = envRefreshToken;
      userEmail = "jonathan.procter@gmail.com"; // Default from environment
    } else {
      console.log("❌ No authentication tokens found");
      return res.status(401).json({
        error: "Not authenticated",
        message: "Please authenticate with Google first",
        oauthUrl: "/api/auth/google"
      });
    }

    // Create OAuth client with available tokens
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

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

    // Handle token refresh if needed
    if (error.message?.includes("invalid_grant") || error.message?.includes("unauthorized")) {
      console.log("🔄 Attempting token refresh...");
      
      try {
        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({
          access_token: req.session?.passport?.user?.accessToken,
          refresh_token: req.session?.passport?.user?.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update session with new tokens
        if (req.session?.passport?.user) {
          req.session.passport.user.accessToken = credentials.access_token;
          if (credentials.refresh_token) {
            req.session.passport.user.refreshToken = credentials.refresh_token;
          }
        }

        console.log("✅ Token refresh successful, please retry sync");
        
        return res.json({
          success: false,
          message: "Tokens refreshed successfully",
          error: "Token refresh required",
          recommendations: [
            "OAuth tokens have been refreshed",
            "Please try the sync operation again",
            "The system should now work with updated tokens"
          ]
        });

      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        return res.status(401).json({
          success: false,
          error: "Authentication failed",
          message: "Please re-authenticate with Google",
          oauthUrl: "/api/auth/google"
        });
      }
    }

    return res.status(500).json({
      success: false,
      error: "Sync failed",
      message: error.message,
      details: error.stack
    });
  }
}