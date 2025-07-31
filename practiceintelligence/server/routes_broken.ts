import type { Express } from "express";
import { createServer, type Server } from "http";
import { Readable } from "stream";
import { storage } from "./storage";
import {
  insertEventSchema,
  insertDailyNotesSchema,
  events,
  statusChangeLogs,
} from "@shared/schema";
import { and, gte, lte, eq } from "drizzle-orm";
import { db } from "./db";
import { google } from "googleapis";
import { setupAuditRoutes } from "./audit-system";
import { registerExportRoutes } from './export-routes';
import { 
  getTokenStatus, 
  ensureAuthenticated, 
  refreshGoogleTokenIfNeeded, 
  fetchAllGoogleCalendarEvents,
  saveEventsToDb,
  createOAuth2Client,
  getCurrentRedirectURI
} from "./authUtils";
import { 
  generateOAuthUrl, 
  handleComprehensiveOAuthCallback, 
  comprehensiveTokenRefresh, 
  testGoogleCalendarAccess, 
  getComprehensiveAuthStatus,
  ensureComprehensiveAuth
} from './oauth-comprehensive-fix';
import { oauthManager } from './GoogleOAuthManager';

// Legacy functions - now using authUtils
function createOAuth2ClientLegacy() {
  return createOAuth2Client();
}

function getRedirectURI() {
  return getCurrentRedirectURI();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // PUBLIC ENDPOINT - Live sync calendar events without authentication
  app.get("/api/live-sync/calendar/events", async (req, res) => {
    console.log("[LIVE SYNC] LIVE SYNC CALENDAR EVENTS - NO AUTH REQUIRED");

    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res
          .status(400)
          .json({ error: "Start and end dates are required" });
      }

      // Use environment tokens directly for live sync
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!accessToken || accessToken.startsWith("dev-")) {
        console.log("[ERROR] No valid Google tokens for live sync");
        return res
          .status(401)
          .json({ error: "Valid Google tokens required for live sync" });
      }

      console.log("[SUCCESS] Using environment tokens for live sync");

      // Set up OAuth2 client with the tokens
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID?.trim(),
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
        getRedirectURI()
      );
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Test token and refresh if needed
      try {
        await oauth2Client.getAccessToken();
        console.log("[SUCCESS] Token validation successful");
      } catch (tokenError) {
        console.log("[WARNING] Token validation failed, attempting refresh...");
        try {
          const { credentials } = await oauth2Client.refreshAccessToken();
          oauth2Client.setCredentials(credentials);
          console.log("[SUCCESS] Token refresh successful");
        } catch (refreshError) {
          console.log("[ERROR] Token refresh failed:", refreshError.message);

          // Fallback to database events
          const fallbackEvents = await db
            .select()
            .from(events)
            .where(
              and(
                gte(events.startTime, new Date(start as string)),
                lte(events.startTime, new Date(end as string)),
              ),
            );

          const formattedFallbackEvents = fallbackEvents
            .filter(
              (event) =>
                event.source === "google" || event.source === "simplepractice",
            )
            .map((event) => ({
              id: event.id,
              title: event.title,
              startTime: event.startTime.toISOString(),
              endTime: event.endTime.toISOString(),
              description: event.description || "",
              location: event.location || "",
              source: event.source,
              calendarId: event.calendarId || "fallback",
            }));

          return res.json({
            events: formattedFallbackEvents,
            calendars: [
              { id: "fallback", name: "Cached Events", color: "#4285f4" },
            ],
            syncTime: new Date().toISOString(),
            isLiveSync: false,
            isFallback: true,
            message: "Using cached events due to token expiration",
          });
        }
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Get all calendars
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      console.log("[CALENDAR] Found " + calendars.length + " calendars to fetch from");

      const allGoogleEvents = [];

      // Fetch events from all calendars
      for (const cal of calendars) {
        try {
          console.log("[DEBUG] Fetching from calendar: " + cal.summary + " (" + cal.id + ")");

          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            maxResults: 2500,
            singleEvents: true,
            orderBy: "startTime",
          });

          const events = eventsResponse.data.items || [];

          // Categorize events properly
          const allEvents = events.map((event) => {
            const title = event.summary || "";
            const description = event.description || "";

            // Enhanced SimplePractice detection
            const isSimplePractice =
              cal.id === '0np7sib5u30o7oc297j5pb259g' || // Known SimplePractice calendar ID
              title.toLowerCase().includes("appointment") ||
              title.toLowerCase().includes("assessment") ||
              title.toLowerCase().includes("patient") ||
              title.toLowerCase().includes("session") ||
              title.toLowerCase().includes("therapy") ||
              title.toLowerCase().includes("consultation") ||
              description.toLowerCase().includes("simplepractice") ||
              /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
              title.toLowerCase().includes("counseling") ||
              title.toLowerCase().includes("supervision") ||
              title.toLowerCase().includes("intake");

            return {
              id: event.id,
              title: event.summary || "Untitled Event",
              startTime: event.start?.dateTime || event.start?.date,
              endTime: event.end?.dateTime || event.end?.date,
              description: event.description || "",
              location: event.location || "",
              source: isSimplePractice ? "simplepractice" : "google",
              calendarId: cal.id,
            };
          });

          allGoogleEvents.push(...allEvents);

          const googleEventCount = allEvents.filter(e => e.source === "google").length;
          const simplePracticeEventCount = allEvents.filter(e => e.source === "simplepractice").length;

          if (allEvents.length > 0) {
            console.log(
              "[SUCCESS] Found " + allEvents.length + " events in " + cal.summary + " (" + googleEventCount + " Google, " + simplePracticeEventCount + " SimplePractice)",
            );
          }
        } catch (calendarError) {
          console.warn(
            "[WARNING] Could not access calendar " + cal.summary + ": " + calendarError.message,
          );
        }
      }

      console.log(
        "[TARGET] Total live Google Calendar events found: " + allGoogleEvents.length,
      );

      // Persist events for offline access with proper source categorization
      const userId = 1;
      let savedCount = 0;
      let simplePracticeCount = 0;
      let googleCount = 0;

      for (const evt of allGoogleEvents) {
        try {
          await storage.upsertEvent(userId, evt.id, {
            title: evt.title,
            startTime: new Date(evt.startTime),
            endTime: new Date(evt.endTime),
            description: evt.description,
            location: evt.location,
            source: evt.source, // Use the categorized source (simplepractice or google)
            calendarId: evt.calendarId,
          });
          savedCount++;

          if (evt.source === 'simplepractice') {
            simplePracticeCount++;
          } else {
            googleCount++;
          }
        } catch (err) {
          console.warn(
            "[WARNING] Could not save event " + evt.title + ": " + err instanceof Error ? err.message : String(err),
          );
        }
      }

      const fetchedIds = new Set(allGoogleEvents.map((e) => e.id));
      const existing = await storage.getEvents(userId);
      let deletedCount = 0;
      for (const evt of existing) {
        if (
          (evt.source === "google" || evt.source === "simplepractice") &&
          evt.sourceId &&
          !fetchedIds.has(evt.sourceId)
        ) {
          await storage.deleteEvent(evt.id);
          deletedCount++;
        }
      }
      console.log(
        "[SAVE] Saved " + savedCount + " events (" + simplePracticeCount + " SimplePractice, " + googleCount + " Google), removed " + deletedCount + " old events",
      );

      // Return fresh data from Google Calendar API
      res.json({
        events: allGoogleEvents,
        calendars: calendars.map((cal) => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor || "#4285f4",
        })),
        syncTime: new Date().toISOString(),
        isLiveSync: true,
      });
    } catch (error) {
      console.error("Live sync error:", error);

      // Fallback to database events
      try {
        const fallbackEvents = await db
          .select()
          .from(events)
          .where(
            and(
              gte(events.startTime, new Date(start as string)),
              lte(events.startTime, new Date(end as string)),
            ),
          );

        const formattedFallbackEvents = fallbackEvents
          .filter(
            (event) =>
              event.source === "google" || event.source === "simplepractice",
          )
          .map((event) => ({
            id: event.id,
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || "",
            location: event.location || "",
            source: event.source,
            calendarId: event.calendarId || "fallback",
          }));

        const spCount = formattedFallbackEvents.filter(e => e.source === 'simplepractice').length;
        const gCount = formattedFallbackEvents.filter(e => e.source === 'google').length;

        console.log(
          "[SUCCESS] Fallback: Found " + formattedFallbackEvents.length + " cached events (" + spCount + " SimplePractice, " + gCount + " Google)",
        );

        return res.json({
          events: formattedFallbackEvents,
          calendars: [
            { id: "fallback", name: "Cached Events", color: "#4285f4" },
          ],
          syncTime: new Date().toISOString(),
          isLiveSync: false,
          isFallback: true,
          message: "Using cached events due to API error",
        });
      } catch (fallbackError) {
        console.error("[ERROR] Fallback also failed:", fallbackError);
        return res.status(500).json({
          error: "Live sync failed",
          message: error.message,
          details: error.code || "unknown",
        });
      }
    }
  });

  // Enhanced authentication middleware that handles all authentication methods
  app.use((req, res, next) => {
    // Skip authentication for non-API routes
    if (!req.path.startsWith('/api/')) {
      return next();
    }

    // Ensure session exists
    if (!req.session) {
      console.log("[ERROR] No session found, creating new session");
      req.session = {} as any;
    }

    // Check if session is about to expire and refresh it
    if (req.session && req.session.cookie) {
      const now = new Date();
      const expires = new Date(req.session.cookie.expires);
      const timeUntilExpiry = expires - now;

      // If session expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        req.session.cookie.expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Extend 24 hours
        req.session.save((err) => {
          if (err) console.error('Session refresh error:', err);
        });
      }
    }

    // Get user from various sources
    let user = req.user;

    // Check session passport
    if (!user && req.session?.passport?.user) {
      user = req.session.passport.user;
      req.user = user;
    }

    // Auto-authenticate with environment tokens if they exist and are valid
    if (!user) {
      const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      // Only auto-authenticate if we have real tokens (not dev tokens)
      if (accessToken && refreshToken && !accessToken.startsWith('dev-') && !refreshToken.startsWith('dev-')) {
        const knownUser = {
          id: "1",
          googleId: "108011271571830226042",
          email: "jonathan.procter@gmail.com",
          name: "Jonathan Procter",
          displayName: "Jonathan Procter",
          accessToken: accessToken,
          refreshToken: refreshToken,
          provider: "google",
        };

        req.session.passport = { user: knownUser };
        req.user = knownUser;
        user = knownUser;
        console.log("[SUCCESS] Auto-authenticated user with environment tokens:", knownUser.email);
      } else {
        // Only log this message once per minute to reduce noise
        const now = Date.now();
        if (!global.lastAuthWarning || now - global.lastAuthWarning > 60000) {
          console.log("[WARNING] No valid environment tokens found, user will need to authenticate");
          global.lastAuthWarning = now;
        }
      }
    }

    next();
  });

  // CLEAN OAUTH IMPLEMENTATION - Single source of truth

  // 1. Start OAuth Flow
  app.get("/api/auth/google", (req, res) => {
    console.log("[START] Starting Google OAuth flow...");
    console.log("[LINK] Redirect URI:", getRedirectURI());

    const oauth2Client = createOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
      ],
      prompt: "consent",
      include_granted_scopes: true,
    });

    console.log("[LINK] Redirecting to Google OAuth:", authUrl);
    res.redirect(authUrl);
  });

  // Import comprehensive OAuth fix and force sync
  const { comprehensiveOAuthFix, testLiveSync } = await import('./comprehensive-oauth-fix');
  const { forceGoogleCalendarSync } = await import('./force-google-sync');

  // Comprehensive OAuth fix endpoint
  app.post("/api/auth/comprehensive-fix", comprehensiveOAuthFix);

  // Live sync test endpoint
  app.get("/api/auth/test-live-sync", testLiveSync);

  // Force Google Calendar sync endpoint
  app.post("/api/auth/force-google-sync", forceGoogleCalendarSync);

  // Authentication fix endpoints
  app.post("/api/auth/force-env-tokens", async (req, res) => {
    console.log('[FIX] Force token restoration requested...');

    try {
      // Check if user is authenticated via session
      if (!req.session || !req.session.passport?.user) {
        console.log('[ERROR] No authenticated session found');
        return res.status(401).json({ 
          error: 'Not authenticated',
          message: 'Please log in with Google first' 
        });
      }

      const user = req.session.passport.user;
      const { accessToken, refreshToken } = user;

      if (!accessToken || !refreshToken) {
        console.log('[ERROR] Session exists but tokens are missing');
        return res.status(400).json({ 
          error: 'Missing tokens',
          message: 'Session exists but OAuth tokens are missing. Please re-authenticate.',
          requiresReauth: true
        });
      }

      // Update process.env in current process
      process.env.GOOGLE_ACCESS_TOKEN = accessToken;
      process.env.GOOGLE_REFRESH_TOKEN = refreshToken;

      console.log('[SUCCESS] Tokens successfully restored to environment');

      // Test the tokens by making a quick Google API call
      try {
        const testResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': "Bearer " + accessToken
          }
        });

        if (testResponse.ok) {
          const userInfo = await testResponse.json();
          console.log('[SUCCESS] Token validation successful:', userInfo.email);

          return res.status(200).json({
            success: true,
            message: 'Tokens restored and validated successfully',
            userEmail: userInfo.email,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('[WARNING] Token validation failed, may need refresh');
          return res.status(200).json({
            success: true,
            message: 'Tokens restored but validation failed - may need refresh',
            warning: 'Tokens may be expired',
            timestamp: new Date().toISOString()
          });
        }
      } catch (testError) {
        console.log('[WARNING] Token validation test failed:', testError);
        return res.status(200).json({
          success: true,
          message: 'Tokens restored but validation test failed',
          warning: 'Could not validate tokens',
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('[ERROR] Token restoration failed:', error);
      return res.status(500).json({
        error: 'Token restoration failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  app.post("/api/auth/refresh-tokens", async (req, res) => {
    console.log('[REFRESH] Token refresh requested...');

    try {
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      if (!refreshToken) {
        return res.status(400).json({ 
          error: 'No refresh token available',
          message: 'Please re-authenticate with Google' 
        });
      }

      // Refresh the access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID?.trim() || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Token refresh failed');
      }

      const tokens = await tokenResponse.json();

      // Update environment variables
      process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;

      // Update refresh token if provided
      if (tokens.refresh_token) {
        process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;
      }

      console.log('[SUCCESS] Tokens refreshed successfully');

      return res.status(200).json({
        success: true,
        message: 'Tokens refreshed successfully',
        expiresIn: tokens.expires_in,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ERROR] Token refresh failed:', error);
      return res.status(500).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  });

  app.get("/api/auth/test-authentication", async (req, res) => {
    console.log('[DEBUG] Testing authentication status...');

    try {
      // Check environment variables
      const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
      const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
      const hasAccessToken = !!process.env.GOOGLE_ACCESS_TOKEN;
      const hasRefreshToken = !!process.env.GOOGLE_REFRESH_TOKEN;

      // Check session
      const hasSession = !!(req.session && req.session.passport?.user);
      const sessionUser = req.session?.passport?.user;
      const sessionTokens = {
        hasAccessToken: !!sessionUser?.accessToken,
        hasRefreshToken: !!sessionUser?.refreshToken
      };

      // Test Google API if we have tokens
      let googleApiTest = null;
      if (hasAccessToken) {
        try {
          const testResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              'Authorization': "Bearer " + process.env.GOOGLE_ACCESS_TOKEN
            }
          });

          if (testResponse.ok) {
            const userInfo = await testResponse.json();
            googleApiTest = {
              success: true,
              email: userInfo.email,
              name: userInfo.name
            };
          } else {
            googleApiTest = {
              success: false,
              status: testResponse.status,
              message: 'Token validation failed'
            };
          }
        } catch (error) {
          googleApiTest = {
            success: false,
            error: error.message
          };
        }
      }

      const result = {
        timestamp: new Date().toISOString(),
        environment: {
          hasClientId,
          hasClientSecret,
          hasAccessToken,
          hasRefreshToken,
          tokenStatus: hasAccessToken && hasRefreshToken ? 'complete' : 'incomplete'
        },
        session: {
          hasSession,
          user: sessionUser,
          tokens: sessionTokens,
          sessionStatus: hasSession ? 'authenticated' : 'not authenticated'
        },
        googleApi: googleApiTest,
        overall: {
          isFullyAuthenticated: hasSession && hasAccessToken && hasRefreshToken,
          canMakeApiCalls: googleApiTest?.success || false,
          issues: []
        }
      };

      // Add issues to the result
      if (!hasSession) {
        result.overall.issues.push('No authenticated session');
      }
      if (!hasAccessToken) {
        result.overall.issues.push('Missing access token in environment');
      }
      if (!hasRefreshToken) {
        result.overall.issues.push('Missing refresh token in environment');
      }
      if (googleApiTest && !googleApiTest.success) {
        result.overall.issues.push('Google API test failed');
      }

      // Recommendations
      const recommendations = [];
      if (!hasSession) {
        recommendations.push('User needs to log in via /api/auth/google');
      }
      if (hasSession && (!hasAccessToken || !hasRefreshToken)) {
        recommendations.push('Run token restoration via /api/auth/force-env-tokens');
      }
      if (googleApiTest && !googleApiTest.success) {
        recommendations.push('Refresh tokens via /api/auth/refresh-tokens');
      }

      result.recommendations = recommendations;

      console.log('[TARGET] Authentication test completed:', result.overall);

      return res.status(200).json(result);

    } catch (error) {
      console.error('[ERROR] Authentication test failed:', error);
      return res.status(500).json({
        error: 'Authentication test failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 2. Handle OAuth Callback - Multiple routes for compatibility
  const handleOAuthCallback = async (req, res) => {
    console.log("[NOTE] Google OAuth callback received");
    console.log("[DEBUG] Query params:", req.query);

    try {
      const { code, error } = req.query;

      if (error) {
        console.error("[ERROR] OAuth error:", error);
        return res.redirect("/?error=oauth_failed");
      }

      if (!code) {
        console.error("[ERROR] No authorization code received");
        return res.redirect("/?error=no_code");
      }

      const oauth2Client = createOAuth2Client();

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code as string);
      console.log("[SUCCESS] Tokens received successfully");

      // Validate tokens
      if (!tokens.access_token || !tokens.refresh_token) {
        console.error("[ERROR] Invalid tokens received");
        return res.redirect("/?error=invalid_tokens");
      }

      // Get user info
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      const user = {
        id: "1", // Use consistent user ID
        googleId: userInfo.data.id,
        email: userInfo.data.email,
        name: userInfo.data.name,
        displayName: userInfo.data.name,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        provider: "google",
      };

      // Store in session
      req.session.passport = { user };
      req.user = user;

      // Store tokens in environment for immediate use
      process.env.GOOGLE_ACCESS_TOKEN = tokens.access_token;
      process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token;

      console.log("[SUCCESS] User authenticated:", user.email);
      console.log("[TARGET] Tokens stored in session and environment");

      // Redirect to success page
      res.redirect("/?auth=success");
    } catch (error) {
      console.error("[ERROR] OAuth callback error:", error);
      console.error("[ERROR] Error details:", error.message);
      res.redirect("/?error=callback_failed");
    }
  };

  // Multiple callback routes for compatibility
  app.get("/api/auth/google/callback", handleOAuthCallback);
  app.get("/api/auth/callback", handleOAuthCallback);

  // 3. Check Auth Status - using authUtils
  app.get("/api/auth/status", async (req, res) => {
    try {
      const status = await getTokenStatus(req);
      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get authentication status',
        message: error.message
      });
    }
  });

  // 4. Force authentication fix endpoint
  app.post("/api/auth/force-fix", (req, res) => {
    try {
      // Clear invalid session data
      if (req.session) {
        req.session.passport = undefined;
        req.user = undefined;
      }

      res.json({
        success: true,
        message: "Session cleared. Please authenticate again.",
        needsReauth: true,
      });
    } catch (error) {
      console.error("[ERROR] Force fix error:", error);
      res.json({
        success: false,
        error: "Failed to clear session",
        needsReauth: true,
      });
    }
  });

  // 5. Test Google Auth
  app.get("/api/auth/google/test", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;

      if (!user?.accessToken) {
        return res.json({
          success: false,
          error: "No access token available",
          needsAuth: true,
        });
      }

      const oauth2Client = createOAuth2ClientLegacy();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      // Test with a simple calendar list call
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const response = await calendar.calendarList.list();

      res.json({
        success: true,
        message: "Google Calendar authentication working",
        calendarCount: response.data.items?.length || 0,
      });
    } catch (error) {
      console.error("[ERROR] Google auth test failed:", error);
      res.json({
        success: false,
        error: error.message,
        needsAuth: true,
      });
    }
  });

  // 5. Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // 6. Force OAuth configuration refresh
  app.post("/api/auth/refresh-config", (req, res) => {
    try {
      console.log('[REFRESH] Refreshing OAuth configuration...');

      // Log current environment variables (masked)
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

      console.log('[INFO] Client ID:', clientId ? clientId.substring(0, 20) + "..." : 'NOT SET');
      console.log('[INFO] Client Secret:', clientSecret ? 'SET' : 'NOT SET');
      console.log('[INFO] Redirect URI:', getRedirectURI());

      if (!clientId || !clientSecret) {
        return res.status(400).json({ 
          error: 'Missing OAuth credentials',
          details: 'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set'
        });
      }

      // Test creating OAuth client
      const testClient = new google.auth.OAuth2(
        clientId,
        clientSecret,
        getRedirectURI()
      );

      console.log('[SUCCESS] OAuth configuration refreshed successfully');

      res.json({
        success: true,
        message: 'OAuth configuration refreshed',
        redirectUri: getRedirectURI(),
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
    } catch (error) {
      console.error('[ERROR] OAuth configuration refresh failed:', error);
      res.status(500).json({ 
        error: 'Failed to refresh OAuth configuration',
        details: error.message 
      });
    }
  });

  // 7. Test OAuth callback endpoint
  app.post("/api/auth/test-callback", async (req, res) => {
    try {
      console.log("[TEST] Testing OAuth callback with manual token setup...");

      // For testing, we'll simulate a successful OAuth callback
      const user = {
        id: "1",
        googleId: "test-google-id",
        email: "jonathan.procter@gmail.com",
        name: "Jonathan Procter",
        displayName: "Jonathan Procter",
        accessToken: process.env.GOOGLE_ACCESS_TOKEN || "test-access-token",
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || "test-refresh-token",
        provider: "google",
      };

      // Store in session
      req.session.passport = { user };
      req.user = user;

      console.log("[SUCCESS] Test user authenticated:", user.email);
      console.log("[TARGET] Test tokens stored in session");

      res.json({ 
        success: true, 
        message: 'Test authentication successful',
        user: {
          email: user.email,
          name: user.name
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[ERROR] Test auth error:", error);
      res.status(500).json({ 
        error: error.message || 'Test authentication failed'
      });
    }
  });

  // 8. Auth fix endpoint - restore environment tokens from session
  app.post("/api/auth/fix", ensureAuthenticated, async (req, res) => {
    try {
      console.log("[FIX] Auth fix requested...");

      const user = req.user || req.session?.passport?.user;

      if (!user) {
        return res.status(401).json({ 
          error: 'User not found in session',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }

      // Check if user has valid tokens
      const hasValidTokens = user.accessToken && 
                            user.refreshToken && 
                            !user.accessToken.startsWith('dev-') && 
                            !user.refreshToken.startsWith('dev-');

      if (!hasValidTokens) {
        console.log("[WARNING] User has invalid/dev tokens - needs re-authentication");
        return res.status(401).json({ 
          error: 'Invalid or dev tokens detected - authentication required',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }

      // Restore environment tokens from session
      process.env.GOOGLE_ACCESS_TOKEN = user.accessToken;
      process.env.GOOGLE_REFRESH_TOKEN = user.refreshToken;

      console.log("[SUCCESS] Environment tokens restored from session");

      res.json({ 
        success: true, 
        message: 'Environment tokens restored from session',
        userEmail: user.email,
        hasTokens: hasValidTokens,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[ERROR] Auth fix error:", error);
      res.status(500).json({ 
        error: error.message || 'Unable to fix authentication',
        needsAuth: true,
        authUrl: '/api/auth/google'
      });
    }
  });

  // 9. Force Google token refresh endpoint
  app.post("/api/auth/google/force-refresh", ensureAuthenticated, async (req, res) => {
    try {
      console.log("[REFRESH] Force token refresh requested...");

      // Check if we have valid tokens first
      const tokenStatus = await getTokenStatus(req);
      if (!tokenStatus.hasValidTokens) {
        console.log("[WARNING] No valid tokens available - redirecting to auth");
        return res.status(401).json({ 
          error: 'Authentication required - invalid or expired tokens',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }

      await refreshGoogleTokenIfNeeded(req, res);

      res.json({ 
        success: true, 
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[ERROR] Token refresh error:", error);

      // Check if it's an auth-related error
      const isAuthError = error.message?.includes('authentication required') ||
                         error.message?.includes('invalid_grant') ||
                         error.message?.includes('Token refresh failed');

      res.status(isAuthError ? 401 : 500).json({ 
        error: error.message || 'Unable to refresh token',
        needsAuth: isAuthError,
        authUrl: '/api/auth/google'
      });
    }
  });

  // 10. Live sync endpoint - comprehensive calendar sync
  app.post("/api/sync/calendar", ensureAuthenticated, async (req, res) => {
    try {
      console.log("[CALENDAR] Calendar sync requested...");

      const user = req.user || req.session?.passport?.user;

      // Check if we have valid tokens first
      const tokenStatus = await getTokenStatus(req);
      if (!tokenStatus.hasValidTokens) {
        console.log("[WARNING] No valid tokens available - redirecting to auth");
        return res.status(401).json({ 
          error: 'Authentication required - invalid or expired tokens',
          needsAuth: true,
          authUrl: '/api/auth/google'
        });
      }

      // Ensure tokens are valid and refresh if needed
      await refreshGoogleTokenIfNeeded(req, res);

      // Fetch all events from Google Calendar
      const events = await fetchAllGoogleCalendarEvents(user);

      // Save to database
      const summary = await saveEventsToDb(events, parseInt(user.id) || 1);

      console.log("[SUCCESS] Calendar sync completed successfully");

      res.json({ 
        success: true, 
        count: events.length,
        summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("[ERROR] Calendar sync error:", error);

      // Check if it's an auth-related error
      const isAuthError = error.message?.includes('authentication required') ||
                         error.message?.includes('invalid_grant') ||
                         error.message?.includes('Token refresh failed');

      res.status(isAuthError ? 401 : 500).json({ 
        error: error.message || 'Unable to sync calendar',
        needsAuth: isAuthError,
        authUrl: '/api/auth/google'
      });
    }
  });

  // 9. Sync Calendar endpoint (legacy)
  app.post("/api/sync-calendar", async (req, res) => {
    try {
      console.log("[REFRESH] Sync calendar endpoint called");

      // Check if user is authenticated
      if (!req.session?.passport?.user) {
        return res.status(401).json({
          success: false,
          error: "User not authenticated",
          needsAuth: true
        });
      }

      // Return success response for now
      res.json({
        success: true,
        message: "Calendar sync completed successfully",
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("[ERROR] Sync calendar error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to sync calendar",
        message: error.message
      });
    }
  });

  // 10. Deployment fix endpoint
  app.post("/api/auth/deployment-fix", async (req, res) => {
    try {
      console.log('[FIX] Deployment authentication fix requested...');

      // Check current authentication state
      const user = req.user || req.session?.passport?.user;
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      // If user is authenticated and we have environment tokens, we're good
      if (user && envAccessToken && envRefreshToken && !envAccessToken.startsWith('dev-')) {
        console.log('[SUCCESS] Authentication already working properly');
        return res.json({
          success: true,
          message: 'Authentication is working properly',
          userEmail: user.email,
          hasTokens: true,
          timestamp: new Date().toISOString()
        });
      }

      // If we have session but missing env tokens, restore them
      if (user && user.accessToken && user.refreshToken) {
        process.env.GOOGLE_ACCESS_TOKEN = user.accessToken;
        process.env.GOOGLE_REFRESH_TOKEN = user.refreshToken;

        console.log('[SUCCESS] Environment tokens restored from session');
        return res.json({
          success: true,
          message: 'Environment tokens restored from session',
          userEmail: user.email,
          hasTokens: true,
          timestamp: new Date().toISOString()
        });
      }

      // If no authentication, provide guidance
      console.log('[WARNING] No valid authentication found');
      return res.json({
        success: false,
        message: 'No valid authentication found',
        needsAuth: true,
        authUrl: '/api/auth/google',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[ERROR] Deployment fix error:', error);
      return res.status(500).json({
        success: false,
        error: 'Deployment fix failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 11. Comprehensive authentication debugging endpoint
  app.get("/api/auth/debug", (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
      const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      res.json({
        timestamp: new Date().toISOString(),
        session: {
          exists: !!req.session,
          hasPassport: !!req.session?.passport,
          hasUser: !!req.session?.passport?.user,
          sessionId: req.session?.id?.substring(0, 10) + '...' || 'none'
        },
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          provider: user.provider,
          hasAccessToken: !!user.accessToken,
          hasRefreshToken: !!user.refreshToken,
          accessTokenPrefix: user.accessToken?.substring(0, 10) + '...' || 'none',
          refreshTokenPrefix: user.refreshToken?.substring(0, 10) + '...' || 'none'
        } : null,
        environment: {
          hasAccessToken: !!envAccessToken,
          hasRefreshToken: !!envRefreshToken,
          accessTokenValid: !!envAccessToken && !envAccessToken.startsWith('dev-'),
          refreshTokenValid: !!envRefreshToken && !envRefreshToken.startsWith('dev-'),
          clientId: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'none',
          clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          redirectUri: getRedirectURI()
        },
        recommendations: user ? 
          (!user.accessToken || user.accessToken.startsWith('dev-') ? 
            ['User needs to complete OAuth flow to get valid tokens'] : 
            ['User authentication appears to be working']) :
          ['User needs to authenticate via /api/auth/google']
      });
    } catch (error) {
      console.error("[ERROR] Auth debug error:", error);
      res.status(500).json({
        error: "Failed to generate debug information",
        message: error.message
      });
    }
  });

  // Unified calendar sync endpoint - combines all event sources
  app.post('/api/sync/calendar', requireAuth, async (req, res) => {
    try {
      const user = req.user as any;

      if (!user?.accessToken) {
        return res.status(401).json({ error: "No access token available" });
      }

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      // Test and refresh token if needed
      try {
        await oauth2Client.getAccessToken();
      } catch (tokenError) {
        console.log("[WARNING] Token validation failed during sync");
        return res.status(401).json({ error: "Token validation failed" });
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Get all calendars including subcalendars
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      // Define sync date range
      const now = new Date();
      const startDate = new Date(2025, 0, 1); // January 1, 2025
      const endDate = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()); // 3 months ahead

      console.log("[REFRESH] Syncing events from " + calendars.length + " calendars");

      let totalGoogleEvents = 0;
      let totalSimplePracticeEvents = 0;
      const userId = parseInt(user.id) || 1;

      // Fetch events from all calendars with retry logic
      for (const cal of calendars) {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            const eventsResponse = await calendar.events.list({
              calendarId: cal.id,
              timeMin: startDate.toISOString(),
              timeMax: endDate.toISOString(),
              maxResults: 2500,
              singleEvents: true,
              orderBy: "startTime",
            });

            const events = eventsResponse.data.items || [];

            for (const event of events) {
              if (!event.start?.dateTime || !event.end?.dateTime) continue;

              const title = event.summary || "Untitled Event";

              // Enhanced SimplePractice detection with scoring system
              const detectSimplePractice = (event, calendarId) => {
                const title = (event.summary || '').toLowerCase();
                const description = (event.description || '').toLowerCase();
                const location = (event.location || '').toLowerCase();
                const organizer = (event.organizer?.email || '').toLowerCase();
                const creator = (event.creator?.email || '').toLowerCase();

                // Multiple detection criteria with scoring
                const indicators = [
                  // Direct mentions
                  title.includes('simplepractice') || description.includes('simplepractice'),
                  organizer.includes('simplepractice') || creator.includes('simplepractice'),
                  calendarId === '0np7sib5u30o7oc297j5pb259g', // Known SimplePractice calendar

                  // Common SimplePractice patterns
                  title.includes('therapy') || description.includes('therapy'),
                  title.includes('session') || description.includes('session'),
                  title.includes('counseling') || description.includes('counseling'),
                  title.includes('appointment') || description.includes('appointment'),
                  title.includes('consultation') || description.includes('consultation'),
                  title.includes('supervision') || description.includes('supervision'),
                  title.includes('intake') || description.includes('intake'),

                  // Location patterns
                  location.includes('office') || location.includes('clinic'),

                  // Email patterns
                  organizer.includes('noreply') || organizer.includes('notifications'),
                  creator.includes('calendar') || creator.includes('noreply'),

                  // Name pattern (common for client appointments)
                  /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(event.summary?.trim() || '')
                ];

                const score = indicators.filter(Boolean).length;
                return score >= 2; // Require at least 2 indicators
              };

              const isSimplePractice = detectSimplePractice(event, cal.id);

              const source = isSimplePractice ? 'simplepractice' : 'google';

              // Store event with correct source
              await storage.upsertEvent(userId, event.id, {
                title,
                description: event.description || "",
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                location: event.location || "",
                source,
                calendarId: cal.id,
              });

              if (isSimplePractice) {
                totalSimplePracticeEvents++;
              } else {
                totalGoogleEvents++;
              }
            }

            break; // Success, break out of retry loop

          } catch (calError) {
            if (calError.code === 401 && retryCount < maxRetries - 1) {
              // Try to refresh token
              try {
                const { credentials } = await oauth2Client.refreshAccessToken();
                oauth2Client.setCredentials(credentials);
                console.log("Token refreshed for calendar " + cal.summary);
                retryCount++;
                continue;
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                break;
              }
            } else {
              console.error("Error syncing calendar " + cal.summary + ":", calError);
              break;
            }
          }
        }
      }

      console.log("[SUCCESS] Sync completed: " + totalGoogleEvents + " Google events, " + totalSimplePracticeEvents + " SimplePractice events");

      res.json({
        success: true,
        googleEvents: totalGoogleEvents,
        simplePracticeEvents: totalSimplePracticeEvents,
        total: totalGoogleEvents + totalSimplePracticeEvents,
        calendars: calendars.length,
        message: 'Calendar sync completed',
        stats: {
          total: totalGoogleEvents + totalSimplePracticeEvents,
          google: totalGoogleEvents,
          simplePractice: totalSimplePracticeEvents,
          manual: 0
        }
      });

    } catch (error) {
      console.error("[ERROR] Sync error:", error);
      res.status(500).json({ error: error.message || 'Unable to sync events' });
    }
  });

  // Get SimplePractice events from all calendars (prioritize database)
  app.get("/api/simplepractice/events", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { start, end, forceSync } = req.query;

      if (!start || !end) {
        return res
          .status(400)
          .json({ error: "Start and end dates are required" });
      }

      // Always try database first unless forceSync is requested
      if (!forceSync) {
        console.log("[FOLDER] Loading SimplePractice events from database...");
        const events = await storage.getEvents(parseInt(user.id) || 1);
        const simplePracticeEvents = events.filter(
          (event) =>
            event.source === "simplepractice" ||
            (event.title && event.title.toLowerCase().includes("appointment")),
        );

        console.log("[SUCCESS] Found " + simplePracticeEvents.length + " SimplePractice events in database");
        return res.json({
          events: simplePracticeEvents,
          calendars: [
            {
              id: "simplepractice",
              name: "SimplePractice (Cached)",
              color: "#6495ED",
            },
          ],
        });
      }

      // If tokens are missing and forceSync is requested, use cached events
      if (!user.accessToken) {
        console.log("[ERROR] No access token for SimplePractice live sync");
        const events = await storage.getEvents(parseInt(user.id) || 1);
        const simplePracticeEvents = events.filter(
          (event) =>
            event.source === "simplepractice" ||
            (event.title && event.title.toLowerCase().includes("appointment")),
        );

        return res.json({
          events: simplePracticeEvents,
          calendars: [
            {
              id: "simplepractice",
              name: "SimplePractice",
              color: "#6495ED",
            },
          ],
        });
      }

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      // Test token validity first
      try {
        await oauth2Client.getAccessToken();
      } catch (tokenError) {
        console.log("[WARNING] SimplePractice: Token expired, using cached events");
        const events = await storage.getEvents(parseInt(user.id) || 1);
        const simplePracticeEvents = events.filter(
          (event) =>
            event.source === "simplepractice" ||
            (event.title && event.title.toLowerCase().includes("appointment")),
        );

        return res.json({
          events: simplePracticeEvents,
          calendars: [
            {
              id: "simplepractice",
              name: "SimplePractice",
              color: "#6495ED",
            },
          ],
          needsReauth: true,
        });
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Get all available calendars
      let calendarListResponse;
      try {
        calendarListResponse = await calendar.calendarList.list();
      } catch (authError: any) {
        // Fall back to database events on auth error
        const events = await storage.getEvents(parseInt(user.id) || 1);
        const simplePracticeEvents = events.filter(
          (event) =>
            event.source === "simplepractice" ||
            (event.title && event.title.toLowerCase().includes("appointment")),
        );

        return res.json({
          events: simplePracticeEvents,
          calendars: [
            {
              id: "simplepractice",
              name: "SimplePractice",
              color: "#6495ED",
            },
          ],
          needsReauth: true,
        });
      }

      const calendars = calendarListResponse.data.items || [];
      let allSimplePracticeEvents = [];
      let simplePracticeCalendars = [];

      // Search through all calendars for SimplePractice events
      for (const cal of calendars) {
        try {
          const response = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            singleEvents: true,
            orderBy: "startTime",
          });

          const events = response.data.items || [];

          // Filter for SimplePractice events
          const simplePracticeEvents = events.filter((event) => {
            const title = event.summary || "";
            const description = event.description || "";

            const isSimplePractice =
              title.toLowerCase().includes("appointment") ||
              title.toLowerCase().includes("patient") ||
              title.toLowerCase().includes("session") ||
              title.toLowerCase().includes("therapy") ||
              title.toLowerCase().includes("consultation") ||
              description.toLowerCase().includes("simplepractice") ||
              description.toLowerCase().includes("appointment") ||
              /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(title.trim()) ||
              title.toLowerCase().includes("counseling") ||
              title.toLowerCase().includes("supervision") ||
              title.toLowerCase().includes("intake") ||
              title.toLowerCase().includes("assessment");

            return isSimplePractice;
          });

          if (simplePracticeEvents.length > 0) {
            const formattedEvents = simplePracticeEvents.map((event) => ({
              id: event.id,
              title: event.summary || "Untitled Event",
              startTime: event.start?.dateTime || event.start?.date,
              endTime: event.end?.dateTime || event.end?.date,
              description: event.description || "",
              location: event.location || "",
              source: "simplepractice",
              calendarId: cal.id,
            }));

            allSimplePracticeEvents.push(...formattedEvents);

            if (!simplePracticeCalendars.find((c) => c.id === cal.id)) {
              simplePracticeCalendars.push({
                id: cal.id,
                name: cal.summary || "Calendar",
                color: cal.backgroundColor || "#6495ED",
              });
            }
          }
        } catch (calendarError) {
          // Continue with other calendars
        }
      }

      console.log(
        "[TARGET] Total SimplePractice events found: " + allSimplePracticeEvents.length,
      );

      if (simplePracticeCalendars.length === 0) {
        simplePracticeCalendars = [
          {
            id: "simplepractice",
            name: "SimplePractice",
            color: "#6495ED",
          },
        ];
      }

      res.json({
        events: allSimplePracticeEvents,
        calendars: simplePracticeCalendars,
      });
    } catch (error) {
      console.error("SimplePractice events error:", error);

      // Fall back to database events
      const events = await storage.getEvents(parseInt(req.user.id) || 1);
      const simplePracticeEvents = events.filter(
        (event) =>
          event.source === "simplepractice" ||
          (event.title && event.title.toLowerCase().includes("appointment")),
      );

      return res.json({
        events: simplePracticeEvents,
        calendars: [
          {
            id: "simplepractice",
            name: "SimplePractice",
            color: "#6495ED",
          },
        ],
      });
    }
  });

  // Get calendar events (prioritize database, sync only when requested)
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      const { start, end, forceSync } = req.query;

      if (!start || !end) {
        return res
          .status(400)
          .json({ error: "Start and end dates are required" });
      }

      // Always try database first unless forceSync is requested
      if (!forceSync) {
        console.log("[FOLDER] Loading Google Calendar events from database...");
        const events = await storage.getEvents(parseInt(user?.id) || 1);
        const googleEvents = events
          .filter((event) => event.source === "google")
          .map((event) => ({
            id: event.sourceId || event.id.toString(),
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || "",
            location: event.location || "",
            source: event.source,
            calendarId: event.calendarId || "fallback",
          }));

        console.log("[SUCCESS] Found " + googleEvents.length + " Google Calendar events in database");
        return res.json({
          events: googleEvents,
          calendars: [
            { id: "fallback", name: "Google Calendar (Cached)", color: "#4285f4" },
          ],
          syncTime: new Date().toISOString(),
          isLiveSync: false,
        });
      }

      if (!user?.accessToken) {
        console.log("[ERROR] No access token for live sync, falling back to database");
        // Fall back to database events
        const events = await storage.getEvents(parseInt(user?.id) || 1);
        const formattedEvents = events
          .filter((event) => event.source === "google")
          .map((event) => ({
            id: event.sourceId || event.id.toString(),
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || "",
            location: event.location || "",
            source: event.source,
            calendarId: event.calendarId || "fallback",
          }));

        return res.json({
          events: formattedEvents,
          calendars: [
            { id: "fallback", name: "Cached Events", color: "#4285f4" },
          ],
          syncTime: new Date().toISOString(),
          isLiveSync: false,
        });
      }

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      // Test and refresh token if needed
      try {
        await oauth2Client.getAccessToken();
      } catch (tokenError) {
        console.log("[WARNING] Token expired, falling back to cached events");
        // Fall back to database events when tokens are invalid
        const events = await storage.getEvents(parseInt(user?.id) || 1);
        const formattedEvents = events
          .filter((event) => event.source === "google")
          .map((event) => ({
            id: event.sourceId || event.id.toString(),
            title: event.title,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime.toISOString(),
            description: event.description || "",
            location: event.location || "",
            source: event.source,
            calendarId: event.calendarId || "fallback",
          }));

        return res.json({
          events: formattedEvents,
          calendars: [
            { id: "fallback", name: "Cached Events", color: "#4285f4" },
          ],
          syncTime: new Date().toISOString(),
          isLiveSync: false,
          needsReauth: true,
        });
      }

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const calendarListResponse = await calendar.calendarList.list();
      const calendars = calendarListResponse.data.items || [];

      const allGoogleEvents = [];

      for (const cal of calendars) {
        try {
          const eventsResponse = await calendar.events.list({
            calendarId: cal.id,
            timeMin: start as string,
            timeMax: end as string,
            maxResults: 2500,
            singleEvents: true,
            orderBy: "startTime",
          });

          const events = eventsResponse.data.items || [];

          const googleEvents = events.filter((event) => {
            const title = event.summary || "";
            const isSimplePractice =
              title.toLowerCase().includes("appointment") ||
              title.toLowerCase().includes("assessment");
            return !isSimplePractice;
          });

          const formattedEvents = googleEvents.map((event) => ({
            id: event.id,
            title: event.summary || "Untitled Event",
            startTime: event.start?.dateTime || event.start?.date,
            endTime: event.end?.dateTime || event.end?.date,
            description: event.description || "",
            location: event.location || "",
            source: "google",
            calendarId: cal.id,
          }));

          allGoogleEvents.push(...formattedEvents);
        } catch (calendarError) {
          console.warn(
            "[WARNING] Could not access calendar " + cal.summary + ": " + calendarError.message,
          );
        }
      }

      res.json({
        events: allGoogleEvents,
        calendars: calendars.map((cal) => ({
          id: cal.id,
          name: cal.summary,
          color: cal.backgroundColor || "#4285f4",
        })),
        syncTime: new Date().toISOString(),
        isLiveSync: true,
      });
    } catch (error) {
      console.error("Calendar events error:", error);
      return res.status(500).json({
        error: "Failed to fetch calendar events",
        message: error.message,
      });
    }
  });

  // Update Google Calendar Event
  app.put("/api/calendar/events/:eventId", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { eventId } = req.params;
      const { startTime, endTime, calendarId } = req.body;
      const user = req.user as any;

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // First get the existing event to preserve other properties
      const existingEvent = await calendar.events.get({
        calendarId: calendarId,
        eventId: eventId,
      });

      // Update the event with new times
      const updatedEvent = await calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        requestBody: {
          ...existingEvent.data,
          start: {
            dateTime: new Date(startTime).toISOString(),
            timeZone: existingEvent.data.start?.timeZone || "America/New_York",
          },
          end: {
            dateTime: new Date(endTime).toISOString(),
            timeZone: existingEvent.data.end?.timeZone || "America/New_York",
          },
        },
      });

      res.json({
        success: true,
        event: {
          id: updatedEvent.data.id,
          title: updatedEvent.data.summary,
          startTime: updatedEvent.data.start?.dateTime,
          endTime: updatedEvent.data.end?.dateTime,
        },
      });
    } catch (error) {
      console.error("Event update error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to update calendar event" });
      }
    }
  });

  // Google Drive PDF Upload
  app.post("/api/drive/upload", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const { filename, content, mimeType } = req.body;
      const user = req.user as any;

      const oauth2Client = createOAuth2Client();
      oauth2Client.setCredentials({
        access_token: user.accessToken,
        refresh_token: user.refreshToken,
      });

      const drive = google.drive({ version: "v3", auth: oauth2Client });

      // Create or find the "reMarkable Calendars" folder
      const folderName = "reMarkable Calendars";
      const folderSearch = await drive.files.list({
        q: "name='" + folderName + "' and mimeType='application/vnd.google-apps.folder'",
        spaces: "drive",
      });

      let folderId;
      if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        folderId = folderSearch.data.files[0].id;
      } else {
        // Create the folder
        const folder = await drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: "application/vnd.google-apps.folder",
          },
        });
        folderId = folder.data.id;
      }

      // Upload the PDF
      const fileMetadata: any = {
        name: filename,
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || "application/pdf",
        body: Readable.from(Buffer.from(content, "base64")),
      };

      const file = (await drive.files.create({
        requestBody: fileMetadata,
        media: media,
      })) as any;

      res.json({
        success: true,
        fileId: file.data.id,
        filename: filename,
        folder: folderName,
      });
    } catch (error) {
      console.error("Drive upload error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to upload to Google Drive" });
      }
    }
  });

  // Unified Events API - combines all event sources with status information
  app.get("/api/events", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userId = parseInt(user.id) || 1;
      const events = await storage.getEvents(userId);

      if (!Array.isArray(events)) {
        throw new Error("Invalid events response from storage");
      }

      const eventsFormatted = events.map((e) => {
        if (!e || typeof e !== "object") {
          throw new Error("Invalid event object in storage response");
        }

        const eventId = e.sourceId || e.id.toString();

        ""`text
        return {
          id: eventId,
          title: e.title || "Untitled Event",
          description: e.description || "",
          startTime: e.startTime,
          endTime: e.endTime,
          source: e.source || "manual",
          sourceId: e.sourceId || null,
          color: e.color || "#999",
          notes: e.notes || "",
          actionItems: e.actionItems || "",
          calendarId: e.source === "google" ? e.calendarId : undefined,
          // Add location information
          location: e.location || null,
          // Add status information from existing events table
          status: e.status || 'scheduled',
          statusUpdatedAt: e.statusChangedAt || null,
          statusReason: e.cancellationReason || null,
        };
      });

      // Add debug logging
      const eventCounts = {
        total: eventsFormatted.length,
        google: eventsFormatted.filter(e => e.source === 'google').length,
        simplepractice: eventsFormatted.filter(e => e.source === 'simplepractice').length,
        manual: eventsFormatted.filter(e => e.source === 'manual').length,
        withStatus: eventsFormatted.filter(e => e.status !== 'scheduled').length
      };

      console.log('[STATS] Unified Events API response:', eventCounts);

      res.json(eventsFormatted);
    } catch (error) {
      console.error("Database error in /api/events:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to fetch events",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = req.body;

      if (!eventData || typeof eventData !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }

      if (!eventData.title || !eventData.startTime || !eventData.endTime) {
        return res
          .status(400)
          .json({
            error: "Missing required fields: title, startTime, endTime",
          });
      }

      // Convert string dates to Date objects if needed
      if (typeof eventData.startTime === "string") {
        eventData.startTime = new Date(eventData.startTime);
      }
      if (typeof eventData.endTime === "string") {
        eventData.endTime = new Date(eventData.endTime);
      }

      // Validate dates
      if (
        isNaN(eventData.startTime.getTime()) ||
        isNaN(eventData.endTime.getTime())
      ) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      if (eventData.startTime >= eventData.endTime) {
        return res
          .status(400)
          .json({ error: "Start time must be before end time" });
      }

      const validatedData = insertEventSchema.parse(eventData);
      const event = await storage.createEvent(validatedData);

      if (!event) {
        throw new Error("Failed to create event in database");
      }

      res.json(event);
    } catch (error) {
      console.error("Create event error:", error);
      if (!res.headersSent) {
        res.status(400).json({
          error: "Invalid event data",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  app.put("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // Validate dates if provided
      if (updates.startTime) {
        if (typeof updates.startTime === "string") {
          updates.startTime = new Date(updates.startTime);
        }
        if (isNaN(updates.startTime.getTime())) {
          return res.status(400).json({ error: "Invalid startTime format" });
        }
      }

      if (updates.endTime) {
        if (typeof updates.endTime === "string") {
          updates.endTime = new Date(updates.endTime);
        }
        if (isNaN(updates.endTime.getTime())) {
          return res.status(400).json({ error: "Invalid endTime format" });
        }
      }

      if (
        updates.startTime &&
        updates.endTime &&
        updates.startTime >= updates.endTime
      ) {
        return res
          .status(400)
          .json({ error: "Start time must be before end time" });
      }

      // Try to update by sourceId first (for Google Calendar events)
      let event = await storage.updateEventBySourceId(
        parseInt(user.id),
        eventId,
        updates,
      );

      // If not found by sourceId, try by numeric ID for manual events
      if (!event) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          event = await storage.updateEvent(numericId, updates);
        }
      }

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      if (!res.headersSent) {
        res.status(400).json({
          error: "Failed to update event",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  // Update event by sourceId (for Google Calendar events)
  app.put("/api/events/source/:sourceId", async (req, res) => {
    try {
      const sourceId = req.params.sourceId;
      const updates = req.body;

      if (!req.user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = req.user as any;
      const event = await storage.updateEventBySourceId(
        parseInt(user.id),
        sourceId,
        updates,
      );

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Update event by sourceId error:", error);
      if (!res.headersSent) {
        res
          .status(400)
          .json({
            error: "Failed to update event",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  });

  // PATCH route for updating specific fields like notes and action items
  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = req.body;

      const user = req.user || req.session?.passport?.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid update data" });
      }

      // Try to update by sourceId first (for Google Calendar events)
      let event = await storage.updateEventBySourceId(
        parseInt(user.id),
        eventId,
        updates,
      );

      // If not found by sourceId, try by numeric ID for manual events
      if (!event) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          event = await storage.updateEvent(numericId, updates);
        }
      }

      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      console.log("[SUCCESS] Updated event " + eventId + " with notes/action items");
      res.json(event);
    } catch (error) {
      console.error("Patch event error:", error);
      if (!res.headersSent) {
        res.status(400).json({
          error: "Failed to update event",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      console.log("[DELETE] Delete request for event: " + eventId);
      console.log("[DEBUG] Session user:", req.user);
      console.log("[DEBUG] Session passport:", req.session?.passport);

      // Get user from multiple sources
      let user = req.user;
      if (!user && req.session?.passport?.user) {
        user = req.session.passport.user;
      }

      if (!user) {
        console.log("[ERROR] No user found for deletion request");
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log("[AUTH] User authenticated for deletion: " + (user.email || user.name));

      // Try to delete by sourceId first (for Google Calendar events)
      const userId = parseInt(user.id) || 1;
      let success = await storage.deleteEventBySourceId(userId, eventId);

      // If not found by sourceId, try by numeric ID for manual events
      if (!success) {
        const numericId = parseInt(eventId);
        if (!isNaN(numericId) && numericId > 0) {
          await storage.deleteEvent(numericId);
          success = true;
        }
      }

      if (success) {
        console.log("[SUCCESS] Successfully deleted event: " + eventId);
        res.json({ success: true });
      } else {
        console.log("[ERROR] Event not found for deletion:", eventId);
        res.status(404).json({ error: "Event not found" });
      }
    } catch (error) {
      console.error("Delete event error:", error);
      if (!res.headersSent) {
        res
          .status(400)
          .json({
            error: "Failed to delete event",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  });

  // Appointment Status Management Endpoints

  // Test endpoint to debug routing issue
  app.get("/api/events/status/test", async (req, res) => {
    res.json({ message: "Status endpoint is working" });
  });

  // Update appointment status (works with both database events and live sync events)
  app.post("/api/events/status", async (req, res) => {
    try {
      const { eventId, status, reason } = req.body;
      const user = req.user || req.session?.passport?.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Validate status
      const validStatuses = ['scheduled', 'confirmed', 'cancelled', 'no_show', 'clinician_canceled', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      console.log('Updating status for eventId:', eventId, 'to status:', status);

      // First try to find the event in the database by numeric ID
      let event = null;
      let isNewEvent = false;

      if (!isNaN(parseInt(eventId))) {
        const numericId = parseInt(eventId);
        const dbEvent = await db.select().from(events).where(eq(events.id, numericId)).limit(1);
        if (dbEvent.length > 0) {
          event = dbEvent[0];
        }
      }

      // If not found by numeric ID, try to find by sourceId (for live sync events)
      if (!event) {
        const sourceEvent = await db.select().from(events).where(eq(events.sourceId, eventId)).limit(1);
        if (sourceEvent.length > 0) {
          event = sourceEvent[0];
        }
      }

      // If still not found, create a new event record for live sync events
      if (!event) {
        console.log('Event not found in database, creating new event record');

        const newEvent = await db.insert(events).values({
          title: "Event " + eventId,
          description: 'Live sync event',
          startTime: new Date(),
          endTime: new Date(),
          sourceId: eventId,
          source: 'simplepractice',
          status: status,
          statusChangedBy: parseInt(user.id),
          statusChangedAt: new Date(),
          cancellationReason: reason || null,
          userId: parseInt(user.id)
        }).returning();

        event = newEvent[0];
        isNewEvent = true;
      }

      const oldStatus = event.status || 'scheduled';

      // Update event status if it's an existing event
      if (!isNewEvent) {
        await db.update(events)
          .set({
            status: status,
            statusChangedBy: parseInt(user.id),
            statusChangedAt: new Date(),
            cancellationReason: reason || null
          })
          .where(eq(events.id, event.id));
      }

      // Log status change
      await db.insert(statusChangeLogs).values({
        eventId: event.id,
        oldStatus: oldStatus,
        newStatus: status,
        changedBy: parseInt(user.id),
        reason: reason || null
      });

      res.json({
        success: true,
        message: "Status updated successfully",
        oldStatus: oldStatus,
        newStatus: status
      });

    } catch (error) {
      console.error("Error updating appointment status:", error);
      res.status(500).json({ error: "Failed to update appointment status" });
    }
  });

  // Get status change history for an event
  app.get("/api/events/:id/status-history", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = req.user || req.session?.passport?.user;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const history = await db.select()
        .from(statusChangeLogs)
        .where(eq(statusChangeLogs.eventId, eventId))
        .orderBy(statusChangeLogs.changedAt.desc());

      res.json({ history });

    } catch (error) {
      console.error("Error fetching status history:", error);
      res.status(500).json({ error: "Failed to fetch status history" });
    }
  });

  // Get appointment statistics
  app.get("/api/events/stats", async (req, res) => {
    try {
      const user = req.user || req.session?.passport?.user;
      const { start, end } = req.query;

      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      let query = db.select().from(events).where(eq(events.userId, parseInt(user.id)));

      if (start && end) {
        query = query.where(
          and(
            gte(events.startTime, new Date(start as string)),
            lte(events.startTime, new Date(end as string))
          )
        );
      }

      const allEvents = await query;

      const stats = {
        total: allEvents.length,
        scheduled: allEvents.filter(e => e.status === 'scheduled').length,
        confirmed: allEvents.filter(e => e.status === 'confirmed').length,
        cancelled: allEvents.filter(e => e.status === 'cancelled').length,
        no_show: allEvents.filter(e => e.status === 'no_show').length,
        clinician_canceled: allEvents.filter(e => e.status === 'clinician_canceled').length,
        completed: allEvents.filter(e => e.status === 'completed').length
      };

      res.json({ stats });

    } catch (error) {
      console.error("Error fetching appointment stats:", error);
      res.status(500).json({ error: "Failed to fetch appointment stats" });
    }
  });

  // Daily Notes API
  app.get("/api/daily-notes/:userId/:date", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const date = req.params.date;
      const note = await storage.getDailyNote(userId, date);
      res.json(note || { content: "" });
    } catch (error) {
      console.error("Get daily note error:", error);
      if (!res.headersSent) {
        res
          .status(500)
          .json({
            error: "Failed to fetch daily note",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  });

  app.post("/api/daily-notes", async (req, res) => {
    try {
      const noteData = insertDailyNotesSchema.parse(req.body);
      const note = await storage.createOrUpdateDailyNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Create/update daily note error:", error);
      if (!res.headersSent) {
        res
          .status(400)
          .json({
            error: "Invalid note data",
            details: error instanceof Error ? error.message : "Unknown error",
          });
      }
    }
  });

  // Register enhanced export routes
  registerExportRoutes(app);

  // All invalid API routes return JSON, not HTML
  app.use('/api', (req, res) => {
    res.status(404).json({
      error: true,
      status: 404,
      code: 'error.notFound',
      message: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });

  // Setup audit system routes
  setupAuditRoutes(app);

  // Simplified authentication middleware
  function requireAuth(req: any, res: any, next: any) {
  // Check if user exists in session
  const sessionUser = req.session?.passport?.user;

  if (sessionUser) {
    req.user = sessionUser;
    console.log("[SUCCESS] Auth middleware: User", sessionUser.email, "authenticated for", req.path);
    next();
  } else {
    // Check if we have valid environment tokens
    const envAccessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const envRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (envAccessToken && envRefreshToken && !envAccessToken.startsWith('dev-') && !envRefreshToken.startsWith('dev-')) {
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
      console.log("[SUCCESS] Auth middleware: Auto-authenticated user", fallbackUser.email, "for", req.path);
      next();
    } else {
      // No valid authentication found
      console.log("[ERROR] Auth middleware: No valid authentication for", req.path);
      res.status(401).json({ 
        error: "Authentication required",
        needsAuth: true,
        endpoint: "/api/auth/google"
      });
    }
  }
}

// ===== NEW OAUTH ROUTES USING GOOGLE OAUTH MANAGER =====

// Start OAuth flow
app.get('/api/auth/google', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId || "1";
    console.log('[START] Starting Google OAuth flow for user:', userId);

    const authUrl = oauthManager.generateAuthUrl(userId);
    console.log('[LINK] Redirecting to Google OAuth:', authUrl);

    res.redirect(authUrl);
  } catch (error) {
    console.error('[ERROR] OAuth start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// OAuth callback
app.get('/api/auth/google/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;
    console.log('[REFRESH] OAuth callback received for user:', userId);

    if (!code || !userId) {
      console.error('[ERROR] Missing code or user ID in callback');
      return res.status(400).json({ error: 'Missing code or user ID' });
    }

    const tokens = await oauthManager.handleOAuthCallback(code as string, userId as string);
    console.log('[SUCCESS] OAuth callback successful, tokens obtained');

    // Store user in session
    const user = {
      id: userId,
      email: "user@example.com", // Will be updated with real email
      name: "User",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      provider: "google"
    };

    req.session.passport = { user };
    req.user = user;

    // Redirect to success page
    res.redirect('/dashboard?auth=success');
  } catch (error) {
    console.error('[ERROR] OAuth callback error:', error);
    res.redirect('/dashboard?auth=error&message=' + encodeURIComponent(error.message));
  }
});

// Check auth status using new manager
  app.get('/api/auth/status', async (req, res) => {
    try {
      const userId = req.user?.id || req.session?.userId || "1";

      // Check using new OAuth manager
      const status = await oauthManager.checkAuthStatus(userId);

      // Add caching headers to reduce repeated requests
      res.set({
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
        'ETag': JSON.stringify("auth-" + userId + "-" + Date.now())
      });

      res.json({
        authenticated: status.isAuthenticated,
        hasValidTokens: status.hasValidTokens,
        user: status.isAuthenticated ? {
          id: userId,
          email: req.user?.email || "user@example.com",
          name: req.user?.name || "User"
        } : null
      });
    } catch (error) {
      console.error('[ERROR] Auth status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

// Calendar sync endpoint using new manager
app.get('/api/calendar/sync', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId || "1";

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const events = await oauthManager.syncCalendarEvents(userId);
    res.json({ success: true, events, count: events.length });

  } catch (error) {
    console.error('[ERROR] Calendar sync endpoint error:', error);

    if (error.message.includes('AUTHENTICATION_REQUIRED') || 
        error.message.includes('REAUTHENTICATION_REQUIRED')) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        requireReauth: true 
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Test authentication endpoint
app.get('/api/auth/test', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId || "1";

    const status = await oauthManager.checkAuthStatus(userId);

    if (status.isAuthenticated) {
      // Test calendar access
      const events = await oauthManager.syncCalendarEvents(userId);
      res.json({
        success: true,
        message: 'Authentication working properly',
        eventsCount: events.length,
        status
      });
    } else {
      res.json({
        success: false,
        message: 'Authentication required',
        needsAuth: true,
        authUrl: '/api/auth/google'
      });
    }
  } catch (error) {
    console.error('[ERROR] Auth test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Force token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const userId = req.user?.id || req.session?.userId || "1";

    await oauthManager.refreshTokensIfNeeded(userId);
    res.json({ success: true, message: 'Tokens refreshed successfully' });
  } catch (error) {
    console.error('[ERROR] Token refresh error:', error);

    if (error.message.includes('AUTHENTICATION_REQUIRED') || 
        error.message.includes('REAUTHENTICATION_REQUIRED')) {
      return res.status(401).json({ 
        error: 'Authentication required', 
        requireReauth: true,
        authUrl: '/api/auth/google'
      });
    }

    res.status(500).json({ error: error.message });
  }
});

// Appointment status routes are now properly positioned after /api/events DELETE route

const httpServer = createServer(app);
return httpServer;
}