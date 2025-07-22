
/**
 * Test OAuth Client Fix
 * This script tests the OAuth client configuration fix
 */

console.log('🔧 Testing OAuth Client Fix...');

async function testOAuthClientFix() {
  const baseUrl = window.location.origin;
  
  try {
    // Step 1: Test OAuth configuration refresh
    console.log('\n🔄 Step 1: Testing OAuth configuration refresh...');
    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh-config`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ OAuth configuration refreshed:', refreshData);
    } else {
      console.log('❌ OAuth configuration refresh failed');
      return;
    }
    
    // Step 2: Test auth status
    console.log('\n👤 Step 2: Testing auth status...');
    const statusResponse = await fetch(`${baseUrl}/api/auth/status`, {
      credentials: 'include'
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Auth status:', statusData);
    } else {
      console.log('❌ Auth status check failed');
    }
    
    // Step 3: Test Google Calendar access
    console.log('\n📅 Step 3: Testing Google Calendar access...');
    const calendarResponse = await fetch(`${baseUrl}/api/calendar/events?start=2025-01-01T00:00:00.000Z&end=2025-01-31T23:59:59.999Z`, {
      credentials: 'include'
    });
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      console.log('✅ Google Calendar access working!');
      console.log('📊 Events found:', calendarData.events?.length || 0);
      console.log('📅 Calendars found:', calendarData.calendars?.length || 0);
    } else {
      const errorText = await calendarResponse.text();
      console.log('❌ Google Calendar access failed:', errorText);
      
      // If calendar fails, try the live sync endpoint
      console.log('\n🔄 Trying live sync endpoint...');
      const liveSyncResponse = await fetch(`${baseUrl}/api/live-sync/calendar/events?start=2025-01-01T00:00:00.000Z&end=2025-01-31T23:59:59.999Z`);
      
      if (liveSyncResponse.ok) {
        const liveSyncData = await liveSyncResponse.json();
        console.log('✅ Live sync working!');
        console.log('📊 Live sync events found:', liveSyncData.events?.length || 0);
      } else {
        console.log('❌ Live sync also failed');
      }
    }
    
    // Step 4: Test OAuth flow
    console.log('\n🔗 Step 4: OAuth flow is available at:');
    console.log(`${baseUrl}/api/auth/google`);
    
    console.log('\n✅ OAuth client fix test completed!');
    console.log('💡 If calendar is still not working, try:');
    console.log('1. Click the Google authentication link above');
    console.log('2. Complete the OAuth flow');
    console.log('3. The calendar should connect properly');
    
  } catch (error) {
    console.error('❌ OAuth client fix test failed:', error);
  }
}

// Auto-run the test
testOAuthClientFix();

// Also make it available globally
window.testOAuthClientFix = testOAuthClientFix;
