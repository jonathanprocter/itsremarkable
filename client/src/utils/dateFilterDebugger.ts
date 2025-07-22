
export function debugEventFiltering(events: any[], targetDate: Date | string) {
  const target = new Date(targetDate);
  console.log('\n🔍 DATE FILTERING DEBUG REPORT');
  console.log('==================================');
  console.log('Target Date:', target.toDateString());
  console.log('Target ISO:', target.toISOString());
  console.log('Total Events:', events.length);
  
  // Find Calvin Hill specifically
  const calvinEvents = events.filter(e => 
    e.title?.toLowerCase().includes('calvin') || 
    e.title?.toLowerCase().includes('hill')
  );
  
  console.log('\n🎯 CALVIN HILL SEARCH:');
  console.log('Calvin Hill events found:', calvinEvents.length);
  calvinEvents.forEach((event, i) => {
    const eventDate = new Date(event.startTime || event.start);
    console.log(`${i + 1}. ${event.title} - ${eventDate.toDateString()} ${eventDate.toLocaleTimeString()}`);
    console.log(`   Start: ${event.startTime || event.start}`);
    console.log(`   Source: ${event.source}`);
  });
  
  // Check events around July 19th
  const targetMonth = target.getMonth();
  const targetYear = target.getFullYear();
  const julyEvents = events.filter(e => {
    const eventDate = new Date(e.startTime || e.start);
    return eventDate.getMonth() === targetMonth && eventDate.getFullYear() === targetYear;
  });
  
  console.log(`\n📅 JULY ${targetYear} EVENTS:`, julyEvents.length);
  
  // Group by date
  const eventsByDate = new Map();
  julyEvents.forEach(event => {
    const eventDate = new Date(event.startTime || event.start);
    const dateKey = eventDate.toDateString();
    if (!eventsByDate.has(dateKey)) {
      eventsByDate.set(dateKey, []);
    }
    eventsByDate.get(dateKey).push(event);
  });
  
  // Show events around target date
  const sortedDates = Array.from(eventsByDate.keys()).sort();
  const targetDateString = target.toDateString();
  
  console.log('\n📊 EVENTS BY DATE (around target):');
  sortedDates.forEach(dateStr => {
    const isTarget = dateStr === targetDateString;
    const eventsOnDate = eventsByDate.get(dateStr);
    console.log(`${isTarget ? '🎯' : '📅'} ${dateStr}: ${eventsOnDate.length} events`);
    
    if (isTarget || eventsOnDate.some(e => e.title?.toLowerCase().includes('calvin'))) {
      eventsOnDate.forEach(event => {
        console.log(`   - ${event.title} (${event.source})`);
      });
    }
  });
  
  return {
    calvinEvents,
    julyEvents,
    eventsByDate,
    targetDateString
  };
}
