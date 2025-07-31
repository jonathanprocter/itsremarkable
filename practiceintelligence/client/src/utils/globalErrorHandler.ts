/**
 * Global Error Handler for Unhandled Promise Rejections
 */

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default behavior that would normally crash the app
  event.preventDefault();
});

// Handle general errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Console debugging functions for authentication
if (typeof window !== 'undefined') {
  (window as any).fixSessionNow = async () => {
    try {
      const response = await fetch('/api/auth/force-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log('Fix session result:', result);
      return result;
    } catch (error) {
      console.error('Fix session error:', error);
      return { success: false, error: error.message };
    }
  };

  (window as any).testAuthenticatedSession = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const result = await response.json();
      console.log('Auth status:', result);
      return result;
    } catch (error) {
      console.error('Auth status error:', error);
      return { success: false, error: error.message };
    }
  };

  (window as any).clearAuthenticationData = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    console.log('Authentication data cleared');
    window.location.reload();
  };

  (window as any).forceGoogleOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  (window as any).runDiagnostics = async () => {
    console.log('Running comprehensive diagnostics...');
    
    try {
      const statusResponse = await fetch('/api/auth/status', { credentials: 'include' });
      const status = await statusResponse.json();
      console.log('1. Auth Status:', status);

      const eventsResponse = await fetch('/api/events', { credentials: 'include' });
      console.log('2. Events Response Status:', eventsResponse.status);

      if (eventsResponse.status === 401) {
        console.log('3. Running auto-fix...');
        const fixResult = await (window as any).fixSessionNow();
        console.log('4. Fix Result:', fixResult);

        if (fixResult.success) {
          const retryEventsResponse = await fetch('/api/events', { credentials: 'include' });
          console.log('5. Retry Events Response Status:', retryEventsResponse.status);
        }
      }
    } catch (error) {
      console.error('Diagnostics error:', error);
    }
  };

  console.log('🛠️ Session fix commands available:');
  console.log('  fixSessionNow() - Fix authentication session');
  console.log('  testAuthenticatedSession() - Test and debug session');
  console.log('  clearAuthenticationData() - Clear all auth data');
  console.log('  forceGoogleOAuth() - Force fresh OAuth');
  console.log('  runDiagnostics() - Run comprehensive diagnostics');
}

export {};