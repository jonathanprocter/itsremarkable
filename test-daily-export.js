/**
 * Test script to verify daily PDF export functionality
 * Run this in the browser console to test daily export
 */

async function testDailyPDFExport() {
  console.log('🧪 Testing daily PDF export functionality...');
  
  try {
    // Test data
    const testDate = new Date(2025, 6, 7); // July 7, 2025
    const testEvents = [
      {
        id: 'test-1',
        title: 'Test Appointment',
        startTime: new Date(2025, 6, 7, 10, 0).toISOString(),
        endTime: new Date(2025, 6, 7, 11, 0).toISOString(),
        source: 'simplepractice',
        description: 'Test appointment for PDF export'
      },
      {
        id: 'test-2',
        title: 'Another Test Event',
        startTime: new Date(2025, 6, 7, 14, 30).toISOString(),
        endTime: new Date(2025, 6, 7, 15, 30).toISOString(),
        source: 'google',
        description: 'Google calendar test event'
      }
    ];

    console.log('📊 Test data prepared:', {
      date: testDate.toDateString(),
      events: testEvents.length
    });

    // Test if the function exists
    if (typeof window.testDailyExport === 'function') {
      console.log('✅ testDailyExport function found');
      await window.testDailyExport();
    } else {
      console.log('❌ testDailyExport function not found');
      console.log('Available window functions:', Object.keys(window).filter(k => k.includes('test')));
    }

    // Test if export function can be called directly
    if (typeof exportDailyToPDF === 'function') {
      console.log('✅ exportDailyToPDF function found');
      await exportDailyToPDF(testDate, testEvents);
    } else {
      console.log('❌ exportDailyToPDF function not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Make function globally available
window.testDailyPDFExport = testDailyPDFExport;

console.log('🎯 Test function loaded. Run testDailyPDFExport() to test daily PDF export');