
// Run this in browser console to audit PDF export
async function auditPDFExport() {
  console.log('=== PDF EXPORT AUDIT STARTING ===');
  
  try {
    // Fetch events for July 20, 2025
    const response = await fetch('/api/events');
    const allEvents = await response.json();
    const testDate = new Date('2025-07-20');
    
    // Filter events for July 20
    const filteredEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getFullYear() === testDate.getFullYear() &&
             eventDate.getMonth() === testDate.getMonth() &&
             eventDate.getDate() === testDate.getDate();
    });
    
    console.log('📊 Total events for July 20:', filteredEvents.length);
    
    // Check for critical appointments
    const amberlyExists = filteredEvents.find(e => e.title.includes('Amberly'));
    const davidExists = filteredEvents.find(e => e.title.includes('David') && e.title.includes('Grossman'));
    
    console.log('✅ Amberly found:', !!amberlyExists);
    console.log('✅ David Grossman found:', !!davidExists);
    
    // Calculate statistics
    let totalMinutes = 0;
    filteredEvents.forEach(event => {
      const duration = (new Date(event.endTime) - new Date(event.startTime)) / (1000 * 60);
      totalMinutes += duration;
    });
    
    const scheduledHours = totalMinutes / 60;
    const freeTimePercent = ((18 - scheduledHours) / 18) * 100;
    
    console.log('📊 Statistics:');
    console.log('- Appointments:', filteredEvents.length);
    console.log('- Scheduled hours:', scheduledHours.toFixed(1));
    console.log('- Free time:', Math.round(freeTimePercent) + '%');
    
    return {
      appointments: filteredEvents.length,
      scheduledHours: scheduledHours.toFixed(1),
      freeTimePercent: Math.round(freeTimePercent),
      hasAmberly: !!amberlyExists,
      hasDavid: !!davidExists
    };
  } catch (error) {
    console.error('Audit failed:', error);
  }
}

// Run it
auditPDFExport();

