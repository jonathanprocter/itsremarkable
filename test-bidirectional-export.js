// Test bidirectional export after height fix
console.log('🧪 Testing bidirectional export after height fix...');

// Find Export Options card
const exportCard = Array.from(document.querySelectorAll('.text-sm')).find(el => 
  el.textContent === 'Export Options'
);

if (exportCard) {
  const exportSection = exportCard.closest('.space-y-2');
  const buttons = exportSection?.querySelectorAll('button') || [];
  
  // Find bidirectional button
  const bidirectionalBtn = Array.from(buttons).find(btn => 
    btn.textContent.includes('Bidirectional Weekly Package')
  );
  
  if (bidirectionalBtn) {
    console.log('✅ Found Bidirectional Weekly Package button');
    console.log('🖱️ Clicking button...');
    
    // Monitor console for errors
    const originalError = console.error;
    console.error = function(...args) {
      originalError.apply(console, args);
      console.log('❌ EXPORT ERROR DETECTED:', args);
    };
    
    // Click the button
    bidirectionalBtn.click();
    console.log('✅ Button clicked! Check for PDF download...');
    
    // Monitor for a few seconds
    setTimeout(() => {
      console.log('📊 Export test complete');
      console.error = originalError;
    }, 3000);
  } else {
    console.log('❌ Could not find Bidirectional Weekly Package button');
  }
} else {
  console.log('❌ Could not find Export Options card');
}