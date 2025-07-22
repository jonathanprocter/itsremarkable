/**
 * Comprehensive audit execution to identify and fix issues
 */

// Execute comprehensive audit analysis
async function executeComprehensiveAudit() {
  console.log('🔍 Starting Comprehensive Audit Execution...');
  
  const auditResults = {
    pixelPerfectAudit: null,
    comprehensiveAudit: null,
    layoutIssues: [],
    measurementIssues: [],
    typographyIssues: [],
    colorIssues: [],
    recommendedFixes: []
  };
  
  try {
    // 1. Check audit system availability
    console.log('📋 Checking audit system availability...');
    
    if (typeof window.pixelPerfectAuditSystem === 'undefined') {
      console.log('❌ Pixel-perfect audit system not available');
      auditResults.recommendedFixes.push({
        category: 'system',
        issue: 'Pixel-perfect audit system not initialized',
        fix: 'Initialize pixel-perfect audit system in planner component'
      });
    } else {
      console.log('✅ Pixel-perfect audit system available');
      
      // 2. Extract dashboard measurements
      console.log('📐 Extracting dashboard measurements...');
      try {
        const measurements = await window.pixelPerfectAuditSystem.extractDashboardMeasurements();
        console.log('✅ Dashboard measurements extracted:', measurements);
        
        // Check for critical measurement issues
        if (measurements.timeColumnWidth !== 80) {
          auditResults.measurementIssues.push({
            property: 'timeColumnWidth',
            expected: 80,
            actual: measurements.timeColumnWidth,
            severity: 'high'
          });
        }
        
        if (measurements.dayColumnWidth !== 110) {
          auditResults.measurementIssues.push({
            property: 'dayColumnWidth',
            expected: 110,
            actual: measurements.dayColumnWidth,
            severity: 'high'
          });
        }
        
        if (measurements.timeSlotHeight !== 40) {
          auditResults.measurementIssues.push({
            property: 'timeSlotHeight',
            expected: 40,
            actual: measurements.timeSlotHeight,
            severity: 'high'
          });
        }
        
        // 3. Generate PDF configuration
        console.log('📄 Generating PDF configuration...');
        const pdfConfig = window.pixelPerfectAuditSystem.generatePixelPerfectConfig();
        console.log('✅ PDF configuration generated');
        
        // 4. Run pixel-perfect audit
        console.log('🎯 Running pixel-perfect audit...');
        const pixelPerfectResult = await window.pixelPerfectAuditSystem.runPixelPerfectAudit(pdfConfig);
        auditResults.pixelPerfectAudit = pixelPerfectResult;
        
        console.log('🎯 Pixel-Perfect Audit Results:');
        console.log('Score:', pixelPerfectResult.score + '%');
        console.log('Inconsistencies:', pixelPerfectResult.inconsistencies?.length || 0);
        
        // Analyze inconsistencies
        if (pixelPerfectResult.inconsistencies && pixelPerfectResult.inconsistencies.length > 0) {
          console.log('🔧 Pixel-perfect issues found:');
          pixelPerfectResult.inconsistencies.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.property}: Expected ${issue.expected}, Got ${issue.actual}`);
            
            // Categorize issues
            if (issue.property.includes('Width') || issue.property.includes('Height')) {
              auditResults.layoutIssues.push(issue);
            } else if (issue.property.includes('font') || issue.property.includes('Font')) {
              auditResults.typographyIssues.push(issue);
            } else if (issue.property.includes('color') || issue.property.includes('Color')) {
              auditResults.colorIssues.push(issue);
            } else {
              auditResults.measurementIssues.push(issue);
            }
          });
        }
        
      } catch (measurementError) {
        console.log('⚠️ Measurement extraction failed:', measurementError.message);
        auditResults.recommendedFixes.push({
          category: 'measurement',
          issue: 'Dashboard measurement extraction failed: ' + measurementError.message,
          fix: 'Use fallback measurements or fix DOM element selectors'
        });
      }
    }
    
    // 5. Check comprehensive audit system
    if (typeof window.comprehensiveAuditSystem !== 'undefined') {
      console.log('🔍 Running comprehensive audit...');
      try {
        const comprehensiveResult = await window.comprehensiveAuditSystem.runComprehensiveAudit();
        auditResults.comprehensiveAudit = comprehensiveResult;
        
        console.log('🔍 Comprehensive Audit Results:');
        console.log('Score:', comprehensiveResult.score + '%');
        
        if (comprehensiveResult.issues && comprehensiveResult.issues.length > 0) {
          console.log('🔧 Comprehensive issues found:');
          comprehensiveResult.issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue.category}: ${issue.description}`);
          });
        }
        
      } catch (comprehensiveError) {
        console.log('⚠️ Comprehensive audit failed:', comprehensiveError.message);
      }
    }
    
    // 6. Generate fix recommendations
    console.log('🔧 Generating fix recommendations...');
    
    // Layout fixes
    if (auditResults.layoutIssues.length > 0) {
      auditResults.recommendedFixes.push({
        category: 'layout',
        issue: `${auditResults.layoutIssues.length} layout measurement issues`,
        fix: 'Update PDF export functions to use exact dashboard measurements',
        details: auditResults.layoutIssues
      });
    }
    
    // Typography fixes
    if (auditResults.typographyIssues.length > 0) {
      auditResults.recommendedFixes.push({
        category: 'typography',
        issue: `${auditResults.typographyIssues.length} typography issues`,
        fix: 'Synchronize font sizes between dashboard and PDF exports',
        details: auditResults.typographyIssues
      });
    }
    
    // Color fixes
    if (auditResults.colorIssues.length > 0) {
      auditResults.recommendedFixes.push({
        category: 'color',
        issue: `${auditResults.colorIssues.length} color inconsistencies`,
        fix: 'Update PDF export color values to match dashboard exactly',
        details: auditResults.colorIssues
      });
    }
    
    // 7. Summary
    const totalIssues = auditResults.layoutIssues.length + 
                       auditResults.typographyIssues.length + 
                       auditResults.colorIssues.length + 
                       auditResults.measurementIssues.length;
    
    console.log('📊 Audit Summary:');
    console.log('- Total issues found:', totalIssues);
    console.log('- Layout issues:', auditResults.layoutIssues.length);
    console.log('- Typography issues:', auditResults.typographyIssues.length);
    console.log('- Color issues:', auditResults.colorIssues.length);
    console.log('- Measurement issues:', auditResults.measurementIssues.length);
    console.log('- Recommended fixes:', auditResults.recommendedFixes.length);
    
    // Store results globally
    window.auditResults = auditResults;
    
    if (totalIssues > 0) {
      console.log('🔧 Issues found - ready for fixing');
      console.log('📋 Access detailed results: window.auditResults');
    } else {
      console.log('✅ No issues found - system is perfect!');
    }
    
    return auditResults;
    
  } catch (error) {
    console.log('❌ Audit execution failed:', error.message);
    return { error: error.message };
  }
}

// Execute the comprehensive audit
executeComprehensiveAudit();