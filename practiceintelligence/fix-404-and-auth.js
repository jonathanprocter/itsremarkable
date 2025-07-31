/**
 * Fix 404 Error and Authentication Issue
 * This script will resolve both the 404 error and authentication problems
 */

async function fix404AndAuth() {
  console.log('🔧 Starting 404 and Authentication Fix...');
  
  // Step 1: Check if we're actually getting a 404 or if it's an authentication issue
  console.log('📊 Step 1: Checking current page status...');
  
  // Check if the page is actually loading
  const hasContent = document.body && document.body.textContent.length > 0;
  const has404Text = document.body && document.body.textContent.includes('404');
  
  console.log('Page Status:', {
    hasContent,
    has404Text,
    currentPath: window.location.pathname,
    bodyLength: document.body ? document.body.textContent.length : 0
  });
  
  // Step 2: If we have a 404 page, it means React is working but routing failed
  if (has404Text) {
    console.log('⚠️ React router showing 404 page');
    console.log('🔄 Redirecting to root path...');
    
    // Clear any URL parameters and redirect to root
    window.location.href = '/';
    return;
  }
  
  // Step 3: Check authentication status
  console.log('🔍 Step 3: Checking authentication status...');
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log('Authentication Status:', {
      isAuthenticated: authData.isAuthenticated,
      hasValidTokens: authData.hasValidTokens,
      userEmail: authData.user?.email || 'none'
    });
    
    // Step 4: If not authenticated, start OAuth flow
    if (!authData.isAuthenticated) {
      console.log('❌ User is not authenticated');
      console.log('🚀 Starting OAuth authentication flow...');
      
      // Create a visible message for the user
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4285f4;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;
      message.textContent = 'Redirecting to Google Authentication...';
      document.body.appendChild(message);
      
      // Redirect to OAuth after a short delay
      setTimeout(() => {
        window.location.href = '/api/auth/google';
      }, 2000);
      
      return;
    }
    
    // Step 5: If authenticated but no tokens, try force fix
    if (authData.isAuthenticated && !authData.hasValidTokens) {
      console.log('⚠️ Authenticated but no valid tokens');
      console.log('🔄 Attempting to force authentication fix...');
      
      try {
        const forceResponse = await fetch('/api/auth/force-fix', { method: 'POST' });
        const forceData = await forceResponse.json();
        
        if (forceData.success) {
          console.log('✅ Authentication fix successful');
          console.log('🔄 Reloading page...');
          window.location.reload();
        } else {
          console.log('❌ Force fix failed, redirecting to OAuth...');
          window.location.href = '/api/auth/google';
        }
      } catch (forceError) {
        console.log('❌ Force fix request failed, redirecting to OAuth...');
        window.location.href = '/api/auth/google';
      }
      
      return;
    }
    
    // Step 6: If authentication is good, check if page needs refresh
    if (authData.isAuthenticated && authData.hasValidTokens) {
      console.log('✅ Authentication is working properly');
      console.log('🔄 Refreshing page to load calendar data...');
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Authentication check failed:', error);
    console.log('🔗 Fallback: Redirecting to OAuth...');
    window.location.href = '/api/auth/google';
  }
}

// Run the fix immediately
fix404AndAuth();

// Also make it available globally
window.fix404AndAuth = fix404AndAuth;