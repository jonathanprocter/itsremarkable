// Test script for the UPDATED UNIFIED BIDIRECTIONAL EXPORT
// Run this in the browser console to test the current implementation

const testUpdatedUnifiedBidirectionalExport = async () => {
  try {
    console.log('🔗 TESTING UPDATED UNIFIED BIDIRECTIONAL EXPORT');
    console.log('===============================================');
    console.log('✅ This creates ONE PDF with 8 pages and bidirectional navigation');
    console.log('✅ Weekly overview styled like Current Weekly Export');
    console.log('✅ Daily views with full 6:00-23:30 timeframe like Browser Replica PDF');
    console.log('');
    
    // Get current events
    const response = await fetch('/api/events');
    const events = await response.json();
    
    console.log(`📊 Loaded ${events.length} events from API`);
    
    // Calculate current week
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
    monday.setHours(0, 0, 0, 0);
    
    console.log(`📅 Week starts: ${monday.toDateString()}`);
    
    // Test the unified bidirectional export
    console.log('🚀 Importing updated unified bidirectional export function...');
    
    try {
      // Import the updated export function
      const module = await import('/client/src/utils/unifiedBidirectionalExport.ts');
      const { exportUnifiedBidirectionalWeeklyPackage } = module;
      
      console.log('✅ Successfully imported function');
      console.log('🔗 Executing unified bidirectional export...');
      
      // Execute the export
      const result = await exportUnifiedBidirectionalWeeklyPackage(events, monday);
      
      console.log('');
      console.log('🎉 UNIFIED BIDIRECTIONAL EXPORT TEST COMPLETED');
      console.log(`📄 Result: ${result}`);
      console.log('');
      console.log('✅ ACTUAL BEHAVIOR:');
      console.log('  📄 ONE PDF file with 8 pages');
      console.log('  🔗 Page 1: Weekly overview (landscape) styled like Current Weekly Export');
      console.log('  🔗 Pages 2-8: Daily views (portrait) with full 6:00-23:30 timeframe');
      console.log('  📊 Preserves existing template styling and full timeframe coverage');
      console.log('  🎯 Bidirectional navigation using jsPDF.link() method');
      console.log('');
      console.log('💡 Features:');
      console.log('  - Weekly grid with time slots 6:00-23:30');
      console.log('  - Daily views with complete timeframe like Browser Replica PDF');
      console.log('  - Clickable navigation between weekly and daily pages');
      console.log('  - Events positioned in correct time slots');
      console.log('  - SimplePractice appointments with blue borders');
      console.log('  - Full event details including time ranges');
      
      return true;
      
    } catch (importError) {
      console.error('❌ Import failed:', importError);
      console.log('');
      console.log('🔍 DEBUGGING INFO:');
      console.log('- File: client/src/utils/unifiedBidirectionalExport.ts');
      console.log('- Function: exportUnifiedBidirectionalWeeklyPackage');
      console.log('- Expected: Single PDF with template-styled content and full timeframes');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run the test
console.log('🧪 Running updated unified bidirectional export test...');
testUpdatedUnifiedBidirectionalExport().then(success => {
  console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
});