/**
 * Immediate Calendar Sync Solution
 * This script will sync your Google Calendar with new events
 */

async function syncCalendarNow() {
  console.log('🔄 SYNCING CALENDAR WITH NEW EVENTS');
  console.log('===================================');
  
  try {
    // Step 1: Force authentication refresh
    console.log('1. Refreshing authentication...');
    window.location.href = '/api/auth/google';
    
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Manual fallback
    console.log('\n📋 MANUAL SYNC STEPS:');
    console.log('1. Open new tab: http://localhost:5000/api/auth/google');
    console.log('2. Complete Google login');
    console.log('3. Return to calendar and refresh page');
    console.log('4. Your new events should now appear');
  }
}

// Immediate sync
syncCalendarNow();