// Test script for unified bidirectional export after fixing duplicate declaration
// Run this in the browser console after navigating to the planner page

(async () => {
  console.log('🎯 Testing Fixed Unified Bidirectional Export...');
  
  // Navigate to Export tab first
  const exportTab = Array.from(document.querySelectorAll('[role="tab"]')).find(tab => 
    tab.textContent.includes('Export')
  );
  
  if (exportTab) {
    console.log('✅ Clicking Export tab...');
    exportTab.click();
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Find the export button
  const exportButtons = Array.from(document.querySelectorAll('button'));
  const bidirectionalButton = exportButtons.find(btn => 
    btn.textContent.includes('Bidirectional Weekly Package')
  );
  
  if (!bidirectionalButton) {
    console.error('❌ Could not find Bidirectional Weekly Package button');
    return;
  }
  
  console.log('✅ Found bidirectional export button');
  console.log('📄 Clicking button to trigger unified export...');
  
  // Monitor console for export logs
  const originalLog = console.log;
  const originalError = console.error;
  const logs = [];
  const errors = [];
  
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
  };
  
  console.error = (...args) => {
    errors.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Click the button
  bidirectionalButton.click();
  
  // Wait for export to complete
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Restore console methods
  console.log = originalLog;
  console.error = originalError;
  
  // Check results
  const exportStarted = logs.some(log => log.includes('UNIFIED BIDIRECTIONAL EXPORT STARTING'));
  const weeklyTemplateUsed = logs.some(log => log.includes('Applying EXACT Current Weekly Export template'));
  const dailyTemplateUsed = logs.some(log => log.includes('Applying EXACT Browser Replica PDF template'));
  const navigationAdded = logs.some(log => log.includes('Added clickable link for day'));
  const exportCompleted = logs.some(log => log.includes('Unified bidirectional PDF created successfully'));
  const hasErrors = errors.length > 0;
  
  console.log('📊 Export Test Results:');
  console.log(`  - Export Started: ${exportStarted ? '✅' : '❌'}`);
  console.log(`  - Weekly Template Used: ${weeklyTemplateUsed ? '✅' : '❌'}`);
  console.log(`  - Daily Template Used: ${dailyTemplateUsed ? '✅' : '❌'}`);
  console.log(`  - Navigation Links Added: ${navigationAdded ? '✅' : '❌'}`);
  console.log(`  - Export Completed: ${exportCompleted ? '✅' : '❌'}`);
  console.log(`  - Has Errors: ${hasErrors ? '❌ YES' : '✅ NO'}`);
  
  if (hasErrors) {
    console.log('\n❌ Errors found:');
    errors.forEach(err => console.log(`  - ${err}`));
  }
  
  if (exportStarted && exportCompleted && !hasErrors) {
    console.log('\n✅ UNIFIED EXPORT TEST PASSED');
    console.log('📄 Check your downloads for the unified PDF file');
    console.log('🔗 The PDF should have 8 pages with clickable navigation');
  } else {
    console.log('\n❌ UNIFIED EXPORT TEST FAILED');
    console.log('🔍 Check console for error messages');
  }
  
  // Show relevant logs
  console.log('\n📋 Key Export Logs:');
  logs.filter(log => 
    log.includes('UNIFIED') || 
    log.includes('EXACT') || 
    log.includes('template') ||
    log.includes('navigation') ||
    log.includes('clickable') ||
    log.includes('page')
  ).slice(0, 20).forEach(log => console.log(`  - ${log}`));
})();