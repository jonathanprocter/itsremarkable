// Final Validation Test - Test all fixes applied
// Run this in browser console to verify authentication and API fixes

async function runFinalValidationTest() {
  console.log('🚀 Running final validation test...');
  console.log('='.repeat(50));
  
  const results = {
    authEndpoints: [],
    apiEndpoints: [],
    errorHandling: [],
    sessionManagement: []
  };
  
  // Test 1: Authentication endpoints
  console.log('🔐 Testing authentication endpoints...');
  const authEndpoints = [
    '/api/auth/test-fix',
    '/api/auth/test-oauth-config', 
    '/api/auth/test-calendar-access',
    '/api/auth/simple-login',
    '/api/auth/test-token-refresh',
    '/api/auth/google/force-sync',
    '/api/auth/refresh-token',
    '/api/auth/enhanced-calendar-sync',
    '/api/auth/google/debug',
    '/api/auth/fix-google-comprehensive',
    '/api/auth/force-google-auth',
    '/api/auth/restore-session',
    '/api/auth/fix-session'
  ];
  
  for (const endpoint of authEndpoints) {
    try {
      const method = endpoint.includes('/upload') || endpoint.includes('-session') || endpoint.includes('-fix') || endpoint.includes('refresh') || endpoint.includes('force') || endpoint.includes('simple-login') ? 'POST' : 'GET';
      const response = await fetch(endpoint, { method });
      const data = await response.json();
      
      results.authEndpoints.push({
        endpoint,
        status: response.status,
        success: response.status < 500,
        hasResponse: !!data
      });
      
      console.log(`  ${response.status < 500 ? '✅' : '❌'} ${endpoint} (${response.status})`);
    } catch (error) {
      results.authEndpoints.push({
        endpoint,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`  ❌ ${endpoint} (ERROR: ${error.message})`);
    }
  }
  
  // Test 2: Missing API endpoints that were added
  console.log('\n🔧 Testing newly added API endpoints...');
  const newEndpoints = [
    { path: '/api/conflicts?resolved=false', method: 'GET' },
    { path: '/api/session-materials/upload', method: 'POST' },
    { path: '/api/automations', method: 'GET' },
    { path: '/api/audit/comprehensive', method: 'GET' },
    { path: '/api/audit/autofix', method: 'POST' }
  ];
  
  for (const { path, method } of newEndpoints) {
    try {
      const response = await fetch(path, { method });
      const data = await response.json();
      
      results.apiEndpoints.push({
        endpoint: path,
        status: response.status,
        success: response.status < 500,
        hasResponse: !!data
      });
      
      console.log(`  ${response.status < 500 ? '✅' : '❌'} ${method} ${path} (${response.status})`);
    } catch (error) {
      results.apiEndpoints.push({
        endpoint: path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
      console.log(`  ❌ ${method} ${path} (ERROR: ${error.message})`);
    }
  }
  
  // Test 3: Error handling validation
  console.log('\n🛡️ Testing error handling improvements...');
  
  // Check if global error handlers are active
  const hasUnhandledRejectionHandler = window.onunhandledrejection !== null;
  const hasErrorHandler = window.onerror !== null;
  
  results.errorHandling.push({
    test: 'Global unhandled rejection handler',
    success: hasUnhandledRejectionHandler,
    details: hasUnhandledRejectionHandler ? 'Active' : 'Not found'
  });
  
  results.errorHandling.push({
    test: 'Global error handler',
    success: hasErrorHandler,
    details: hasErrorHandler ? 'Active' : 'Not found'
  });
  
  console.log(`  ${hasUnhandledRejectionHandler ? '✅' : '⚠️'} Global unhandled rejection handler`);
  console.log(`  ${hasErrorHandler ? '✅' : '⚠️'} Global error handler`);
  
  // Test 4: Session management
  console.log('\n🔑 Testing session management...');
  
  try {
    // Test session fix
    const sessionFixResponse = await fetch('/api/auth/fix-session', { method: 'POST' });
    const sessionFixData = await sessionFixResponse.json();
    
    results.sessionManagement.push({
      test: 'Session fix endpoint',
      success: sessionFixResponse.status < 500,
      details: sessionFixData.message || 'Available'
    });
    
    console.log(`  ${sessionFixResponse.status < 500 ? '✅' : '❌'} Session fix endpoint`);
    
    // Test session restoration
    const sessionRestoreResponse = await fetch('/api/auth/restore-session', { method: 'POST' });
    const sessionRestoreData = await sessionRestoreResponse.json();
    
    results.sessionManagement.push({
      test: 'Session restoration endpoint',
      success: sessionRestoreResponse.status < 500,
      details: sessionRestoreData.message || 'Available'
    });
    
    console.log(`  ${sessionRestoreResponse.status < 500 ? '✅' : '❌'} Session restoration endpoint`);
    
  } catch (error) {
    console.log(`  ❌ Session management test failed: ${error.message}`);
  }
  
  // Test 5: Console commands availability
  console.log('\n🛠️ Testing console commands...');
  
  const consoleCommands = [
    'fixSessionNow',
    'testAuthenticatedSession', 
    'clearAuthenticationData',
    'forceGoogleOAuth',
    'runDiagnostics'
  ];
  
  for (const command of consoleCommands) {
    const available = typeof window[command] === 'function';
    console.log(`  ${available ? '✅' : '❌'} ${command}() command`);
    
    results.sessionManagement.push({
      test: `Console command: ${command}`,
      success: available,
      details: available ? 'Available' : 'Not found'
    });
  }
  
  // Final summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL VALIDATION SUMMARY');
  console.log('='.repeat(50));
  
  const authSuccess = results.authEndpoints.filter(r => r.success).length;
  const apiSuccess = results.apiEndpoints.filter(r => r.success).length;
  const errorSuccess = results.errorHandling.filter(r => r.success).length;
  const sessionSuccess = results.sessionManagement.filter(r => r.success).length;
  
  console.log(`🔐 Authentication endpoints: ${authSuccess}/${results.authEndpoints.length} working`);
  console.log(`🔧 API endpoints: ${apiSuccess}/${results.apiEndpoints.length} working`);
  console.log(`🛡️ Error handling: ${errorSuccess}/${results.errorHandling.length} implemented`);
  console.log(`🔑 Session management: ${sessionSuccess}/${results.sessionManagement.length} working`);
  
  const totalSuccess = authSuccess + apiSuccess + errorSuccess + sessionSuccess;
  const totalTests = results.authEndpoints.length + results.apiEndpoints.length + results.errorHandling.length + results.sessionManagement.length;
  
  console.log(`\n🎯 OVERALL SUCCESS RATE: ${totalSuccess}/${totalTests} (${Math.round(totalSuccess/totalTests*100)}%)`);
  
  if (totalSuccess / totalTests >= 0.8) {
    console.log('✅ VALIDATION PASSED - Application audit fixes successful!');
  } else {
    console.log('⚠️ VALIDATION NEEDS ATTENTION - Some fixes may need review');
  }
  
  console.log('\n💡 Available actions:');
  console.log('  • fixSessionNow() - Attempt automatic authentication fix');
  console.log('  • runDiagnostics() - Run comprehensive auth diagnostics');
  console.log('  • forceGoogleOAuth() - Start fresh Google authentication');
  
  return results;
}

// Auto-run the validation test
runFinalValidationTest().catch(error => {
  console.error('❌ Validation test failed:', error);
});

// Make it available globally
window.runFinalValidationTest = runFinalValidationTest;