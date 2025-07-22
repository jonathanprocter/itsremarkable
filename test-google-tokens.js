import { google } from 'googleapis';

async function testGoogleTokens() {
  console.log('Testing Google Calendar API with environment tokens...');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google/callback'
  );
  
  oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  try {
    const response = await calendar.calendarList.list({ maxResults: 1 });
    console.log('✅ SUCCESS: Google Calendar API is working!');
    console.log('Calendars found:', response.data.items?.length || 0);
    return true;
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    console.log('Status:', error.response?.status);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

testGoogleTokens();