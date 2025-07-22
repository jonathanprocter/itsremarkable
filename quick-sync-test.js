// Quick Sync Test - Run in browser console
fetch('/api/sync/calendar', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
}).then(response => response.json())
.then(data => {
  console.log('Sync result:', data);
  
  // Get events after sync
  return fetch('/api/events', { 
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' }
  });
}).then(response => response.json())
.then(events => {
  const counts = {
    total: events.length,
    google: events.filter(e => e.source === 'google').length,
    simplepractice: events.filter(e => e.source === 'simplepractice').length,
    manual: events.filter(e => e.source === 'manual').length
  };
  
  console.log('Event counts after sync:', counts);
  
  // Look for SimplePractice events
  const spEvents = events.filter(e => e.source === 'simplepractice');
  if (spEvents.length > 0) {
    console.log('SimplePractice events found:', spEvents.slice(0, 5).map(e => ({
      title: e.title,
      date: new Date(e.startTime).toLocaleDateString(),
      source: e.source
    })));
  }
  
  // Check for potential SimplePractice events
  const potentialSP = events.filter(e => 
    e.title.toLowerCase().includes('appointment') || 
    /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(e.title.trim())
  );
  
  console.log(`Found ${potentialSP.length} events matching SimplePractice patterns`);
  if (potentialSP.length > 0) {
    console.log('Sample potential SimplePractice events:', potentialSP.slice(0, 5).map(e => ({
      title: e.title,
      currentSource: e.source,
      matchesNamePattern: /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(e.title.trim())
    })));
  }
})
.catch(error => console.error('Test failed:', error));