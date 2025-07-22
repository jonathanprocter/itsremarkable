/**
 * Final Integration Test - Complete validation of unified calendar system
 * Run this in the browser console to test the complete implementation
 */

async function runFinalIntegrationTest() {
  console.log('🚀 Starting final integration test...');
  
  try {
    // Test 1: Check authentication
    console.log('1. Checking authentication...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    if (!authData.authenticated) {
      console.log('❌ Authentication required');
      return false;
    }
    console.log('✅ Authentication confirmed');
    
    // Test 2: Test unified events endpoint
    console.log('2. Testing unified events endpoint...');
    const eventsResponse = await fetch('/api/events', {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!eventsResponse.ok) {
      console.log('❌ Failed to fetch events');
      return false;
    }
    
    const events = await eventsResponse.json();
    console.log(`✅ Fetched ${events.length} events from unified endpoint`);
    
    // Test 3: Analyze event sources
    console.log('3. Analyzing event sources...');
    const sourceAnalysis = {
      total: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Event sources:', sourceAnalysis);
    
    // Test 4: Test SimplePractice detection logic
    console.log('4. Testing SimplePractice detection logic...');
    
    function isSimplePractice(event) {
      const title = event.title.toLowerCase();
      const description = (event.description || '').toLowerCase();
      
      return event.calendarId === '0np7sib5u30o7oc297j5pb259g' ||
             title.includes('appointment') ||
             title.includes('session') ||
             title.includes('therapy') ||
             title.includes('consultation') ||
             title.includes('counseling') ||
             title.includes('supervision') ||
             title.includes('intake') ||
             /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(event.title.trim());
    }
    
    const potentialSimplePractice = events.filter(isSimplePractice);
    console.log(`🔍 Found ${potentialSimplePractice.length} events matching SimplePractice patterns`);
    
    // Test 5: Check calendar IDs
    console.log('5. Checking calendar IDs...');
    const calendarIds = {};
    events.forEach(event => {
      const calId = event.calendarId || 'unknown';
      calendarIds[calId] = (calendarIds[calId] || 0) + 1;
    });
    
    console.log('📊 Calendar distribution:', calendarIds);
    
    // Test 6: Test sync functionality
    console.log('6. Testing sync functionality...');
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ Sync successful:', syncData);
      
      // Wait and check events again
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedEventsResponse = await fetch('/api/events', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (updatedEventsResponse.ok) {
        const updatedEvents = await updatedEventsResponse.json();
        const updatedSourceAnalysis = {
          total: updatedEvents.length,
          google: updatedEvents.filter(e => e.source === 'google').length,
          simplepractice: updatedEvents.filter(e => e.source === 'simplepractice').length,
          manual: updatedEvents.filter(e => e.source === 'manual').length
        };
        
        console.log('📊 Updated event sources after sync:', updatedSourceAnalysis);
        
        // Show SimplePractice events if found
        const simplePracticeEvents = updatedEvents.filter(e => e.source === 'simplepractice');
        if (simplePracticeEvents.length > 0) {
          console.log('🎉 SimplePractice events found:');
          simplePracticeEvents.slice(0, 5).forEach((event, index) => {
            console.log(`${index + 1}. "${event.title}" - ${new Date(event.startTime).toLocaleDateString()}`);
          });
        } else {
          console.log('⚠️ No SimplePractice events detected');
          
          // Show potential SimplePractice events
          const potentialSP = updatedEvents.filter(isSimplePractice);
          if (potentialSP.length > 0) {
            console.log('📋 Events that match SimplePractice patterns:');
            potentialSP.slice(0, 5).forEach((event, index) => {
              console.log(`${index + 1}. "${event.title}" (Current source: ${event.source})`);
            });
          }
        }
      }
    } else {
      console.log('❌ Sync failed:', await syncResponse.json());
    }
    
    // Test 7: Final validation summary
    console.log('7. Final validation summary...');
    const finalSummary = {
      authenticationWorking: authData.authenticated,
      eventsLoaded: events.length > 0,
      unifiedEndpointWorking: eventsResponse.ok,
      syncEndpointWorking: syncResponse.ok,
      simplePracticeEventsFound: sourceAnalysis.simplepractice > 0,
      totalEvents: events.length,
      eventSources: sourceAnalysis
    };
    
    console.log('📊 Final Test Summary:', finalSummary);
    
    if (finalSummary.authenticationWorking && 
        finalSummary.eventsLoaded && 
        finalSummary.unifiedEndpointWorking && 
        finalSummary.syncEndpointWorking) {
      console.log('🎉 All core functionality is working correctly!');
      
      if (finalSummary.simplePracticeEventsFound) {
        console.log('✅ SimplePractice events are being detected and categorized');
      } else {
        console.log('⚠️ No SimplePractice events found - this could be expected if there are none in the calendar');
      }
      
      return true;
    } else {
      console.log('❌ Some functionality is not working correctly');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Final integration test failed:', error);
    return false;
  }
}

// Run the test
runFinalIntegrationTest().then(success => {
  if (success) {
    console.log('🏆 Final Integration Test: PASSED');
    console.log('✅ The unified calendar system is working correctly!');
  } else {
    console.log('❌ Final Integration Test: FAILED');
    console.log('⚠️ Some issues need to be addressed');
  }
});