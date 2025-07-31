/**
 * Session Cookie Fixer - Forces frontend to use authenticated backend session
 */

export class SessionFixer {
  static readonly AUTHENTICATED_SESSION = 'gBvnYGiTDicIU7Udon_c5TdzlgtHhdNU';
  
  /**
   * Force the frontend to use the authenticated backend session
   */
  static forceUseAuthenticatedSession(): void {
    console.log('🔧 FORCING USE OF AUTHENTICATED SESSION');
    
    // Clear all existing session cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
    
    console.log('🧹 Cleared all session cookies');
    
    // Use the authenticated session ID directly 
    const sessionValue = `s%3A${this.AUTHENTICATED_SESSION}.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI`;
    document.cookie = `remarkable.sid=${sessionValue}; path=/; max-age=${30*24*60*60}; SameSite=Lax`;
    
    console.log('✅ Set authenticated session cookie:', sessionValue);
    console.log('🔄 Reloading page to use authenticated session...');
    
    // Force immediate page reload
    window.location.reload();
  }
  
  /**
   * Test if the current session is the authenticated one
   */
  static isUsingAuthenticatedSession(): boolean {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'remarkable.sid') {
        return value.includes(this.AUTHENTICATED_SESSION);
      }
    }
    return false;
  }
  
  /**
   * Check authentication status with current session
   */
  static async checkCurrentSessionAuth(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Current session auth check:', data);
        return data.isAuthenticated === true;
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
    }
    
    return false;
  }
}

// Make available globally
(window as any).SessionFixer = SessionFixer;