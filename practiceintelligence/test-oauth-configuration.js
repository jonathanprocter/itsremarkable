/**
 * OAuth Configuration Test Script
 * Run this after updating Google Cloud Console OAuth configuration
 */

async function testOAuthConfiguration() {
  console.log('🧪 Testing OAuth Configuration...\n');
  
  try {
    // Test 1: Check current domain and callback URL
    console.log('1. Current domain configuration:');
    console.log('✅ Domain:', window.location.hostname);
    console.log('✅ Protocol:', window.location.protocol);
    console.log('✅ Full origin:', window.location.origin);
    console.log('✅ Required callback URL:', window.location.origin + '/api/auth/callback');
    
    // Test 2: Test OAuth initiation
    console.log('\n2. Testing OAuth initiation...');
    const oauthResponse = await fetch('/api/auth/google', { method: 'GET', redirect: 'manual' });
    console.log('✅ OAuth initiation status:', oauthResponse.status);
    
    if (oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('Location');
      console.log('✅ OAuth redirect URL:', location);
      
      // Parse the OAuth URL to check client ID
      const url = new URL(location);
      const clientId = url.searchParams.get('client_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      
      console.log('✅ Client ID in URL:', clientId);
      console.log('✅ Redirect URI in URL:', redirectUri);
      
      // Verify redirect URI matches current domain
      const expectedRedirectUri = window.location.origin + '/api/auth/callback';
      if (redirectUri === expectedRedirectUri) {
        console.log('✅ Redirect URI matches expected:', redirectUri);
      } else {
        console.log('❌ Redirect URI mismatch:');
        console.log('   Expected:', expectedRedirectUri);
        console.log('   Actual:', redirectUri);
      }
    }
    
    // Test 3: Check authentication status
    console.log('\n3. Current authentication status:');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    console.log('✅ Auth status:', authData);
    
    // Test 4: Test callback endpoint
    console.log('\n4. Testing callback endpoint accessibility:');
    const callbackResponse = await fetch('/api/auth/callback', { method: 'GET', redirect: 'manual' });
    console.log('✅ Callback endpoint status:', callbackResponse.status);
    
    console.log('\n📋 Configuration Checklist:');
    console.log('In Google Cloud Console, make sure:');
    console.log('1. OAuth client ID: ' + (clientId || 'Check OAuth initiation'));
    console.log('2. Authorized redirect URIs includes: ' + (window.location.origin + '/api/auth/callback'));
    console.log('3. Test users includes: jonathan.procter@gmail.com');
    console.log('4. Authorized domains: LEAVE EMPTY (don\'t add kirk.replit.dev)');
    console.log('5. Required APIs enabled: Google Calendar API, Google Drive API');
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  testOAuthConfiguration();
}

// Export for Node.js
if (typeof module !== 'undefined') {
  module.exports = { testOAuthConfiguration };
}