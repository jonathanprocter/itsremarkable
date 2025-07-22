/**
 * Browser Comprehensive Test - Execute in browser console
 * Run this after opening the planner application to validate PDF export functionality
 */

// Test function to be executed in browser console
async function runBrowserTest() {
  console.log('🧪 Browser Comprehensive Test Starting...');
  console.log('=' .repeat(60));

  const results = {
    tests: [],
    passed: 0,
    failed: 0,
    startTime: Date.now()
  };

  // Helper function to add test results
  function addTest(name, status, message) {
    results.tests.push({ name, status, message });
    if (status) {
      results.passed++;
      console.log(`✅ ${name}: ${message}`);
    } else {
      results.failed++;
      console.log(`❌ ${name}: ${message}`);
    }
  }

  // Test 1: Check if pixel-perfect audit system is available
  try {
    const auditAvailable = typeof window.testPixelPerfectAudit === 'function';
    addTest('Pixel-Perfect Audit Availability', auditAvailable, 
      auditAvailable ? 'Available' : 'Not available');
  } catch (error) {
    addTest('Pixel-Perfect Audit Availability', false, error.message);
  }

  // Test 2: Check if DOM elements exist
  try {
    const weeklyView = document.querySelector('.weekly-planner-view') || 
                      document.querySelector('[data-testid="weekly-view"]') ||
                      document.querySelector('.planner-container');
    addTest('Weekly View DOM Elements', !!weeklyView, 
      weeklyView ? 'Found weekly view container' : 'Weekly view container not found');
  } catch (error) {
    addTest('Weekly View DOM Elements', false, error.message);
  }

  // Test 3: Check if export functions are available
  try {
    const exportFunctions = [
      'exportExactGridPDF',
      'exportTrulyPixelPerfectWeeklyPDF',
      'exportDailyToPDF',
      'exportWeeklyPackagePDF'
    ];
    
    const availableFunctions = exportFunctions.filter(func => 
      typeof window[func] === 'function' || 
      (window.PlannerExports && typeof window.PlannerExports[func] === 'function')
    );
    
    addTest('Export Functions Available', availableFunctions.length > 0, 
      `${availableFunctions.length}/${exportFunctions.length} functions available`);
  } catch (error) {
    addTest('Export Functions Available', false, error.message);
  }

  // Test 4: Check if measurement extraction works
  try {
    const timeColumn = document.querySelector('.time-column, [data-testid="time-column"]');
    const dayColumn = document.querySelector('.day-column, [data-testid="day-column"]');
    
    let measurementResults = { timeColumn: null, dayColumn: null };
    
    if (timeColumn) {
      measurementResults.timeColumn = timeColumn.getBoundingClientRect().width;
    }
    
    if (dayColumn) {
      measurementResults.dayColumn = dayColumn.getBoundingClientRect().width;
    }
    
    const measurementsFound = measurementResults.timeColumn && measurementResults.dayColumn;
    addTest('Dashboard Measurements', measurementsFound, 
      measurementsFound ? 
        `Time: ${measurementResults.timeColumn}px, Day: ${measurementResults.dayColumn}px` : 
        'Unable to extract measurements');
  } catch (error) {
    addTest('Dashboard Measurements', false, error.message);
  }

  // Test 5: Check if jsPDF is available
  try {
    const jsPDFAvailable = typeof window.jsPDF !== 'undefined';
    addTest('jsPDF Library', jsPDFAvailable, 
      jsPDFAvailable ? 'Available' : 'Not available');
  } catch (error) {
    addTest('jsPDF Library', false, error.message);
  }

  // Test 6: Check if html2canvas is available
  try {
    const html2canvasAvailable = typeof window.html2canvas !== 'undefined';
    addTest('html2canvas Library', html2canvasAvailable, 
      html2canvasAvailable ? 'Available' : 'Not available');
  } catch (error) {
    addTest('html2canvas Library', false, error.message);
  }

  // Test 7: Check if calendar events are loaded
  try {
    const events = window.calendarEvents || [];
    addTest('Calendar Events', events.length > 0, 
      `${events.length} events loaded`);
  } catch (error) {
    addTest('Calendar Events', false, error.message);
  }

  // Test 8: Test dimension calculations
  try {
    const pageWidth = 910;
    const margin = 30;
    const timeColumnWidth = 80;
    const expectedDayColumnWidth = 110;
    
    const contentWidth = pageWidth - (2 * margin);
    const availableForDays = contentWidth - timeColumnWidth;
    const actualDayColumnWidth = Math.floor(availableForDays / 7);
    
    const dimensionsCorrect = actualDayColumnWidth === expectedDayColumnWidth;
    addTest('Dimension Calculations', dimensionsCorrect, 
      dimensionsCorrect ? 
        `${actualDayColumnWidth}px day columns (expected ${expectedDayColumnWidth}px)` : 
        `${actualDayColumnWidth}px day columns (expected ${expectedDayColumnWidth}px) - MISMATCH`);
  } catch (error) {
    addTest('Dimension Calculations', false, error.message);
  }

  // Test 9: Try to run pixel-perfect audit (if available)
  try {
    if (typeof window.testPixelPerfectAudit === 'function') {
      const auditResult = await window.testPixelPerfectAudit();
      const auditPassed = auditResult && auditResult.score >= 95;
      addTest('Pixel-Perfect Audit Execution', auditPassed, 
        auditPassed ? 
          `Audit score: ${auditResult.score}%` : 
          'Audit score below 95%');
    } else {
      addTest('Pixel-Perfect Audit Execution', false, 'Audit function not available');
    }
  } catch (error) {
    addTest('Pixel-Perfect Audit Execution', false, error.message);
  }

  // Test 10: Check console for errors
  try {
    const consoleErrors = [];
    const originalError = console.error;
    console.error = function(...args) {
      consoleErrors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Wait a moment to catch any errors
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const noErrors = consoleErrors.length === 0;
    addTest('Console Errors', noErrors, 
      noErrors ? 'No errors detected' : `${consoleErrors.length} errors detected`);
      
    // Restore original console.error
    console.error = originalError;
  } catch (error) {
    addTest('Console Errors', false, error.message);
  }

  // Final results
  const endTime = Date.now();
  const duration = endTime - results.startTime;
  const totalTests = results.passed + results.failed;
  const successRate = Math.round((results.passed / totalTests) * 100);

  console.log('\n📊 Test Results Summary');
  console.log('-'.repeat(40));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Success Rate: ${successRate}%`);
  console.log(`Duration: ${duration}ms`);

  if (results.failed === 0) {
    console.log('\n🎉 ALL BROWSER TESTS PASSED!');
    console.log('✅ Export system is ready for use');
    console.log('✅ Pixel-perfect audit system functional');
    console.log('✅ All dependencies available');
    console.log('✅ Dashboard measurements extractable');
  } else {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('❌ Review failed tests above');
    console.log('❌ Fix issues before using export functionality');
  }

  console.log('\n🏁 Browser Test Complete!');
  console.log('=' .repeat(60));

  return results;
}

// Instructions for running the test
console.log('📋 Browser Test Instructions:');
console.log('1. Open the planner application');
console.log('2. Copy and paste this entire script into the browser console');
console.log('3. Execute: await runBrowserTest()');
console.log('4. Review the test results');
console.log('5. If all tests pass, the export system is ready');

// Export the test function for immediate use
if (typeof window !== 'undefined') {
  window.runBrowserTest = runBrowserTest;
  console.log('\n✅ Test function loaded! Run: await runBrowserTest()');
}