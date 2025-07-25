// Test script for unified bidirectional export
// Run this in the browser console after navigating to the planner page

(async () => {
  console.log('🎯 Testing Unified Bidirectional Export...');
  
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
  const logs = [];
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog.apply(console, args);
  };
  
  // Click the button
  bidirectionalButton.click();
  
  // Wait for export to complete
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Restore console.log
  console.log = originalLog;
  
  // Check results
  const exportStarted = logs.some(log => log.includes('UNIFIED BIDIRECTIONAL EXPORT STARTING'));
  const templateExtractorUsed = logs.some(log => log.includes('Applying EXACT Current Weekly Export template'));
  const browserReplicaUsed = logs.some(log => log.includes('Applying EXACT Browser Replica PDF template'));
  const exportCompleted = logs.some(log => log.includes('Unified bidirectional PDF created successfully'));
  
  console.log('📊 Export Test Results:');
  console.log(`  - Export Started: ${exportStarted ? '✅' : '❌'}`);
  console.log(`  - Weekly Template Used: ${templateExtractorUsed ? '✅' : '❌'}`);
  console.log(`  - Daily Template Used: ${browserReplicaUsed ? '✅' : '❌'}`);
  console.log(`  - Export Completed: ${exportCompleted ? '✅' : '❌'}`);
  
  if (exportStarted && exportCompleted) {
    console.log('✅ UNIFIED EXPORT TEST PASSED');
    console.log('📄 Check your downloads for the unified PDF file');
  } else {
    console.log('❌ UNIFIED EXPORT TEST FAILED');
    console.log('🔍 Check console for error messages');
  }
  
  // Show relevant logs
  console.log('\n📋 Export Logs:');
  logs.filter(log => 
    log.includes('UNIFIED') || 
    log.includes('EXACT') || 
    log.includes('template') ||
    log.includes('error') ||
    log.includes('Error')
  ).forEach(log => console.log(`  - ${log}`));
})();