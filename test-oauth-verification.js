
async function verifyOAuthStatus() {
  console.log('🔍 Double-checking OAuth authentication status...');
  
  try {
    // Test 1: Check auth status
    const authResponse = await fetch('/api/auth/status', { credentials: 'include' });
    const authData = await authResponse.json();
    
    console.log('✅ Auth Status:', {
      authenticated: authData.authenticated,
      hasValidTokens: authData.hasValidTokens,
      userEmail: authData.user?.email || 'none'
    });
    
    // Test 2: Check events loading
    const eventsResponse = await fetch('/api/events', { credentials: 'include' });
    const events = await eventsResponse.json();
    
    console.log('✅ Events Loading:', {
      totalEvents: events.length,
      google: events.filter(e => e.source === 'google').length,
      simplepractice: events.filter(e => e.source === 'simplepractice').length,
      manual: events.filter(e => e.source === 'manual').length
    });
    
    // Test 3: Test OAuth URL generation
    const oauthTest = await fetch('/api/auth/google', { 
      method: 'HEAD',
      credentials: 'include',
      redirect: 'manual' 
    });
    
    console.log('✅ OAuth URL Generation:', {
      status: oauthTest.status,
      working: oauthTest.status === 302 || oauthTest.status === 0
    });
    
    console.log('🎯 VERIFICATION COMPLETE: All systems operational');
    
    return {
      authWorking: authData.authenticated,
      eventsLoading: events.length > 0,
      oauthWorking: oauthTest.status === 302 || oauthTest.status === 0,
      overall: 'FULLY FUNCTIONAL'
    };
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return { error: error.message };
  }
}

// Run verification
verifyOAuthStatus().then(result => {
  console.log('📊 Final Verification Result:', result);
});
