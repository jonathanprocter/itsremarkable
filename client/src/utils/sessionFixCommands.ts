/**
 * Session Fix Commands
 * Console commands for debugging and fixing authentication sessions
 */

interface SessionDebugInfo {
  sessionId: string;
  authenticated: boolean;
  user?: any;
  hasTokens: boolean;
  cookies: string[];
  sessionData?: any;
}

// Fix session now - comprehensive session restoration
export async function fixSessionNow(): Promise<boolean> {
  console.log('🔧 FIXING SESSION NOW...');
  
  try {
    // Step 1: Try the backend session fix endpoint
    console.log('Step 1: Calling backend session fix...');
    const fixResponse = await fetch('/api/auth/fix-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const fixResult = await fixResponse.json();
    console.log('Fix session result:', fixResult);

    if (fixResult.success) {
      console.log('✅ Backend session fix successful');
      
      // If requires reload, do it
      if (fixResult.requiresReload) {
        console.log('🔄 Reloading page as requested...');
        setTimeout(() => window.location.reload(), 1000);
        return true;
      }
      
      // Otherwise verify the fix worked
      const statusCheck = await testAuthenticatedSession();
      if (statusCheck.authenticated) {
        console.log('✅ Session fix verified - authentication working');
        return true;
      }
    }

    // Step 2: If backend fix failed, try manual session restoration
    console.log('Step 2: Attempting manual session restoration...');
    const restoreResponse = await fetch('/api/auth/restore-session', {
      method: 'POST',
      credentials: 'include'
    });

    const restoreResult = await restoreResponse.json();
    console.log('Manual restore result:', restoreResult);

    if (restoreResult.success) {
      console.log('✅ Manual session restoration successful');
      setTimeout(() => window.location.reload(), 1000);
      return true;
    }

    // Step 3: If all else fails, force fresh OAuth
    console.log('Step 3: All fixes failed, redirecting to fresh OAuth...');
    window.location.href = '/api/auth/google';
    return false;

  } catch (error) {
    console.error('❌ Session fix failed:', error);
    console.log('🔄 Falling back to fresh OAuth...');
    window.location.href = '/api/auth/google';
    return false;
  }
}

// Test authenticated session - comprehensive session debugging
export async function testAuthenticatedSession(): Promise<SessionDebugInfo> {
  console.log('🧪 TESTING AUTHENTICATED SESSION...');
  
  const debugInfo: Partial<SessionDebugInfo> = {
    cookies: document.cookie.split(';').map(c => c.trim())
  };

  try {
    // Check authentication status
    console.log('Checking /api/auth/status...');
    const statusResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    const statusData = await statusResponse.json();
    console.log('Auth status response:', statusData);
    
    debugInfo.authenticated = statusData.authenticated || statusData.isAuthenticated || false;
    debugInfo.user = statusData.user;
    debugInfo.hasTokens = statusData.hasValidTokens || false;

    // Check debug endpoint for more details
    console.log('Checking /api/auth/debug...');
    const debugResponse = await fetch('/api/auth/debug', {
      credentials: 'include'
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('Auth debug response:', debugData);
      debugInfo.sessionId = debugData.sessionId;
      debugInfo.sessionData = debugData;
    }

    // Log comprehensive session state
    console.log('=== SESSION DEBUG SUMMARY ===');
    console.log('Authenticated:', debugInfo.authenticated);
    console.log('Has user:', !!debugInfo.user);
    console.log('Has tokens:', debugInfo.hasTokens);
    console.log('Session ID:', debugInfo.sessionId);
    console.log('Cookies count:', debugInfo.cookies.length);
    console.log('User email:', debugInfo.user?.email || 'None');
    console.log('===========================');

    return debugInfo as SessionDebugInfo;

  } catch (error) {
    console.error('❌ Session test failed:', error);
    return {
      sessionId: 'unknown',
      authenticated: false,
      hasTokens: false,
      cookies: debugInfo.cookies || []
    };
  }
}

// Clear all authentication data
export async function clearAuthenticationData(): Promise<void> {
  console.log('🧹 CLEARING ALL AUTHENTICATION DATA...');
  
  try {
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    // Call logout endpoint
    await fetch('/api/auth/logout', {
      credentials: 'include'
    });

    console.log('✅ Authentication data cleared');
    setTimeout(() => window.location.reload(), 500);
  } catch (error) {
    console.error('❌ Clear auth data failed:', error);
  }
}

// Force fresh Google OAuth
export function forceGoogleOAuth(): void {
  console.log('🔄 FORCING FRESH GOOGLE OAUTH...');
  window.location.href = '/api/auth/google';
}

// Make functions available globally for console use
if (typeof window !== 'undefined') {
  (window as any).fixSessionNow = fixSessionNow;
  (window as any).testAuthenticatedSession = testAuthenticatedSession;
  (window as any).clearAuthenticationData = clearAuthenticationData;
  (window as any).forceGoogleOAuth = forceGoogleOAuth;
  
  console.log('🛠️ Session fix commands available:');
  console.log('  fixSessionNow() - Fix authentication session');
  console.log('  testAuthenticatedSession() - Test and debug session');
  console.log('  clearAuthenticationData() - Clear all auth data');
  console.log('  forceGoogleOAuth() - Force fresh OAuth');
}