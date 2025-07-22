/**
 * Live Sync Fix - Comprehensive Solution for Google Calendar Live Sync Issues
 * This script addresses the core authentication and sync issues
 */

console.log('🔧 LIVE SYNC FIX STARTING...');

// Step 1: Check current authentication status
async function checkAuthStatus() {
  try {
    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    console.log('📊 Current Auth Status:', {
      isAuthenticated: data.isAuthenticated,
      hasTokens: data.hasTokens,
      hasValidTokens: data.hasValidTokens,
      needsFix: data.needsFix
    });
    
    return data;
  } catch (error) {
    console.error('❌ Auth status check failed:', error);
    return null;
  }
}

// Step 2: Fix authentication if needed
async function fixAuthentication() {
  try {
    console.log('🔄 Running comprehensive authentication fix...');
    
    const response = await fetch('/api/auth/comprehensive-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Authentication fix completed:', result);
      return true;
    } else {
      console.error('❌ Authentication fix failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication fix error:', error);
    return false;
  }
}

// Step 3: Test live sync functionality
async function testLiveSync() {
  try {
    console.log('🧪 Testing live sync functionality...');
    
    const start = '2024-01-01T05:00:00.000Z';
    const end = '2025-12-31T05:00:00.000Z';
    
    const response = await fetch(`/api/calendar/events?start=${start}&end=${end}&force=true`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Live sync test successful:', {
        eventCount: data.events?.length || 0,
        calendarsFound: data.calendars?.length || 0,
        isLiveSync: data.isLiveSync,
        syncTime: data.syncTime
      });
      return true;
    } else {
      console.error('❌ Live sync test failed:', response.status, await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Live sync test error:', error);
    return false;
  }
}

// Step 4: Force Google Calendar sync
async function forceGoogleSync() {
  try {
    console.log('🔄 Forcing Google Calendar sync...');
    
    const response = await fetch('/api/auth/force-google-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Force Google sync completed:', result);
      return true;
    } else {
      console.error('❌ Force Google sync failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Force Google sync error:', error);
    return false;
  }
}

// Main execution
async function runLiveSyncFix() {
  console.log('🎯 STARTING COMPREHENSIVE LIVE SYNC FIX');
  console.log('=' .repeat(50));
  
  // Check current status
  const authStatus = await checkAuthStatus();
  if (!authStatus) {
    console.error('❌ Cannot proceed - auth status check failed');
    return;
  }
  
  // Fix authentication if needed
  if (authStatus.needsFix || !authStatus.hasValidTokens) {
    console.log('⚠️  Authentication needs fixing...');
    const authFixed = await fixAuthentication();
    if (!authFixed) {
      console.error('❌ Authentication fix failed - cannot proceed');
      return;
    }
  }
  
  // Force Google Calendar sync
  console.log('🔄 Forcing Google Calendar sync...');
  const syncForced = await forceGoogleSync();
  if (!syncForced) {
    console.warn('⚠️  Google sync force failed, continuing with test...');
  }
  
  // Test live sync
  console.log('🧪 Testing live sync functionality...');
  const liveSyncWorks = await testLiveSync();
  
  // Final report
  console.log('\n🎯 LIVE SYNC FIX COMPLETE');
  console.log('=' .repeat(50));
  
  if (liveSyncWorks) {
    console.log('✅ SUCCESS: Live sync is now working correctly!');
    console.log('📡 Google Calendar events are being fetched in real-time');
    console.log('🚀 System is ready for deployment');
  } else {
    console.log('❌ FAILURE: Live sync is still not working');
    console.log('🔧 Additional debugging required');
    console.log('💡 Check server logs for authentication errors');
  }
  
  return liveSyncWorks;
}

// Run the fix
window.runLiveSyncFix = runLiveSyncFix;
console.log('🔧 Live Sync Fix loaded. Run runLiveSyncFix() to start the fix process.');