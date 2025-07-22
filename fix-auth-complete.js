/**
 * Complete Authentication Fix Script
 * This script will diagnose and fix all authentication issues
 */

async function fixAuthenticationComplete() {
  console.log('🔧 Starting comprehensive authentication fix...');
  
  // Step 1: Check current authentication status
  console.log('📊 Step 1: Checking authentication status...');
  
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log('Current Authentication Status:', {
      isAuthenticated: authData.isAuthenticated,
      hasValidTokens: authData.hasValidTokens,
      userEmail: authData.user?.email || 'none',
      sessionId: authData.session?.sessionId || 'none'
    });
    
    // If we got environment tokens applied, we're done
    if (authData.hasValidTokens && authData.envTokensApplied) {
      console.log('✅ Authentication already fixed with environment tokens');
      console.log('🔄 Reloading page to apply changes...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      return;
    }
    
    // Step 2: If authenticated but no tokens, try force fix
    if (authData.isAuthenticated && !authData.hasValidTokens) {
      console.log('🔧 Step 2: Attempting force authentication fix...');
      
      const forceResponse = await fetch('/api/auth/force-fix', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const forceData = await forceResponse.json();
      
      if (forceData.success) {
        console.log('✅ Force authentication fix successful');
        console.log('🔄 Reloading page to apply changes...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      } else {
        console.log('❌ Force fix failed:', forceData.error);
      }
    }
    
    // Step 3: If not authenticated or force fix failed, redirect to OAuth
    if (!authData.isAuthenticated || !authData.hasValidTokens) {
      console.log('🔗 Step 3: Redirecting to OAuth authentication...');
      
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
      
      // Redirect to OAuth
      setTimeout(() => {
        window.location.href = '/api/auth/google';
      }, 2000);
      
      return;
    }
    
    // Step 4: If everything looks good, just reload
    console.log('✅ Authentication appears to be working');
    console.log('🔄 Reloading page to ensure proper state...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('❌ Authentication fix failed:', error);
    console.log('🔗 Fallback: Redirecting to OAuth...');
    
    // Create error message
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    errorMessage.textContent = 'Authentication error - redirecting to login...';
    document.body.appendChild(errorMessage);
    
    setTimeout(() => {
      window.location.href = '/api/auth/google';
    }, 3000);
  }
}

// Run the complete fix immediately
fixAuthenticationComplete();

// Also make it available globally
window.fixAuthenticationComplete = fixAuthenticationComplete;