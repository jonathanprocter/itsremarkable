// Browser Test - Final validation of SimplePractice detection
// Run this in the browser console when authenticated

console.log('🔍 Testing SimplePractice detection...');

// Function to test SimplePractice detection logic
function testSimplePracticeDetection(event) {
  const title = event.title.toLowerCase();
  const description = (event.description || '').toLowerCase();
  
  return event.calendarId === '0np7sib5u30o7oc297j5pb259g' ||
         title.includes('appointment') ||
         title.includes('session') ||
         title.includes('therapy') ||
         title.includes('consultation') ||
         title.includes('counseling') ||
         title.includes('supervision') ||
         title.includes('intake') ||
         /^[A-Z][a-z]+ [A-Z][a-z]+(\s|$)/.test(event.title.trim());
}

// Test the current events
fetch('/api/events', { 
  credentials: 'include',
  headers: { 'Cache-Control': 'no-cache' }
}).then(response => response.json())
.then(events => {
  console.log(`📊 Testing ${events.length} events for SimplePractice patterns...`);
  
  const analysis = {
    total: events.length,
    google: events.filter(e => e.source === 'google').length,
    simplepractice: events.filter(e => e.source === 'simplepractice').length,
    manual: events.filter(e => e.source === 'manual').length
  };
  
  console.log('📊 Current event sources:', analysis);
  
  // Test detection logic on all events
  const potentialSimplePractice = events.filter(testSimplePracticeDetection);
  
  console.log(`🔍 Found ${potentialSimplePractice.length} events matching SimplePractice patterns`);
  
  if (potentialSimplePractice.length > 0) {
    console.log('📋 Sample events matching SimplePractice patterns:');
    potentialSimplePractice.slice(0, 10).forEach((event, index) => {
      console.log(`${index + 1}. "${event.title}" - ${new Date(event.startTime).toLocaleDateString()} - Source: ${event.source}`);
    });
    
    // Check if any are already marked as SimplePractice
    const alreadyMarked = potentialSimplePractice.filter(e => e.source === 'simplepractice');
    console.log(`✅ ${alreadyMarked.length} events already correctly marked as SimplePractice`);
    
    const needsMarking = potentialSimplePractice.filter(e => e.source !== 'simplepractice');
    console.log(`⚠️ ${needsMarking.length} events match SimplePractice patterns but are not marked as such`);
    
    if (needsMarking.length > 0) {
      console.log('📋 Events that should be SimplePractice but are not marked:');
      needsMarking.slice(0, 5).forEach((event, index) => {
        console.log(`${index + 1}. "${event.title}" - Current source: ${event.source}`);
      });
    }
  }
  
  // Check calendar IDs
  const calendarIds = {};
  events.forEach(event => {
    const calId = event.calendarId || 'unknown';
    calendarIds[calId] = (calendarIds[calId] || 0) + 1;
  });
  
  console.log('📊 Events by calendar ID:', calendarIds);
  
  // Check for known SimplePractice calendar
  const knownSimplePracticeCalId = '0np7sib5u30o7oc297j5pb259g';
  if (calendarIds[knownSimplePracticeCalId]) {
    console.log(`✅ Found ${calendarIds[knownSimplePracticeCalId]} events from known SimplePractice calendar`);
  }
  
  return analysis;
})
.catch(error => {
  console.error('❌ Test failed:', error);
  console.log('💡 Make sure you are authenticated and try again');
});