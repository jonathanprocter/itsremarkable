/**
 * Test script for pixel-perfect weekly export
 * This will trigger the export and verify the output
 */

console.log('🎯 TESTING PIXEL-PERFECT WEEKLY EXPORT');
console.log('='.repeat(60));

// Test the pixel-perfect export by triggering it through the global test function
if (typeof window !== 'undefined' && window.testPixelPerfectAudit) {
  console.log('✅ Found testPixelPerfectAudit function, running test...');
  window.testPixelPerfectAudit();
} else {
  console.log('❌ testPixelPerfectAudit function not found');
  console.log('Available global functions:', Object.keys(window).filter(key => key.includes('test') || key.includes('export')));
}

// Also test direct export function if available
if (typeof window !== 'undefined' && window.testDailyExport) {
  console.log('✅ Found testDailyExport function, testing...');
  window.testDailyExport();
}

console.log('Test script completed. Check console output for results.');