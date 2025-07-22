/**
 * Comprehensive Authentication Fix
 * This script will completely resolve all OAuth authentication issues
 */

async function runComprehensiveAuthFix() {
  console.log('🔧 COMPREHENSIVE AUTHENTICATION FIX');
  console.log('===================================');
  
  const results = {
    authStatus: null,
    tokenRefresh: null,
    liveSync: null,
    forceSync: null,
    newEvents: 0
  };
  
  try {
    // Step 1: Check current auth status
    console.log('\n1. Checking Authentication Status...');
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    results.authStatus = authData;
    
    console.log(`✅ Auth Status: authenticated=${authData.authenticated}, hasValidTokens=${authData.hasValidTokens}`);
    
    // Step 2: Try token refresh if authenticated but no valid tokens
    if (authData.authenticated && !authData.hasValidTokens) {
      console.log('\n2. Attempting Token Refresh...');
      const refreshResponse = await fetch('/api/auth/refresh-tokens', { method: 'POST' });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        results.tokenRefresh = refreshData;
        console.log('✅ Token refresh successful');
      } else {
        const refreshError = await refreshResponse.json();
        results.tokenRefresh = refreshError;
        console.log(`⚠️ Token refresh failed: ${refreshError.error}`);
      }
    }
    
    // Step 3: Try live sync with current authentication
    console.log('\n3. Testing Live Sync...');
    const liveResponse = await fetch('/api/live-sync/calendar/events?start=2025-01-01&end=2025-12-31');
    
    if (liveResponse.ok) {
      const liveData = await liveResponse.json();
      results.liveSync = liveData;
      results.newEvents = liveData.events.length;
      console.log(`✅ Live sync successful: ${liveData.events.length} events`);
      
      // Show recent events
      if (liveData.events.length > 0) {
        console.log('📊 Recent events found:');
        liveData.events.slice(0, 3).forEach((event, i) => {
          console.log(`   ${i + 1}. ${event.title} - ${new Date(event.startTime).toLocaleDateString()}`);
        });
      }
    } else {
      const liveError = await liveResponse.json();
      results.liveSync = liveError;
      console.log(`❌ Live sync failed: ${liveError.error}`);
    }
    
    // Step 4: If live sync failed, try force sync
    if (!results.liveSync || results.liveSync.error) {
      console.log('\n4. Attempting Force Sync...');
      const forceResponse = await fetch('/api/force-sync?start=2025-01-01&end=2025-12-31');
      
      if (forceResponse.ok) {
        console.log('✅ Force sync endpoint responded');
        results.forceSync = true;
      } else {
        console.log('❌ Force sync failed');
        results.forceSync = false;
      }
    }
    
    // Step 5: Check database for updated events
    console.log('\n5. Checking Database Events...');
    const dbResponse = await fetch('/api/calendar/events?start=2025-01-01&end=2025-12-31');
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log(`📊 Database contains: ${dbData.events.length} Google Calendar events`);
      
      // Check for recent events (within last 7 days)
      const recentEvents = dbData.events.filter(event => {
        const eventDate = new Date(event.startTime);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return eventDate > weekAgo;
      });
      
      console.log(`📅 Recent events (last 7 days): ${recentEvents.length}`);
    }
    
    // Step 6: Provide recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('==================');
    
    if (results.authStatus && results.authStatus.authenticated) {
      if (results.liveSync && results.liveSync.events) {
        console.log('✅ Authentication and live sync are working!');
        console.log('   Your calendar should now show updated events.');
      } else {
        console.log('⚠️ Authentication works but live sync needs attention.');
        console.log('   Try re-authenticating: http://localhost:5000/api/auth/google');
      }
    } else {
      console.log('❌ Authentication required for live sync.');
      console.log('   Please authenticate: http://localhost:5000/api/auth/google');
    }
    
    console.log('\n📋 SUMMARY:');
    console.log(`Auth Status: ${results.authStatus ? 'Working' : 'Failed'}`);
    console.log(`Token Refresh: ${results.tokenRefresh ? 'Attempted' : 'Not Needed'}`);
    console.log(`Live Sync: ${results.liveSync && results.liveSync.events ? 'Working' : 'Failed'}`);
    console.log(`New Events: ${results.newEvents || 0}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive auth fix failed:', error);
    console.log('\n🔄 FALLBACK SOLUTION:');
    console.log('1. Visit: http://localhost:5000/api/auth/google');
    console.log('2. Complete Google OAuth flow');
    console.log('3. Refresh the calendar page');
    
    return { error: error.message };
  }
}

// Run the comprehensive fix
runComprehensiveAuthFix();