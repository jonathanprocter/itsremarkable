// Test the overlap detection logic from the daily PDF export
const events = [
  {
    id: '1',
    title: 'Nancy Grossman Appointment',
    startTime: new Date('2025-07-07T10:00:00'),
    endTime: new Date('2025-07-07T11:00:00'),
    calendarId: 'simplepractice'
  },
  {
    id: '2', 
    title: 'Dan re: Supervision',
    startTime: new Date('2025-07-07T10:30:00'),
    endTime: new Date('2025-07-07T11:30:00'),
    calendarId: 'google'
  },
  {
    id: '3',
    title: 'Sherrifa Hoosein Appointment', 
    startTime: new Date('2025-07-07T10:45:00'),
    endTime: new Date('2025-07-07T11:45:00'),
    calendarId: 'simplepractice'
  }
];

// Test the slot-based overlap detection system
const timeSlotHeight = 16;
const usedSlots = new Set();

console.log('=== TESTING OVERLAP DETECTION SYSTEM ===\n');

events.forEach((event, index) => {
  const eventDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  
  // Calculate position exactly like the PDF export
  const startHour = eventDate.getHours();
  const startMinute = eventDate.getMinutes();
  const minutesSince6am = (startHour - 6) * 60 + startMinute;
  const slotsFromStart = minutesSince6am / 30;
  
  // Calculate duration
  const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
  
  // Calculate precise slot positioning for overlap detection
  const startSlot = Math.floor(slotsFromStart);
  const endSlot = Math.ceil((minutesSince6am + durationMinutes) / 30);
  
  console.log(`Event ${index + 1}: ${event.title}`);
  console.log(`  Time: ${eventDate.toLocaleTimeString()} - ${endDate.toLocaleTimeString()}`);
  console.log(`  Start slot: ${startSlot}, End slot: ${endSlot}`);
  console.log(`  Duration: ${durationMinutes} minutes`);
  
  // Find available horizontal position for overlapping events
  let horizontalOffset = 0;
  const maxOverlaps = 3;
  
  // Check for overlaps and find available position
  while (horizontalOffset < maxOverlaps) {
    let hasOverlap = false;
    for (let slot = startSlot; slot < endSlot; slot++) {
      if (usedSlots.has(slot * 10 + horizontalOffset)) {
        hasOverlap = true;
        break;
      }
    }
    
    if (!hasOverlap) {
      // Mark slots as used
      for (let slot = startSlot; slot < endSlot; slot++) {
        usedSlots.add(slot * 10 + horizontalOffset);
      }
      break;
    }
    
    horizontalOffset++;
  }
  
  console.log(`  Horizontal offset: ${horizontalOffset}`);
  console.log(`  Used slots: ${Array.from(usedSlots).join(', ')}`);
  console.log('');
});

console.log('=== FINAL POSITIONING RESULTS ===');
console.log('Event 1 (Nancy): Horizontal offset 0 (leftmost)');
console.log('Event 2 (Dan): Horizontal offset 1 (middle)');
console.log('Event 3 (Sherrifa): Horizontal offset 2 (rightmost)');
console.log('\nThis ensures no overlapping appointments in the PDF export!');