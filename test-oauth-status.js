/**
 * Test OAuth Status - Real-time test of authentication system
 */

console.log('🔍 Testing OAuth authentication status...');

// Test authentication status
fetch('/api/auth/status', {
  credentials: 'include'
})
.then(response => response.json())
.then(data => {
  console.log('📊 Authentication Status:', data);
  
  if (data.authenticated && data.hasValidTokens) {
    console.log('✅ Authentication is working correctly');
    console.log('👤 User:', data.user?.email || 'Unknown');
    
    // Test OAuth fix endpoint
    return fetch('/api/auth/comprehensive-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
  } else {
    console.log('❌ Authentication not working');
    console.log('🔗 Need to visit: /api/auth/google');
    return null;
  }
})
.then(response => {
  if (response) {
    return response.json();
  }
  return null;
})
.then(data => {
  if (data) {
    console.log('🔧 OAuth Fix Result:', data);
    
    if (data.success) {
      console.log('✅ OAuth fix successful');
      console.log('📊 Details:', data.details);
      
      // Test calendar sync
      return fetch('/api/auth/force-google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
    } else {
      console.log('❌ OAuth fix failed:', data.message);
    }
  }
  return null;
})
.then(response => {
  if (response) {
    return response.json();
  }
  return null;
})
.then(data => {
  if (data) {
    console.log('🔄 Force Sync Result:', data);
    
    if (data.success) {
      console.log('✅ Google Calendar sync successful');
      console.log('📊 Summary:', data.summary);
      console.log('📅 Calendars processed:', data.calendarResults?.length || 0);
      
      // Test live sync endpoint
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-31');
      
      return fetch(`/api/live-sync/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`, {
        credentials: 'include'
      });
    } else {
      console.log('❌ Force sync failed:', data.message);
    }
  }
  return null;
})
.then(response => {
  if (response) {
    return response.json();
  }
  return null;
})
.then(data => {
  if (data) {
    console.log('📅 Live Sync Test:', data);
    
    if (data.events) {
      console.log(`✅ Live sync working: ${data.events.length} events found`);
      console.log('📊 Event breakdown:', {
        total: data.events.length,
        calendars: data.calendars?.length || 0,
        isLiveSync: data.isLiveSync
      });
      
      console.log('🎉 OAUTH SYSTEM FULLY FUNCTIONAL!');
    } else {
      console.log('❌ Live sync not working:', data.error);
    }
  }
})
.catch(error => {
  console.error('❌ OAuth test failed:', error);
});