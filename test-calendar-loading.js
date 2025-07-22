/**
 * Comprehensive Calendar Loading Test
 * Tests all calendar sources including Google Calendar and subcalendars
 */

const baseUrl = 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';

async function testCalendarLoading() {
  console.log('🔍 Testing comprehensive calendar loading...');
  
  const results = {
    authStatus: false,
    googleCalendars: [],
    simplePracticeEvents: [],
    allEvents: [],
    totalCalendars: 0,
    totalEvents: 0
  };
  
  try {
    // Test 1: Check Authentication Status
    console.log('\n👤 Test 1: Authentication Status');
    const authResponse = await fetch(`${baseUrl}/api/auth/status`, {
      credentials: 'include'
    });
    const authData = await authResponse.json();
    
    if (authData.isAuthenticated) {
      console.log('✅ User authenticated:', authData.user.email);
      results.authStatus = true;
    } else {
      console.log('❌ User not authenticated');
      return results;
    }
    
    // Test 2: Google Calendar Events
    console.log('\n📅 Test 2: Google Calendar Events');
    const googleResponse = await fetch(`${baseUrl}/api/calendar/events`, {
      credentials: 'include'
    });
    
    if (googleResponse.ok) {
      const googleData = await googleResponse.json();
      console.log('✅ Google Calendar response received');
      console.log('   - Events found:', googleData.events?.length || 0);
      console.log('   - Calendars found:', googleData.calendars?.length || 0);
      
      if (googleData.calendars && googleData.calendars.length > 0) {
        console.log('   - Calendar details:');
        googleData.calendars.forEach(cal => {
          console.log(`     • ${cal.name} (${cal.id})`);
        });
      }
      
      results.googleCalendars = googleData.calendars || [];
      results.totalCalendars += googleData.calendars?.length || 0;
      results.totalEvents += googleData.events?.length || 0;
    } else {
      console.log('❌ Google Calendar request failed:', googleResponse.status);
    }
    
    // Test 3: SimplePractice Events
    console.log('\n🏥 Test 3: SimplePractice Events');
    const spResponse = await fetch(`${baseUrl}/api/simplepractice/events?start=2024-01-01&end=2025-12-31`, {
      credentials: 'include'
    });
    
    if (spResponse.ok) {
      const spData = await spResponse.json();
      console.log('✅ SimplePractice response received');
      console.log('   - Events found:', spData.events?.length || 0);
      console.log('   - Calendars found:', spData.calendars?.length || 0);
      
      if (spData.calendars && spData.calendars.length > 0) {
        console.log('   - Calendar details:');
        spData.calendars.forEach(cal => {
          console.log(`     • ${cal.name} (${cal.id})`);
        });
      }
      
      results.simplePracticeEvents = spData.events || [];
      results.totalCalendars += spData.calendars?.length || 0;
      results.totalEvents += spData.events?.length || 0;
    } else {
      console.log('❌ SimplePractice request failed:', spResponse.status);
    }
    
    // Test 4: All Events Combined
    console.log('\n📊 Test 4: All Events Combined');
    const allEventsResponse = await fetch(`${baseUrl}/api/events`, {
      credentials: 'include'
    });
    
    if (allEventsResponse.ok) {
      const allEventsData = await allEventsResponse.json();
      console.log('✅ All events response received');
      console.log('   - Total events:', allEventsData.length);
      
      // Analyze event sources
      const eventSources = {};
      allEventsData.forEach(event => {
        const source = event.source || 'unknown';
        eventSources[source] = (eventSources[source] || 0) + 1;
      });
      
      console.log('   - Event sources breakdown:');
      Object.entries(eventSources).forEach(([source, count]) => {
        console.log(`     • ${source}: ${count} events`);
      });
      
      results.allEvents = allEventsData;
    } else {
      console.log('❌ All events request failed:', allEventsResponse.status);
    }
    
    // Test 5: Test with Environment Tokens (if needed)
    console.log('\n🔧 Test 5: Environment Token Test');
    const envTokenResponse = await fetch(`${baseUrl}/api/auth/force-env-tokens`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (envTokenResponse.ok) {
      const envTokenData = await envTokenResponse.json();
      if (envTokenData.success) {
        console.log('✅ Environment tokens applied successfully');
        console.log('   - Retesting calendar access...');
        
        // Retry calendar access with environment tokens
        const retryResponse = await fetch(`${baseUrl}/api/auth/test-calendar-access`, {
          credentials: 'include'
        });
        
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          if (retryData.success) {
            console.log('✅ Calendar access with environment tokens successful');
            console.log('   - Calendars found:', retryData.testResults.calendarsFound);
            console.log('   - Calendar names:', retryData.testResults.calendarNames.join(', '));
          } else {
            console.log('❌ Calendar access with environment tokens failed');
          }
        }
      } else {
        console.log('❌ Environment token application failed:', envTokenData.error);
      }
    } else {
      console.log('❌ Environment token request failed:', envTokenResponse.status);
    }
    
    // Summary
    console.log('\n🎯 Summary');
    console.log('=====================================');
    console.log(`Authentication: ${results.authStatus ? '✅ Working' : '❌ Failed'}`);
    console.log(`Total Calendars: ${results.totalCalendars}`);
    console.log(`Total Events: ${results.totalEvents}`);
    console.log(`Google Calendars: ${results.googleCalendars.length}`);
    console.log(`SimplePractice Events: ${results.simplePracticeEvents.length}`);
    console.log(`All Events Combined: ${results.allEvents.length}`);
    
    if (results.googleCalendars.length > 0) {
      console.log('\n📅 Google Calendar Details:');
      results.googleCalendars.forEach(cal => {
        console.log(`   • ${cal.name} (ID: ${cal.id})`);
      });
    }
    
    // Status Assessment
    if (results.authStatus && results.totalEvents > 0) {
      console.log('\n🎉 CALENDAR SYSTEM STATUS: FULLY FUNCTIONAL');
    } else if (results.authStatus && results.totalEvents === 0) {
      console.log('\n⚠️  CALENDAR SYSTEM STATUS: AUTHENTICATED BUT NO EVENTS');
    } else {
      console.log('\n❌ CALENDAR SYSTEM STATUS: AUTHENTICATION FAILED');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Calendar loading test failed:', error.message);
    return results;
  }
}

// Run the test
testCalendarLoading().catch(console.error);