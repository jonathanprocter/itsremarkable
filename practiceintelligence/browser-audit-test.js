// Copy and paste this into your browser console to test the pixel-perfect audit system

console.log('🎯 Testing Pixel-Perfect Audit System');
console.log('Run this in your browser console while viewing the planner application');

// Test if the audit buttons exist and work
function testAuditButtons() {
  console.log('📋 Testing audit buttons...');
  
  // Look for audit buttons
  const auditButtons = document.querySelectorAll('button');
  const pixelAuditButton = Array.from(auditButtons).find(btn => 
    btn.textContent.includes('Pixel Audit') || btn.textContent.includes('Run Pixel Audit')
  );
  const comprehensiveAuditButton = Array.from(auditButtons).find(btn => 
    btn.textContent.includes('Comprehensive Audit')
  );
  
  console.log('🔍 Audit buttons found:', {
    pixelAuditButton: !!pixelAuditButton,
    comprehensiveAuditButton: !!comprehensiveAuditButton
  });
  
  return { pixelAuditButton, comprehensiveAuditButton };
}

// Test if the weekly planner view is rendered
function testWeeklyPlannerView() {
  console.log('📋 Testing weekly planner view...');
  
  const weeklyPlanner = document.querySelector('.weekly-planner-view');
  const timeColumn = document.querySelector('.time-column');
  const dayColumns = document.querySelectorAll('.day-column');
  
  console.log('🏗️ Weekly planner elements:', {
    weeklyPlanner: !!weeklyPlanner,
    timeColumn: !!timeColumn,
    dayColumns: dayColumns.length
  });
  
  return { weeklyPlanner, timeColumn, dayColumns };
}

// Test measurement extraction
function testMeasurements() {
  console.log('📋 Testing measurement extraction...');
  
  try {
    const timeColumn = document.querySelector('.time-column');
    if (timeColumn) {
      const rect = timeColumn.getBoundingClientRect();
      const style = window.getComputedStyle(timeColumn);
      
      console.log('📐 Time column measurements:', {
        width: rect.width,
        height: rect.height,
        computedWidth: style.width,
        backgroundColor: style.backgroundColor,
        fontSize: style.fontSize
      });
      
      return true;
    } else {
      console.log('❌ Time column not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error extracting measurements:', error);
    return false;
  }
}

// Test if html2canvas is available
function testScreenshotCapability() {
  console.log('📋 Testing screenshot capability...');
  
  if (typeof html2canvas !== 'undefined') {
    console.log('✅ html2canvas is available');
    return true;
  } else {
    console.log('❌ html2canvas not available');
    return false;
  }
}

// Run comprehensive test
function runPixelPerfectAuditTest() {
  console.log('🚀 Starting pixel-perfect audit system test');
  
  const results = {
    auditButtons: testAuditButtons(),
    weeklyPlannerView: testWeeklyPlannerView(),
    measurementExtraction: testMeasurements(),
    screenshotCapability: testScreenshotCapability()
  };
  
  console.log('📊 Test Summary:', {
    auditButtonsFound: !!(results.auditButtons.pixelAuditButton && results.auditButtons.comprehensiveAuditButton),
    weeklyPlannerRendered: !!(results.weeklyPlannerView.weeklyPlanner && results.weeklyPlannerView.timeColumn),
    measurementsWorking: results.measurementExtraction,
    screenshotReady: results.screenshotCapability
  });
  
  // Try to click the audit buttons if they exist
  if (results.auditButtons.pixelAuditButton) {
    console.log('🔧 Attempting to trigger pixel audit...');
    results.auditButtons.pixelAuditButton.click();
  }
  
  if (results.auditButtons.comprehensiveAuditButton) {
    console.log('🔧 Attempting to trigger comprehensive audit...');
    setTimeout(() => {
      results.auditButtons.comprehensiveAuditButton.click();
    }, 2000);
  }
  
  return results;
}

// Export test function
window.testPixelPerfectAuditSystem = runPixelPerfectAuditTest;

console.log('✅ Test functions loaded. Run window.testPixelPerfectAuditSystem() to begin testing');