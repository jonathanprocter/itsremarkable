/**
 * Authentication Session Fix Utility
 * Automatically detects and fixes authentication session issues
 */

interface AuthFixResult {
  success: boolean;
  message: string;
  user?: any;
  needsReauth?: boolean;
  authUrl?: string;
  requiresReload?: boolean;
}

export async function fixAuthenticationSession(): Promise<AuthFixResult> {
  try {
    console.log('🔧 Attempting to fix authentication session...');
    
    const response = await fetch('/api/auth/fix-session', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Authentication session fixed:', result.message);
      
      // If requires reload, reload the page to refresh authentication state
      if (result.requiresReload) {
        console.log('🔄 Reloading page to apply authentication fix...');
        window.location.reload();
        return result;
      }
      
      return result;
    } else {
      console.log('❌ Authentication fix failed:', result.error);
      
      // If needs reauth, redirect to Google OAuth
      if (result.needsReauth && result.authUrl) {
        console.log('🔄 Redirecting to Google OAuth for fresh authentication...');
        window.location.href = result.authUrl;
        return result;
      }
      
      return result;
    }
  } catch (error) {
    console.error('Authentication fix error:', error);
    return {
      success: false,
      message: `Fix failed: ${error.message}`,
      needsReauth: true,
      authUrl: '/api/auth/google'
    };
  }
}

export async function checkAndFixAuthentication(): Promise<boolean> {
  try {
    // First check current auth status
    const statusResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    const status = await statusResponse.json();
    
    // If not authenticated, try to fix
    if (!status.authenticated && !status.isAuthenticated) {
      console.log('🔍 Authentication issue detected, attempting fix...');
      const fixResult = await fixAuthenticationSession();
      return fixResult.success;
    }
    
    // Already authenticated
    return true;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}

// Make functions available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).fixAuthenticationSession = fixAuthenticationSession;
  (window as any).checkAndFixAuthentication = checkAndFixAuthentication;
}