// Test unified bidirectional export with reduced height
console.log('🧪 Testing unified bidirectional export with reduced grid height...');

// Find the export button
const exportBtn = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.textContent.includes('Bidirectional Weekly Package')
);

if (exportBtn) {
  console.log('✅ Found Bidirectional Weekly Package button');
  
  // Monitor for errors and logs
  let exportLogs = [];
  let exportErrors = [];
  
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = function(...args) {
    originalLog.apply(console, args);
    const msg = args.join(' ');
    if (msg.includes('export') || msg.includes('EXACT') || msg.includes('PDF') || msg.includes('Template')) {
      exportLogs.push(msg);
    }
  };
  
  console.error = function(...args) {
    originalError.apply(console, args);
    exportErrors.push(args.join(' '));
  };
  
  // Add error listeners
  window.addEventListener('error', (e) => {
    exportErrors.push(`Window error: ${e.message}`);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    exportErrors.push(`Unhandled rejection: ${e.reason}`);
  });
  
  console.log('🖱️ Clicking export button...');
  exportBtn.click();
  
  // Wait and check results
  setTimeout(() => {
    console.log('\n📊 Export test results:');
    console.log(`✅ Captured ${exportLogs.length} export logs`);
    console.log(`❌ Captured ${exportErrors.length} errors`);
    
    if (exportErrors.length > 0) {
      console.error('\n❌ Errors found:');
      exportErrors.forEach((err, i) => console.error(`${i+1}. ${err}`));
    }
    
    if (exportLogs.length > 0) {
      console.log('\n📝 Export logs:');
      exportLogs.forEach((log, i) => console.log(`${i+1}. ${log}`));
    }
    
    // Restore console
    console.log = originalLog;
    console.error = originalError;
  }, 3000);
  
} else {
  console.log('❌ Bidirectional Weekly Package button not found');
  
  // Check if we're in the right view
  const title = document.querySelector('h2')?.textContent;
  console.log('📍 Current view:', title);
}