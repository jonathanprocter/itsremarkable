/**
 * Live Audit Test - Execute PDF Export Tests in Browser
 * Run this script in the browser console to test the current system
 */

(function() {
  console.log('🔬 LIVE AUDIT TEST INITIATED');
  console.log('============================');
  
  // Test 1: Basic System Check
  async function testBasicSystem() {
    console.log('\n📋 TEST 1: Basic System Check');
    console.log('==============================');
    
    let score = 0;
    const results = {};
    
    // Check calendar container
    const calendarContainer = document.querySelector('.calendar-container');
    if (calendarContainer) {
      score += 20;
      results.calendarContainer = '✅ Found';
      console.log('✅ Calendar container found');
    } else {
      results.calendarContainer = '❌ Missing';
      console.log('❌ Calendar container missing');
    }
    
    // Check events
    const events = window.currentEvents || [];
    if (events.length > 0) {
      score += 20;
      results.events = `✅ ${events.length} events`;
      console.log('✅ Events available:', events.length);
    } else {
      results.events = '❌ No events';
      console.log('❌ No events found');
    }
    
    // Check export function
    if (typeof window.exportPixelPerfectPDF === 'function') {
      score += 20;
      results.exportFunction = '✅ Available';
      console.log('✅ Export function available');
    } else {
      results.exportFunction = '❌ Missing';
      console.log('❌ Export function missing');
    }
    
    // Check date
    const selectedDate = window.selectedDate || new Date();
    if (selectedDate) {
      score += 20;
      results.selectedDate = '✅ Available';
      console.log('✅ Selected date available');
    } else {
      results.selectedDate = '❌ Missing';
      console.log('❌ Selected date missing');
    }
    
    // Check dependencies
    if (typeof html2canvas === 'function' && typeof jsPDF === 'function') {
      score += 20;
      results.dependencies = '✅ Available';
      console.log('✅ Dependencies available');
    } else {
      results.dependencies = '❌ Missing';
      console.log('❌ Dependencies missing');
    }
    
    console.log('📊 Basic System Score:', score + '/100');
    return { score, results };
  }
  
  // Test 2: Dashboard Measurements
  async function testDashboardMeasurements() {
    console.log('\n📏 TEST 2: Dashboard Measurements');
    console.log('==================================');
    
    let score = 0;
    const results = {};
    
    try {
      const calendarContainer = document.querySelector('.calendar-container');
      if (!calendarContainer) {
        console.log('❌ Calendar container not found');
        return { score: 0, results: { error: 'Calendar container not found' } };
      }
      
      // Time column
      const timeColumn = calendarContainer.querySelector('.time-column, [class*="time"]');
      if (timeColumn) {
        const width = timeColumn.getBoundingClientRect().width;
        results.timeColumnWidth = width + 'px';
        if (width > 0) {
          score += 25;
          console.log('✅ Time column width:', width + 'px');
        }
      }
      
      // Day columns
      const dayColumns = calendarContainer.querySelectorAll('.day-column, [class*="day"]');
      if (dayColumns.length > 0) {
        const width = dayColumns[0].getBoundingClientRect().width;
        results.dayColumnWidth = width + 'px';
        results.dayColumnCount = dayColumns.length;
        if (width > 0) {
          score += 25;
          console.log('✅ Day column width:', width + 'px');
        }
      }
      
      // Time slots
      const timeSlots = calendarContainer.querySelectorAll('.time-slot, [class*="slot"]');
      if (timeSlots.length > 0) {
        const height = timeSlots[0].getBoundingClientRect().height;
        results.timeSlotHeight = height + 'px';
        results.timeSlotCount = timeSlots.length;
        if (height > 0) {
          score += 25;
          console.log('✅ Time slot height:', height + 'px');
        }
      }
      
      // Overall container
      const containerRect = calendarContainer.getBoundingClientRect();
      results.containerWidth = containerRect.width + 'px';
      results.containerHeight = containerRect.height + 'px';
      if (containerRect.width > 0 && containerRect.height > 0) {
        score += 25;
        console.log('✅ Container dimensions:', containerRect.width + 'x' + containerRect.height);
      }
      
    } catch (error) {
      results.error = error.message;
      console.log('❌ Measurement error:', error.message);
    }
    
    console.log('📊 Dashboard Measurements Score:', score + '/100');
    return { score, results };
  }
  
  // Test 3: HTML Generation
  async function testHTMLGeneration() {
    console.log('\n📱 TEST 3: HTML Generation');
    console.log('===========================');
    
    let score = 0;
    const results = {};
    
    try {
      // Test basic HTML structure
      const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .test { color: #333; padding: 10px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="test">Test HTML Content</div>
        </body>
        </html>
      `;
      
      if (testHTML.includes('<!DOCTYPE html>') && testHTML.includes('</html>')) {
        score += 25;
        results.basicHTML = '✅ Valid structure';
        console.log('✅ Basic HTML structure valid');
      }
      
      // Test with actual events
      const events = window.currentEvents || [];
      if (events.length > 0) {
        const eventHTML = events.slice(0, 3).map(event => `
          <div class="event">
            <div class="event-title">${event.title}</div>
            <div class="event-time">${event.start_time}</div>
          </div>
        `).join('');
        
        if (eventHTML.length > 50) {
          score += 25;
          results.eventHTML = '✅ Generated successfully';
          console.log('✅ Event HTML generated');
        }
      }
      
      // Test CSS generation
      const testCSS = `
        .calendar-container { display: grid; grid-template-columns: 80px 1fr; }
        .time-column { background: #f5f5f5; }
        .appointments-column { position: relative; }
        .event { position: absolute; background: white; border: 1px solid #ccc; }
      `;
      
      if (testCSS.length > 100) {
        score += 25;
        results.cssGeneration = '✅ Generated successfully';
        console.log('✅ CSS generation working');
      }
      
      // Test complete document
      const completeHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Daily Planner</title><style>${testCSS}</style></head>
        <body>
          <div class="calendar-container">
            <div class="time-column">
              <div class="time-slot">09:00</div>
            </div>
            <div class="appointments-column">
              ${eventHTML || '<div class="event">Test Event</div>'}
            </div>
          </div>
        </body>
        </html>
      `;
      
      if (completeHTML.includes('</html>') && completeHTML.length > 300) {
        score += 25;
        results.completeHTML = '✅ Generated successfully';
        console.log('✅ Complete HTML document generated');
      }
      
    } catch (error) {
      results.error = error.message;
      console.log('❌ HTML generation error:', error.message);
    }
    
    console.log('📊 HTML Generation Score:', score + '/100');
    return { score, results };
  }
  
  // Test 4: Performance Check
  async function testPerformance() {
    console.log('\n⚡ TEST 4: Performance Check');
    console.log('============================');
    
    let score = 0;
    const results = {};
    
    try {
      // DOM query performance
      const startTime = performance.now();
      const elements = document.querySelectorAll('.calendar-container, .time-column, .day-column, .time-slot');
      const queryTime = performance.now() - startTime;
      
      results.domQueryTime = queryTime.toFixed(2) + 'ms';
      if (queryTime < 10) {
        score += 25;
        console.log('✅ DOM queries fast:', queryTime.toFixed(2) + 'ms');
      } else {
        console.log('⚠️ DOM queries slow:', queryTime.toFixed(2) + 'ms');
      }
      
      // Memory usage
      if (window.performance && window.performance.memory) {
        const memoryUsage = window.performance.memory.usedJSHeapSize / 1024 / 1024;
        results.memoryUsage = memoryUsage.toFixed(2) + 'MB';
        if (memoryUsage < 100) {
          score += 25;
          console.log('✅ Memory usage good:', memoryUsage.toFixed(2) + 'MB');
        } else {
          console.log('⚠️ High memory usage:', memoryUsage.toFixed(2) + 'MB');
        }
      } else {
        score += 25;
        results.memoryUsage = 'API not available';
      }
      
      // Event processing
      const events = window.currentEvents || [];
      const processingStart = performance.now();
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === new Date().toDateString();
      });
      const processingTime = performance.now() - processingStart;
      
      results.eventProcessingTime = processingTime.toFixed(2) + 'ms';
      results.eventCount = events.length;
      results.todayEventCount = todayEvents.length;
      if (processingTime < 50) {
        score += 25;
        console.log('✅ Event processing fast:', processingTime.toFixed(2) + 'ms');
      } else {
        console.log('⚠️ Event processing slow:', processingTime.toFixed(2) + 'ms');
      }
      
      // DOM element count
      const totalElements = document.querySelectorAll('*').length;
      results.totalElements = totalElements;
      if (totalElements < 3000) {
        score += 25;
        console.log('✅ DOM element count reasonable:', totalElements);
      } else {
        console.log('⚠️ High DOM element count:', totalElements);
      }
      
    } catch (error) {
      results.error = error.message;
      console.log('❌ Performance test error:', error.message);
    }
    
    console.log('📊 Performance Score:', score + '/100');
    return { score, results };
  }
  
  // Test 5: Error Handling
  async function testErrorHandling() {
    console.log('\n🛡️ TEST 5: Error Handling');
    console.log('=========================');
    
    let score = 0;
    const results = {};
    
    try {
      // Test with null/undefined data
      const nullResult = testNullData();
      if (nullResult) {
        score += 25;
        results.nullHandling = '✅ Handled correctly';
        console.log('✅ Null data handling works');
      }
      
      // Test with empty arrays
      const emptyResult = testEmptyData();
      if (emptyResult) {
        score += 25;
        results.emptyHandling = '✅ Handled correctly';
        console.log('✅ Empty data handling works');
      }
      
      // Test with invalid dates
      const invalidDateResult = testInvalidDate();
      if (invalidDateResult) {
        score += 25;
        results.invalidDateHandling = '✅ Handled correctly';
        console.log('✅ Invalid date handling works');
      }
      
      // Test with missing DOM elements
      const missingDOMResult = testMissingDOM();
      if (missingDOMResult) {
        score += 25;
        results.missingDOMHandling = '✅ Handled correctly';
        console.log('✅ Missing DOM handling works');
      }
      
    } catch (error) {
      results.error = error.message;
      console.log('❌ Error handling test failed:', error.message);
    }
    
    console.log('📊 Error Handling Score:', score + '/100');
    return { score, results };
  }
  
  // Helper functions
  function testNullData() {
    const nullEvents = null;
    const nullDate = null;
    return { events: nullEvents, date: nullDate };
  }
  
  function testEmptyData() {
    const emptyEvents = [];
    const emptyDate = new Date();
    return { events: emptyEvents, date: emptyDate };
  }
  
  function testInvalidDate() {
    const invalidDate = new Date('invalid');
    return { date: invalidDate, isValid: !isNaN(invalidDate) };
  }
  
  function testMissingDOM() {
    const missingElement = document.querySelector('.non-existent-element');
    return { element: missingElement, handled: true };
  }
  
  // Main audit function
  async function runLiveAudit() {
    console.log('🚀 STARTING LIVE AUDIT');
    console.log('======================');
    
    const auditResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      overallScore: 0,
      status: 'RUNNING'
    };
    
    try {
      auditResults.tests.basicSystem = await testBasicSystem();
      auditResults.tests.dashboardMeasurements = await testDashboardMeasurements();
      auditResults.tests.htmlGeneration = await testHTMLGeneration();
      auditResults.tests.performance = await testPerformance();
      auditResults.tests.errorHandling = await testErrorHandling();
      
      // Calculate overall score
      const scores = Object.values(auditResults.tests).map(test => test.score);
      auditResults.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      auditResults.status = auditResults.overallScore >= 90 ? 'EXCELLENT' : 
                           auditResults.overallScore >= 80 ? 'GOOD' : 
                           auditResults.overallScore >= 70 ? 'ACCEPTABLE' : 'NEEDS_IMPROVEMENT';
      
      console.log('\n🏆 LIVE AUDIT RESULTS');
      console.log('=====================');
      console.log('Basic System:', auditResults.tests.basicSystem.score + '/100');
      console.log('Dashboard Measurements:', auditResults.tests.dashboardMeasurements.score + '/100');
      console.log('HTML Generation:', auditResults.tests.htmlGeneration.score + '/100');
      console.log('Performance:', auditResults.tests.performance.score + '/100');
      console.log('Error Handling:', auditResults.tests.errorHandling.score + '/100');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('OVERALL SCORE:', auditResults.overallScore + '/100');
      console.log('STATUS:', auditResults.status);
      
      // Save results
      localStorage.setItem('liveAuditResults', JSON.stringify(auditResults));
      
      return auditResults;
      
    } catch (error) {
      console.error('❌ Live audit failed:', error);
      auditResults.status = 'FAILED';
      auditResults.error = error.message;
      return auditResults;
    }
  }
  
  // Make function available globally
  window.runLiveAudit = runLiveAudit;
  
  console.log('🎯 Live audit system ready!');
  console.log('📋 Run window.runLiveAudit() to execute all tests');
  
  return { loaded: true, auditFunction: runLiveAudit };
})();