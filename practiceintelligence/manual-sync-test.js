/**
 * Manual Sync Test - Force execute sync and check results
 * This simulates clicking the sync button in the UI
 */

// Wait for the page to load then test
setTimeout(async () => {
  console.log('🔄 Starting manual sync test...');
  
  try {
    // Check if we're authenticated
    const authCheck = await fetch('/api/auth/status', { credentials: 'include' });
    const authData = await authCheck.json();
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated. Please authenticate first.');
      return;
    }
    
    console.log('✅ Authentication verified');
    
    // Trigger sync
    console.log('📅 Triggering calendar sync...');
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const syncResult = await syncResponse.json();
    console.log('📊 Sync result:', syncResult);
    
    // Wait a moment for sync to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get fresh events
    const eventsResponse = await fetch('/api/events', {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const events = await eventsResponse.json();
    
    // Analyze the results
    const eventBreakdown = {
      total: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Event breakdown after sync:', eventBreakdown);
    
    // Look for SimplePractice events
    const simplePracticeEvents = events.filter(e => e.source === 'simplepractice');
    
    if (simplePracticeEvents.length > 0) {
      console.log('🎉 SimplePractice events found!');
      console.log('📋 Sample SimplePractice events:', simplePracticeEvents.slice(0, 10).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        time: new Date(e.startTime).toLocaleTimeString(),
        source: e.source
      })));
    } else {
      console.log('⚠️ No SimplePractice events detected');
      
      // Show some sample events to verify the detection logic
      const sampleEvents = events.slice(0, 10).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        source: e.source,
        // Check if this looks like a SimplePractice event
        likelySimplePractice: e.title.includes('Appointment') || 
                           e.title.includes('Session') || 
                           e.title.includes('Consultation') ||
                           e.title.includes('Meeting') ||
                           e.title.includes('Therapy') ||
                           e.title.includes('Counseling')
      }));
      
      console.log('📋 Sample events (checking SimplePractice patterns):', sampleEvents);
      
      // Count potential SimplePractice events
      const potentialSimplePractice = events.filter(e => 
        e.title.includes('Appointment') || 
        e.title.includes('Session') || 
        e.title.includes('Consultation') ||
        e.title.includes('Meeting') ||
        e.title.includes('Therapy') ||
        e.title.includes('Counseling')
      );
      
      console.log(`🔍 Found ${potentialSimplePractice.length} events that might be SimplePractice appointments`);
      
      if (potentialSimplePractice.length > 0) {
        console.log('📋 Potential SimplePractice events:', potentialSimplePractice.slice(0, 10).map(e => ({
          title: e.title,
          date: new Date(e.startTime).toLocaleDateString(),
          currentSource: e.source
        })));
      }
    }
    
  } catch (error) {
    console.error('❌ Manual sync test failed:', error);
  }
}, 1000);