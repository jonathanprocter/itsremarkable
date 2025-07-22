
console.log('🧪 Testing SimplePractice Events Fix...\n');

async function testSimplePracticeEvents() {
  try {
    console.log('1. Testing SimplePractice events endpoint...');
    
    const response = await fetch('/api/simplepractice/events?start=2024-01-01&end=2025-12-31', {
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ SimplePractice Response:', {
        status: response.status,
        eventsFound: data.events?.length || 0,
        calendarsFound: data.calendars?.length || 0,
        sampleEvents: data.events?.slice(0, 3).map(e => ({
          title: e.title,
          start: e.startTime?.substring(0, 10),
          source: e.source
        })) || []
      });
      
      if (data.events && data.events.length > 0) {
        console.log('\n📋 Event breakdown:');
        data.events.forEach((event, index) => {
          if (index < 5) { // Show first 5 events
            console.log(`   ${index + 1}. ${event.title} (${event.startTime?.substring(0, 10)})`);
          }
        });
        
        if (data.events.length > 5) {
          console.log(`   ... and ${data.events.length - 5} more events`);
        }
      }
      
    } else {
      const errorData = await response.text();
      console.log('❌ SimplePractice Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
    }
    
    // Test authentication status
    console.log('\n2. Testing authentication status...');
    const authResponse = await fetch('/api/auth/status', {
      credentials: 'include'
    });
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Auth Status:', {
        isAuthenticated: authData.isAuthenticated,
        hasValidTokens: authData.hasValidTokens,
        calendarAccessible: authData.calendarAccessible
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSimplePracticeEvents();
