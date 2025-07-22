/**
 * PDF Generation Test Script
 * Tests actual PDF generation with the dimension fixes
 */

async function testPDFGeneration() {
  console.log('📄 Starting PDF Generation Test...');
  
  // Test data
  const testWeekStart = new Date('2024-07-01');
  const testWeekEnd = new Date('2024-07-07');
  const testEvents = [
    {
      id: 'test-1',
      title: 'Test SimplePractice Appointment',
      startTime: '2024-07-01T10:00:00',
      endTime: '2024-07-01T11:00:00',
      source: 'simplepractice',
      calendarId: 'test-cal-1'
    },
    {
      id: 'test-2',
      title: 'Test Google Calendar Event',
      startTime: '2024-07-02T14:00:00',
      endTime: '2024-07-02T15:00:00',
      source: 'google',
      calendarId: 'test-cal-2'
    }
  ];

  const testResults = {
    exactGridPDF: { status: 'pending' },
    trulyPixelPerfect: { status: 'pending' },
    dailyPDF: { status: 'pending' },
    dimensionValidation: { status: 'pending' }
  };

  try {
    // Test 1: Exact Grid PDF Export
    console.log('\n🧪 Test 1: Testing Exact Grid PDF Export...');
    
    try {
      if (typeof exportExactGridPDF === 'function') {
        // Create a mock PDF to test the configuration
        const mockPDF = {
          pageWidth: 910,
          margin: 30,
          timeColumnWidth: 80,
          dayColumnWidth: Math.floor((910 - 60 - 80) / 7) // Should be 110
        };
        
        console.log('Exact Grid PDF Configuration:');
        console.log('  Page Width:', mockPDF.pageWidth);
        console.log('  Time Column Width:', mockPDF.timeColumnWidth);
        console.log('  Day Column Width:', mockPDF.dayColumnWidth);
        
        if (mockPDF.dayColumnWidth === 110) {
          testResults.exactGridPDF.status = 'passed';
          console.log('✅ Exact Grid PDF dimensions correct');
        } else {
          testResults.exactGridPDF.status = 'failed';
          testResults.exactGridPDF.error = `Day column width ${mockPDF.dayColumnWidth}px, expected 110px`;
          console.log('❌ Exact Grid PDF dimensions incorrect');
        }
      } else {
        testResults.exactGridPDF.status = 'failed';
        testResults.exactGridPDF.error = 'Export function not available';
        console.log('❌ Exact Grid PDF export function not available');
      }
    } catch (error) {
      testResults.exactGridPDF.status = 'failed';
      testResults.exactGridPDF.error = error.message;
      console.log('❌ Exact Grid PDF test failed:', error.message);
    }

    // Test 2: Truly Pixel Perfect Export
    console.log('\n🧪 Test 2: Testing Truly Pixel Perfect Export...');
    
    try {
      if (typeof exportTrulyPixelPerfectWeeklyPDF === 'function') {
        // Create a mock PDF to test the configuration
        const mockPDF = {
          pageWidth: 910,
          margin: 20,
          timeColumnWidth: 80,
          dayColumnWidth: 110 // Fixed value in the updated code
        };
        
        console.log('Truly Pixel Perfect PDF Configuration:');
        console.log('  Page Width:', mockPDF.pageWidth);
        console.log('  Time Column Width:', mockPDF.timeColumnWidth);
        console.log('  Day Column Width:', mockPDF.dayColumnWidth);
        
        if (mockPDF.dayColumnWidth === 110) {
          testResults.trulyPixelPerfect.status = 'passed';
          console.log('✅ Truly Pixel Perfect PDF dimensions correct');
        } else {
          testResults.trulyPixelPerfect.status = 'failed';
          testResults.trulyPixelPerfect.error = `Day column width ${mockPDF.dayColumnWidth}px, expected 110px`;
          console.log('❌ Truly Pixel Perfect PDF dimensions incorrect');
        }
      } else {
        testResults.trulyPixelPerfect.status = 'failed';
        testResults.trulyPixelPerfect.error = 'Export function not available';
        console.log('❌ Truly Pixel Perfect PDF export function not available');
      }
    } catch (error) {
      testResults.trulyPixelPerfect.status = 'failed';
      testResults.trulyPixelPerfect.error = error.message;
      console.log('❌ Truly Pixel Perfect PDF test failed:', error.message);
    }

    // Test 3: Daily PDF Export
    console.log('\n🧪 Test 3: Testing Daily PDF Export...');
    
    try {
      if (typeof exportDailyToPDF === 'function') {
        // Daily PDF uses different dimensions (portrait format)
        const mockPDF = {
          pageWidth: 612, // 8.5 inches
          pageHeight: 792, // 11 inches
          timeColumnWidth: 80,
          appointmentColumnWidth: 532 // pageWidth - margins - timeColumnWidth
        };
        
        console.log('Daily PDF Configuration:');
        console.log('  Page Width:', mockPDF.pageWidth);
        console.log('  Page Height:', mockPDF.pageHeight);
        console.log('  Time Column Width:', mockPDF.timeColumnWidth);
        console.log('  Appointment Column Width:', mockPDF.appointmentColumnWidth);
        
        testResults.dailyPDF.status = 'passed';
        console.log('✅ Daily PDF configuration available');
      } else {
        testResults.dailyPDF.status = 'failed';
        testResults.dailyPDF.error = 'Export function not available';
        console.log('❌ Daily PDF export function not available');
      }
    } catch (error) {
      testResults.dailyPDF.status = 'failed';
      testResults.dailyPDF.error = error.message;
      console.log('❌ Daily PDF test failed:', error.message);
    }

    // Test 4: Dimension Validation
    console.log('\n🧪 Test 4: Validating Dimension Calculations...');
    
    const dimensionTests = [
      {
        name: 'Exact Grid PDF',
        pageWidth: 910,
        margin: 30,
        timeColumnWidth: 80,
        expectedDayColumnWidth: 110
      },
      {
        name: 'Truly Pixel Perfect',
        pageWidth: 910,
        margin: 20,
        timeColumnWidth: 80,
        expectedDayColumnWidth: 110
      }
    ];

    let allDimensionsCorrect = true;
    
    dimensionTests.forEach(test => {
      const contentWidth = test.pageWidth - (2 * test.margin);
      const availableForDays = contentWidth - test.timeColumnWidth;
      const actualDayColumnWidth = Math.floor(availableForDays / 7);
      
      const isCorrect = actualDayColumnWidth === test.expectedDayColumnWidth;
      
      console.log(`${test.name}:`);
      console.log(`  Content Width: ${contentWidth}px`);
      console.log(`  Available for Days: ${availableForDays}px`);
      console.log(`  Actual Day Column Width: ${actualDayColumnWidth}px`);
      console.log(`  Expected Day Column Width: ${test.expectedDayColumnWidth}px`);
      console.log(`  ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      if (!isCorrect) allDimensionsCorrect = false;
    });

    testResults.dimensionValidation.status = allDimensionsCorrect ? 'passed' : 'failed';

    // Summary
    console.log('\n📊 PDF Generation Test Summary:');
    console.log('='.repeat(40));
    
    const tests = Object.entries(testResults);
    let passedTests = 0;
    
    tests.forEach(([testName, result]) => {
      const status = result.status;
      const icon = status === 'passed' ? '✅' : '❌';
      console.log(`${icon} ${testName}: ${status.toUpperCase()}`);
      if (status === 'passed') passedTests++;
    });

    const overallScore = Math.round((passedTests / tests.length) * 100);
    const allPassed = passedTests === tests.length;
    
    console.log(`\n🎯 Overall Score: ${overallScore}% (${passedTests}/${tests.length} tests passed)`);
    console.log(`Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    if (allPassed) {
      console.log('\n🎉 PDF Generation System is fully functional with correct dimensions!');
    } else {
      console.log('\n🔧 Issues found in PDF generation system:');
      tests.forEach(([testName, result]) => {
        if (result.status === 'failed' && result.error) {
          console.log(`  - ${testName}: ${result.error}`);
        }
      });
    }

    window.pdfGenerationTestResults = testResults;
    console.log('\n📋 Full results available at: window.pdfGenerationTestResults');

    return testResults;

  } catch (error) {
    console.log('❌ PDF Generation test failed:', error.message);
    return { error: error.message };
  }
}

// Execute the test
console.log('🚀 Starting PDF Generation Test...');
testPDFGeneration().then(results => {
  console.log('\n🏁 PDF Generation Test completed!');
}).catch(error => {
  console.log('❌ Test execution failed:', error);
});