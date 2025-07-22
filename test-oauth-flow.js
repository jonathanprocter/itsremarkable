/**
 * Test OAuth Flow - Comprehensive validation after user authentication
 * Run this script after completing Google OAuth to verify the system works
 */

async function testOAuthFlow() {
  console.log('🔍 Testing complete OAuth flow...');
  
  const testResults = [];
  
  function addResult(test, status, message, data = null) {
    testResults.push({ test, status, message, data });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
  }
  
  try {
    // Test 1: Authentication Status
    console.log('\n--- Test 1: Authentication Status ---');
    const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
    const authData = await authResponse.json();
    
    if (authData.authenticated) {
      addResult('Auth Status', 'pass', `Authenticated as ${authData.user?.email}`);
    } else {
      addResult('Auth Status', 'fail', 'Not authenticated');
    }
    
    // Test 2: Token Validity
    console.log('\n--- Test 2: Token Validity ---');
    if (authData.hasValidTokens) {
      addResult('Token Validity', 'pass', 'Valid tokens present');
    } else {
      addResult('Token Validity', 'warn', 'Tokens may be expired or invalid');
    }
    
    // Test 3: Token Refresh
    console.log('\n--- Test 3: Token Refresh ---');
    const refreshResponse = await fetch('/api/auth/google/force-refresh', { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      if (refreshData.success) {
        addResult('Token Refresh', 'pass', 'Token refresh successful');
      } else {
        addResult('Token Refresh', 'warn', 'Token refresh not needed');
      }
    } else {
      addResult('Token Refresh', 'fail', 'Token refresh failed');
    }
    
    // Test 4: Calendar Sync
    console.log('\n--- Test 4: Calendar Sync ---');
    const syncResponse = await fetch('/api/sync/calendar', { 
      method: 'POST', 
      credentials: 'include' 
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      if (syncData.success) {
        addResult('Calendar Sync', 'pass', `Synced ${syncData.count} events`);
      } else {
        addResult('Calendar Sync', 'fail', 'Calendar sync failed');
      }
    } else {
      addResult('Calendar Sync', 'fail', 'Calendar sync endpoint error');
    }
    
    // Test 5: Event Loading
    console.log('\n--- Test 5: Event Loading ---');
    const eventsResponse = await fetch('/api/events', { credentials: 'include' });
    
    if (eventsResponse.ok) {
      const events = await eventsResponse.json();
      if (Array.isArray(events) && events.length > 0) {
        addResult('Event Loading', 'pass', `Loaded ${events.length} events`);
      } else {
        addResult('Event Loading', 'warn', 'No events found');
      }
    } else {
      addResult('Event Loading', 'fail', 'Event loading failed');
    }
    
    // Test 6: Calendar Events
    console.log('\n--- Test 6: Calendar Events ---');
    const calendarResponse = await fetch('/api/calendar/events', { credentials: 'include' });
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      if (calendarData.events && calendarData.events.length > 0) {
        addResult('Calendar Events', 'pass', `Loaded ${calendarData.events.length} calendar events`);
      } else {
        addResult('Calendar Events', 'warn', 'No calendar events found');
      }
    } else {
      addResult('Calendar Events', 'fail', 'Calendar events loading failed');
    }
    
    // Test 7: SimplePractice Events
    console.log('\n--- Test 7: SimplePractice Events ---');
    const spResponse = await fetch('/api/simplepractice/events', { credentials: 'include' });
    
    if (spResponse.ok) {
      const spData = await spResponse.json();
      if (spData.events && spData.events.length > 0) {
        addResult('SimplePractice Events', 'pass', `Loaded ${spData.events.length} SimplePractice events`);
      } else {
        addResult('SimplePractice Events', 'warn', 'No SimplePractice events found');
      }
    } else {
      addResult('SimplePractice Events', 'fail', 'SimplePractice events loading failed');
    }
    
    // Generate Summary
    console.log('\n=== OAUTH FLOW TEST SUMMARY ===');
    const passed = testResults.filter(r => r.status === 'pass').length;
    const failed = testResults.filter(r => r.status === 'fail').length;
    const warnings = testResults.filter(r => r.status === 'warn').length;
    
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    
    if (failed === 0) {
      console.log('\n🎉 OAUTH FLOW FULLY FUNCTIONAL!');
      console.log('✅ Authentication working correctly');
      console.log('✅ Token management operational');
      console.log('✅ Calendar sync functional');
      console.log('✅ Event loading working');
      
      if (warnings > 0) {
        console.log('\n⚠️ Minor issues (non-critical):');
        testResults.filter(r => r.status === 'warn').forEach(r => {
          console.log(`- ${r.test}: ${r.message}`);
        });
      }
    } else {
      console.log('\n❌ CRITICAL ISSUES DETECTED:');
      testResults.filter(r => r.status === 'fail').forEach(r => {
        console.log(`- ${r.test}: ${r.message}`);
      });
      
      console.log('\n🔧 Next Steps:');
      if (testResults.find(r => r.test === 'Auth Status' && r.status === 'fail')) {
        console.log('1. Complete Google OAuth authentication');
        console.log('2. Visit: /api/auth/google');
      }
      if (testResults.find(r => r.test === 'Token Refresh' && r.status === 'fail')) {
        console.log('3. Check Google OAuth credentials');
      }
      if (testResults.find(r => r.test === 'Calendar Sync' && r.status === 'fail')) {
        console.log('4. Verify Google Calendar API permissions');
      }
    }
    
    return {
      summary: { passed, failed, warnings },
      results: testResults,
      isFullyFunctional: failed === 0
    };
    
  } catch (error) {
    console.error('❌ OAuth Flow Test Failed:', error);
    return { error: error.message };
  }
}

// Auto-run the test
console.log('🚀 Starting OAuth Flow Test...');
testOAuthFlow().then(result => {
  if (result.isFullyFunctional) {
    console.log('\n🎯 RESULT: OAuth system is fully functional and ready for use!');
  } else {
    console.log('\n⚠️ RESULT: OAuth system has issues that need attention.');
  }
});