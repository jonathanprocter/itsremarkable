
console.log('🔧 COMPREHENSIVE AUTHENTICATION TEST AND FIX');

async function runAuthTest() {
  console.log('\n=== STEP 1: Testing Current Auth Status ===');
  
  try {
    const authResponse = await fetch('/api/auth/status');
    const authData = await authResponse.json();
    
    console.log('Auth Status:', {
      isAuthenticated: authData.isAuthenticated,
      hasValidTokens: authData.hasValidTokens,
      needsAuth: authData.needsAuth,
      user: authData.user
    });
    
    if (!authData.hasValidTokens) {
      console.log('❌ No valid tokens found - attempting fix...');
      
      // Test Google auth endpoint
      console.log('\n=== STEP 2: Testing Google Auth Endpoint ===');
      const googleAuthResponse = await fetch('/api/auth/google-status');
      const googleData = await googleAuthResponse.json();
      
      console.log('Google Auth Status:', googleData);
      
      if (!googleData.hasValidTokens) {
        console.log('\n=== STEP 3: Attempting Token Refresh ===');
        const refreshResponse = await fetch('/api/auth/refresh-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const refreshData = await refreshResponse.json();
        console.log('Token Refresh Result:', refreshData);
        
        if (!refreshData.success) {
          console.log('\n=== STEP 4: Forcing Environment Token Application ===');
          const forceResponse = await fetch('/api/auth/force-env-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const forceData = await forceResponse.json();
          console.log('Force Environment Tokens:', forceData);
        }
      }
    }
    
    console.log('\n=== STEP 5: Testing Calendar Access ===');
    const calendarResponse = await fetch('/api/calendar/events?start=2025-01-01&end=2025-12-31');
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      console.log('✅ Calendar Access Working:', {
        eventCount: calendarData.events?.length || 0,
        calendars: calendarData.calendars?.length || 0
      });
    } else {
      console.log('❌ Calendar Access Failed:', {
        status: calendarResponse.status,
        statusText: calendarResponse.statusText
      });
      
      // Try SimplePractice events
      console.log('\n=== STEP 6: Testing SimplePractice Events ===');
      const spResponse = await fetch('/api/simplepractice/events?start=2025-01-01&end=2025-12-31');
      
      if (spResponse.ok) {
        const spData = await spResponse.json();
        console.log('✅ SimplePractice Access Working:', {
          eventCount: spData.events?.length || 0
        });
      } else {
        console.log('❌ SimplePractice Access Failed:', {
          status: spResponse.status,
          statusText: spResponse.statusText
        });
        
        // Show OAuth fix URL
        console.log('\n=== AUTHENTICATION FIX REQUIRED ===');
        console.log('🔗 To fix authentication, visit this URL:');
        console.log('https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev/api/auth/google');
        console.log('\nThis will start fresh Google OAuth authentication.');
      }
    }
    
    console.log('\n=== STEP 7: Testing Database Events ===');
    const eventsResponse = await fetch('/api/events');
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Database Events Working:', {
        eventCount: eventsData.length,
        sampleEvents: eventsData.slice(0, 3).map(e => ({
          title: e.title,
          source: e.source,
          startTime: e.startTime
        }))
      });
    } else {
      console.log('❌ Database Events Failed');
    }
    
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

// Run the test
runAuthTest();
