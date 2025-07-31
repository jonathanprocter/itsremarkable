// Final test of bidirectional export with all height adjustments
console.log('🎯 Final test of bidirectional export with height adjustments...');

// Navigate to weekly view first
const currentView = document.querySelector('h2')?.textContent;
console.log('📍 Current view:', currentView);

if (currentView && currentView.includes('day,')) {
  console.log('📅 Switching to weekly view...');
  const weeklyBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Weekly Overview')
  );
  if (weeklyBtn) {
    weeklyBtn.click();
    setTimeout(testExport, 1000);
  }
} else {
  testExport();
}

function testExport() {
  console.log('\n🔍 Testing bidirectional export...');
  
  // Find the button
  const exportBtn = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Bidirectional Weekly Package')
  );
  
  if (exportBtn) {
    console.log('✅ Found Bidirectional Weekly Package button');
    
    // Set up comprehensive monitoring
    let logs = [];
    let errors = [];
    let downloadDetected = false;
    
    // Monitor console
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      logs.push(args.join(' '));
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      errors.push(args.join(' '));
    };
    
    // Monitor for download
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
      const element = originalCreateElement.call(document, tagName);
      if (tagName.toLowerCase() === 'a') {
        const originalClick = element.click;
        element.click = function() {
          if (element.download && element.href.startsWith('blob:')) {
            downloadDetected = true;
            console.log('📥 PDF DOWNLOAD TRIGGERED!');
            console.log('📄 Filename:', element.download);
          }
          return originalClick.call(this);
        };
      }
      return element;
    };
    
    // Click the button
    console.log('🖱️ Clicking export button...');
    exportBtn.click();
    
    // Check results after delay
    setTimeout(() => {
      console.log('\n📊 EXPORT TEST RESULTS:');
      console.log(`✅ Logs captured: ${logs.length}`);
      console.log(`❌ Errors captured: ${errors.length}`);
      console.log(`📥 Download detected: ${downloadDetected ? 'YES ✅' : 'NO ❌'}`);
      
      if (errors.length > 0) {
        console.error('\n❌ ERRORS FOUND:');
        errors.forEach((err, i) => console.error(`${i+1}. ${err}`));
      }
      
      // Key logs
      const keyLogs = logs.filter(log => 
        log.includes('USING EXACT') || 
        log.includes('Applied') || 
        log.includes('export') ||
        log.includes('PDF') ||
        log.includes('Error')
      );
      
      if (keyLogs.length > 0) {
        console.log('\n📝 KEY EXPORT LOGS:');
        keyLogs.forEach((log, i) => console.log(`${i+1}. ${log}`));
      }
      
      // Restore functions
      console.log = originalLog;
      console.error = originalError;
      document.createElement = originalCreateElement;
      
      if (downloadDetected) {
        console.log('\n✅ SUCCESS! PDF export completed and download triggered.');
      } else {
        console.log('\n⚠️ WARNING: Export completed but no download detected.');
      }
    }, 4000);
    
  } else {
    console.log('❌ Bidirectional Weekly Package button not found');
  }
}