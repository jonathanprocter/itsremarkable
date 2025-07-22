/**
 * Comprehensive Sync Test - Final validation
 * Copy and paste this into browser console to test everything
 */

console.log('🚀 Starting comprehensive sync test...');

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE SYNC TEST ===');
  
  try {
    // 1. Check authentication
    console.log('1️⃣ Checking authentication status...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    if (!authData.authenticated) {
      console.log('❌ Not authenticated');
      return { success: false, error: 'Not authenticated' };
    }
    
    console.log('✅ Authentication confirmed');
    
    // 2. Get current events before sync
    console.log('2️⃣ Getting current events before sync...');
    const beforeResponse = await fetch('/api/events', { 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const beforeEvents = await beforeResponse.json();
    
    const beforeCounts = {
      total: beforeEvents.length,
      google: beforeEvents.filter(e => e.source === 'google').length,
      simplepractice: beforeEvents.filter(e => e.source === 'simplepractice').length,
      manual: beforeEvents.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Events before sync:', beforeCounts);
    
    // 3. Trigger sync
    console.log('3️⃣ Triggering calendar sync...');
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.log('❌ Sync failed:', errorData);
      return { success: false, error: errorData };
    }
    
    const syncData = await syncResponse.json();
    console.log('✅ Sync completed:', syncData);
    
    // 4. Get events after sync
    console.log('4️⃣ Getting events after sync...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for sync to complete
    
    const afterResponse = await fetch('/api/events', { 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const afterEvents = await afterResponse.json();
    
    const afterCounts = {
      total: afterEvents.length,
      google: afterEvents.filter(e => e.source === 'google').length,
      simplepractice: afterEvents.filter(e => e.source === 'simplepractice').length,
      manual: afterEvents.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Events after sync:', afterCounts);
    
    // 5. Analyze SimplePractice detection
    console.log('5️⃣ Analyzing SimplePractice detection...');
    const simplePracticeEvents = afterEvents.filter(e => e.source === 'simplepractice');
    
    if (simplePracticeEvents.length > 0) {
      console.log('🎉 SimplePractice events found!');
      console.log('📋 SimplePractice events:', simplePracticeEvents.slice(0, 10).map(e => ({
        title: e.title,
        date: new Date(e.startTime).toLocaleDateString(),
        time: new Date(e.startTime).toLocaleTimeString(),
        source: e.source
      })));
    } else {
      console.log('⚠️ No SimplePractice events detected');
      
      // Check for potential SimplePractice events
      const potentialEvents = afterEvents.filter(e => {
        const title = e.title.toLowerCase();
        return title.includes('appointment') || 
               title.includes('session') || 
               title.includes('therapy') || 
               title.includes('consultation') ||
               title.includes('counseling') ||
               title.includes('supervision') ||
               title.includes('intake') ||
               /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(e.title.trim());
      });
      
      console.log(`🔍 Found ${potentialEvents.length} events matching SimplePractice patterns`);
      
      if (potentialEvents.length > 0) {
        console.log('📋 Potential SimplePractice events:', potentialEvents.slice(0, 10).map(e => ({
          title: e.title,
          date: new Date(e.startTime).toLocaleDateString(),
          currentSource: e.source,
          matchesPattern: /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(e.title.trim())
        })));
      }
    }
    
    // 6. Check specific calendar IDs
    console.log('6️⃣ Checking calendar IDs...');
    const calendarIdCounts = {};
    afterEvents.forEach(event => {
      const calId = event.calendarId || 'unknown';
      calendarIdCounts[calId] = (calendarIdCounts[calId] || 0) + 1;
    });
    
    console.log('📊 Events by calendar ID:', calendarIdCounts);
    
    // Check for known SimplePractice calendar ID
    const knownSimplePracticeCalId = '0np7sib5u30o7oc297j5pb259g';
    const eventsFromKnownCalendar = afterEvents.filter(e => e.calendarId === knownSimplePracticeCalId);
    
    if (eventsFromKnownCalendar.length > 0) {
      console.log(`✅ Found ${eventsFromKnownCalendar.length} events from known SimplePractice calendar ID`);
      console.log('📋 Events from SimplePractice calendar:', eventsFromKnownCalendar.slice(0, 5).map(e => ({
        title: e.title,
        source: e.source,
        calendarId: e.calendarId
      })));
    }
    
    // 7. Final summary
    console.log('7️⃣ Final summary:');
    const summary = {
      syncSuccessful: syncResponse.ok,
      eventsBeforeSync: beforeCounts,
      eventsAfterSync: afterCounts,
      simplePracticeFound: simplePracticeEvents.length > 0,
      simplePracticeCount: simplePracticeEvents.length,
      potentialSimplePracticeCount: potentialEvents?.length || 0,
      knownCalendarEvents: eventsFromKnownCalendar.length
    };
    
    console.log('📊 Test Summary:', summary);
    
    return {
      success: true,
      ...summary
    };
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
runComprehensiveTest().then(result => {
  console.log('🏁 Comprehensive test completed:', result);
  
  if (result.success) {
    if (result.simplePracticeFound) {
      console.log('🎉 SUCCESS: SimplePractice events are being detected and categorized correctly!');
    } else {
      console.log('⚠️ WARNING: No SimplePractice events detected. This could mean:');
      console.log('   - There are no SimplePractice events in your calendar');
      console.log('   - The detection logic needs refinement');
      console.log('   - SimplePractice events are in a different calendar');
    }
  } else {
    console.log('❌ FAILED: Test could not complete successfully');
  }
});