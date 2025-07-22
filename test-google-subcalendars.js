/**
 * Test Google Calendar Subcalendars
 * Direct test of Google Calendar API to fetch all calendars and subcalendars
 */

const baseUrl = 'https://ed4c6ee6-c0f6-458f-9eac-1eadf0569a2c-00-387t3f5z7i1mm.kirk.replit.dev';

async function testGoogleSubcalendars() {
  console.log('🔍 Testing Google Calendar subcalendars...');
  
  try {
    // Step 1: Apply environment tokens first
    console.log('\n🔧 Step 1: Applying environment tokens...');
    const envTokenResponse = await fetch(`${baseUrl}/api/auth/force-env-tokens`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (envTokenResponse.ok) {
      const envData = await envTokenResponse.json();
      if (envData.success) {
        console.log('✅ Environment tokens applied successfully');
        console.log('   - Access token:', envData.tokenInfo.hasAccessToken ? 'Present' : 'Missing');
        console.log('   - Refresh token:', envData.tokenInfo.hasRefreshToken ? 'Present' : 'Missing');
        console.log('   - Expires at:', envData.tokenInfo.expiresAt);
      } else {
        console.log('❌ Environment token application failed:', envData.error);
        return;
      }
    } else {
      console.log('❌ Environment token request failed');
      return;
    }
    
    // Step 2: Test calendar access with tokens
    console.log('\n📅 Step 2: Testing calendar access with tokens...');
    const calendarResponse = await fetch(`${baseUrl}/api/auth/test-calendar-access`, {
      credentials: 'include'
    });
    
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      if (calendarData.success) {
        console.log('✅ Calendar access successful');
        console.log('   - Calendars found:', calendarData.testResults.calendarsFound);
        console.log('   - Upcoming events:', calendarData.testResults.upcomingEvents);
        console.log('   - Calendar names:', calendarData.testResults.calendarNames);
      } else {
        console.log('❌ Calendar access failed:', calendarData.error);
      }
    } else {
      console.log('❌ Calendar access request failed');
    }
    
    // Step 3: Test live Google Calendar events
    console.log('\n🔗 Step 3: Testing live Google Calendar events...');
    const eventsResponse = await fetch(`${baseUrl}/api/calendar/events`, {
      credentials: 'include'
    });
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('✅ Google Calendar events response received');
      console.log('   - Events found:', eventsData.events?.length || 0);
      console.log('   - Calendars found:', eventsData.calendars?.length || 0);
      
      if (eventsData.calendars && eventsData.calendars.length > 0) {
        console.log('   - Calendar details:');
        eventsData.calendars.forEach(cal => {
          console.log(`     • ${cal.name} (${cal.id}) - Color: ${cal.color}`);
        });
      }
      
      // Show sample events from different calendars
      if (eventsData.events && eventsData.events.length > 0) {
        console.log('\n   - Sample events by calendar:');
        const eventsByCalendar = {};
        eventsData.events.forEach(event => {
          if (!eventsByCalendar[event.calendarId]) {
            eventsByCalendar[event.calendarId] = [];
          }
          eventsByCalendar[event.calendarId].push(event);
        });
        
        Object.entries(eventsByCalendar).forEach(([calendarId, events]) => {
          console.log(`     Calendar ${calendarId}: ${events.length} events`);
          if (events.length > 0) {
            console.log(`       Sample: "${events[0].title}" at ${events[0].startTime}`);
          }
        });
      }
    } else {
      console.log('❌ Google Calendar events request failed');
    }
    
    // Step 4: Test SimplePractice events
    console.log('\n🏥 Step 4: Testing SimplePractice events...');
    const spResponse = await fetch(`${baseUrl}/api/simplepractice/events?start=2024-01-01&end=2025-12-31`, {
      credentials: 'include'
    });
    
    if (spResponse.ok) {
      const spData = await spResponse.json();
      console.log('✅ SimplePractice events response received');
      console.log('   - Events found:', spData.events?.length || 0);
      console.log('   - Calendars found:', spData.calendars?.length || 0);
      
      if (spData.calendars && spData.calendars.length > 0) {
        console.log('   - Calendar details:');
        spData.calendars.forEach(cal => {
          console.log(`     • ${cal.name} (${cal.id}) - Color: ${cal.color}`);
        });
      }
    } else {
      console.log('❌ SimplePractice events request failed');
    }
    
    // Step 5: Test all events combined
    console.log('\n📊 Step 5: Testing all events combined...');
    const allEventsResponse = await fetch(`${baseUrl}/api/events`, {
      credentials: 'include'
    });
    
    if (allEventsResponse.ok) {
      const allEventsData = await allEventsResponse.json();
      console.log('✅ All events response received');
      console.log('   - Total events:', allEventsData.length);
      
      // Analyze event sources
      const eventSources = {};
      const calendarBreakdown = {};
      
      allEventsData.forEach(event => {
        const source = event.source || 'unknown';
        eventSources[source] = (eventSources[source] || 0) + 1;
        
        const calendarId = event.calendarId || 'unknown';
        calendarBreakdown[calendarId] = (calendarBreakdown[calendarId] || 0) + 1;
      });
      
      console.log('   - Event sources breakdown:');
      Object.entries(eventSources).forEach(([source, count]) => {
        console.log(`     • ${source}: ${count} events`);
      });
      
      console.log('   - Calendar breakdown:');
      Object.entries(calendarBreakdown).forEach(([calendarId, count]) => {
        console.log(`     • Calendar ${calendarId}: ${count} events`);
      });
    } else {
      console.log('❌ All events request failed');
    }
    
    console.log('\n🎉 Google Calendar subcalendar test completed!');
    
  } catch (error) {
    console.error('❌ Google subcalendar test failed:', error.message);
  }
}

// Run the test
testGoogleSubcalendars().catch(console.error);