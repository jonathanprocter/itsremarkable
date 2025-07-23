// Test PyMyPDF export with real events from a week that has data
const testPyMyPDFWithRealEvents = async () => {
  try {
    console.log('🧪 Testing PyMyPDF export with real events...');
    
    // First, get all events to find a week with data
    const eventsResponse = await fetch('/api/events');
    const allEvents = await eventsResponse.json();
    console.log(`📊 Total events available: ${allEvents.length}`);
    
    // Find the date range of available events
    const eventDates = allEvents
      .map(e => e.date ? new Date(e.date) : null)
      .filter(d => d !== null)
      .sort((a, b) => a - b);
    
    if (eventDates.length === 0) {
      console.log('❌ No events with valid dates found');
      return;
    }
    
    const firstDate = eventDates[0];
    const lastDate = eventDates[eventDates.length - 1];
    
    console.log(`📅 Event date range: ${firstDate.toDateString()} to ${lastDate.toDateString()}`);
    
    // Find a week that has events (use the first week with data)
    const firstWeekStart = new Date(firstDate);
    firstWeekStart.setDate(firstDate.getDate() - firstDate.getDay()); // Go to Monday
    firstWeekStart.setHours(0, 0, 0, 0);
    
    const firstWeekEnd = new Date(firstWeekStart);
    firstWeekEnd.setDate(firstWeekStart.getDate() + 6); // Sunday
    firstWeekEnd.setHours(23, 59, 59, 999);
    
    console.log(`🗓️ Testing week: ${firstWeekStart.toDateString()} to ${firstWeekEnd.toDateString()}`);
    
    // Filter events for this week
    const weekEvents = allEvents.filter(event => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= firstWeekStart && eventDate <= firstWeekEnd;
    });
    
    console.log(`📊 Events in test week: ${weekEvents.length}`);
    
    if (weekEvents.length === 0) {
      console.log('❌ No events found in the first week, trying the week with the most events...');
      
      // Find the week with the most events
      const weekCounts = {};
      allEvents.forEach(event => {
        if (!event.date) return;
        const eventDate = new Date(event.date);
        const monday = new Date(eventDate);
        monday.setDate(eventDate.getDate() - eventDate.getDay());
        monday.setHours(0, 0, 0, 0);
        const weekKey = monday.toISOString().split('T')[0];
        weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
      });
      
      const bestWeek = Object.keys(weekCounts).reduce((a, b) => 
        weekCounts[a] > weekCounts[b] ? a : b
      );
      
      const bestWeekStart = new Date(bestWeek);
      const bestWeekEnd = new Date(bestWeekStart);
      bestWeekEnd.setDate(bestWeekStart.getDate() + 6);
      bestWeekEnd.setHours(23, 59, 59, 999);
      
      console.log(`🎯 Best week with ${weekCounts[bestWeek]} events: ${bestWeekStart.toDateString()} to ${bestWeekEnd.toDateString()}`);
      
      // Test with the best week
      const response = await fetch('/api/export/pymypdf-bidirectional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: JSON.stringify(allEvents.filter(event => {
            if (!event.date) return false;
            const eventDate = new Date(event.date);
            return eventDate >= bestWeekStart && eventDate <= bestWeekEnd;
          })),
          weekStart: bestWeekStart.toISOString(),
          weekEnd: bestWeekEnd.toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ PyMyPDF export successful: ${result.filename}`);
        console.log(`📄 Generated file: ${result.filename}`);
        
        // Test download
        const downloadResponse = await fetch(`/api/download/${result.filename}`);
        if (downloadResponse.ok) {
          console.log('✅ Download endpoint working correctly');
        } else {
          console.log(`❌ Download failed: ${downloadResponse.statusText}`);
        }
      } else {
        console.log(`❌ PyMyPDF export failed: ${response.statusText}`);
      }
      
    } else {
      // Test with the first week
      const response = await fetch('/api/export/pymypdf-bidirectional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: JSON.stringify(weekEvents),
          weekStart: firstWeekStart.toISOString(),
          weekEnd: firstWeekEnd.toISOString()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ PyMyPDF export successful: ${result.filename}`);
        console.log(`📄 Generated file: ${result.filename}`);
      } else {
        console.log(`❌ PyMyPDF export failed: ${response.statusText}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testPyMyPDFWithRealEvents();