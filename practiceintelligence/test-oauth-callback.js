/**
 * Test script to verify OAuth callback routes are working
 */

async function testOAuthCallback() {
  console.log('🧪 Testing OAuth callback routes...\n');
  
  try {
    // Test 1: Check if callback route exists
    console.log('1. Testing callback route accessibility...');
    const callbackResponse = await fetch('/api/auth/callback');
    console.log('✅ Callback route status:', callbackResponse.status);
    
    // Test 2: Check auth status
    console.log('\n2. Checking current auth status...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    console.log('✅ Auth status:', authData);
    
    // Test 3: Generate OAuth URL
    console.log('\n3. Testing OAuth URL generation...');
    const oauthResponse = await fetch('/api/auth/google');
    console.log('✅ OAuth redirect status:', oauthResponse.status);
    
    // Test 4: Check current domain
    console.log('\n4. Current domain info...');
    console.log('✅ Current domain:', window.location.hostname);
    console.log('✅ Current protocol:', window.location.protocol);
    console.log('✅ Full callback URL:', window.location.origin + '/api/auth/callback');
    
    console.log('\n📋 Summary:');
    console.log('- Callback route: ' + (callbackResponse.status === 302 ? '✅ Working' : '❌ Failed'));
    console.log('- Auth status: ' + (authResponse.ok ? '✅ Working' : '❌ Failed'));
    console.log('- OAuth redirect: ' + (oauthResponse.status === 302 ? '✅ Working' : '❌ Failed'));
    
    console.log('\n🔗 Use this callback URL in Google Cloud Console:');
    console.log(window.location.origin + '/api/auth/callback');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testOAuthCallback();
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = { testOAuthCallback };
}