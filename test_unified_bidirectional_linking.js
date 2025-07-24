// Test script for the UNIFIED BIDIRECTIONAL EXPORT with true linking
// Run this in the browser console to test the new implementation

const testUnifiedBidirectionalLinking = async () => {
  try {
    console.log('🔗 TESTING TRUE UNIFIED BIDIRECTIONAL EXPORT');
    console.log('==============================================');
    console.log('✅ This should create ONE PDF with clickable navigation');
    console.log('✅ Uses existing template styling without modifying templates');
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
    console.log('🚀 Importing unified bidirectional export function...');
    
    try {
      // Import the updated export function
      const module = await import('/client/src/utils/unifiedBidirectionalExport.ts');
      const { exportUnifiedBidirectionalWeeklyPackage } = module;
      
      console.log('✅ Successfully imported function');
      console.log('🔗 Executing TRUE bidirectional export...');
      
      // Execute the export
      const result = await exportUnifiedBidirectionalWeeklyPackage(events, monday);
      
      console.log('');
      console.log('🎉 UNIFIED BIDIRECTIONAL EXPORT TEST COMPLETED');
      console.log(`📄 Result: ${result}`);
      console.log('');
      console.log('✅ EXPECTED BEHAVIOR:');
      console.log('  📄 ONE PDF file with 8 pages');
      console.log('  🔗 Page 1: Weekly overview with clickable day links (Mon, Tue, Wed, etc.)');
      console.log('  🔗 Pages 2-8: Daily views with navigation back to weekly + between days');
      console.log('  📊 Uses existing template styling without modifying templates');
      console.log('  🎯 TRUE bidirectional navigation using jsPDF.link() method');
      console.log('');
      console.log('💡 Click day names in weekly view to jump to daily pages');
      console.log('💡 Click "Weekly Overview" in daily pages to return to page 1');
      console.log('💡 Click other day names in daily pages to jump between days');
      
      return true;
      
    } catch (importError) {
      console.error('❌ Import failed:', importError);
      console.log('');
      console.log('🔍 DEBUGGING INFO:');
      console.log('- File: client/src/utils/unifiedBidirectionalExport.ts');
      console.log('- Function: exportUnifiedBidirectionalWeeklyPackage');
      console.log('- Expected: Single PDF with bidirectional navigation');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Auto-run the test
console.log('🧪 Running unified bidirectional linking test...');
testUnifiedBidirectionalLinking().then(success => {
  console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
});