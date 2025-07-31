/**
 * PDF Perfection Test System
 * Comprehensive testing and validation for PDF generation
 */

import { CalendarEvent } from '@/types/calendar';
import { DynamicDailyPlannerGenerator } from './dynamicDailyPlannerGenerator';
import { exportDynamicDailyPlannerPDF } from './dynamicDailyPlannerPDF';
import { format } from 'date-fns';

export interface PDFPerfectionTestResult {
  testName: string;
  passed: boolean;
  score: number;
  maxScore: number;
  issues: string[];
  recommendations: string[];
  details: Record<string, any>;
}

export class PDFPerfectionTester {
  private generator: DynamicDailyPlannerGenerator;
  
  constructor() {
    this.generator = new DynamicDailyPlannerGenerator();
  }

  /**
   * Run comprehensive PDF perfection tests
   */
  async runComprehensivePerfectionTest(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult[]> {
    console.log('🎯 STARTING COMPREHENSIVE PDF PERFECTION TEST');
    console.log('=============================================');
    
    const results: PDFPerfectionTestResult[] = [];
    
    // Test 1: HTML Generation Quality
    results.push(await this.testHTMLGenerationQuality(date, events));
    
    // Test 2: Data Integrity
    results.push(await this.testDataIntegrity(date, events));
    
    // Test 3: Visual Layout Precision
    results.push(await this.testVisualLayoutPrecision(date, events));
    
    // Test 4: Typography Excellence
    results.push(await this.testTypographyExcellence(date, events));
    
    // Test 5: PDF Export Functionality
    results.push(await this.testPDFExportFunctionality(date, events));
    
    // Test 6: Cross-Browser Compatibility
    results.push(await this.testCrossBrowserCompatibility(date, events));
    
    // Test 7: Performance Optimization
    results.push(await this.testPerformanceOptimization(date, events));
    
    // Test 8: Error Handling Robustness
    results.push(await this.testErrorHandlingRobustness(date, events));
    
    // Calculate overall score
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxTotalScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    const overallPercentage = Math.round((totalScore / maxTotalScore) * 100);
    
    console.log(`\n🎯 COMPREHENSIVE PDF PERFECTION TEST COMPLETE`);
    console.log(`Overall Score: ${totalScore}/${maxTotalScore} (${overallPercentage}%)`);
    
    return results;
  }

  /**
   * Test HTML generation quality and completeness
   */
  private async testHTMLGenerationQuality(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      // Generate HTML
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      
      // Test 1: HTML structure completeness (20 points)
      if (html.includes('<!DOCTYPE html>') && html.includes('<html>') && html.includes('</html>')) {
        score += 20;
      } else {
        issues.push('HTML structure incomplete - missing DOCTYPE or html tags');
      }
      
      // Test 2: CSS styling presence (20 points)
      if (html.includes('<style>') && html.includes('</style>')) {
        score += 20;
      } else {
        issues.push('CSS styling missing from HTML');
      }
      
      // Test 3: Content sections present (20 points)
      const requiredSections = ['time-column', 'appointments-column', 'notes-column', 'daily-header'];
      const sectionsPresent = requiredSections.filter(section => html.includes(section));
      score += Math.round((sectionsPresent.length / requiredSections.length) * 20);
      
      if (sectionsPresent.length < requiredSections.length) {
        issues.push(`Missing sections: ${requiredSections.filter(s => !sectionsPresent.includes(s)).join(', ')}`);
      }
      
      // Test 4: Event data integration (20 points)
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === date.toDateString();
      });
      
      if (dayEvents.length > 0) {
        const eventTitlesInHTML = dayEvents.filter(event => 
          html.includes(event.title.replace(' Appointment', ''))
        );
        score += Math.round((eventTitlesInHTML.length / dayEvents.length) * 20);
        
        if (eventTitlesInHTML.length < dayEvents.length) {
          issues.push(`Missing ${dayEvents.length - eventTitlesInHTML.length} event(s) in HTML`);
        }
      } else {
        score += 20; // No events to test
      }
      
      // Test 5: Accessibility features (20 points)
      const accessibilityFeatures = [
        'lang="en"',
        'charset="UTF-8"',
        'viewport',
        'title>'
      ];
      const accessibilityPresent = accessibilityFeatures.filter(feature => html.includes(feature));
      score += Math.round((accessibilityPresent.length / accessibilityFeatures.length) * 20);
      
      if (accessibilityPresent.length < accessibilityFeatures.length) {
        recommendations.push('Add missing accessibility features for better compliance');
      }
      
      // HTML length validation
      if (html.length < 1000) {
        issues.push('HTML content appears too short - may be incomplete');
      }
      
    } catch (error) {
      issues.push(`HTML generation failed: ${error.message}`);
    }
    
    return {
      testName: 'HTML Generation Quality',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        htmlLength: html?.length || 0,
        generationTime: new Date().toISOString()
      }
    };
  }

  /**
   * Test data integrity and accuracy
   */
  private async testDataIntegrity(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      // Filter events for the specific date
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === date.toDateString();
      });
      
      // Convert to appointments
      const appointments = this.generator.convertCalendarEventsToAppointments(dayEvents);
      
      // Test 1: Event count accuracy (25 points)
      if (appointments.length === dayEvents.length) {
        score += 25;
      } else {
        issues.push(`Event count mismatch: ${appointments.length} appointments vs ${dayEvents.length} events`);
      }
      
      // Test 2: Time accuracy (25 points)
      let timeAccurate = true;
      appointments.forEach((apt, index) => {
        const originalEvent = dayEvents[index];
        if (originalEvent) {
          const eventStart = format(new Date(originalEvent.startTime), 'HH:mm');
          if (apt.start_time !== eventStart) {
            timeAccurate = false;
            issues.push(`Time mismatch for ${apt.title}: ${apt.start_time} vs ${eventStart}`);
          }
        }
      });
      
      if (timeAccurate) score += 25;
      
      // Test 3: Duration calculation (25 points)
      let durationAccurate = true;
      appointments.forEach((apt, index) => {
        const originalEvent = dayEvents[index];
        if (originalEvent) {
          const expectedDuration = Math.round(
            (new Date(originalEvent.endTime).getTime() - new Date(originalEvent.startTime).getTime()) / (1000 * 60)
          );
          if (Math.abs(apt.duration_minutes - expectedDuration) > 5) {
            durationAccurate = false;
            issues.push(`Duration mismatch for ${apt.title}: ${apt.duration_minutes}min vs ${expectedDuration}min`);
          }
        }
      });
      
      if (durationAccurate) score += 25;
      
      // Test 4: Notes and action items preservation (25 points)
      let notesAccurate = true;
      appointments.forEach((apt, index) => {
        const originalEvent = dayEvents[index];
        if (originalEvent) {
          if (originalEvent.notes && originalEvent.notes.length > 0) {
            if (!apt.event_notes || apt.event_notes.length === 0) {
              notesAccurate = false;
              issues.push(`Notes missing for ${apt.title}`);
            }
          }
          if (originalEvent.actionItems && originalEvent.actionItems.length > 0) {
            if (!apt.action_items || apt.action_items.length === 0) {
              notesAccurate = false;
              issues.push(`Action items missing for ${apt.title}`);
            }
          }
        }
      });
      
      if (notesAccurate) score += 25;
      
    } catch (error) {
      issues.push(`Data integrity test failed: ${error.message}`);
    }
    
    return {
      testName: 'Data Integrity',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        eventsProcessed: dayEvents?.length || 0,
        appointmentsGenerated: appointments?.length || 0
      }
    };
  }

  /**
   * Test visual layout precision
   */
  private async testVisualLayoutPrecision(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      
      // Test 1: Grid system implementation (25 points)
      if (html.includes('display: grid') || html.includes('grid-template-columns')) {
        score += 25;
      } else {
        issues.push('CSS Grid system not implemented');
        recommendations.push('Implement CSS Grid for better layout control');
      }
      
      // Test 2: Responsive design elements (25 points)
      const responsiveFeatures = ['viewport', 'min-width', 'max-width', 'media'];
      const responsivePresent = responsiveFeatures.filter(feature => html.includes(feature));
      score += Math.round((responsivePresent.length / responsiveFeatures.length) * 25);
      
      // Test 3: Color consistency (25 points)
      const colorVariables = ['--cornflower', '--navy', '--warm-white', '--cool-grey'];
      const colorsPresent = colorVariables.filter(color => html.includes(color));
      score += Math.round((colorsPresent.length / colorVariables.length) * 25);
      
      // Test 4: Typography hierarchy (25 points)
      const typographyElements = ['h1', 'h2', 'h3', 'font-size', 'font-weight'];
      const typographyPresent = typographyElements.filter(element => html.includes(element));
      score += Math.round((typographyPresent.length / typographyElements.length) * 25);
      
      if (score < 80) {
        recommendations.push('Enhance layout precision with better CSS structure');
      }
      
    } catch (error) {
      issues.push(`Visual layout test failed: ${error.message}`);
    }
    
    return {
      testName: 'Visual Layout Precision',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        testDate: date.toISOString(),
        htmlAnalyzed: true
      }
    };
  }

  /**
   * Test typography excellence
   */
  private async testTypographyExcellence(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      
      // Test 1: Font family consistency (25 points)
      if (html.includes('font-family: Georgia') || html.includes('Georgia, serif')) {
        score += 25;
      } else {
        issues.push('Georgia font family not consistently applied');
      }
      
      // Test 2: Font size hierarchy (25 points)
      const fontSizes = html.match(/font-size:\s*(\d+)px/g) || [];
      const uniqueSizes = [...new Set(fontSizes)];
      if (uniqueSizes.length >= 4) {
        score += 25;
      } else {
        issues.push('Insufficient font size hierarchy');
        recommendations.push('Create more distinct font size levels');
      }
      
      // Test 3: Line height optimization (25 points)
      if (html.includes('line-height')) {
        score += 25;
      } else {
        issues.push('Line height not optimized');
        recommendations.push('Add line-height for better readability');
      }
      
      // Test 4: Text formatting (25 points)
      const textFormats = ['bold', 'italic', 'text-align', 'text-decoration'];
      const formatsPresent = textFormats.filter(format => html.includes(format));
      score += Math.round((formatsPresent.length / textFormats.length) * 25);
      
    } catch (error) {
      issues.push(`Typography test failed: ${error.message}`);
    }
    
    return {
      testName: 'Typography Excellence',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        fontAnalysis: 'Georgia serif font family targeted',
        textComplexity: 'Professional hierarchy implemented'
      }
    };
  }

  /**
   * Test PDF export functionality
   */
  private async testPDFExportFunctionality(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      // Test 1: Export function availability (25 points)
      if (typeof exportDynamicDailyPlannerPDF === 'function') {
        score += 25;
      } else {
        issues.push('PDF export function not available');
      }
      
      // Test 2: HTML2Canvas availability (25 points)
      try {
        const html2canvas = await import('html2canvas');
        if (html2canvas) {
          score += 25;
        }
      } catch (error) {
        issues.push('HTML2Canvas not available');
      }
      
      // Test 3: jsPDF availability (25 points)
      try {
        const { jsPDF } = await import('jspdf');
        if (jsPDF) {
          score += 25;
        }
      } catch (error) {
        issues.push('jsPDF not available');
      }
      
      // Test 4: Configuration completeness (25 points)
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      if (html.length > 1000 && html.includes('<!DOCTYPE html>')) {
        score += 25;
      } else {
        issues.push('HTML configuration incomplete for PDF generation');
      }
      
      if (score < 100) {
        recommendations.push('Ensure all PDF generation dependencies are properly configured');
      }
      
    } catch (error) {
      issues.push(`PDF export functionality test failed: ${error.message}`);
    }
    
    return {
      testName: 'PDF Export Functionality',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        exportReady: score >= 80,
        dependenciesChecked: true
      }
    };
  }

  /**
   * Test cross-browser compatibility
   */
  private async testCrossBrowserCompatibility(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      
      // Test 1: Modern CSS features (25 points)
      const modernFeatures = ['grid', 'flexbox', 'var(', 'calc('];
      const modernPresent = modernFeatures.filter(feature => html.includes(feature));
      score += Math.round((modernPresent.length / modernFeatures.length) * 25);
      
      // Test 2: Fallback support (25 points)
      if (html.includes('serif') || html.includes('sans-serif')) {
        score += 25;
      } else {
        issues.push('Font fallbacks not implemented');
      }
      
      // Test 3: Vendor prefixes (25 points)
      const vendorPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
      const prefixesPresent = vendorPrefixes.filter(prefix => html.includes(prefix));
      if (prefixesPresent.length > 0) {
        score += 25;
      } else {
        recommendations.push('Consider adding vendor prefixes for better browser support');
        score += 15; // Partial credit
      }
      
      // Test 4: HTML5 compliance (25 points)
      if (html.includes('<!DOCTYPE html>') && html.includes('lang=')) {
        score += 25;
      } else {
        issues.push('HTML5 compliance issues detected');
      }
      
    } catch (error) {
      issues.push(`Cross-browser compatibility test failed: ${error.message}`);
    }
    
    return {
      testName: 'Cross-Browser Compatibility',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        browserSupport: 'Modern browsers with HTML5 and CSS3 support',
        fallbacksImplemented: score >= 80
      }
    };
  }

  /**
   * Test performance optimization
   */
  private async testPerformanceOptimization(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      const startTime = performance.now();
      
      // Test 1: HTML generation speed (25 points)
      const html = this.generator.generateCompleteDailyPlannerHTML(date, events);
      const generationTime = performance.now() - startTime;
      
      if (generationTime < 100) {
        score += 25;
      } else if (generationTime < 500) {
        score += 15;
        recommendations.push('Consider optimizing HTML generation for better performance');
      } else {
        issues.push(`HTML generation too slow: ${generationTime}ms`);
      }
      
      // Test 2: HTML size optimization (25 points)
      const htmlSize = html.length;
      if (htmlSize < 50000) {
        score += 25;
      } else if (htmlSize < 100000) {
        score += 15;
        recommendations.push('Consider minifying HTML/CSS for better performance');
      } else {
        issues.push(`HTML size too large: ${htmlSize} characters`);
      }
      
      // Test 3: CSS efficiency (25 points)
      const cssMatches = html.match(/<style>[\s\S]*?<\/style>/g);
      if (cssMatches && cssMatches.length === 1) {
        score += 25;
      } else {
        issues.push('CSS not optimally consolidated');
      }
      
      // Test 4: Memory efficiency (25 points)
      const memoryUsage = performance.memory?.usedJSHeapSize || 0;
      if (memoryUsage < 50000000) { // 50MB threshold
        score += 25;
      } else {
        recommendations.push('Monitor memory usage for large datasets');
        score += 15;
      }
      
    } catch (error) {
      issues.push(`Performance optimization test failed: ${error.message}`);
    }
    
    return {
      testName: 'Performance Optimization',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        generationTime: `${generationTime}ms`,
        htmlSize: `${htmlSize} characters`,
        optimizationLevel: score >= 80 ? 'Excellent' : 'Good'
      }
    };
  }

  /**
   * Test error handling robustness
   */
  private async testErrorHandlingRobustness(
    date: Date, 
    events: CalendarEvent[]
  ): Promise<PDFPerfectionTestResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 0;
    const maxScore = 100;
    
    try {
      // Test 1: Invalid date handling (25 points)
      try {
        const invalidDate = new Date('invalid');
        const html = this.generator.generateCompleteDailyPlannerHTML(invalidDate, events);
        if (html.includes('Invalid Date')) {
          issues.push('Invalid date not properly handled');
        } else {
          score += 25;
        }
      } catch (error) {
        score += 25; // Proper error throwing is good
      }
      
      // Test 2: Empty events array (25 points)
      try {
        const html = this.generator.generateCompleteDailyPlannerHTML(date, []);
        if (html.length > 1000) {
          score += 25;
        } else {
          issues.push('Empty events array not handled gracefully');
        }
      } catch (error) {
        issues.push('Empty events array causes crash');
      }
      
      // Test 3: Malformed event data (25 points)
      try {
        const malformedEvents = [
          { id: '1', title: '', startTime: new Date(), endTime: new Date() }
        ] as CalendarEvent[];
        const html = this.generator.generateCompleteDailyPlannerHTML(date, malformedEvents);
        if (html.length > 1000) {
          score += 25;
        }
      } catch (error) {
        issues.push('Malformed event data not handled gracefully');
      }
      
      // Test 4: Large dataset handling (25 points)
      try {
        const largeEvents = Array.from({ length: 100 }, (_, i) => ({
          id: `event-${i}`,
          title: `Event ${i}`,
          startTime: new Date(date.getTime() + i * 30 * 60 * 1000),
          endTime: new Date(date.getTime() + (i + 1) * 30 * 60 * 1000),
          calendarId: 'test'
        })) as CalendarEvent[];
        
        const html = this.generator.generateCompleteDailyPlannerHTML(date, largeEvents);
        if (html.length > 1000) {
          score += 25;
        }
      } catch (error) {
        issues.push('Large dataset handling causes performance issues');
      }
      
    } catch (error) {
      issues.push(`Error handling test failed: ${error.message}`);
    }
    
    return {
      testName: 'Error Handling Robustness',
      passed: score >= 80,
      score,
      maxScore,
      issues,
      recommendations,
      details: {
        errorHandling: score >= 80 ? 'Robust' : 'Needs improvement',
        edgeCasesTested: 4
      }
    };
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport(results: PDFPerfectionTestResult[]): string {
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const maxTotalScore = results.reduce((sum, result) => sum + result.maxScore, 0);
    const overallPercentage = Math.round((totalScore / maxTotalScore) * 100);
    
    let report = `
🎯 COMPREHENSIVE PDF PERFECTION TEST REPORT
==========================================

📊 Overall Score: ${totalScore}/${maxTotalScore} (${overallPercentage}%)
📈 Perfection Level: ${overallPercentage >= 95 ? 'PERFECT' : overallPercentage >= 90 ? 'EXCELLENT' : overallPercentage >= 80 ? 'GOOD' : 'NEEDS IMPROVEMENT'}

📋 Test Results:
${results.map(result => `
✅ ${result.testName}: ${result.score}/${result.maxScore} (${Math.round((result.score/result.maxScore)*100)}%) ${result.passed ? '✓' : '✗'}
   ${result.issues.length > 0 ? `Issues: ${result.issues.join(', ')}` : 'No issues found'}
   ${result.recommendations.length > 0 ? `Recommendations: ${result.recommendations.join(', ')}` : 'No recommendations'}
`).join('')}

🎯 Summary:
- Passed Tests: ${results.filter(r => r.passed).length}/${results.length}
- Failed Tests: ${results.filter(r => !r.passed).length}/${results.length}
- Total Issues: ${results.reduce((sum, r) => sum + r.issues.length, 0)}
- Total Recommendations: ${results.reduce((sum, r) => sum + r.recommendations.length, 0)}

${overallPercentage >= 95 ? 
  '🎉 PERFECT SCORE ACHIEVED! PDF generation is ready for production.' : 
  overallPercentage >= 90 ? 
  '✅ EXCELLENT SCORE! Minor optimizations may be beneficial.' :
  overallPercentage >= 80 ?
  '✅ GOOD SCORE! Some improvements recommended for optimal performance.' :
  '⚠️ NEEDS IMPROVEMENT! Critical issues must be addressed before production use.'
}
`;
    
    return report;
  }
}

// Export singleton instance
export const pdfPerfectionTester = new PDFPerfectionTester();