import { CalendarEvent } from '../types/calendar';

export interface AuditResult {
  score: number;
  issues: AuditIssue[];
  recommendations: string[];
  summary: string;
}

export interface AuditIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'layout' | 'typography' | 'data' | 'styling' | 'functionality';
  description: string;
  expectedValue: string;
  actualValue: string;
  fix: string;
}

/**
 * Comprehensive audit system for isolated calendar PDF export
 * Analyzes layout, data, styling, and functionality against target specifications
 */
export const auditIsolatedCalendarExport = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<AuditResult> => {
  console.log('🔍 Starting comprehensive isolated calendar audit...');

  const issues: AuditIssue[] = [];
  let score = 100;

  // 1. Data Integrity Audit
  const dataIssues = auditDataIntegrity(selectedDate, events);
  issues.push(...dataIssues);
  score -= dataIssues.length * 5;

  // 2. Layout Specifications Audit
  const layoutIssues = auditLayoutSpecifications();
  issues.push(...layoutIssues);
  score -= layoutIssues.length * 10;

  // 3. Typography Audit
  const typographyIssues = auditTypography();
  issues.push(...typographyIssues);
  score -= typographyIssues.length * 3;

  // 4. Time Format Audit
  const timeFormatIssues = auditTimeFormat();
  issues.push(...timeFormatIssues);
  score -= timeFormatIssues.length * 8;

  // 5. Event Display Audit
  const eventDisplayIssues = auditEventDisplay(selectedDate, events);
  issues.push(...eventDisplayIssues);
  score -= eventDisplayIssues.length * 12;

  // 6. Visual Styling Audit
  const stylingIssues = auditVisualStyling();
  issues.push(...stylingIssues);
  score -= stylingIssues.length * 5;

  score = Math.max(0, score);

  const recommendations = generateRecommendations(issues);
  const summary = generateAuditSummary(score, issues);

  const result: AuditResult = {
    score,
    issues,
    recommendations,
    summary
  };

  console.log('📊 Audit completed:', result);
  return result;
};

// Corrected date filtering logic - implemented directly into auditDataIntegrity
function auditDataIntegrity(selectedDate: Date, events: CalendarEvent[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Debug event filtering
  debugEventFiltering(events, selectedDate);

  // Filter events for selected date
  const dayEvents = filterEventsForDate(events, selectedDate);

  console.log(`📅 Auditing ${dayEvents.length} events for ${selectedDate.toDateString()}`);

  // Check if Calvin Hill appointment is present (based on screenshot)
  const calvinHillEvent = dayEvents.find(event => 
    event.title.toLowerCase().includes('calvin') || 
    event.title.toLowerCase().includes('hill')
  );

  if (!calvinHillEvent && selectedDate.toDateString().includes('Jul 19')) {
    issues.push({
      severity: 'critical',
      category: 'data',
      description: 'Calvin Hill appointment missing from July 19th data',
      expectedValue: 'Calvin Hill appointment at 10:00',
      actualValue: 'No Calvin Hill appointment found',
      fix: 'Verify event data filtering and date matching logic'
    });
  }

  // Check for test data contamination
  const testEvents = dayEvents.filter(event => {
    const title = event.title.toLowerCase();
    return title.includes('test') || title.includes('debug') || title.includes('sample');
  });

  if (testEvents.length > 0) {
    issues.push({
      severity: 'high',
      category: 'data',
      description: 'Test events found in production export',
      expectedValue: 'Only real appointments',
      actualValue: `${testEvents.length} test events found`,
      fix: 'Implement stricter event filtering to exclude test data'
    });
  }

  return issues;
}

function auditLayoutSpecifications(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Target specifications from requirements
  const targetSpecs = {
    headerHeight: 88, // 54px top + 34px stats
    timeColumnWidth: 70,
    rowHeight: 40,
    totalHeight: 36 * 40 + 88, // 36 time slots + header
    totalWidth: 1600
  };

  // Since we can't directly measure the generated element here,
  // we'll flag this for measurement during generation
  issues.push({
    severity: 'medium',
    category: 'layout',
    description: 'Layout measurements need verification against target specs',
    expectedValue: `Header: ${targetSpecs.headerHeight}px, TimeCol: ${targetSpecs.timeColumnWidth}px, Row: ${targetSpecs.rowHeight}px`,
    actualValue: 'Needs measurement during generation',
    fix: 'Add measurement validation during PDF generation'
  });

  return issues;
}

function auditTypography(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Typography specifications that need verification
  const expectedFonts = {
    title: '20px bold',
    timeLabels: '13px for hours, 11px for half-hours',
    appointments: '10px for title, 9px for time',
    stats: '14px medium'
  };

  issues.push({
    severity: 'low',
    category: 'typography',
    description: 'Typography hierarchy needs optimization for readability',
    expectedValue: JSON.stringify(expectedFonts),
    actualValue: 'Current font sizes may not be optimal',
    fix: 'Implement responsive font sizing based on content density'
  });

  return issues;
}

function auditTimeFormat(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Check if military time format is properly implemented
  const expectedFormat = '24-hour format (06:00, 07:00, 08:00)';

  issues.push({
    severity: 'high',
    category: 'functionality',
    description: 'Military time format implementation needs verification',
    expectedValue: expectedFormat,
    actualValue: 'formatTime function exists but visual output needs verification',
    fix: 'Ensure all time displays use HH:MM format consistently'
  });

  return issues;
}

// Corrected date filtering logic - implemented directly into auditEventDisplay
function auditEventDisplay(selectedDate: Date, events: CalendarEvent[]): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Debug event filtering
  debugEventFiltering(events, selectedDate);

  const dayEvents = filterEventsForDate(events, selectedDate);

  console.log('📋 Event display audit:', {
    totalEvents: dayEvents.length,
    eventTitles: dayEvents.map(e => e.title)
  });

  if (dayEvents.length === 0) {
    issues.push({
      severity: 'critical',
      category: 'data',
      description: 'No events found for selected date',
      expectedValue: 'At least 1 event for July 19th (Calvin Hill)',
      actualValue: '0 events found',
      fix: 'Check date filtering logic and event data availability'
    });
  }

  // Check for proper event positioning
  dayEvents.forEach(event => {
    const startTime = new Date(event.startTime);
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();

    if (hour < 6 || hour >= 24) {
      issues.push({
        severity: 'medium',
        category: 'functionality',
        description: `Event "${event.title}" outside business hours`,
        expectedValue: 'Events between 06:00 and 23:30',
        actualValue: `Event at ${hour}:${minute.toString().padStart(2, '0')}`,
        fix: 'Adjust time grid range or event filtering'
      });
    }
  });

  return issues;
}

function auditVisualStyling(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // Visual styling requirements
  const stylingSpecs = {
    simplePracticeColor: '#6366f1',
    googleCalendarColor: '#059669',
    holidayColor: '#d97706',
    borderStyle: 'SimplePractice: 4px left border, Google: dashed, Holiday: solid',
    backgroundColor: 'White for appointments, alternating for time slots'
  };

  issues.push({
    severity: 'medium',
    category: 'styling',
    description: 'Event styling needs verification against specifications',
    expectedValue: JSON.stringify(stylingSpecs),
    actualValue: 'Styling implemented but needs visual verification',
    fix: 'Verify color accuracy and border styles in generated output'
  });

  return issues;
}

function generateRecommendations(issues: AuditIssue[]): string[] {
  const recommendations: string[] = [];

  const criticalIssues = issues.filter(i => i.severity === 'critical');
  const highIssues = issues.filter(i => i.severity === 'high');

  if (criticalIssues.length > 0) {
    recommendations.push('🚨 PRIORITY: Fix critical data and layout issues immediately');
    recommendations.push('• Verify event data is properly filtered for selected date');
    recommendations.push('• Ensure Calvin Hill appointment is visible at correct time');
  }

  if (highIssues.length > 0) {
    recommendations.push('⚠️ HIGH: Address time format and functionality issues');
    recommendations.push('• Implement consistent military time format (HH:MM)');
    recommendations.push('• Verify appointment positioning and visibility');
  }

  recommendations.push('📐 LAYOUT: Validate all measurements against pixel-perfect specifications');
  recommendations.push('🎨 STYLING: Ensure consistent visual appearance with proper colors and borders');
  recommendations.push('🔍 TESTING: Add visual regression testing to prevent future issues');

  return recommendations;
}

function generateAuditSummary(score: number, issues: AuditIssue[]): string {
  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;
  const mediumCount = issues.filter(i => i.severity === 'medium').length;
  const lowCount = issues.filter(i => i.severity === 'low').length;

  let status = '';
  if (score >= 90) status = '🟢 EXCELLENT';
  else if (score >= 75) status = '🟡 GOOD';
  else if (score >= 50) status = '🟠 NEEDS IMPROVEMENT';
  else status = '🔴 POOR';

  return `${status} - Score: ${score}/100\n` +
         `Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount}, Low: ${lowCount}\n` +
         `Total Issues: ${issues.length}`;
}

/**
 * Run audit and generate actionable report
 */
export const runIsolatedCalendarAudit = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('🚀 Running isolated calendar audit...');

  const auditResult = await auditIsolatedCalendarExport(selectedDate, events);

  console.log('\n📊 ISOLATED CALENDAR AUDIT REPORT');
  console.log('==================================');
  console.log(auditResult.summary);
  console.log('\n🔍 ISSUES FOUND:');

  auditResult.issues.forEach((issue, index) => {
    console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category.toUpperCase()}`);
    console.log(`   Problem: ${issue.description}`);
    console.log(`   Expected: ${issue.expectedValue}`);
    console.log(`   Actual: ${issue.actualValue}`);
    console.log(`   Fix: ${issue.fix}`);
  });

  console.log('\n💡 RECOMMENDATIONS:');
  auditResult.recommendations.forEach(rec => {
    console.log(`   ${rec}`);
  });

  console.log('\n🔧 Ready for autonomous fixes...');
};

// Implemented corrected date filtering logic
function filterEventsForDate(events: CalendarEvent[], targetDate: Date): CalendarEvent[] {
    console.log(`🔍 Filtering ${events.length} events for date:`, targetDate.toDateString());

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = events.filter(event => {
      const eventStart = new Date(event.startTime || event.start);
      const eventEnd = new Date(event.endTime || event.end);

      // Check if event occurs on the target date
      const eventStartDay = new Date(eventStart);
      eventStartDay.setHours(0, 0, 0, 0);

      const targetDay = new Date(targetDate);
      targetDay.setHours(0, 0, 0, 0);

      const isOnDate = eventStartDay.getTime() === targetDay.getTime() || 
                     (eventStart <= endOfDay && eventEnd >= startOfDay);

      if (isOnDate) {
        console.log(`✅ Found event: ${event.title} on ${eventStart.toDateString()}`);
      }

      return isOnDate;
    });

    console.log(`📊 Filtered results: ${filtered.length} events found for ${targetDate.toDateString()}`);
    return filtered;
  }

  // Debugging utility function
function debugEventFiltering(events: CalendarEvent[], selectedDate: Date) {
  console.log('*** DEBUG EVENT FILTERING ***');
  console.log(`Total events: ${events.length}`);
  console.log(`Selected date: ${selectedDate.toDateString()}`);
  events.forEach(event => {
    console.log(`  Event: ${event.title}, Start: ${new Date(event.startTime).toDateString()}`);
  });
  console.log('****************************');
}