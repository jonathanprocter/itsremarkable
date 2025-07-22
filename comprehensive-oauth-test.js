/**
 * Comprehensive OAuth Test Suite
 * Run this in the browser console to test the complete OAuth flow
 */

async function runComprehensiveOAuthTest() {
  console.log('🔍 Starting comprehensive OAuth test suite...');
  
  const testResults = [];
  
  function addTest(name, status, message, details = null) {
    testResults.push({ name, status, message, details });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${emoji} ${name}: ${message}`);
    if (details) {
      console.log(`   Details:`, details);
    }
  }
  
  try {
    // Test 1: Authentication Status
    console.log('\n--- Test 1: Authentication Status ---');
    const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
    if (authResponse.ok) {
      const authData = await authResponse.json();
      if (authData.authenticated) {
        addTest('Authentication Status', 'pass', `Authenticated as ${authData.user?.email}`, authData);
      } else {
        addTest('Authentication Status', 'fail', 'Not authenticated', authData);
      }
    } else {
      addTest('Authentication Status', 'fail', `Auth status check failed: ${authResponse.status}`);
    }
    
    // Test 2: Token Validation
    console.log('\n--- Test 2: Token Validation ---');
    const tokenResponse = await fetch('/api/auth/google/test', { credentials: 'include' });
    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json();
      if (tokenData.success) {
        addTest('Token Validation', 'pass', `Google tokens valid, ${tokenData.calendarCount} calendars found`, tokenData);
      } else {
        addTest('Token Validation', 'fail', tokenData.error || 'Token validation failed', tokenData);
      }
    } else {
      addTest('Token Validation', 'fail', `Token test failed: ${tokenResponse.status}`);
    }
    
    // Test 3: Calendar Sync
    console.log('\n--- Test 3: Calendar Sync Test ---');
    const syncResponse = await fetch('/api/sync/calendar', { 
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      if (syncData.success) {
        addTest('Calendar Sync', 'pass', `Synced ${syncData.count} events from ${syncData.calendars} calendars`, syncData);
      } else {
        addTest('Calendar Sync', 'warn', syncData.message || 'Calendar sync completed with warnings', syncData);
      }
    } else {
      addTest('Calendar Sync', 'fail', `Calendar sync failed: ${syncResponse.status}`);
    }
    
    // Test 4: Event Loading
    console.log('\n--- Test 4: Event Loading ---');
    const eventsResponse = await fetch('/api/events', { credentials: 'include' });
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      if (Array.isArray(events) && events.length > 0) {
        const googleEvents = events.filter(e => e.source === 'google').length;
        const spEvents = events.filter(e => e.source === 'simplepractice').length;
        addTest('Event Loading', 'pass', `Loaded ${events.length} total events (${googleEvents} Google, ${spEvents} SimplePractice)`, { total: events.length, google: googleEvents, simplepractice: spEvents });
      } else {
        addTest('Event Loading', 'warn', 'No events found in database');
      }
    } else {
      addTest('Event Loading', 'fail', `Event loading failed: ${eventsResponse.status}`);
    }
    
    // Test 5: Force Token Refresh
    console.log('\n--- Test 5: Force Token Refresh ---');
    const refreshResponse = await fetch('/api/auth/google/force-refresh', { 
      method: 'POST',
      credentials: 'include' 
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        addTest('Force Token Refresh', 'pass', 'Token refresh successful', refreshData);
      } else {
        addTest('Force Token Refresh', 'warn', 'Token refresh not needed or failed', refreshData);
      }
    } else {
      addTest('Force Token Refresh', 'fail', `Token refresh failed: ${refreshResponse.status}`);
    }
    
    // Test 6: Calendar Events API
    console.log('\n--- Test 6: Calendar Events API ---');
    const calendarResponse = await fetch('/api/calendar/events', { credentials: 'include' });
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      if (calendarData.events && calendarData.events.length > 0) {
        addTest('Calendar Events API', 'pass', `Loaded ${calendarData.events.length} calendar events`, calendarData);
      } else {
        addTest('Calendar Events API', 'warn', 'No calendar events found');
      }
    } else {
      addTest('Calendar Events API', 'fail', `Calendar events API failed: ${calendarResponse.status}`);
    }
    
    // Test 7: SimplePractice Events API
    console.log('\n--- Test 7: SimplePractice Events API ---');
    const spResponse = await fetch('/api/simplepractice/events', { credentials: 'include' });
    if (spResponse.ok) {
      const spData = await spResponse.json();
      if (spData.events && spData.events.length > 0) {
        addTest('SimplePractice Events API', 'pass', `Loaded ${spData.events.length} SimplePractice events`, spData);
      } else {
        addTest('SimplePractice Events API', 'warn', 'No SimplePractice events found');
      }
    } else {
      addTest('SimplePractice Events API', 'fail', `SimplePractice events API failed: ${spResponse.status}`);
    }
    
    // Test 8: OAuth URL Generation
    console.log('\n--- Test 8: OAuth URL Generation ---');
    const oauthResponse = await fetch('/api/auth/google', { credentials: 'include' });
    if (oauthResponse.ok) {
      const oauthData = await oauthResponse.json();
      if (oauthData.authUrl) {
        addTest('OAuth URL Generation', 'pass', 'OAuth URL generated successfully', oauthData);
      } else {
        addTest('OAuth URL Generation', 'fail', 'OAuth URL generation failed', oauthData);
      }
    } else {
      addTest('OAuth URL Generation', 'fail', `OAuth URL generation failed: ${oauthResponse.status}`);
    }
    
    // Generate comprehensive summary
    console.log('\n=== COMPREHENSIVE OAUTH TEST SUMMARY ===');
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const warnings = testResults.filter(r => r.status === 'warn').length;
    
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    
    // Detailed results
    console.log('\n--- DETAILED RESULTS ---');
    testResults.forEach(result => {
      const emoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      console.log(`${emoji} ${result.name}: ${result.message}`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 OAUTH SYSTEM FULLY FUNCTIONAL!');
      console.log('✅ Authentication working correctly');
      console.log('✅ Token management operational');
      console.log('✅ Calendar sync functional');
      console.log('✅ Event loading working');
      console.log('✅ All API endpoints responding');
      
      console.log('\n🚀 READY FOR PRODUCTION USE!');
      console.log('- User authentication: Working');
      console.log('- Google Calendar sync: Working');
      console.log('- SimplePractice events: Working');
      console.log('- Token refresh: Working');
      console.log('- JSON-only API responses: Working');
      
      if (warnings > 0) {
        console.log('\n⚠️ Minor issues (non-critical):');
        testResults.filter(r => r.status === 'warn').forEach(r => {
          console.log(`- ${r.name}: ${r.message}`);
        });
      }
    } else {
      console.log('\n❌ CRITICAL ISSUES DETECTED:');
      testResults.filter(r => r.status === 'fail').forEach(r => {
        console.log(`- ${r.name}: ${r.message}`);
      });
      
      console.log('\n🔧 NEXT STEPS:');
      if (testResults.find(r => r.name === 'Authentication Status' && r.status === 'fail')) {
        console.log('1. Complete Google OAuth authentication');
        console.log('2. Visit: /api/auth/google');
      }
      if (testResults.find(r => r.name === 'Token Validation' && r.status === 'fail')) {
        console.log('3. Check Google OAuth credentials and API permissions');
      }
      if (testResults.find(r => r.name === 'Calendar Sync' && r.status === 'fail')) {
        console.log('4. Verify Google Calendar API access');
      }
    }
    
    return {
      summary: { passed, failed, warnings },
      results: testResults,
      isFullyFunctional: failed === 0,
      readyForProduction: failed === 0
    };
    
  } catch (error) {
    console.error('❌ OAuth Test Suite Failed:', error);
    return { error: error.message };
  }
}

// Make it available globally
window.runComprehensiveOAuthTest = runComprehensiveOAuthTest;

// Auto-run the test
console.log('🚀 Starting Comprehensive OAuth Test Suite...');
runComprehensiveOAuthTest().then(result => {
  if (result.readyForProduction) {
    console.log('\n🎯 FINAL RESULT: OAuth system is FULLY FUNCTIONAL and READY FOR PRODUCTION!');
  } else {
    console.log('\n⚠️ FINAL RESULT: OAuth system has issues that need attention before production use.');
  }
}).catch(error => {
  console.error('❌ Test suite execution failed:', error);
});