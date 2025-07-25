// Test script for unified bidirectional export with EXACT HTML daily template
console.log('🧪 Testing Unified Bidirectional Export with EXACT HTML Daily Template...');

// Find the export button and click it
const exportButton = document.querySelector('button:has([data-lucide-icon="layers"])');
if (exportButton) {
  console.log('✅ Found Unified Bidirectional Weekly Package button');
  exportButton.click();
  
  // Wait for PDF generation
  setTimeout(() => {
    console.log('📄 PDF generation should be complete');
    console.log('✅ Check browser console for any errors');
    console.log('✅ Check if PDF download started');
  }, 3000);
} else {
  console.error('❌ Could not find Unified Bidirectional Weekly Package button');
  console.log('Looking for buttons...');
  document.querySelectorAll('button').forEach((btn, i) => {
    if (btn.textContent.includes('Unified') || btn.textContent.includes('Bidirectional')) {
      console.log(`Button ${i}: "${btn.textContent.trim()}"`);
    }
  });
}