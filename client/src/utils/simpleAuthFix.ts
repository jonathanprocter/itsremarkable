/**
 * Simple Authentication Fix System
 * Handles OAuth token synchronization between browser session and backend
 */

let hasReloaded = false;
let hasAttemptedFix = false;

export interface AuthFixResult {
  success: boolean;
  message: string;
  needsReload?: boolean;
  oauthUrl?: string;
  details?: any;
}

export async function runSimpleAuthFix(): Promise<AuthFixResult> {
  console.log('🔧 Starting simple authentication fix...');
  
  // Prevent multiple simultaneous fix attempts
  if (hasAttemptedFix) {
    console.log('⚠️ Auth fix already attempted, skipping');
    return {
      success: false,
      message: 'Authentication fix already attempted'
    };
  }
  
  hasAttemptedFix = true;
  
  try {
    // Step 1: Check current authentication status
    const authResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    const authData = await authResponse.json();
    console.log('📊 Current auth status:', authData);
    
    if (authData.authenticated && authData.hasValidTokens) {
      console.log('✅ Authentication already working correctly');
      return {
        success: true,
        message: 'Authentication is already working correctly',
        details: authData
      };
    }
    
    // Step 2: Try to run comprehensive OAuth fix
    console.log('🔄 Running comprehensive OAuth fix...');
    const fixResponse = await fetch('/api/auth/comprehensive-fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const fixData = await fixResponse.json();
    
    if (fixResponse.ok && fixData.success) {
      console.log('✅ OAuth fix successful:', fixData.message);
      
      // Test calendar sync after fix
      const syncResponse = await fetch('/api/auth/test-live-sync', {
        credentials: 'include'
      });
      
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        return {
          success: true,
          message: 'Authentication and sync working correctly',
          details: {
            auth: fixData,
            sync: syncData
          }
        };
      }
    }
    
    // Step 3: If OAuth fix failed, try force Google sync
    console.log('🔄 Attempting force Google Calendar sync...');
    const syncResponse = await fetch('/api/auth/force-google-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const syncData = await syncResponse.json();
    
    if (syncResponse.ok && syncData.success) {
      console.log('✅ Force sync successful:', syncData.message);
      return {
        success: true,
        message: 'Google Calendar sync restored successfully',
        details: syncData
      };
    }
    
    // Step 4: If all else fails, need fresh OAuth
    console.log('⚠️ All fixes failed, need fresh OAuth authentication');
    return {
      success: false,
      message: 'Authentication failed - need fresh OAuth',
      oauthUrl: '/api/auth/google',
      details: {
        fixResponse: fixData,
        syncResponse: syncData
      }
    };
    
  } catch (error) {
    console.error('❌ Simple auth fix failed:', error);
    return {
      success: false,
      message: `Authentication fix failed: ${error.message}`,
      oauthUrl: '/api/auth/google'
    };
  } finally {
    // Reset attempt flag after a delay
    setTimeout(() => {
      hasAttemptedFix = false;
    }, 30000); // 30 seconds
  }
}

export async function testAuthenticationStatus(): Promise<{
  authenticated: boolean;
  hasValidTokens: boolean;
  needsOAuth: boolean;
  details: any;
}> {
  try {
    const response = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    const data = await response.json();
    
    return {
      authenticated: data.authenticated || false,
      hasValidTokens: data.hasValidTokens || false,
      needsOAuth: !data.authenticated || !data.hasValidTokens,
      details: data
    };
  } catch (error) {
    console.error('❌ Failed to check auth status:', error);
    return {
      authenticated: false,
      hasValidTokens: false,
      needsOAuth: true,
      details: { error: error.message }
    };
  }
}

export async function forceCalendarSync(): Promise<{
  success: boolean;
  message: string;
  eventCount?: number;
  details?: any;
}> {
  try {
    const response = await fetch('/api/auth/force-google-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      return {
        success: true,
        message: data.message,
        eventCount: data.summary?.totalEventsSaved || 0,
        details: data
      };
    } else {
      return {
        success: false,
        message: data.message || 'Calendar sync failed',
        details: data
      };
    }
  } catch (error) {
    console.error('❌ Force calendar sync failed:', error);
    return {
      success: false,
      message: `Calendar sync failed: ${error.message}`
    };
  }
}