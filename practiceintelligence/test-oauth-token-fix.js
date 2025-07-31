/**
 * Test script to verify OAuth token fix system
 */

async function testOAuthTokenFix() {
  console.log('🔧 Testing OAuth Token Fix System...');
  
  try {
    // Test 1: Test token refresh endpoint
    console.log('📋 Test 1: Testing token refresh endpoint');
    const refreshResponse = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });
    
    const refreshData = await refreshResponse.json();
    console.log('Token refresh result:', refreshData);
    
    if (refreshData.success) {
      console.log('✅ Token refresh successful');
    } else {
      console.log('❌ Token refresh failed:', refreshData.error);
    }
    
    // Test 2: Test authentication fix endpoint
    console.log('\n📋 Test 2: Testing authentication fix endpoint');
    const fixResponse = await fetch('/api/auth/force-fix', {
      method: 'POST',
      credentials: 'include'
    });
    
    const fixData = await fixResponse.json();
    console.log('Authentication fix result:', fixData);
    
    if (fixData.success) {
      console.log('✅ Authentication fix successful');
    } else {
      console.log('❌ Authentication fix failed:', fixData.error);
    }
    
    // Test 3: Test Google Calendar sync
    console.log('\n📋 Test 3: Testing Google Calendar sync');
    const syncResponse = await fetch('/api/auth/google/force-sync', {
      method: 'POST',
      credentials: 'include'
    });
    
    const syncData = await syncResponse.json();
    console.log('Google Calendar sync result:', syncData);
    
    if (syncData.success) {
      console.log(`✅ Google Calendar sync successful: ${syncData.eventsCount} events`);
    } else {
      console.log('❌ Google Calendar sync failed:', syncData.error);
    }
    
    // Test 4: Test authentication status
    console.log('\n📋 Test 4: Testing authentication status');
    const statusResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    const statusData = await statusResponse.json();
    console.log('Authentication status:', statusData);
    
    if (statusData.isAuthenticated && statusData.hasValidTokens) {
      console.log('✅ Authentication status: All systems working');
    } else {
      console.log('❌ Authentication status: Issues detected');
    }
    
    // Summary
    console.log('\n🎯 Test Summary:');
    console.log('- Token refresh:', refreshData.success ? '✅ Working' : '❌ Failed');
    console.log('- Authentication fix:', fixData.success ? '✅ Working' : '❌ Failed');
    console.log('- Google Calendar sync:', syncData.success ? '✅ Working' : '❌ Failed');
    console.log('- Authentication status:', statusData.isAuthenticated && statusData.hasValidTokens ? '✅ Working' : '❌ Issues');
    
    if (refreshData.success && fixData.success && syncData.success && statusData.isAuthenticated && statusData.hasValidTokens) {
      console.log('\n🎉 ALL TESTS PASSED - OAuth Token Fix System is working correctly!');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed - OAuth Token Fix System needs attention');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testOAuthTokenFix().then(success => {
  console.log('\n' + '='.repeat(60));
  console.log(success ? '✅ OAuth Token Fix System: WORKING' : '❌ OAuth Token Fix System: NEEDS ATTENTION');
  console.log('='.repeat(60));
});