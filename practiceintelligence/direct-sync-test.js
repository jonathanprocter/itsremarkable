/**
 * Direct Sync Test - Execute in browser console
 * Copy and paste this entire script into the browser console
 */

console.log('🔄 Direct sync test starting...');

// Test function
async function runDirectSyncTest() {
  try {
    console.log('1. Checking authentication...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ Authenticated successfully');
    
    console.log('2. Triggering calendar sync...');
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.log('❌ Sync failed:', errorData);
      return;
    }
    
    const syncData = await syncResponse.json();
    console.log('✅ Sync completed:', syncData);
    
    console.log('3. Fetching updated events...');
    const eventsResponse = await fetch('/api/events', {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!eventsResponse.ok) {
      console.log('❌ Failed to fetch events');
      return;
    }
    
    const events = await eventsResponse.json();
    
    console.log('4. Analyzing event sources...');
    const counts = {
      total: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Event counts:', counts);
    
    // Check for SimplePractice events
    const simplePracticeEvents = events.filter(e => e.source === 'simplepractice');
    
    if (simplePracticeEvents.length > 0) {
      console.log('🎉 SimplePractice events detected!');
      console.log('📋 SimplePractice events:', simplePracticeEvents.slice(0, 5).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        source: e.source
      })));
    } else {
      console.log('⚠️ No SimplePractice events found');
      
      // Look for potential SimplePractice events
      const potentialEvents = events.filter(e => 
        e.title.toLowerCase().includes('appointment') ||
        e.title.toLowerCase().includes('session') ||
        e.title.toLowerCase().includes('consultation') ||
        e.title.toLowerCase().includes('therapy') ||
        e.title.toLowerCase().includes('counseling')
      );
      
      console.log(`🔍 Found ${potentialEvents.length} events that might be SimplePractice appointments`);
      
      if (potentialEvents.length > 0) {
        console.log('📋 Potential SimplePractice events:', potentialEvents.slice(0, 10).map(e => ({
          title: e.title,
          date: new Date(e.startTime).toLocaleDateString(),
          currentSource: e.source
        })));
      }
    }
    
    return {
      success: true,
      syncResult: syncData,
      eventCounts: counts,
      simplePracticeFound: simplePracticeEvents.length > 0
    };
    
  } catch (error) {
    console.error('❌ Direct sync test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
runDirectSyncTest().then(result => {
  console.log('🏁 Test completed:', result);
});