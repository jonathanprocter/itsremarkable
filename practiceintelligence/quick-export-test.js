// Quick export test
console.log('🎯 Quick export test...');
const btn = Array.from(document.querySelectorAll('button')).find(b => 
  b.textContent.includes('Bidirectional Weekly Package')
);
if (btn) {
  console.log('✅ Found button, clicking...');
  btn.click();
  console.log('✅ Clicked! Check for download...');
} else {
  console.log('❌ Button not found. Current view:', document.querySelector('h2')?.textContent);
}