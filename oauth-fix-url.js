#!/usr/bin/env node

// Simple OAuth URL generator for Google Calendar authentication
import { google } from 'googleapis';

// OAuth configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID?.trim(),
  process.env.GOOGLE_CLIENT_SECRET?.trim(),
  `https://474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev/api/auth/google/callback`
);

// Generate OAuth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
  ],
  prompt: 'consent',
  include_granted_scopes: true
});

console.log('\n🔗 GOOGLE OAUTH AUTHENTICATION URL:');
console.log(authUrl);
console.log('\n✅ Click the link above to authenticate with Google Calendar');
console.log('✅ After authentication, you will be redirected back to your application');
console.log('✅ Your Google Calendar events will then be accessible\n');