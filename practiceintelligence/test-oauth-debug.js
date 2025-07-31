/**
 * OAuth Debug Test Script
 * This script tests the OAuth flow and debugging
 */

async function testOAuthFlow() {
  console.log('=== OAUTH FLOW DEBUG TEST ===');
  
  try {
    // Test 1: Check OAuth URL generation
    console.log('1. Testing OAuth URL generation...');
    const response = await fetch('/api/auth/google', {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (response.status === 302) {
      const location = response.headers.get('Location');
      console.log('✅ OAuth URL redirect:', location);
      
      if (location && location.includes('accounts.google.com')) {
        console.log('✅ Google OAuth URL is correctly generated');
        
        // Extract redirect URI from the URL
        const url = new URL(location);
        const redirectUri = url.searchParams.get('redirect_uri');
        console.log('🔗 Redirect URI:', redirectUri);
        
        if (redirectUri && redirectUri.includes('/api/auth/callback')) {
          console.log('✅ Redirect URI is correctly configured');
        } else {
          console.log('❌ Redirect URI is incorrect');
        }
        
        // Extract client ID
        const clientId = url.searchParams.get('client_id');
        console.log('🔑 Client ID:', clientId);
        
        // Extract scopes
        const scope = url.searchParams.get('scope');
        console.log('📋 Scopes:', scope);
        
      } else {
        console.log('❌ OAuth URL is not pointing to Google');
      }
    } else {
      console.log('❌ OAuth URL generation failed with status:', response.status);
    }
    
    // Test 2: Check callback route accessibility
    console.log('\n2. Testing callback route accessibility...');
    const callbackResponse = await fetch('/api/auth/callback', {
      method: 'GET'
    });
    
    if (callbackResponse.status === 302) {
      console.log('✅ Callback route is accessible');
    } else {
      console.log('❌ Callback route returned status:', callbackResponse.status);
    }
    
    // Test 3: Check auth status
    console.log('\n3. Testing auth status...');
    const statusResponse = await fetch('/api/auth/status');
    const statusData = await statusResponse.json();
    console.log('📊 Auth status:', statusData);
    
    // Test 4: Check if domain is correctly configured
    console.log('\n4. Testing domain configuration...');
    const domain = window.location.hostname;
    const expectedDomain = 'ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
    
    if (domain === expectedDomain) {
      console.log('✅ Domain matches expected configuration');
    } else {
      console.log('⚠️ Domain mismatch:');
      console.log('   Current:', domain);
      console.log('   Expected:', expectedDomain);
    }
    
  } catch (error) {
    console.error('❌ OAuth debug test failed:', error);
  }
}

// Run the test immediately
testOAuthFlow();

// Also provide manual trigger
window.testOAuthFlow = testOAuthFlow;
console.log('🔧 OAuth debug test loaded. Run testOAuthFlow() to test again.');