/**
 * Simple Authentication Test
 * This script tests the authentication flow directly
 */

async function runSimpleAuthTest() {
  console.log('🧪 Running Simple Authentication Test...');
  
  // Step 1: Check if we can access the authentication status
  console.log('📊 Step 1: Checking authentication status...');
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    console.log('✅ Auth status response:', data);
    
    if (!data.hasValidTokens && data.isAuthenticated) {
      console.log('⚠️ User is authenticated but has no valid tokens');
      console.log('🔗 Redirecting to OAuth flow...');
      
      // Redirect to OAuth
      window.location.href = '/api/auth/google';
      return;
    }
    
    if (!data.isAuthenticated) {
      console.log('❌ User is not authenticated');
      console.log('🔗 Redirecting to OAuth flow...');
      
      // Redirect to OAuth
      window.location.href = '/api/auth/google';
      return;
    }
    
    if (data.hasValidTokens) {
      console.log('✅ User has valid tokens - authentication working!');
      console.log('🔄 Refreshing page to load calendar data...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    console.log('🔗 Attempting direct OAuth redirect...');
    window.location.href = '/api/auth/google';
  }
}

// Run the test immediately
runSimpleAuthTest();

// Also make it available globally
window.runSimpleAuthTest = runSimpleAuthTest;