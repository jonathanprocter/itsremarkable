/**
 * Comprehensive OAuth Fix Verification Test
 * This script verifies all the OAuth fixes have been properly implemented
 */

async function testOAuthFix() {
  console.log('🧪 Starting OAuth Fix Verification Test...');
  
  // Step 1: Test authentication status
  console.log('📊 Step 1: Testing authentication status...');
  const statusResponse = await fetch('/api/auth/status');
  const statusData = await statusResponse.json();
  
  console.log('Authentication Status:', {
    isAuthenticated: statusData.isAuthenticated,
    hasValidTokens: statusData.hasValidTokens,
    userEmail: statusData.user?.email || 'none',
    sessionId: statusData.session?.sessionId?.substring(0, 10) + '...',
    needsReauth: statusData.needsReauth
  });
  
  // Step 2: Test OAuth URL generation
  console.log('🔗 Step 2: Testing OAuth URL generation...');
  try {
    const oauthResponse = await fetch('/api/auth/google');
    if (oauthResponse.redirected) {
      console.log('✅ OAuth URL generated successfully');
      console.log('🔗 OAuth URL:', oauthResponse.url);
    } else {
      console.log('❌ OAuth URL generation failed');
    }
  } catch (error) {
    console.error('❌ OAuth URL test failed:', error);
  }
  
  // Step 3: Test comprehensive status endpoint
  console.log('📋 Step 3: Testing comprehensive status...');
  try {
    const compResponse = await fetch('/api/auth/comprehensive-status');
    const compData = await compResponse.json();
    
    console.log('Comprehensive Status:', {
      isAuthenticated: compData.isAuthenticated,
      hasEnvironmentTokens: compData.environment?.hasAccessToken,
      hasValidTokens: compData.tokenStatus?.isValid,
      recommendations: compData.recommendations?.length || 0
    });
  } catch (error) {
    console.error('❌ Comprehensive status test failed:', error);
  }
  
  // Step 4: Test if we have valid tokens
  if (statusData.hasValidTokens) {
    console.log('🎉 SUCCESS: Authentication is working!');
    console.log('📅 Testing calendar access...');
    
    try {
      const calendarResponse = await fetch('/api/calendar/events?start=2025-07-01T00:00:00.000Z&end=2025-07-31T23:59:59.999Z');
      const calendarData = await calendarResponse.json();
      
      if (calendarResponse.ok) {
        console.log('✅ Calendar access working:', calendarData.length || 0, 'events');
      } else {
        console.log('❌ Calendar access failed:', calendarData.error);
      }
    } catch (error) {
      console.error('❌ Calendar test failed:', error);
    }
  } else {
    console.log('⚠️ No valid tokens found. Authentication required.');
    console.log('🔗 NEXT STEP: Click "Fix Authentication" button or go to /api/auth/google');
  }
  
  // Final recommendations
  console.log('\n🎯 FINAL RECOMMENDATIONS:');
  if (statusData.hasValidTokens) {
    console.log('✅ Authentication is working properly');
    console.log('🔄 Refresh the page to see calendar events');
  } else {
    console.log('❌ Authentication needs to be completed');
    console.log('📝 INSTRUCTIONS:');
    console.log('   1. Click the "Fix Authentication" button in the UI');
    console.log('   2. Or navigate to: /api/auth/google');
    console.log('   3. Complete the Google OAuth flow');
    console.log('   4. Return to the planner page');
  }
}

// Run the test
testOAuthFix().catch(console.error);

// Make available globally
window.testOAuthFix = testOAuthFix;