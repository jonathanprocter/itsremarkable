/**
 * Test Calendar Sync Functionality
 * Run this in the browser console to test the unified sync endpoint
 */

async function testCalendarSync() {
  console.log('🔄 Testing calendar sync functionality...');
  
  try {
    // Test the sync endpoint
    const response = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Calendar sync successful:', data);
    
    // Test the unified events endpoint
    const eventsResponse = await fetch('/api/events', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });

    if (!eventsResponse.ok) {
      throw new Error(`Events fetch failed: ${eventsResponse.status}`);
    }

    const events = await eventsResponse.json();
    
    // Count events by source
    const eventCounts = {
      total: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Event counts after sync:', eventCounts);
    
    // Sample SimplePractice events
    const simplePracticeEvents = events.filter(e => e.source === 'simplepractice');
    if (simplePracticeEvents.length > 0) {
      console.log('📋 Sample SimplePractice events:', simplePracticeEvents.slice(0, 5).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toDateString(),
        source: e.source
      })));
    }
    
    // Sample Google events
    const googleEvents = events.filter(e => e.source === 'google');
    if (googleEvents.length > 0) {
      console.log('📋 Sample Google events:', googleEvents.slice(0, 5).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toDateString(),
        source: e.source
      })));
    }
    
    return {
      success: true,
      syncResult: data,
      eventCounts,
      totalEvents: events.length
    };
    
  } catch (error) {
    console.error('❌ Calendar sync test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Make function available globally
window.testCalendarSync = testCalendarSync;

// Auto-run the test
testCalendarSync().then(result => {
  if (result.success) {
    console.log('🎉 Calendar sync test completed successfully!');
  } else {
    console.log('⚠️ Calendar sync test failed:', result.error);
  }
});