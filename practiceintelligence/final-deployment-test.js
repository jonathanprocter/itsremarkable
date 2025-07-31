/**
 * Final Deployment Test Suite
 * Comprehensive testing before deployment
 */

async function runFinalDeploymentTest() {
  console.log('🚀 Final Deployment Test Suite Starting...');
  
  const tests = [];
  
  // Test 1: Live Sync Endpoint
  console.log('\n1. Testing Live Sync Endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/live-sync/calendar/events?start=2024-01-01T05:00:00.000Z&end=2025-12-31T05:00:00.000Z');
    const data = await response.json();
    
    if (response.ok && data.events && data.events.length > 0) {
      console.log('✅ Live Sync Endpoint: PASS');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Events: ${data.events.length}`);
      console.log(`   - Calendars: ${data.calendars.length}`);
      console.log(`   - Sync Time: ${data.syncTime}`);
      tests.push({ name: 'Live Sync Endpoint', status: 'PASS' });
    } else {
      console.log('❌ Live Sync Endpoint: FAIL');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Error: ${JSON.stringify(data, null, 2)}`);
      tests.push({ name: 'Live Sync Endpoint', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ Live Sync Endpoint: ERROR');
    console.log(`   - Error: ${error.message}`);
    tests.push({ name: 'Live Sync Endpoint', status: 'ERROR' });
  }
  
  // Test 2: Authentication Status
  console.log('\n2. Testing Authentication Status...');
  try {
    const response = await fetch('http://localhost:5000/api/auth/status');
    const data = await response.json();
    
    if (response.ok && data.isAuthenticated) {
      console.log('✅ Authentication Status: PASS');
      console.log(`   - Authenticated: ${data.isAuthenticated}`);
      console.log(`   - Has Tokens: ${data.hasTokens}`);
      tests.push({ name: 'Authentication Status', status: 'PASS' });
    } else {
      console.log('❌ Authentication Status: FAIL');
      console.log(`   - Data: ${JSON.stringify(data, null, 2)}`);
      tests.push({ name: 'Authentication Status', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ Authentication Status: ERROR');
    console.log(`   - Error: ${error.message}`);
    tests.push({ name: 'Authentication Status', status: 'ERROR' });
  }
  
  // Test 3: Regular Events Endpoint
  console.log('\n3. Testing Regular Events Endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/events');
    const data = await response.json();
    
    if (response.ok && Array.isArray(data) && data.length > 0) {
      console.log('✅ Regular Events Endpoint: PASS');
      console.log(`   - Events Count: ${data.length}`);
      tests.push({ name: 'Regular Events Endpoint', status: 'PASS' });
    } else {
      console.log('❌ Regular Events Endpoint: FAIL');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Data: ${JSON.stringify(data, null, 2)}`);
      tests.push({ name: 'Regular Events Endpoint', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ Regular Events Endpoint: ERROR');
    console.log(`   - Error: ${error.message}`);
    tests.push({ name: 'Regular Events Endpoint', status: 'ERROR' });
  }
  
  // Test 4: SimplePractice Events Endpoint
  console.log('\n4. Testing SimplePractice Events Endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/simplepractice/events?start=2024-01-01T05:00:00.000Z&end=2025-12-31T05:00:00.000Z');
    const data = await response.json();
    
    if (response.ok && data.events && data.events.length > 0) {
      console.log('✅ SimplePractice Events Endpoint: PASS');
      console.log(`   - Events Count: ${data.events.length}`);
      tests.push({ name: 'SimplePractice Events Endpoint', status: 'PASS' });
    } else {
      console.log('❌ SimplePractice Events Endpoint: FAIL');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Data: ${JSON.stringify(data, null, 2)}`);
      tests.push({ name: 'SimplePractice Events Endpoint', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ SimplePractice Events Endpoint: ERROR');
    console.log(`   - Error: ${error.message}`);
    tests.push({ name: 'SimplePractice Events Endpoint', status: 'ERROR' });
  }
  
  // Test 5: Calendar Events Endpoint
  console.log('\n5. Testing Calendar Events Endpoint...');
  try {
    const response = await fetch('http://localhost:5000/api/calendar/events?start=2024-01-01T05:00:00.000Z&end=2025-12-31T05:00:00.000Z');
    const data = await response.json();
    
    if (response.ok && data.events && data.events.length > 0) {
      console.log('✅ Calendar Events Endpoint: PASS');
      console.log(`   - Events Count: ${data.events.length}`);
      tests.push({ name: 'Calendar Events Endpoint', status: 'PASS' });
    } else {
      console.log('❌ Calendar Events Endpoint: FAIL');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Data: ${JSON.stringify(data, null, 2)}`);
      tests.push({ name: 'Calendar Events Endpoint', status: 'FAIL' });
    }
  } catch (error) {
    console.log('❌ Calendar Events Endpoint: ERROR');
    console.log(`   - Error: ${error.message}`);
    tests.push({ name: 'Calendar Events Endpoint', status: 'ERROR' });
  }
  
  // Final Summary
  console.log('\n🎯 Final Test Summary:');
  console.log('========================');
  
  const passCount = tests.filter(t => t.status === 'PASS').length;
  const failCount = tests.filter(t => t.status === 'FAIL').length;
  const errorCount = tests.filter(t => t.status === 'ERROR').length;
  
  tests.forEach(test => {
    const icon = test.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.status}`);
  });
  
  console.log(`\n📊 Results: ${passCount} PASS, ${failCount} FAIL, ${errorCount} ERROR`);
  
  if (passCount === tests.length) {
    console.log('🎉 ALL TESTS PASSED - READY FOR DEPLOYMENT!');
    return true;
  } else {
    console.log('⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYMENT');
    return false;
  }
}

// Run the test suite
runFinalDeploymentTest().then(success => {
  if (success) {
    console.log('\n✅ System is FULLY FUNCTIONAL and ready for deployment');
  } else {
    console.log('\n❌ System has issues that need to be resolved');
  }
}).catch(error => {
  console.error('\n💥 Test suite failed:', error);
});