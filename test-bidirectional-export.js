// Test script for bidirectional weekly package export
// Run this in the browser console to test the export functionality

console.log('🔗 Testing Bidirectional Weekly Package Export');

// Simulate clicking the export button
async function testBidirectionalExport() {
  try {
    // Get current week dates (July 21-27, 2025)
    const today = new Date('2025-07-21');
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    
    console.log(`📅 Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
    
    // Mock events data (simplified for testing)
    const mockEvents = [
      {
        id: '1',
        title: 'Test Appointment',
        startTime: new Date('2025-07-21T10:00:00'),
        endTime: new Date('2025-07-21T11:00:00'),
        source: 'simplepractice'
      },
      {
        id: '2', 
        title: 'Google Meeting',
        startTime: new Date('2025-07-22T14:00:00'),
        endTime: new Date('2025-07-22T15:00:00'),
        source: 'google'
      }
    ];
    
    console.log(`📊 Test events: ${mockEvents.length}`);
    
    // Import and call the export function
    const { exportLinkedWeeklyPackage } = await import('./client/src/utils/bidirectionalWeeklyPackageLinked.ts');
    
    console.log('🚀 Starting bidirectional export test...');
    await exportLinkedWeeklyPackage(weekStart, weekEnd, mockEvents);
    
    console.log('✅ Bidirectional export test completed successfully!');
    
  } catch (error) {
    console.error('❌ Bidirectional export test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Auto-run the test
testBidirectionalExport();