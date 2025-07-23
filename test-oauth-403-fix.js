
// Test OAuth 403 Fix - Run in browser console
async function testOAuth403Fix() {
  console.log('🔍 Testing OAuth 403 Fix...');

  try {
    // Step 1: Check current auth status
    const statusResponse = await fetch('/api/auth/status');
    const status = await statusResponse.json();
    console.log('📊 Current auth status:', status);

    // Step 2: Try calendar sync to see specific error
    console.log('🔄 Testing calendar sync...');
    const syncResponse = await fetch('/api/calendar/sync');
    const syncResult = await syncResponse.json();
    
    if (syncResponse.status === 403) {
      console.error('❌ 403 Error Details:', syncResult);
      console.log('🔧 This confirms Google Cloud Console needs configuration');
      console.log('📋 Check OAuth consent screen publishing status');
    } else {
      console.log('✅ Calendar sync response:', syncResult);
    }

    // Step 3: Check if we can force a new OAuth flow
    console.log('🔄 Testing fresh OAuth flow...');
    const authUrl = '/api/auth/google';
    console.log('🔗 OAuth URL:', window.location.origin + authUrl);
    
    // Open in new tab to test
    const authWindow = window.open(authUrl, '_blank', 'width=500,height=600');
    console.log('🪟 Opened OAuth window - complete flow and check results');

    return {
      currentAuth: status,
      syncTest: syncResult,
      recommendation: syncResponse.status === 403 ? 
        'Google Cloud Console configuration required' : 
        'OAuth may be working - check specific error details'
    };

  } catch (error) {
    console.error('❌ OAuth test failed:', error);
    return { error: error.message };
  }
}

// Run the test
testOAuth403Fix().then(result => {
  console.log('🎯 OAuth 403 Test Results:', result);
});
