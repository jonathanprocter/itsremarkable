/**
 * Comprehensive Audit Validation Script
 * Tests the pixel-perfect fixes applied to the PDF export system
 */

// Execute validation tests
(async function runAuditValidation() {
  console.log('🔍 Starting Comprehensive Audit Validation...');
  
  // Test 1: Verify audit system is available
  console.log('\n📋 Test 1: Checking audit system availability...');
  
  if (typeof window.pixelPerfectAuditSystem !== 'undefined') {
    console.log('✅ Pixel-perfect audit system is available');
    
    try {
      // Test 2: Extract dashboard measurements
      console.log('\n📐 Test 2: Extracting dashboard measurements...');
      const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
      console.log('Dashboard measurements:', measurements);
      
      // Test 3: Generate pixel-perfect configuration
      console.log('\n⚙️ Test 3: Generating pixel-perfect configuration...');
      const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
      console.log('PDF configuration generated with dimensions:', {
        pageWidth: pdfConfig.pageWidth,
        pageHeight: pdfConfig.pageHeight,
        timeColumnWidth: pdfConfig.timeColumnWidth,
        dayColumnWidth: pdfConfig.dayColumnWidth,
        slotHeight: pdfConfig.slotHeight
      });
      
      // Test 4: Validate day column width calculation
      console.log('\n🧮 Test 4: Validating day column width calculation...');
      const expectedDayColumnWidth = 110;
      const actualDayColumnWidth = pdfConfig.dayColumnWidth;
      
      if (actualDayColumnWidth === expectedDayColumnWidth) {
        console.log('✅ Day column width is correct:', actualDayColumnWidth, 'px');
      } else {
        console.log('❌ Day column width mismatch:', {
          expected: expectedDayColumnWidth,
          actual: actualDayColumnWidth,
          difference: actualDayColumnWidth - expectedDayColumnWidth
        });
      }
      
      // Test 5: Run pixel-perfect audit
      console.log('\n🎯 Test 5: Running pixel-perfect audit...');
      const auditResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
      
      console.log('Audit Results:');
      console.log('  Score:', auditResult.score + '%');
      console.log('  Inconsistencies:', auditResult.inconsistencies?.length || 0);
      
      if (auditResult.inconsistencies && auditResult.inconsistencies.length > 0) {
        console.log('  Issues found:');
        auditResult.inconsistencies.forEach((issue, index) => {
          console.log(`    ${index + 1}. ${issue.property}: Expected ${issue.expected}, Got ${issue.actual}`);
        });
      } else {
        console.log('  ✅ No inconsistencies found!');
      }
      
      // Test 6: Test comprehensive audit system
      console.log('\n🔍 Test 6: Testing comprehensive audit system...');
      if (typeof window.comprehensiveAuditSystem !== 'undefined') {
        try {
          const comprehensiveResult = await window.comprehensiveAuditSystem.runComprehensiveAudit();
          console.log('Comprehensive audit score:', comprehensiveResult.score + '%');
          
          if (comprehensiveResult.issues && comprehensiveResult.issues.length > 0) {
            console.log('Comprehensive issues found:');
            comprehensiveResult.issues.forEach((issue, index) => {
              console.log(`  ${index + 1}. ${issue.category}: ${issue.description}`);
            });
          } else {
            console.log('  ✅ No comprehensive issues found!');
          }
        } catch (error) {
          console.log('  ⚠️ Comprehensive audit failed:', error.message);
        }
      } else {
        console.log('  ⚠️ Comprehensive audit system not available');
      }
      
      // Test 7: Summary
      console.log('\n📊 Validation Summary:');
      console.log('  - Audit system: ✅ Available');
      console.log('  - Dashboard measurements: ✅ Extracted');
      console.log('  - PDF configuration: ✅ Generated');
      console.log('  - Day column width: ' + (actualDayColumnWidth === expectedDayColumnWidth ? '✅ Correct' : '❌ Incorrect'));
      console.log('  - Pixel-perfect score: ' + auditResult.score + '%');
      console.log('  - Issues found: ' + (auditResult.inconsistencies?.length || 0));
      
      // Overall status
      const isFullyPixelPerfect = auditResult.score >= 100 && 
                                actualDayColumnWidth === expectedDayColumnWidth;
      
      if (isFullyPixelPerfect) {
        console.log('\n🎉 VALIDATION PASSED: System is 100% pixel-perfect!');
      } else {
        console.log('\n🔧 VALIDATION NEEDS ATTENTION: Issues detected');
      }
      
      return {
        success: true,
        auditScore: auditResult.score,
        dayColumnWidth: actualDayColumnWidth,
        isPixelPerfect: isFullyPixelPerfect,
        issues: auditResult.inconsistencies || []
      };
      
    } catch (error) {
      console.log('❌ Validation failed:', error.message);
      return { success: false, error: error.message };
    }
  } else {
    console.log('❌ Pixel-perfect audit system not available');
    return { success: false, error: 'Audit system not available' };
  }
})().then(result => {
  console.log('\n🏁 Validation complete!');
  window.validationResult = result;
  console.log('📋 Full results available at: window.validationResult');
}).catch(error => {
  console.log('❌ Validation error:', error);
});