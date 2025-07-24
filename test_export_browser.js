// Real browser test for unified bidirectional export
const testRealExport = async () => {
  try {
    console.log('🚀 Starting real unified bidirectional export test...');
    
    // Import the unified export function
    const { unifiedBidirectionalWeeklyPackageExport } = await import('./client/src/utils/unifiedBidirectionalExport.ts');
    
    // Mock events for testing
    const testEvents = [
      {
        id: '1',
        title: 'Monday Test Event',
        startTime: new Date('2025-07-21T10:00:00Z'),
        endTime: new Date('2025-07-21T11:00:00Z'),
        source: 'simplepractice',
        description: 'Test appointment'
      },
      {
        id: '2', 
        title: 'Tuesday Test Event',
        startTime: new Date('2025-07-22T14:00:00Z'),
        endTime: new Date('2025-07-22T15:00:00Z'),
        source: 'google',
        description: 'Google Calendar test'
      },
      {
        id: '3',
        title: 'Wednesday Test Event', 
        startTime: new Date('2025-07-23T16:00:00Z'),
        endTime: new Date('2025-07-23T17:00:00Z'),
        source: 'simplepractice',
        description: 'Another test'
      }
    ];

    // Test with current week
    const today = new Date('2025-07-24');
    
    console.log('📊 Test data prepared:');
    console.log(`- Events: ${testEvents.length}`);
    console.log(`- Selected date: ${today.toDateString()}`);
    
    // Call the unified export function
    const result = await unifiedBidirectionalWeeklyPackageExport(testEvents, today);
    
    console.log('✅ Export completed successfully');
    console.log(`📄 Generated file: ${result}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Export test failed:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
};

testRealExport();