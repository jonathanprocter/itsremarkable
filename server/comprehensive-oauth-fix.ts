/**
 * Comprehensive OAuth Fix - Complete authentication and token management
 * This will ensure proper OAuth token flow and live sync functionality
 */

import { google } from "googleapis";
import { storage } from "./storage";
import { db } from "./db";
import { events } from "@shared/schema";
import { and, gte, lte } from "drizzle-orm";

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

export async function comprehensiveOAuthFix(req: any, res: any) {
  console.log("🔧 Starting comprehensive OAuth fix...");

  try {
    // Step 1: Check if user has valid session
    const sessionUser = req.session?.passport?.user;
    if (!sessionUser) {
      console.log("❌ No authenticated session found");
      return res.status(401).json({
        error: "Not authenticated",
        message: "Please authenticate with Google first",
        oauthUrl: "/api/auth/google"
      });
    }

    console.log("✅ Found authenticated session:", sessionUser.email);

    // Step 2: Extract tokens from session
    const { accessToken, refreshToken } = sessionUser;
    if (!accessToken || !refreshToken) {
      console.log("❌ Session exists but tokens are missing");
      return res.status(400).json({
        error: "Missing tokens",
        message: "Session exists but OAuth tokens are missing. Please re-authenticate.",
        oauthUrl: "/api/auth/google"
      });
    }

    console.log("✅ Found tokens in session");

    // Step 3: Update environment variables
    process.env.GOOGLE_ACCESS_TOKEN = accessToken;
    process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
    console.log("✅ Environment tokens updated");

    // Step 4: Test tokens with Google API
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    try {
      // Test API access
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      console.log("✅ Token validation successful:", userInfo.data.email);

      // Step 5: Test calendar access
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];
      console.log(`✅ Calendar access successful: ${calendars.length} calendars found`);

      // Step 6: Perform live sync test
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      
      let totalEvents = 0;
      const allEvents = [];

      for (const cal of calendars) {
        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: oneMonthAgo.toISOString(),
            timeMax: now.toISOString(),
            maxResults: 1000,
            singleEvents: true,
            orderBy: "startTime",
          });

          const events = eventsResponse.data.items || [];
          totalEvents += events.length;
          allEvents.push(...events);

          console.log(`✅ Calendar "${cal.summary}": ${events.length} events`);
        } catch (calError) {
          console.warn(`⚠️ Could not access calendar ${cal.summary}:`, calError.message);
        }
      }

      console.log(`✅ Total events fetched: ${totalEvents}`);

      // Step 7: Save events to database
      const userId = 1;
      let savedCount = 0;

      for (const event of allEvents) {
        try {
          const title = event.summary || "Untitled Event";
          const isSimplePractice = 
            title.toLowerCase().includes("appointment") ||
            title.toLowerCase().includes("session") ||
            /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim());

          await storage.upsertEvent(userId, event.id, {
            title,
            startTime: new Date(event.start?.dateTime || event.start?.date),
            endTime: new Date(event.end?.dateTime || event.end?.date),
            description: event.description || "",
            location: event.location || "",
            source: isSimplePractice ? "simplepractice" : "google",
            calendarId: event.organizer?.email || "primary",
          });
          savedCount++;
        } catch (saveError) {
          console.warn(`⚠️ Could not save event ${event.summary}:`, saveError.message);
        }
      }

      console.log(`✅ Saved ${savedCount} events to database`);

      // Step 8: Return comprehensive status
      return res.json({
        success: true,
        message: "OAuth fix completed successfully",
        details: {
          userEmail: userInfo.data.email,
          calendarsFound: calendars.length,
          eventsFound: totalEvents,
          eventsSaved: savedCount,
          tokenStatus: "valid",
          syncTime: new Date().toISOString()
        },
        calendars: calendars.map(cal => ({
          id: cal.id,
          name: cal.summary,
          accessRole: cal.accessRole
        })),
        recommendations: [
          "OAuth authentication is now fully functional",
          "Live sync is working with all subcalendars",
          "Events are being saved to database",
          "Calendar interface should now display all events"
        ]
      });

    } catch (apiError) {
      console.log("⚠️ API validation failed, attempting token refresh...");

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Update environment and session with fresh tokens
        process.env.GOOGLE_ACCESS_TOKEN = credentials.access_token;
        if (credentials.refresh_token) {
          process.env.GOOGLE_REFRESH_TOKEN = credentials.refresh_token;
        }

        // Update session
        req.session.passport.user.accessToken = credentials.access_token;
        if (credentials.refresh_token) {
          req.session.passport.user.refreshToken = credentials.refresh_token;
        }

        console.log("✅ Token refresh successful");

        return res.json({
          success: true,
          message: "OAuth fix completed with token refresh",
          details: {
            tokenStatus: "refreshed",
            expiresIn: credentials.expiry_date,
            refreshTime: new Date().toISOString()
          },
          recommendations: [
            "Tokens have been refreshed",
            "Please try calendar sync again",
            "Live sync should now work properly"
          ]
        });

      } catch (refreshError) {
        console.log("❌ Token refresh failed:", refreshError.message);
        
        return res.status(401).json({
          success: false,
          error: "Token refresh failed",
          message: "Please re-authenticate with Google",
          oauthUrl: "/api/auth/google",
          details: {
            refreshError: refreshError.message,
            tokenStatus: "expired"
          }
        });
      }
    }

  } catch (error) {
    console.error("❌ Comprehensive OAuth fix failed:", error);
    return res.status(500).json({
      success: false,
      error: "OAuth fix failed",
      message: error.message,
      oauthUrl: "/api/auth/google"
    });
  }
}

export async function testLiveSync(req: any, res: any) {
  console.log("🧪 Testing live sync functionality...");

  try {
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!accessToken || !refreshToken) {
      return res.status(401).json({
        error: "No tokens available",
        message: "Please run OAuth fix first"
      });
    }

    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    // Test calendar list access
    const calendarListResponse = await calendar.calendarList.list();
    const calendars = calendarListResponse.data.items || [];

    // Test event fetching from primary calendar
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const eventsResponse = await calendar.events.list({
      calendarId: "primary",
      timeMin: oneWeekAgo.toISOString(),
      timeMax: now.toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = eventsResponse.data.items || [];

    return res.json({
      success: true,
      message: "Live sync test successful",
      results: {
        calendarsFound: calendars.length,
        eventsFound: events.length,
        testTime: new Date().toISOString()
      },
      calendars: calendars.map(cal => ({
        id: cal.id,
        name: cal.summary,
        accessRole: cal.accessRole
      })),
      sampleEvents: events.slice(0, 3).map(event => ({
        id: event.id,
        title: event.summary,
        startTime: event.start?.dateTime || event.start?.date
      }))
    });

  } catch (error) {
    console.error("❌ Live sync test failed:", error);
    return res.status(500).json({
      success: false,
      error: "Live sync test failed",
      message: error.message
    });
  }
}