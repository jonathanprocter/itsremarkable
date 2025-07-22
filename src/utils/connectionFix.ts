
// Connection Recovery Utility
export class ConnectionFix {
  private static retryCount = 0;
  private static readonly MAX_RETRIES = 3;

  static async forceConnection(): Promise<boolean> {
    console.log('🔄 FORCING CONNECTION RECOVERY...');
    
    try {
      // Step 1: Try deployment fix
      const deploymentResponse = await fetch('/api/auth/deployment-fix', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (deploymentResponse.ok) {
        const result = await deploymentResponse.json();
        if (result.success) {
          console.log('✅ Connection recovered via deployment fix');
          return true;
        }
      }

      // Step 2: Try simple login
      const loginResponse = await fetch('/api/auth/simple-login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (loginResponse.ok) {
        console.log('✅ Connection recovered via simple login');
        return true;
      }

      // Step 3: Force reload if all else fails
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        console.log(`⚠️ Connection recovery attempt ${this.retryCount}/${this.MAX_RETRIES}`);
        setTimeout(() => window.location.reload(), 2000);
        return false;
      }

      console.error('❌ Connection recovery failed after maximum retries');
      return false;

    } catch (error) {
      console.error('❌ Connection recovery error:', error);
      return false;
    }
  }

  static resetRetryCount() {
    this.retryCount = 0;
  }
}

// Auto-run connection recovery on load
window.addEventListener('load', () => {
  setTimeout(() => {
    ConnectionFix.forceConnection();
  }, 1000);
});

// Make available globally
(window as any).ConnectionFix = ConnectionFix;
