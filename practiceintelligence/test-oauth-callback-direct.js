
console.log('🧪 Testing OAuth callback route directly...');

async function testOAuthCallback() {
  try {
    // Test 1: Verify the callback route exists and responds
    const testResponse = await fetch('/api/test-routing');
    const testData = await testResponse.json();
    console.log('✅ API routing test:', testData);

    // Test 2: Test the callback route with a fake code parameter
    const callbackTestUrl = '/api/auth/callback?code=test123&state=test';
    console.log('🔍 Testing callback route:', callbackTestUrl);
    
    const callbackResponse = await fetch(callbackTestUrl, {
      redirect: 'manual' // Don't follow redirects
    });
    
    console.log('📊 Callback route response:', {
      status: callbackResponse.status,
      statusText: callbackResponse.statusText,
      headers: Object.fromEntries(callbackResponse.headers.entries())
    });

    if (callbackResponse.status === 302) {
      console.log('✅ OAuth callback route is responding with redirect (as expected)');
      const location = callbackResponse.headers.get('location');
      console.log('🔗 Redirect location:', location);
    } else {
      console.log('❌ Unexpected response from callback route');
    }

  } catch (error) {
    console.error('❌ OAuth callback test failed:', error);
  }
}

// Run the test
testOAuthCallback();
