
// Session persistence fix utility
export class SessionPersistenceFix {
  static async fixSessionNow() {
    try {
      console.log('🔧 Fixing authentication session...');
      
      const response = await fetch('/api/auth/force-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      console.log('✅ Session fix result:', result);
      
      // Refresh the page to apply the fix
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Session fix error:', error);
    }
  }
  
  static async testAuthenticatedSession() {
    try {
      console.log('🧪 Testing authenticated session...');
      
      const authResponse = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      const authData = await authResponse.json();
      console.log('🔍 Auth status:', authData);
      
      const eventsResponse = await fetch('/api/events', {
        credentials: 'include'
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        console.log('✅ Events loaded successfully:', eventsData.length);
      } else {
        console.log('❌ Events failed to load:', eventsResponse.status);
      }
      
    } catch (error) {
      console.error('❌ Session test error:', error);
    }
  }
  
  static async clearAuthenticationData() {
    try {
      console.log('🧹 Clearing authentication data...');
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear any local storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ Authentication data cleared');
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Clear auth error:', error);
    }
  }
  
  static async forceGoogleOAuth() {
    try {
      console.log('🔐 Forcing fresh Google OAuth...');
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('❌ OAuth redirect error:', error);
    }
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).fixSessionNow = SessionPersistenceFix.fixSessionNow;
  (window as any).testAuthenticatedSession = SessionPersistenceFix.testAuthenticatedSession;
  (window as any).clearAuthenticationData = SessionPersistenceFix.clearAuthenticationData;
  (window as any).forceGoogleOAuth = SessionPersistenceFix.forceGoogleOAuth;
  
  (window as any).runDiagnostics = async () => {
    console.log('🔧 Running comprehensive diagnostics...');
    await SessionPersistenceFix.testAuthenticatedSession();
    console.log('📊 Diagnostics complete');
  };
}
