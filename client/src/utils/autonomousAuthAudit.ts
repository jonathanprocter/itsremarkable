/**
 * Autonomous Authentication Audit System
 * Automatically detects and fixes authentication synchronization issues
 */

interface AuthAuditResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'FIXED';
  issue?: string;
  action?: string;
  details?: any;
}

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  sessionId: string;
  hasTokens: boolean;
}

export class AutonomousAuthAudit {
  private results: AuthAuditResult[] = [];
  private retryCount = 0;
  private maxRetries = 3;

  async runComprehensiveAudit(): Promise<{ fixed: boolean; results: AuthAuditResult[] }> {
    // Starting Autonomous Authentication Audit
    this.results = [];
    this.retryCount = 0;

    // Step 1: Check backend authentication status
    const backendAuth = await this.checkBackendAuth();
    
    // Step 2: Check frontend authentication state
    const frontendAuth = await this.checkFrontendAuth();
    
    // Step 3: Detect synchronization issues
    const syncIssues = this.detectSyncIssues(backendAuth, frontendAuth);
    
    // Step 4: Auto-fix detected issues
    const fixResults = await this.autoFixIssues(syncIssues);
    
    // Step 5: Verify fixes
    const verifyResults = await this.verifyFixes();
    
    const allFixed = this.results.every(r => r.status === 'PASS' || r.status === 'FIXED');
    
    // Authentication audit completed
    
    return { fixed: allFixed, results: this.results };
  }

  private async checkBackendAuth(): Promise<AuthState> {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        this.results.push({
          component: 'Backend Auth',
          status: 'FAIL',
          issue: `Auth endpoint returned ${response.status}`,
          details: { status: response.status }
        });
        return { isAuthenticated: false, user: null, sessionId: '', hasTokens: false };
      }
      
      const data = await response.json();
      
      this.results.push({
        component: 'Backend Auth',
        status: data.isAuthenticated ? 'PASS' : 'FAIL',
        issue: data.isAuthenticated ? undefined : 'User not authenticated on backend',
        details: data
      });
      
      return {
        isAuthenticated: data.isAuthenticated,
        user: data.user,
        sessionId: data.debug?.sessionId || '',
        hasTokens: !!data.hasTokens
      };
    } catch (error) {
      this.results.push({
        component: 'Backend Auth',
        status: 'FAIL',
        issue: 'Failed to connect to auth endpoint',
        details: { error: error.message }
      });
      return { isAuthenticated: false, user: null, sessionId: '', hasTokens: false };
    }
  }

  private async checkFrontendAuth(): Promise<any> {
    try {
      // Check if useAuthenticatedUser hook is available
      const authHook = (window as any).authHookState;
      
      this.results.push({
        component: 'Frontend Auth Hook',
        status: authHook ? 'PASS' : 'FAIL',
        issue: authHook ? undefined : 'Auth hook state not available',
        details: authHook
      });
      
      return authHook;
    } catch (error) {
      this.results.push({
        component: 'Frontend Auth Hook',
        status: 'FAIL',
        issue: 'Error checking frontend auth state',
        details: { error: error.message }
      });
      return null;
    }
  }

  private detectSyncIssues(backendAuth: AuthState, frontendAuth: any): string[] {
    const issues: string[] = [];
    
    // Check if backend is authenticated but frontend is not
    if (backendAuth.isAuthenticated && (!frontendAuth || !frontendAuth.user)) {
      issues.push('FRONTEND_SYNC_ISSUE');
      this.results.push({
        component: 'Auth Synchronization',
        status: 'FAIL',
        issue: 'Backend authenticated but frontend not synchronized',
        details: { backend: backendAuth.isAuthenticated, frontend: !!frontendAuth?.user }
      });
    }
    
    // Check if tokens are present but frontend queries are failing
    if (backendAuth.hasTokens && backendAuth.isAuthenticated) {
      issues.push('QUERY_SYNC_ISSUE');
      this.results.push({
        component: 'Query Synchronization',
        status: 'FAIL',
        issue: 'Backend has tokens but frontend queries may be failing',
        details: { hasTokens: backendAuth.hasTokens }
      });
    }
    
    return issues;
  }

  private async autoFixIssues(issues: string[]): Promise<void> {
    // Auto-fixing issues
    for (const issue of issues) {
      switch (issue) {
        case 'FRONTEND_SYNC_ISSUE':
          await this.fixFrontendSync();
          break;
        case 'QUERY_SYNC_ISSUE':
          await this.fixQuerySync();
          break;
        default:
          // Unknown issue type
      }
    }
  }

  private async fixFrontendSync(): Promise<void> {
    try {
      console.log('🔧 Fixing frontend authentication synchronization...');
      
      // Force refresh the authentication hook
      if ((window as any).refreshAuth) {
        await (window as any).refreshAuth();
        
        this.results.push({
          component: 'Frontend Sync Fix',
          status: 'FIXED',
          action: 'Refreshed authentication state',
          details: { method: 'refreshAuth()' }
        });
      } else {
        // Fallback: reload the page to re-initialize auth
        this.results.push({
          component: 'Frontend Sync Fix',
          status: 'FIXED',
          action: 'Page reload required for auth sync',
          details: { method: 'page_reload' }
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      this.results.push({
        component: 'Frontend Sync Fix',
        status: 'FAIL',
        issue: 'Failed to fix frontend sync',
        details: { error: error.message }
      });
    }
  }

  private async fixQuerySync(): Promise<void> {
    try {
      console.log('🔧 Fixing query synchronization...');
      
      // Force refresh all queries
      if ((window as any).queryClient) {
        await (window as any).queryClient.invalidateQueries();
        
        this.results.push({
          component: 'Query Sync Fix',
          status: 'FIXED',
          action: 'Invalidated all queries to force refresh',
          details: { method: 'invalidateQueries()' }
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Query Sync Fix',
        status: 'FAIL',
        issue: 'Failed to fix query sync',
        details: { error: error.message }
      });
    }
  }

  private async verifyFixes(): Promise<void> {
    console.log('🔍 Verifying fixes...');
    
    // Wait a moment for fixes to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Re-check backend auth
    const backendAuth = await this.checkBackendAuth();
    
    // Check if events are now loading
    try {
      const eventsResponse = await fetch('/api/events', {
        credentials: 'include'
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        this.results.push({
          component: 'Events Loading',
          status: 'PASS',
          details: { eventCount: eventsData.length || 0 }
        });
      } else {
        this.results.push({
          component: 'Events Loading',
          status: 'FAIL',
          issue: 'Events endpoint still failing',
          details: { status: eventsResponse.status }
        });
      }
    } catch (error) {
      this.results.push({
        component: 'Events Loading',
        status: 'FAIL',
        issue: 'Failed to verify events loading',
        details: { error: error.message }
      });
    }
  }

  // Auto-run the audit when authentication issues are detected
  public async autoDetectAndFix(): Promise<void> {
    // Check if we're in a state where backend is authenticated but frontend is not
    const backendAuth = await this.checkBackendAuth();
    const frontendAuth = await this.checkFrontendAuth();
    
    if (backendAuth.isAuthenticated && (!frontendAuth || !frontendAuth.user)) {
      console.log('🚨 Authentication desync detected - starting auto-fix...');
      const result = await this.runComprehensiveAudit();
      
      if (result.fixed) {
        console.log('✅ Authentication issues automatically resolved');
      } else {
        console.log('❌ Some authentication issues could not be auto-fixed');
        console.log('📊 Audit results:', result.results);
      }
    }
  }
}

// Global instance
export const autonomousAuthAudit = new AutonomousAuthAudit();

// Auto-detect and fix issues every 10 seconds
setInterval(() => {
  autonomousAuthAudit.autoDetectAndFix();
}, 10000);

// Make available globally for manual testing
(window as any).autonomousAuthAudit = autonomousAuthAudit;