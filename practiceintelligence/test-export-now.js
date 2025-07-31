// Simple direct test of bidirectional export
console.log('🎯 Testing bidirectional export...');

// Find and click the button
const btn = Array.from(document.querySelectorAll('button')).find(b => 
  b.textContent.includes('Bidirectional Weekly Package')
);

if (btn) {
  console.log('✅ Found button, clicking...');
  
  // Monitor for errors
  window.addEventListener('error', (e) => {
    console.error('❌ Error:', e.message, e);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Rejection:', e.reason);
  });
  
  // Click it
  btn.click();
  console.log('✅ Clicked! Check console for export logs...');
} else {
  console.log('❌ Button not found');
  
  // Check current view
  const title = document.querySelector('h2')?.textContent;
  console.log('📍 Current view:', title);
  
  if (title?.includes('Tuesday')) {
    console.log('💡 In daily view - need to switch to weekly view first');
  }
}