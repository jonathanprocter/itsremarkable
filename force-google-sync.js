/**
 * Force Google Calendar Sync Script
 * This script will force a complete sync of Google Calendar events
 */

async function forceGoogleCalendarSync() {
  console.log('🔄 FORCING GOOGLE CALENDAR SYNC');
  console.log('================================');
  
  try {
    // First, check authentication status
    console.log('\n1. Checking Authentication Status...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log(`Authentication: ${authData.authenticated}`);
    console.log(`Valid Tokens: ${authData.hasValidTokens}`);
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated. Please authenticate first:');
      console.log('Visit: http://localhost:5000/api/auth/google');
      return;
    }
    
    // Try to force sync with valid tokens
    console.log('\n2. Attempting Force Sync...');
    const syncResponse = await fetch('/api/force-sync?start=2025-01-01&end=2025-12-31');
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.text();
      console.log('✅ Force sync successful');
      console.log('Sync result:', syncData.substring(0, 200));
    } else {
      console.log('⚠️ Force sync failed, trying live sync endpoint...');
      
      // Try live sync endpoint
      console.log('\n3. Attempting Live Sync...');
      const liveResponse = await fetch('/api/live-sync/calendar/events?start=2025-01-01&end=2025-12-31');
      
      if (liveResponse.ok) {
        const liveData = await liveResponse.json();
        console.log(`✅ Live sync successful: ${liveData.events.length} events`);
        
        // Check if we got new events
        if (liveData.events.length > 0) {
          console.log('📊 Recent events:');
          liveData.events.slice(0, 5).forEach((event, i) => {
            console.log(`${i + 1}. ${event.title} - ${event.startTime}`);
          });
        }
      } else {
        const errorData = await liveResponse.json();
        console.log(`❌ Live sync failed: ${errorData.error}`);
        
        // If tokens are invalid, try to refresh them
        if (errorData.error.includes('tokens')) {
          console.log('\n4. Attempting Token Refresh...');
          const refreshResponse = await fetch('/api/auth/refresh-tokens', { method: 'POST' });
          
          if (refreshResponse.ok) {
            console.log('✅ Tokens refreshed successfully');
            console.log('🔄 Retrying live sync...');
            
            // Retry live sync after refresh
            const retryResponse = await fetch('/api/live-sync/calendar/events?start=2025-01-01&end=2025-12-31');
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              console.log(`✅ Live sync after refresh successful: ${retryData.events.length} events`);
            }
          } else {
            const refreshError = await refreshResponse.json();
            console.log(`❌ Token refresh failed: ${refreshError.error}`);
            console.log('Please re-authenticate: http://localhost:5000/api/auth/google');
          }
        }
      }
    }
    
    // Finally, check database events to see if they were updated
    console.log('\n5. Checking Database Events...');
    const dbResponse = await fetch('/api/calendar/events?start=2025-01-01&end=2025-12-31');
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log(`📊 Database now contains: ${dbData.events.length} Google Calendar events`);
    }
    
    console.log('\n✅ SYNC PROCESS COMPLETE');
    console.log('Try refreshing the calendar view to see new events!');
    
  } catch (error) {
    console.error('❌ Sync process failed:', error);
    console.log('Please try authenticating again: http://localhost:5000/api/auth/google');
  }
}

// Run the sync
forceGoogleCalendarSync();