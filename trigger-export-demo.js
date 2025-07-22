// Trigger Daily PDF Export to Demonstrate Audit System
// This script simulates clicking the "Daily View" export button

console.log('🚀 TRIGGERING DAILY PDF EXPORT TO DEMONSTRATE AUDIT SYSTEM');
console.log('============================================================');

// Find the export button and trigger it
const exportButtons = document.querySelectorAll('button');
let dailyExportButton = null;

exportButtons.forEach(button => {
  if (button.textContent.includes('Daily View') || button.textContent.includes('Daily')) {
    dailyExportButton = button;
  }
});

if (dailyExportButton) {
  console.log('✅ Found Daily View export button, triggering export...');
  dailyExportButton.click();
} else {
  console.log('⚠️  Daily View export button not found');
  console.log('Available buttons:', Array.from(exportButtons).map(b => b.textContent));
}

// Alternative: Trigger export through window functions if available
if (window.handleExportAction) {
  console.log('🔄 Triggering export through window.handleExportAction...');
  window.handleExportAction('Daily View');
} else if (window.testAuditSystem) {
  console.log('🔍 Running audit system test...');
  window.testAuditSystem();
} else {
  console.log('📋 Available window functions:', Object.keys(window).filter(k => k.includes('export') || k.includes('audit')));
}

console.log('🎯 Watch the console for audit system output...');