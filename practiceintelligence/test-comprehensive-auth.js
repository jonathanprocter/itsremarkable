/**
 * Comprehensive Authentication Test
 * Tests all the requirements from the attached file
 */

async function testComprehensiveAuth() {
  console.log('🔄 Starting comprehensive authentication test...');
  
  const results = [];
  
  // Test 1: Check Google API credentials
  console.log('\n1. Testing Google API credentials...');
  try {
    const response = await fetch('/api/auth/comprehensive-status');
    const data = await response.json();
    
    const hasCredentials = data.environment?.hasClientId && data.environment?.hasClientSecret;
    results.push({
      test: 'Google API Credentials',
      status: hasCredentials ? 'PASS' : 'FAIL',
      details: `Client ID: ${data.environment?.hasClientId ? 'Present' : 'Missing'}, Client Secret: ${data.environment?.hasClientSecret ? 'Present' : 'Missing'}`
    });
    
    console.log(`${hasCredentials ? '✅' : '❌'} Google API credentials: ${hasCredentials ? 'Present' : 'Missing'}`);
  } catch (error) {
    results.push({
      test: 'Google API Credentials',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to check credentials:', error.message);
  }
  
  // Test 2: Check user authentication
  console.log('\n2. Testing user authentication...');
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    const isAuthenticated = data.isAuthenticated;
    results.push({
      test: 'User Authentication',
      status: isAuthenticated ? 'PASS' : 'FAIL',
      details: `User: ${data.user?.email || 'None'}, Authenticated: ${isAuthenticated}`
    });
    
    console.log(`${isAuthenticated ? '✅' : '❌'} User authentication: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    if (data.user) {
      console.log(`   User: ${data.user.email}`);
    }
  } catch (error) {
    results.push({
      test: 'User Authentication',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to check authentication:', error.message);
  }
  
  // Test 3: Check token validity
  console.log('\n3. Testing token validity...');
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    const hasValidTokens = data.hasValidTokens;
    results.push({
      test: 'Token Validity',
      status: hasValidTokens ? 'PASS' : 'FAIL',
      details: `Has Valid Tokens: ${hasValidTokens}, Token Source: ${data.tokenSource || 'Unknown'}`
    });
    
    console.log(`${hasValidTokens ? '✅' : '❌'} Token validity: ${hasValidTokens ? 'Valid' : 'Invalid'}`);
    if (data.session?.tokenExpiry) {
      console.log(`   Token expiry: ${data.session.tokenExpiry}`);
    }
  } catch (error) {
    results.push({
      test: 'Token Validity',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to check token validity:', error.message);
  }
  
  // Test 4: Check calendar permissions
  console.log('\n4. Testing calendar permissions...');
  try {
    const response = await fetch('/api/auth/google-status');
    const data = await response.json();
    
    const hasPermissions = data.hasValidTokens && !data.needsAuth;
    results.push({
      test: 'Calendar Permissions',
      status: hasPermissions ? 'PASS' : 'FAIL',
      details: `Has Permissions: ${hasPermissions}, Needs Auth: ${data.needsAuth || false}`
    });
    
    console.log(`${hasPermissions ? '✅' : '❌'} Calendar permissions: ${hasPermissions ? 'Granted' : 'Missing'}`);
    if (data.error) {
      console.log(`   Error: ${data.error}`);
    }
  } catch (error) {
    results.push({
      test: 'Calendar Permissions',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to check calendar permissions:', error.message);
  }
  
  // Test 5: Test Google Calendar API call
  console.log('\n5. Testing Google Calendar API access...');
  try {
    const response = await fetch('/api/auth/google/force-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const apiWorking = data.success;
    
    results.push({
      test: 'Google Calendar API',
      status: apiWorking ? 'PASS' : 'FAIL',
      details: apiWorking ? `Synced ${data.eventsCount} events from ${data.calendarsCount} calendars` : `Error: ${data.error}`
    });
    
    console.log(`${apiWorking ? '✅' : '❌'} Google Calendar API: ${apiWorking ? 'Working' : 'Failed'}`);
    if (apiWorking) {
      console.log(`   Events synced: ${data.eventsCount}`);
      console.log(`   Calendars: ${data.calendarsCount}`);
    } else {
      console.log(`   Error: ${data.error}`);
      if (data.needsReauth) {
        console.log(`   Needs re-authentication: ${data.authUrl}`);
      }
    }
  } catch (error) {
    results.push({
      test: 'Google Calendar API',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to test Calendar API:', error.message);
  }
  
  // Test 6: Check error handling
  console.log('\n6. Testing error handling...');
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    const errorHandling = response.ok || (data.error && data.message);
    
    results.push({
      test: 'Error Handling',
      status: errorHandling ? 'PASS' : 'FAIL',
      details: data.success ? 'Token refresh successful' : `Error handled: ${data.error || 'Unknown'}`
    });
    
    console.log(`${errorHandling ? '✅' : '❌'} Error handling: ${errorHandling ? 'Working' : 'Failed'}`);
  } catch (error) {
    results.push({
      test: 'Error Handling',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Failed to test error handling:', error.message);
  }
  
  // Summary
  console.log('\n📊 COMPREHENSIVE AUTHENTICATION TEST SUMMARY:');
  console.log('='.repeat(60));
  
  let passCount = 0;
  let failCount = 0;
  let errorCount = 0;
  
  results.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${result.test}: ${result.status}`);
    console.log(`   ${result.details}`);
    
    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else errorCount++;
  });
  
  console.log('='.repeat(60));
  console.log(`📈 Results: ${passCount} passed, ${failCount} failed, ${errorCount} errors`);
  
  // Recommendations
  console.log('\n🔧 RECOMMENDATIONS:');
  if (failCount > 0 || errorCount > 0) {
    console.log('1. Check Google Cloud Console OAuth configuration');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Test OAuth flow manually with /api/auth/google');
    console.log('4. Check server logs for detailed error messages');
    console.log('5. Ensure redirect URIs match your deployment domain');
  } else {
    console.log('✅ All tests passed! Authentication system is working correctly.');
  }
  
  return results;
}

// Run the test
testComprehensiveAuth().catch(console.error);