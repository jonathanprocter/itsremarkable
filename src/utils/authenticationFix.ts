/**
 * Comprehensive Authentication Fix System
 * Handles session synchronization issues between frontend and backend
 */

export class AuthenticationFix {
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Comprehensive authentication fix that handles session synchronization
   */
  static async fixAuthentication(): Promise<boolean> {
    // Starting comprehensive authentication fix
    
    try {
      // Step 1: Clear all session-related cookies
      await this.clearAllSessionCookies();
      
      // Step 2: Force session recreation
      await this.forceSessionRecreation();
      
      // Step 3: Validate authentication with retries
      const isAuthenticated = await this.validateAuthenticationWithRetries();
      
      if (isAuthenticated) {
        // Authentication fix successful
        return true;
      } else {
        // Authentication fix failed, trying Google OAuth
        return await this.startGoogleOAuth();
      }
      
    } catch (error) {
      // Authentication fix failed
      return false;
    }
  }
  
  /**
   * Clear all session cookies to force fresh session creation
   */
  private static async clearAllSessionCookies(): Promise<void> {
    console.log('🔄 Clearing all session cookies...');
    
    // Clear all cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Clear for all possible paths and domains
      const clearPatterns = [
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.replit.dev`,
        `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`,
      ];
      
      clearPatterns.forEach(pattern => {
        document.cookie = pattern;
      });
    });
    
    // All session cookies cleared
  }
  
  /**
   * Force session recreation by making a fresh request
   */
  private static async forceSessionRecreation(): Promise<void> {
    console.log('🔄 Forcing session recreation...');
    
    try {
      // Make a fresh request to force session creation
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        console.log('✅ Fresh session created');
      } else {
        console.warn('⚠️ Session recreation returned non-OK status:', response.status);
      }
    } catch (error) {
      console.warn('⚠️ Session recreation failed:', error);
    }
  }
  
  /**
   * Validate authentication with retry logic
   */
  private static async validateAuthenticationWithRetries(): Promise<boolean> {
    // Validating authentication with retries
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Auth validation attempt completed
          
          if (data.isAuthenticated && data.user) {
            // Authentication validated successfully
            return true;
          }
        }
        
        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          // Waiting before retry
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
        
      } catch (error) {
        // Auth validation attempt failed
        
        if (attempt < this.MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    
    // All authentication validation attempts failed
    return false;
  }
  
  /**
   * Start Google OAuth flow
   */
  private static async startGoogleOAuth(): Promise<boolean> {
    // Starting Google OAuth flow
    
    try {
      // Redirect to Google OAuth
      window.location.href = '/api/auth/google';
      return true;
    } catch (error) {
      // Google OAuth start failed
      return false;
    }
  }
  
  /**
   * Force page reload after authentication fix
   */
  static forcePageReload(): void {
    console.log('🔄 Forcing page reload...');
    window.location.reload();
  }
  
  /**
   * Test current authentication status
   */
  static async testAuthentication(): Promise<void> {
    // Testing current authentication status
    
    try {
      const response = await fetch('/api/auth/status', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Current authentication status checked
        
        if (data.isAuthenticated) {
          // User is authenticated
        } else {
          // User is not authenticated
          // Recommendations available
        }
      } else {
        // Authentication test failed
      }
    } catch (error) {
      // Authentication test error
    }
  }
}

// Make available globally for debugging
(window as any).AuthenticationFix = AuthenticationFix;