// Google OAuth Authentication Test Script
// Run this in the browser console to test OAuth configuration

console.log('🚀 Testing Google OAuth Configuration...');

// Test current authentication status
fetch('/api/auth/debug')
  .then(response => response.json())
  .then(data => {
    console.log('📊 Current Auth Status:', data);
    
    if (!data.hasClientId || !data.hasClientSecret) {
      console.log('❌ Missing OAuth credentials');
      return;
    }
    
    console.log('✅ OAuth credentials present');
    console.log('🔗 Redirect URI:', data.redirectUri);
    console.log('🌐 Current Domain:', data.currentDomain);
    
    // Test OAuth URL generation
    console.log('🧪 Testing OAuth URL...');
    
    fetch('/api/auth/google', { 
      method: 'GET', 
      redirect: 'manual' 
    })
    .then(response => {
      console.log('📍 OAuth Response Status:', response.status);
      
      if (response.status === 302) {
        const location = response.headers.get('Location');
        console.log('🔗 OAuth Redirect URL:', location);
        
        if (location && location.includes('accounts.google.com')) {
          const url = new URL(location);
          console.log('✅ Valid Google OAuth URL generated');
          console.log('🆔 Client ID in URL:', url.searchParams.get('client_id'));
          console.log('🔄 Redirect URI in URL:', url.searchParams.get('redirect_uri'));
          console.log('📋 Scopes requested:', url.searchParams.get('scope'));
          
          // Check if redirect URI matches what we expect
          const expectedRedirectUri = data.redirectUri;
          const actualRedirectUri = url.searchParams.get('redirect_uri');
          
          if (expectedRedirectUri === actualRedirectUri) {
            console.log('✅ Redirect URI matches configuration');
          } else {
            console.log('❌ Redirect URI mismatch!');
            console.log('  Expected:', expectedRedirectUri);
            console.log('  Actual:', actualRedirectUri);
          }
        } else {
          console.log('❌ Invalid OAuth redirect URL');
        }
      } else {
        console.log('❌ OAuth redirect failed');
      }
    })
    .catch(error => {
      console.error('❌ OAuth URL test failed:', error);
    });
  })
  .catch(error => {
    console.error('❌ Auth debug failed:', error);
  });

// Test manual authentication trigger
setTimeout(() => {
  console.log('\n🔧 You can manually test authentication by visiting:');
  console.log('https://5a6f843f-53cb-48cf-8afc-05f223a337ff-00-3gvxznlnxvdl8.riker.replit.dev/api/auth/google');
  console.log('\n📝 Expected behavior:');
  console.log('1. Redirects to Google login');
  console.log('2. Shows permission request for calendar access');
  console.log('3. Redirects back to app with auth=success');
}, 2000);