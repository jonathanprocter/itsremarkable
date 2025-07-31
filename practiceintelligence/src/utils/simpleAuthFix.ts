/**
 * Simple Authentication Fix System
 * Direct approach to fix session synchronization issues
 */

export class SimpleAuthFix {
  static hasAttemptedFix = false;
  
  static async fixAuthenticationNow(): Promise<boolean> {
    console.log('🔧 SIMPLE AUTH FIX: Starting direct authentication fix...');
    
    try {
      // Step 1: Try to get valid session by making a fresh request
      console.log('🔧 Testing current authentication status...');
      const currentStatus = await fetch('/api/auth/status', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (currentStatus.ok) {
        const authData = await currentStatus.json();
        console.log('🔧 Auth status response:', authData);
        
        if (authData.isAuthenticated && authData.user) {
          console.log('✅ SIMPLE AUTH FIX: Backend authentication confirmed!');
          console.log('✅ User:', authData.user.email);
          
          // Force refresh the authentication hook to sync frontend
          if ((window as any).refreshAuth) {
            console.log('🔧 Refreshing authentication hook...');
            await (window as any).refreshAuth();
            
            // Wait for auth hook to process
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Clear and refresh all queries to reload data
          if ((window as any).queryClient) {
            console.log('🔧 Clearing all queries and invalidating cache...');
            (window as any).queryClient.clear();
            try {
              await (window as any).queryClient.invalidateQueries();
            } catch (error) {
              console.error('Error invalidating queries:', error);
            }
            
            // Wait for queries to refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Force page reload to ensure complete synchronization
          console.log('🔧 Forcing page reload to complete authentication sync...');
          window.location.reload();
          
          return true;
        }
      }
      
      // Step 2: If not authenticated, try page reload only once
      if (!SimpleAuthFix.hasReloaded) {
        console.log('🔧 Backend not authenticated, attempting page reload to sync session...');
        SimpleAuthFix.hasReloaded = true;
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        console.log('🔧 Already reloaded once, authentication fix complete');
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ SIMPLE AUTH FIX: Error during authentication fix:', error);
      
      // Last resort: reload the page only once
      if (!SimpleAuthFix.hasReloaded) {
        console.log('🔧 Last resort: Reloading page to fix authentication...');
        SimpleAuthFix.hasReloaded = true;
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
      return false;
    }
  }
  
  private static hasReloaded = false;
  
  static async testAuthenticationStatus(): Promise<{isAuthenticated: boolean; user: any}> {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          isAuthenticated: data.isAuthenticated,
          user: data.user
        };
      }
      
      return { isAuthenticated: false, user: null };
    } catch (error) {
      console.error('❌ Error testing auth status:', error);
      return { isAuthenticated: false, user: null };
    }
  }
}

// Export singleton instance
export const simpleAuthFix = new SimpleAuthFix();