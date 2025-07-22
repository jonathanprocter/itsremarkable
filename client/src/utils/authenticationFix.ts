/**
 * Authentication Fix Utility
 * Provides comprehensive authentication repair and debugging
 */

export interface AuthFixResult {
  success: boolean;
  requiresAction?: boolean;
  message: string;
  details?: any;
}

export async function runAuthenticationFix(): Promise<AuthFixResult> {
  console.log('🔧 Running authentication fix...');

  try {
    // Step 1: Check current auth status
    const statusResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });

    if (!statusResponse.ok) {
      console.error('❌ Auth status check failed:', statusResponse.status);
      return {
        success: false,
        requiresAction: true,
        message: `Auth status check failed: ${statusResponse.status}`,
        details: { status: statusResponse.status }
      };
    }

    const authStatus = await statusResponse.json();
    console.log('🔍 Current auth status:', authStatus);

    // Step 2: If tokens are expired or invalid, redirect to fresh OAuth
    if (!authStatus.hasValidTokens || authStatus.needsAuth) {
      console.log('🔄 Tokens expired or invalid, need fresh OAuth authentication...');

      return {
        success: false,
        requiresAction: true,
        message: 'Google OAuth tokens have expired. Please re-authenticate.',
        details: {
          error: 'invalid_grant',
          solution: 'Fresh OAuth authentication required',
          redirectUrl: '/api/auth/google'
        }
      };
    }

    // Step 3: Try force authentication fix
    try {
      const forceFixResponse = await fetch('/api/auth/force-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (forceFixResponse.ok) {
        const forceFixResult = await forceFixResponse.json();
        if (forceFixResult.success) {
          console.log('✅ Force authentication fix successful');
          return {
            success: true,
            message: 'Authentication fixed successfully',
            details: forceFixResult
          };
        }
      }
    } catch (forceFixError) {
      console.log('❌ Force fix request failed:', forceFixError);
    }

    // Step 4: If not authenticated or tokens failed, return action required
    if (!authStatus.isAuthenticated || !authStatus.hasValidTokens) {
      return {
        success: false,
        requiresAction: true,
        message: 'Manual Google OAuth authentication required',
        details: {
          isAuthenticated: authStatus.isAuthenticated,
          hasValidTokens: authStatus.hasValidTokens,
          suggestion: 'Use the Google Authentication Fix panel to start OAuth flow'
        }
      };
    }

    // Step 5: If everything looks good, success
    return {
      success: true,
      message: 'Authentication is already working correctly',
      details: authStatus
    };

  } catch (error) {
    console.error('❌ Authentication fix failed:', error);

    return {
      success: false,
      requiresAction: true,
      message: 'Authentication fix failed with error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testGoogleCalendarAccess(): Promise<boolean> {
  try {
    const response = await fetch('/api/calendar/events?start=2025-01-01T00:00:00Z&end=2025-12-31T23:59:59Z', {
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Google Calendar access test failed:', error);
    return false;
  }
}

export async function refreshAuthentication(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh-tokens', {
      method: 'POST',
      credentials: 'include'
    });

    return response.ok;
  } catch (error) {
    console.error('Authentication refresh failed:', error);
    return false;
  }
}