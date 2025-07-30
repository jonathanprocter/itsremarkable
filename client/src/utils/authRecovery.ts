
// Authentication Recovery System
class AuthRecovery {
  static async attemptRecovery(): Promise<boolean> {
    console.log('🔄 Attempting authentication recovery...');
    
    try {
      // Step 1: Check session status
      const statusResponse = await fetch('/api/auth/status');
      const status = await statusResponse.json();
      
      if (status.authenticated) {
        console.log('✅ Already authenticated');
        return true;
      }
      
      // Step 2: Try session restoration
      const restoreResponse = await fetch('/api/auth/restore-session', { method: 'POST' });
      const restoreResult = await restoreResponse.json();
      
      if (restoreResult.success) {
        console.log('✅ Session restored successfully');
        return true;
      }
      
      // Step 3: Try session fix
      const fixResponse = await fetch('/api/auth/fix-session', { method: 'POST' });
      const fixResult = await fixResponse.json();
      
      if (fixResult.success) {
        console.log('✅ Session fixed successfully');
        return true;
      }
      
      console.log('⚠️ Manual authentication required');
      return false;
      
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      return false;
    }
  }
  
  static async checkAndRecover(): Promise<boolean> {
    const recovered = await this.attemptRecovery();
    
    if (recovered) {
      // Reload page to refresh authentication state
      window.location.reload();
    }
    
    return recovered;
  }
}

export default AuthRecovery;
