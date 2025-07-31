#!/usr/bin/env python3
"""
Session Fix Commands JavaScript Module
Creates console commands that can fix authentication issues
"""

SESSION_FIX_CONTENT = '''
// Session Fix Commands - Available in browser console
// Usage: fixSessionNow(), testAuthenticatedSession(), etc.

class SessionFixCommands {
  static async fixSessionNow() {
    console.log('🔧 Starting comprehensive session fix...');
    
    try {
      // Step 1: Check current session status
      const statusResponse = await fetch('/api/auth/status');
      const status = await statusResponse.json();
      console.log('📊 Current auth status:', status);
      
      // Step 2: Try session fix endpoint
      const fixResponse = await fetch('/api/auth/fix-session', { method: 'POST' });
      const fixResult = await fixResponse.json();
      console.log('🔧 Session fix result:', fixResult);
      
      // Step 3: Check if tokens exist in environment
      const configResponse = await fetch('/api/auth/test-oauth-config');
      const config = await configResponse.json();
      console.log('🔑 OAuth config:', config);
      
      // Step 4: If we have tokens but no session, try to restore
      if (config.hasAccessToken && !status.authenticated) {
        console.log('🔄 Attempting session restoration...');
        const restoreResponse = await fetch('/api/auth/restore-session', { method: 'POST' });
        const restoreResult = await restoreResponse.json();
        console.log('✨ Session restoration result:', restoreResult);
      }
      
      // Step 5: Final status check
      const finalStatus = await fetch('/api/auth/status');
      const final = await finalStatus.json();
      console.log('✅ Final auth status:', final);
      
      if (final.authenticated) {
        console.log('🎉 Authentication fixed successfully!');
        window.location.reload();
      } else {
        console.log('⚠️ Authentication still requires attention');
        console.log('💡 Try: forceGoogleOAuth() for fresh authentication');
      }
      
    } catch (error) {
      console.error('❌ Session fix error:', error);
    }
  }
  
  static async testAuthenticatedSession() {
    console.log('🧪 Testing authenticated session...');
    
    try {
      // Test various auth endpoints
      const endpoints = [
        '/api/auth/status',
        '/api/auth/quick-diag',
        '/api/events',
        '/api/auth/test-calendar-access'
      ];
      
      for (const endpoint of endpoints) {
        console.log(`🔍 Testing ${endpoint}...`);
        const response = await fetch(endpoint);
        const result = await response.json();
        console.log(`📡 ${endpoint} (${response.status}):`, result);
      }
      
    } catch (error) {
      console.error('❌ Session test error:', error);
    }
  }
  
  static async clearAuthenticationData() {
    console.log('🧹 Clearing authentication data...');
    
    try {
      // Clear all possible auth storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies (if accessible)
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      console.log('✅ Local authentication data cleared');
      console.log('💡 Use forceGoogleOAuth() to start fresh authentication');
      
    } catch (error) {
      console.error('❌ Clear auth data error:', error);
    }
  }
  
  static forceGoogleOAuth() {
    console.log('🔄 Forcing fresh Google OAuth...');
    window.location.href = '/api/auth/google';
  }
  
  static async runDiagnostics() {
    console.log('🚨 Running comprehensive diagnostics...');
    
    try {
      const diagResponse = await fetch('/api/auth/quick-diag');
      const diag = await diagResponse.json();
      
      console.log('📊 Full Diagnostics:', diag);
      
      // Show user-friendly summary
      const summary = `
Session: ${diag.session?.exists ? '✅ Exists' : '❌ Missing'}
User: ${diag.session?.user ? `✅ ${diag.session.user.email}` : '❌ None'}
Tokens: ${diag.environment?.hasAccessToken ? '✅ Present' : '❌ Missing'}
Recommendations: ${diag.recommendations?.join(', ') || 'None'}
      `.trim();
      
      console.log('📋 Summary:', summary);
      
      if (!diag.session?.user) {
        console.log('🔧 No user found, running automatic fix...');
        await this.fixSessionNow();
      }
      
    } catch (error) {
      console.error('❌ Diagnostics error:', error);
    }
  }
}

// Make commands globally available
window.fixSessionNow = () => SessionFixCommands.fixSessionNow();
window.testAuthenticatedSession = () => SessionFixCommands.testAuthenticatedSession();
window.clearAuthenticationData = () => SessionFixCommands.clearAuthenticationData();
window.forceGoogleOAuth = () => SessionFixCommands.forceGoogleOAuth();
window.runDiagnostics = () => SessionFixCommands.runDiagnostics();

// Display available commands
console.log('🛠️ Session fix commands available:');
console.log('  fixSessionNow() - Fix authentication session');
console.log('  testAuthenticatedSession() - Test and debug session');
console.log('  clearAuthenticationData() - Clear all auth data');
console.log('  forceGoogleOAuth() - Force fresh OAuth');
console.log('  runDiagnostics() - Run comprehensive diagnostics');

export { SessionFixCommands };
'''

def create_session_fix_commands():
    """Create the session fix commands file"""
    from pathlib import Path
    
    # Create the utils directory if it doesn't exist
    utils_dir = Path('client/src/utils')
    utils_dir.mkdir(parents=True, exist_ok=True)
    
    # Write the session fix commands
    session_file = utils_dir / 'sessionFixCommands.ts'
    session_file.write_text(SESSION_FIX_CONTENT, encoding='utf-8')
    
    print("✅ Created session fix commands")
    return str(session_file)

if __name__ == "__main__":
    create_session_fix_commands()