/**
 * Live OAuth Flow Test - Test the actual OAuth flow from start to finish
 */

async function testLiveOAuthFlow() {
  console.log('🔍 Testing live OAuth flow...');
  
  const baseUrl = 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';
  
  // Test 1: Get the OAuth URL
  console.log('\n📍 Test 1: Getting OAuth URL from /api/auth/google');
  try {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 302) {
      const location = response.headers.get('location');
      console.log('✅ OAuth redirect URL:', location);
      
      if (location && location.includes('accounts.google.com')) {
        // Parse the redirect URI from the OAuth URL
        const redirectUriMatch = location.match(/redirect_uri=([^&]+)/);
        if (redirectUriMatch) {
          const redirectUri = decodeURIComponent(redirectUriMatch[1]);
          console.log('🎯 Redirect URI in OAuth URL:', redirectUri);
          
          // Test if the redirect URI endpoint exists
          console.log('\n📍 Test 2: Testing redirect URI endpoint');
          try {
            const callbackResponse = await fetch(redirectUri, {
              method: 'GET'
            });
            console.log('Callback endpoint status:', callbackResponse.status);
            
            if (callbackResponse.status === 200) {
              console.log('✅ Callback endpoint exists and responds');
              const callbackText = await callbackResponse.text();
              console.log('Callback response preview:', callbackText.substring(0, 200) + '...');
            } else {
              console.log('❌ Callback endpoint returns:', callbackResponse.status);
            }
          } catch (callbackError) {
            console.error('❌ Error testing callback endpoint:', callbackError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error getting OAuth URL:', error.message);
  }
  
  // Test 3: Check what happens when we access the callback without a code
  console.log('\n📍 Test 3: Testing callback behavior without code');
  try {
    const directCallbackResponse = await fetch(`${baseUrl}/auth/callback`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('Direct callback status:', directCallbackResponse.status);
    console.log('Direct callback headers:', Object.fromEntries(directCallbackResponse.headers.entries()));
    
    if (directCallbackResponse.status === 302) {
      const location = directCallbackResponse.headers.get('location');
      console.log('Direct callback redirects to:', location);
    }
  } catch (error) {
    console.error('❌ Error testing direct callback:', error.message);
  }
  
  // Test 4: Check the alternative callback route
  console.log('\n📍 Test 4: Testing alternative callback route');
  try {
    const altCallbackResponse = await fetch(`${baseUrl}/api/auth/google/callback`, {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('Alternative callback status:', altCallbackResponse.status);
    console.log('Alternative callback headers:', Object.fromEntries(altCallbackResponse.headers.entries()));
    
    if (altCallbackResponse.status === 302) {
      const location = altCallbackResponse.headers.get('location');
      console.log('Alternative callback redirects to:', location);
    }
  } catch (error) {
    console.error('❌ Error testing alternative callback:', error.message);
  }
  
  console.log('\n📋 OAuth Flow Test Summary:');
  console.log('- OAuth URL should redirect to Google with correct redirect_uri');
  console.log('- Callback endpoint should exist and handle missing code gracefully');
  console.log('- Both /auth/callback and /api/auth/google/callback should work');
  console.log('\nIf any callback returns 404, the OAuth flow will fail with "page not found"');
}

// Run the test
testLiveOAuthFlow();