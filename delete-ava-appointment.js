
// Browser console script to find and delete Ava Moskowitz appointment on Thursday 13:00-14:00
(async function deleteAvaAppointment() {
  console.log('🔍 Searching for Ava Moskowitz appointment...');
  
  try {
    // Fetch all events
    const response = await fetch('/api/events', { credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.status}`);
    }
    
    const events = await response.json();
    console.log(`📊 Total events loaded: ${events.length}`);
    
    // Search for Ava Moskowitz appointment on Thursday 13:00-14:00
    const avaAppointment = events.find(event => {
      const title = event.title.toLowerCase();
      const isAva = title.includes('ava') && title.includes('moskowitz');
      
      if (isAva) {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);
        const isThursday = startTime.getDay() === 4; // Thursday = 4
        const is13to14 = startTime.getHours() === 13 && endTime.getHours() === 14;
        
        console.log(`🎯 Found Ava appointment:`, {
          title: event.title,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isThursday,
          is13to14,
          matches: isThursday && is13to14
        });
        
        return isThursday && is13to14;
      }
      return false;
    });
    
    if (!avaAppointment) {
      console.log('❌ Ava Moskowitz appointment not found for Thursday 13:00-14:00');
      console.log('Available Ava appointments:');
      events.filter(e => e.title.toLowerCase().includes('ava')).forEach(event => {
        const start = new Date(event.startTime);
        console.log(`  - ${event.title}: ${start.toDateString()} ${start.toTimeString()}`);
      });
      return;
    }
    
    console.log(`✅ Found Ava Moskowitz appointment to delete:`, avaAppointment);
    
    // Delete the appointment
    const deleteResponse = await fetch(`/api/events/${avaAppointment.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Successfully deleted Ava Moskowitz appointment:', result);
      
      // Refresh the page to update the calendar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      const error = await deleteResponse.json();
      console.error('❌ Failed to delete appointment:', error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
