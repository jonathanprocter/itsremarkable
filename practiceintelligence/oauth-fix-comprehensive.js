/**
 * Comprehensive OAuth Fix Script
 * This script provides a complete solution for the OAuth authentication issues
 */

async function fixOAuthIssues() {
  console.log('=== COMPREHENSIVE OAUTH FIX ===');
  
  // Step 1: Test current OAuth URL generation
  console.log('\n1. Testing current OAuth URL generation...');
  
  try {
    const response = await fetch('/api/auth/google', {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (response.status === 302) {
      const location = response.headers.get('Location');
      console.log('✅ OAuth URL generated:', location);
      
      if (location && location.includes('accounts.google.com')) {
        console.log('✅ OAuth URL is correctly pointing to Google');
        
        // Parse the OAuth URL
        const url = new URL(location);
        const redirectUri = url.searchParams.get('redirect_uri');
        const clientId = url.searchParams.get('client_id');
        const scope = url.searchParams.get('scope');
        
        console.log('🔗 Redirect URI:', redirectUri);
        console.log('🔑 Client ID:', clientId);
        console.log('📋 Scopes:', scope);
        
        // Check if redirect URI matches current domain
        const currentDomain = window.location.origin;
        const expectedCallbackUrl = `${currentDomain}/api/auth/callback`;
        
        if (redirectUri === expectedCallbackUrl) {
          console.log('✅ Redirect URI matches current domain');
        } else {
          console.log('❌ Redirect URI mismatch:');
          console.log('   OAuth URL uses:', redirectUri);
          console.log('   Expected:', expectedCallbackUrl);
        }
        
      } else {
        console.log('❌ OAuth URL is not pointing to Google');
      }
    } else {
      console.log('❌ OAuth URL generation failed with status:', response.status);
    }
    
    // Step 2: Test callback route
    console.log('\n2. Testing callback route...');
    const callbackTest = await fetch('/api/auth/callback?test=true', {
      method: 'GET'
    });
    
    if (callbackTest.status === 302) {
      console.log('✅ Callback route is accessible');
    } else {
      console.log('❌ Callback route issue, status:', callbackTest.status);
    }
    
    // Step 3: Manual OAuth flow test
    console.log('\n3. Attempting manual OAuth flow...');
    
    // Get fresh OAuth URL
    const oauthResponse = await fetch('/api/auth/google', {
      method: 'GET',
      redirect: 'manual'
    });
    
    if (oauthResponse.status === 302) {
      const oauthUrl = oauthResponse.headers.get('Location');
      
      console.log('🔗 Opening OAuth URL in popup for manual test...');
      
      // Open OAuth URL in a popup
      const popup = window.open(oauthUrl, 'oauth', 'width=600,height=700');
      
      if (popup) {
        console.log('✅ OAuth popup opened successfully');
        console.log('👆 Please complete the OAuth flow in the popup window');
        
        // Monitor popup for completion
        const popupMonitor = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(popupMonitor);
              console.log('🔄 OAuth popup closed, checking auth status...');
              
              setTimeout(async () => {
                const statusResponse = await fetch('/api/auth/status');
                const statusData = await statusResponse.json();
                
                if (statusData.hasValidTokens) {
                  console.log('✅ OAuth flow completed successfully!');
                  console.log('📊 Auth status:', statusData);
                } else {
                  console.log('❌ OAuth flow did not complete successfully');
                  console.log('📊 Auth status:', statusData);
                }
              }, 2000);
            }
          } catch (e) {
            // Ignore cross-origin errors
          }
        }, 1000);
        
        // Auto-close monitor after 5 minutes
        setTimeout(() => {
          clearInterval(popupMonitor);
          if (!popup.closed) {
            popup.close();
          }
        }, 300000);
        
      } else {
        console.log('❌ Could not open OAuth popup (popup blocker?)');
      }
    }
    
  } catch (error) {
    console.error('❌ OAuth fix failed:', error);
  }
}

// Provide additional debugging functions
window.testOAuthDirectly = async function() {
  console.log('=== DIRECT OAUTH TEST ===');
  
  const response = await fetch('/api/auth/google', {
    method: 'GET',
    redirect: 'manual'
  });
  
  if (response.status === 302) {
    const location = response.headers.get('Location');
    console.log('OAuth URL:', location);
    
    // Navigate directly to OAuth URL
    window.location.href = location;
  } else {
    console.log('OAuth URL generation failed:', response.status);
  }
};

window.checkAuthStatus = async function() {
  console.log('=== AUTH STATUS CHECK ===');
  
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    console.log('Auth Status:', data);
    
    if (!data.hasValidTokens) {
      console.log('❌ No valid tokens found');
      console.log('🔧 Try running: testOAuthDirectly()');
    } else {
      console.log('✅ Valid tokens found');
    }
  } catch (error) {
    console.error('Status check failed:', error);
  }
};

// Run the comprehensive fix
fixOAuthIssues();

// Provide manual commands
console.log('\n=== MANUAL COMMANDS AVAILABLE ===');
console.log('testOAuthDirectly() - Test OAuth flow directly');
console.log('checkAuthStatus() - Check current auth status');
console.log('fixOAuthIssues() - Run comprehensive fix again');