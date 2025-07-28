/**
 * Test Google Tokens - Direct test of Google Calendar API access
 */

import { google } from "googleapis";

export async function testGoogleTokens(req: any, res: any) {
  console.log("🧪 Testing Google tokens directly...");

  try {
    const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    console.log("🔍 Token status:");
    console.log(`  - Access Token: ${accessToken ? 'Present' : 'Missing'} (${accessToken?.slice(0, 20)}...)`);
    console.log(`  - Refresh Token: ${refreshToken ? 'Present' : 'Missing'} (${refreshToken?.slice(0, 20)}...)`);
    console.log(`  - Client ID: ${clientId ? 'Present' : 'Missing'}`);
    console.log(`  - Client Secret: ${clientSecret ? 'Present' : 'Missing'}`);

    if (!accessToken || !refreshToken || !clientId || !clientSecret) {
      return res.status(400).json({
        error: "Missing required credentials",
        details: {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret
        }
      });
    }

    // Test 1: Create OAuth client
    console.log("🔧 Creating OAuth2 client...");
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev/api/auth/google/callback"
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    console.log("✅ OAuth2 client created successfully");

    // Test 2: Simple API call
    console.log("📋 Testing calendar list access...");
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    
    const response = await calendar.calendarList.list({ maxResults: 3 });
    const calendars = response.data.items || [];
    
    console.log(`✅ Successfully accessed ${calendars.length} calendars`);
    calendars.forEach((cal, index) => {
      console.log(`  ${index + 1}. ${cal.summary} (${cal.id?.slice(0, 20)}...)`);
    });

    // Test 3: Get events from primary calendar
    console.log("📅 Testing events access on primary calendar...");
    const eventsResponse = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 5,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = eventsResponse.data.items || [];
    console.log(`✅ Successfully accessed ${events.length} upcoming events`);

    res.json({
      success: true,
      message: "Google tokens are working correctly",
      results: {
        calendarsFound: calendars.length,
        calendars: calendars.map(cal => ({
          summary: cal.summary,
          id: cal.id,
          primary: cal.primary
        })),
        upcomingEvents: events.length,
        events: events.map(event => ({
          summary: event.summary,
          start: event.start?.dateTime || event.start?.date,
          id: event.id
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("❌ Google tokens test failed:", error);
    
    const errorDetails = {
      message: error.message,
      code: error.code,
      status: error.status,
      name: error.name
    };

    console.log("🔍 Error details:", errorDetails);

    res.status(error.code === 403 ? 403 : error.code === 401 ? 401 : 500).json({
      error: "Google tokens test failed",
      details: errorDetails,
      needsReauth: error.code === 401 || error.code === 403,
      authUrl: "/api/auth/google",
      timestamp: new Date().toISOString()
    });
  }
}