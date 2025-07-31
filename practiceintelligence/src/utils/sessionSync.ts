/**
 * Session Synchronization Utility
 * Handles session cookie issues and authentication sync
 */

export class SessionSync {
  static async forceSessionSync(): Promise<boolean> {
    console.log('🔄 FORCE SESSION SYNC: Starting...');
    
    try {
      // Step 1: Clear all session cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      console.log('🔄 Cleared all session cookies');
      
      // Step 2: Force page reload to get fresh session
      console.log('🔄 Forcing page reload to establish fresh session...');
      window.location.reload();
      
      return true;
      
    } catch (error) {
      console.error('❌ Session sync failed:', error);
      return false;
    }
  }
  
  static async startGoogleOAuth(): Promise<boolean> {
    console.log('🔄 GOOGLE OAUTH: Starting fresh OAuth flow...');
    
    try {
      // Direct redirect to Google OAuth
      window.location.href = '/api/auth/google';
      return true;
      
    } catch (error) {
      console.error('❌ Google OAuth failed:', error);
      return false;
    }
  }
  
  static async testAllSessions(): Promise<void> {
    console.log('🔍 TESTING ALL SESSIONS: Starting comprehensive test...');
    
    try {
      // Test current session
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      const data = await response.json();
      console.log('🔍 Current session test:', data);
      
      // If not authenticated, recommend OAuth
      if (!data.isAuthenticated) {
        console.log('🔍 Recommendation: Start fresh Google OAuth flow');
        console.log('🔍 You can click "Force Google Reconnect" or run SessionSync.startGoogleOAuth()');
      }
      
    } catch (error) {
      console.error('❌ Session test failed:', error);
    }
  }
}

// Make available globally for debugging
(window as any).SessionSync = SessionSync;