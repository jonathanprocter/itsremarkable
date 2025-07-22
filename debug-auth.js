/**
 * Authentication Debug Script
 * Run this in the browser console to diagnose authentication issues
 */

async function debugAuthentication() {
  console.log('🔍 Starting authentication debug...');
  
  // Step 1: Check current authentication status
  console.log('Step 1: Checking authentication status...');
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log('Auth Status:', authData);
    
    if (authData.isAuthenticated && authData.hasValidTokens) {
      console.log('✅ Authentication is working perfectly!');
      console.log('🔄 Reloading page to ensure calendar data loads...');
      setTimeout(() => window.location.reload(), 1000);
      return;
    }
    
    // Step 2: Try force authentication fix
    console.log('Step 2: Attempting force authentication fix...');
    const forceResponse = await fetch('/api/auth/force-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const forceData = await forceResponse.json();
    console.log('Force Fix Result:', forceData);
    
    if (forceData.success) {
      console.log('✅ Authentication fixed successfully!');
      console.log('🔄 Reloading page...');
      setTimeout(() => window.location.reload(), 1000);
      return;
    }
    
    // Step 3: If force fix failed, test OAuth URL
    console.log('Step 3: Testing OAuth URL generation...');
    const oauthResponse = await fetch('/api/auth/google', {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log('OAuth Response Status:', oauthResponse.status);
    
    if (oauthResponse.status === 302) {
      const location = oauthResponse.headers.get('Location');
      console.log('OAuth URL:', location);
      
      if (location && location.includes('accounts.google.com')) {
        console.log('✅ OAuth URL is valid!');
        console.log('🔗 Redirecting to Google OAuth...');
        
        // Show user-friendly message
        const authMsg = document.createElement('div');
        authMsg.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: #4285f4;
          color: white;
          padding: 20px 30px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          z-index: 10000;
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          text-align: center;
          min-width: 300px;
        `;
        authMsg.innerHTML = `
          <div>🔧 Fixing Authentication...</div>
          <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">
            Redirecting to Google OAuth
          </div>
        `;
        document.body.appendChild(authMsg);
        
        setTimeout(() => {
          window.location.href = location;
        }, 2000);
        
      } else {
        console.log('❌ Invalid OAuth URL:', location);
      }
    } else {
      console.log('❌ OAuth URL generation failed');
    }
    
  } catch (error) {
    console.error('❌ Authentication debug failed:', error);
    console.log('🔗 Fallback: Direct OAuth redirect...');
    
    // Show error message and redirect
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #dc3545;
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      font-size: 18px;
      font-weight: bold;
      z-index: 10000;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3);
      text-align: center;
      min-width: 300px;
    `;
    errorMsg.innerHTML = `
      <div>⚠️ Authentication Error</div>
      <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">
        Redirecting to Google OAuth
      </div>
    `;
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
      window.location.href = '/api/auth/google';
    }, 3000);
  }
}

// Run debug immediately
debugAuthentication();

// Also make it available globally
window.debugAuthentication = debugAuthentication;