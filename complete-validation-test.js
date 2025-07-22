/**
 * Complete Validation Test - Run in Browser Console
 * This test validates the enhanced SimplePractice detection and unified calendar system
 */

(async function completeValidationTest() {
  console.log('🚀 Starting complete validation test...');
  
  try {
    // Step 1: Check authentication
    console.log('1️⃣ Checking authentication status...');
    const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
    const authData = await authResponse.json();
    
    if (!authData.authenticated) {
      console.error('❌ Not authenticated. Please log in first.');
      return { success: false, error: 'Authentication required' };
    }
    
    console.log('✅ Authenticated successfully');
    
    // Step 2: Get current events before sync
    console.log('2️⃣ Getting current events...');
    const currentEventsResponse = await fetch('/api/events', { 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const currentEvents = await currentEventsResponse.json();
    
    const beforeSync = {
      total: currentEvents.length,
      google: currentEvents.filter(e => e.source === 'google').length,
      simplepractice: currentEvents.filter(e => e.source === 'simplepractice').length,
      manual: currentEvents.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Events before sync:', beforeSync);
    
    // Step 3: Test SimplePractice detection on current events
    console.log('3️⃣ Testing enhanced SimplePractice detection...');
    
    const enhancedDetection = (event) => {
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();
      const location = (event.location || '').toLowerCase();
      
      const indicators = [
        // Direct mentions
        title.includes('simplepractice') || description.includes('simplepractice'),
        event.calendarId === '0np7sib5u30o7oc297j5pb259g',
        
        // Common SimplePractice patterns
        title.includes('therapy') || description.includes('therapy'),
        title.includes('session') || description.includes('session'),
        title.includes('counseling') || description.includes('counseling'),
        title.includes('appointment') || description.includes('appointment'),
        title.includes('consultation') || description.includes('consultation'),
        title.includes('supervision') || description.includes('supervision'),
        title.includes('intake') || description.includes('intake'),
        
        // Location patterns
        location.includes('office') || location.includes('clinic'),
        
        // Name pattern
        /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(event.title?.trim() || '')
      ];
      
      const score = indicators.filter(Boolean).length;
      return { isSimplePractice: score >= 2, score, indicators };
    };
    
    const detectionResults = currentEvents.map(event => ({
      title: event.title,
      currentSource: event.source,
      ...enhancedDetection(event)
    }));
    
    const potentialSimplePractice = detectionResults.filter(r => r.isSimplePractice);
    console.log(`🔍 Enhanced detection found ${potentialSimplePractice.length} potential SimplePractice events`);
    
    if (potentialSimplePractice.length > 0) {
      console.log('📋 Sample potential SimplePractice events:');
      potentialSimplePractice.slice(0, 10).forEach((event, i) => {
        console.log(`${i + 1}. "${event.title}" (Score: ${event.score}, Current: ${event.currentSource})`);
      });
    }
    
    // Step 4: Trigger sync to test the enhanced detection
    console.log('4️⃣ Triggering calendar sync with enhanced detection...');
    const syncStart = Date.now();
    
    const syncResponse = await fetch('/api/sync/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    let syncResult;
    if (syncResponse.ok) {
      syncResult = await syncResponse.json();
      const syncDuration = Date.now() - syncStart;
      console.log(`✅ Sync completed in ${syncDuration}ms`);
      console.log('📊 Sync results:', syncResult);
    } else {
      const errorText = await syncResponse.text();
      console.log('⚠️ Sync failed:', syncResponse.status, errorText);
      syncResult = { error: errorText };
    }
    
    // Step 5: Check events after sync
    console.log('5️⃣ Checking events after sync...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterSyncResponse = await fetch('/api/events', { 
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const afterSyncEvents = await afterSyncResponse.json();
    
    const afterSync = {
      total: afterSyncEvents.length,
      google: afterSyncEvents.filter(e => e.source === 'google').length,
      simplepractice: afterSyncEvents.filter(e => e.source === 'simplepractice').length,
      manual: afterSyncEvents.filter(e => e.source === 'manual').length
    };
    
    console.log('📊 Events after sync:', afterSync);
    
    // Step 6: Show SimplePractice events if found
    const simplePracticeEvents = afterSyncEvents.filter(e => e.source === 'simplepractice');
    if (simplePracticeEvents.length > 0) {
      console.log('🎉 SimplePractice events found after sync:');
      simplePracticeEvents.slice(0, 10).forEach((event, i) => {
        console.log(`${i + 1}. "${event.title}" - ${new Date(event.startTime).toLocaleDateString()}`);
      });
    } else {
      console.log('ℹ️ No SimplePractice events found after sync');
    }
    
    // Step 7: Compare detection results
    console.log('6️⃣ Comparing detection results...');
    const comparison = {
      beforeSync: beforeSync,
      afterSync: afterSync,
      potentialDetected: potentialSimplePractice.length,
      actualSimplePractice: afterSync.simplepractice,
      improvementNeeded: potentialSimplePractice.length > afterSync.simplepractice
    };
    
    console.log('📊 Detection comparison:', comparison);
    
    // Step 8: Final validation
    console.log('7️⃣ Final validation...');
    const validationResult = {
      authenticationWorking: authData.authenticated,
      eventsLoaded: currentEvents.length > 0,
      syncAttempted: syncResponse.status !== undefined,
      enhancedDetectionWorking: potentialSimplePractice.length > 0,
      simplePracticeFound: afterSync.simplepractice > 0,
      totalEvents: afterSync.total,
      syncSuccessful: syncResponse.ok
    };
    
    console.log('📋 Final validation result:', validationResult);
    
    if (validationResult.authenticationWorking && validationResult.eventsLoaded) {
      console.log('🎉 Core system is working correctly!');
      
      if (validationResult.enhancedDetectionWorking) {
        console.log('✅ Enhanced SimplePractice detection is identifying potential events');
        
        if (validationResult.simplePracticeFound) {
          console.log('🎯 SimplePractice events are being properly categorized');
        } else {
          console.log('⚠️ Detection logic may need adjustment - events identified but not categorized');
        }
      } else {
        console.log('⚠️ No potential SimplePractice events detected - may need broader criteria');
      }
    } else {
      console.log('❌ Core system issues detected');
    }
    
    return {
      success: true,
      validation: validationResult,
      comparison: comparison,
      syncResult: syncResult
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
})();

// Helper function for quick retesting
window.quickValidationTest = async () => {
  try {
    const events = await fetch('/api/events', { credentials: 'include' });
    const eventsData = await events.json();
    
    const counts = {
      total: eventsData.length,
      google: eventsData.filter(e => e.source === 'google').length,
      simplepractice: eventsData.filter(e => e.source === 'simplepractice').length,
      manual: eventsData.filter(e => e.source === 'manual').length
    };
    
    console.log('Quick validation - Event counts:', counts);
    
    if (counts.simplepractice > 0) {
      const spEvents = eventsData.filter(e => e.source === 'simplepractice');
      console.log('SimplePractice events:', spEvents.slice(0, 5).map(e => e.title));
    }
    
    return counts;
  } catch (error) {
    console.error('Quick validation failed:', error);
  }
};

console.log('✨ Complete validation test loaded and running!');
console.log('💡 For quick retests, run: quickValidationTest()');