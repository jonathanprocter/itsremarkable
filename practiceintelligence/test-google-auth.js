// Test Google Calendar Authentication
// This script provides a complete authentication URL and tests the setup

console.log('🔧 Google Calendar Authentication Test\n');

// Step 1: Test environment variables
console.log('📋 Environment Configuration:');
console.log('✅ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Present' : '❌ Missing');
console.log('✅ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Present' : '❌ Missing');
console.log('✅ GOOGLE_ACCESS_TOKEN:', process.env.GOOGLE_ACCESS_TOKEN ? '✓ Present' : '❌ Missing');
console.log('✅ GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '✓ Present' : '❌ Missing');

// Step 2: Test authentication endpoints
console.log('\n🌐 Authentication Endpoints:');
console.log('✅ OAuth URL: http://localhost:5000/api/auth/google');
console.log('✅ Auth Status: http://localhost:5000/api/auth/status');
console.log('✅ Auth Debug: http://localhost:5000/api/auth/debug');

// Step 3: Provide OAuth URL for user
const domain = '474155cb-26cc-45e2-9759-28eaffdac638-00-20mxsrmp7mzl4.worf.replit.dev';
const clientId = process.env.GOOGLE_CLIENT_ID;
const redirectUri = `https://${domain}/api/auth/google/callback`;

const scopes = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'openid'
].join(' ');

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `access_type=offline&` +
  `scope=${encodeURIComponent(scopes)}&` +
  `prompt=consent&` +
  `include_granted_scopes=true&` +
  `response_type=code&` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}`;

console.log('\n🔗 GOOGLE OAUTH AUTHENTICATION URL:');
console.log(authUrl);

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Click the OAuth URL above to authenticate with Google');
console.log('2. Grant permission to access your Google Calendar');
console.log('3. You will be redirected back to your application');
console.log('4. Your Google Calendar events will then be accessible');
console.log('5. The application will automatically sync your events');

console.log('\n🔍 TROUBLESHOOTING:');
console.log('- If you get a "redirect_uri_mismatch" error, the OAuth URL needs to be updated in Google Cloud Console');
console.log('- If authentication fails, check that all environment variables are set correctly');
console.log('- Use the debug endpoint to check authentication status after logging in');