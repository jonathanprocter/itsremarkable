// Test unified bidirectional export button
console.log('🧪 Testing Unified Bidirectional Export Button...');

// First, let's see what view we're in
const viewTitle = document.querySelector('h2')?.textContent;
console.log('📍 Current view:', viewTitle);

// Check if we're in daily view - need to switch to weekly
if (viewTitle && viewTitle.includes('Tuesday')) {
  console.log('📅 In daily view, looking for weekly navigation...');
  
  // Look for "Weekly Overview" button
  const weeklyButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Weekly Overview')
  );
  
  if (weeklyButton) {
    console.log('✅ Found Weekly Overview button, clicking...');
    weeklyButton.click();
    
    // Wait a moment for navigation
    setTimeout(() => {
      findAndClickExportButton();
    }, 1000);
  } else {
    console.log('❌ Could not find Weekly Overview button');
    findAndClickExportButton();
  }
} else {
  findAndClickExportButton();
}

function findAndClickExportButton() {
  console.log('\n🔍 Looking for export buttons...');
  
  // Find all buttons
  const allButtons = Array.from(document.querySelectorAll('button'));
  console.log(`📊 Total buttons found: ${allButtons.length}`);
  
  // Look specifically for export buttons
  const exportButtons = allButtons.filter(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('export') || text.includes('package') || text.includes('bidirectional');
  });
  
  console.log(`📦 Export-related buttons found: ${exportButtons.length}`);
  exportButtons.forEach((btn, i) => {
    console.log(`  ${i + 1}. "${btn.textContent.trim()}"`);
  });
  
  // Find the specific bidirectional button
  const bidirectionalButton = exportButtons.find(btn => 
    btn.textContent.includes('Bidirectional Weekly Package')
  );
  
  if (bidirectionalButton) {
    console.log('\n✅ Found "Bidirectional Weekly Package" button!');
    console.log('🖱️ Clicking button...');
    
    // Set up console monitoring
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = function(...args) {
      originalLog.apply(console, args);
      // Look for export-related messages
      const message = args.join(' ');
      if (message.includes('UNIFIED') || message.includes('BIDIRECTIONAL') || message.includes('export')) {
        originalLog('📌 EXPORT LOG:', message);
      }
    };
    
    console.error = function(...args) {
      originalError.apply(console, args);
      originalError('❌ EXPORT ERROR:', args.join(' '));
    };
    
    // Click the button
    bidirectionalButton.click();
    console.log('✅ Button clicked! Monitoring console output...');
    
    // Monitor for a few seconds
    setTimeout(() => {
      console.log('\n📊 Export monitoring complete');
      console.log = originalLog;
      console.error = originalError;
    }, 5000);
    
  } else {
    console.log('❌ Could not find "Bidirectional Weekly Package" button');
    console.log('💡 Available button texts:');
    allButtons.forEach((btn, i) => {
      if (btn.textContent.trim()) {
        console.log(`  ${i + 1}. "${btn.textContent.trim()}"`);
      }
    });
  }
}