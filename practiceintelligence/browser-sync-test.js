/**
 * Browser Sync Test - Run this in browser console
 * This will test the sync functionality and show SimplePractice event detection
 */

(async function() {
  console.log('🔄 Testing calendar sync from browser...');
  
  try {
    // First check authentication status
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    console.log('🔐 Auth status:', authData);
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated. Please log in first.');
      return;
    }
    
    // Test sync endpoint
    console.log('📅 Triggering calendar sync...');
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.error('❌ Sync failed:', errorData);
      return;
    }
    
    const syncData = await syncResponse.json();
    console.log('✅ Sync completed:', syncData);
    
    // Get updated events
    console.log('📊 Fetching updated events...');
    const eventsResponse = await fetch('/api/events', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!eventsResponse.ok) {
      console.error('❌ Failed to fetch events');
      return;
    }
    
    const events = await eventsResponse.json();
    
    // Analyze event sources
    const analysis = {
      total: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Event analysis after sync:', analysis);
    
    // Show sample SimplePractice events
    const simplePracticeEvents = events.filter(e => e.source === 'simplepractice');
    if (simplePracticeEvents.length > 0) {
      console.log('📋 SimplePractice events found:', simplePracticeEvents.slice(0, 10).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        time: new Date(e.startTime).toLocaleTimeString(),
        source: e.source
      })));
    } else {
      console.log('⚠️ No SimplePractice events detected');
      
      // Show some Google events for comparison
      const googleEvents = events.filter(e => e.source === 'google');
      console.log('📋 Sample Google events (for comparison):', googleEvents.slice(0, 5).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        source: e.source
      })));
    }
    
    return {
      success: true,
      syncResult: syncData,
      eventCounts: analysis,
      simplePracticeFound: simplePracticeEvents.length > 0
    };
    
  } catch (error) {
    console.error('❌ Browser sync test failed:', error);
    return { success: false, error: error.message };
  }
})();