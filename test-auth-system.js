/**
 * Comprehensive Authentication System Test
 * Run this in the browser console to test the authentication flow
 */

async function testAuthenticationSystem() {
  console.log('🔄 Testing Authentication System...');
  
  try {
    // Step 1: Check current auth status
    console.log('\n1. Checking current auth status...');
    const authStatus = await fetch('/api/auth/status', {
      credentials: 'include'
    }).then(r => r.json());
    
    console.log('Current auth status:', authStatus);
    
    // Step 2: Test debug endpoint
    console.log('\n2. Testing debug endpoint...');
    const debugResponse = await fetch('/api/auth/google/debug', {
      credentials: 'include'
    }).then(r => r.json());
    
    console.log('Debug response:', debugResponse);
    
    // Step 3: Test Google auth redirect
    console.log('\n3. Testing Google auth redirect...');
    console.log('Visit this URL to test authentication:');
    console.log('http://localhost:5000/api/auth/google');
    
    // Step 4: Test force sync
    console.log('\n4. Testing force sync...');
    try {
      const syncResponse = await fetch('/api/auth/google/force-sync', {
        method: 'POST',
        credentials: 'include'
      }).then(r => r.json());
      
      console.log('Force sync response:', syncResponse);
    } catch (error) {
      console.log('Force sync failed (expected if not authenticated):', error.message);
    }
    
    // Step 5: Check session storage
    console.log('\n5. Checking session storage...');
    const sessionCheck = await fetch('/api/auth/google/test-tokens', {
      credentials: 'include'
    }).then(r => r.json()).catch(e => ({ error: e.message }));
    
    console.log('Session token check:', sessionCheck);
    
    console.log('\n✅ Authentication test completed');
    console.log('To authenticate:');
    console.log('1. Visit: http://localhost:5000/api/auth/google');
    console.log('2. Complete Google OAuth flow');
    console.log('3. Check that you are redirected back with ?auth=success');
    console.log('4. Run this test again to verify authentication worked');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testAuthenticationSystem();
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = { testAuthenticationSystem };
}