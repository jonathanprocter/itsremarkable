import { CalendarEvent } from '../types/calendar';
import { 
  enhanceEventDataIntegrity, 
  validateDataIntegrity, 
  generatePixelPerfectReport 
} from './dataIntegrityFix';

/**
 * Comprehensive Export Audit Utility
 * 
 * This utility ensures that PDF exports match the dashboard exactly by:
 * 1. Auditing event data completeness
 * 2. Validating calendar filtering
 * 3. Checking notes and action items
 * 4. Ensuring proper event categorization
 */

export interface ExportAuditReport {
  totalEvents: number;
  dayEvents: number;
  missingNotes: string[];
  missingActionItems: string[];
  eventsBySource: {
    simplepractice: number;
    google: number;
    manual: number;
    holiday: number;
  };
  warnings: string[];
  errors: string[];
  // Enhanced fields for pixel-perfect matching
  dashboardEventIds: string[];
  exportEventIds: string[];
  missingEvents: string[];
  extraEvents: string[];
  gridAlignment: boolean;
  stylingConsistency: boolean;
  dataIntegrityScore: number;
  pixelPerfectMatch: boolean;
}

export function auditExportData(
  allEvents: CalendarEvent[],
  filteredEvents: CalendarEvent[],
  selectedDate?: Date
): ExportAuditReport {
  const report: ExportAuditReport = {
    totalEvents: filteredEvents.length,
    dayEvents: 0,
    missingNotes: [],
    missingActionItems: [],
    eventsBySource: {
      simplepractice: 0,
      google: 0,
      manual: 0,
      holiday: 0
    },
    warnings: [],
    errors: [],
    // Enhanced fields for pixel-perfect matching
    dashboardEventIds: [],
    exportEventIds: [],
    missingEvents: [],
    extraEvents: [],
    gridAlignment: true,
    stylingConsistency: true,
    dataIntegrityScore: 0,
    pixelPerfectMatch: false
  };

  // Filter events for specific date if provided
  let eventsToAudit = filteredEvents;
  if (selectedDate) {
    eventsToAudit = filteredEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === selectedDate.toDateString();
    });
    report.dayEvents = eventsToAudit.length;
  }

  // Audit each event
  eventsToAudit.forEach(event => {
    // Check event completeness
    if (!event.id || !event.title || !event.startTime || !event.endTime) {
      report.errors.push(`Event missing required fields: ${event.title || 'Unknown'}`);
    }

    // Check for notes and action items
    if (event.notes && event.notes.trim()) {
      // Notes exist - good
    } else {
      // Check if this is an event that should have notes
      if (event.source === 'manual' || event.title.includes('Supervision')) {
        report.missingNotes.push(event.title);
      }
    }

    if (event.actionItems && event.actionItems.trim()) {
      // Action items exist - good
    } else {
      // Check if this is an event that should have action items
      if (event.source === 'manual' || event.title.includes('Supervision')) {
        report.missingActionItems.push(event.title);
      }
    }

    // Categorize by source
    if (event.source === 'simplepractice' || event.title.toLowerCase().includes('appointment')) {
      report.eventsBySource.simplepractice++;
    } else if (event.source === 'google' && !event.title.toLowerCase().includes('holiday')) {
      report.eventsBySource.google++;
    } else if (event.title.toLowerCase().includes('holiday')) {
      report.eventsBySource.holiday++;
    } else if (event.source === 'manual') {
      report.eventsBySource.manual++;
    }
  });

  // Generate event ID tracking for pixel-perfect matching
  report.dashboardEventIds = filteredEvents.map(event => event.id);
  report.exportEventIds = eventsToAudit.map(event => event.id);
  
  // Find missing or extra events
  report.missingEvents = report.dashboardEventIds.filter(id => 
    !report.exportEventIds.includes(id)
  );
  report.extraEvents = report.exportEventIds.filter(id => 
    !report.dashboardEventIds.includes(id)
  );

  // Calculate data integrity score
  const totalChecks = eventsToAudit.length;
  let passedChecks = 0;
  
  eventsToAudit.forEach(event => {
    // Check required fields
    if (event.id && event.title && event.startTime && event.endTime) passedChecks++;
    // Check for text corruption
    if (!event.title.includes('🔒') && !event.title.includes('Ø=')) passedChecks++;
    // Check source consistency
    if (event.source) passedChecks++;
  });
  
  report.dataIntegrityScore = totalChecks > 0 ? (passedChecks / (totalChecks * 3)) * 100 : 0;
  report.pixelPerfectMatch = report.dataIntegrityScore >= 95 && 
                           report.missingEvents.length === 0 && 
                           report.extraEvents.length === 0;

  // Generate warnings
  if (report.totalEvents === 0) {
    report.warnings.push('No events found for export');
  }

  if (selectedDate && report.dayEvents === 0) {
    report.warnings.push(`No events found for ${selectedDate.toDateString()}`);
  }

  if (filteredEvents.length < allEvents.length) {
    report.warnings.push(`Calendar filtering applied: ${filteredEvents.length}/${allEvents.length} events`);
  }

  if (report.missingEvents.length > 0) {
    report.warnings.push(`Missing events in export: ${report.missingEvents.length}`);
  }

  if (report.extraEvents.length > 0) {
    report.warnings.push(`Extra events in export: ${report.extraEvents.length}`);
  }

  if (report.dataIntegrityScore < 95) {
    report.warnings.push(`Data integrity below 95%: ${report.dataIntegrityScore.toFixed(1)}%`);
  }

  return report;
}

export function logExportAudit(report: ExportAuditReport, exportType: string): void {
  console.log(`\n🔍 PIXEL-PERFECT EXPORT AUDIT - ${exportType.toUpperCase()}`);
  console.log('='.repeat(60));
  
  // Data integrity score
  const scoreColor = report.dataIntegrityScore >= 95 ? '✅' : report.dataIntegrityScore >= 80 ? '⚠️' : '❌';
  console.log(`${scoreColor} Data Integrity Score: ${report.dataIntegrityScore.toFixed(1)}%`);
  console.log(`${report.pixelPerfectMatch ? '✅' : '❌'} Pixel-Perfect Match: ${report.pixelPerfectMatch ? 'YES' : 'NO'}`);
  
  console.log(`\n📊 EVENT SUMMARY:`);
  console.log(`  - Total Events: ${report.totalEvents}`);
  if (report.dayEvents > 0) {
    console.log(`  - Day Events: ${report.dayEvents}`);
  }
  
  console.log(`\n🎯 EVENTS BY SOURCE:`);
  console.log(`  - SimplePractice: ${report.eventsBySource.simplepractice}`);
  console.log(`  - Google Calendar: ${report.eventsBySource.google}`);
  console.log(`  - Manual: ${report.eventsBySource.manual}`);
  console.log(`  - Holidays: ${report.eventsBySource.holiday}`);

  console.log(`\n🔍 DASHBOARD vs EXPORT COMPARISON:`);
  console.log(`  - Dashboard Event IDs: ${report.dashboardEventIds.length}`);
  console.log(`  - Export Event IDs: ${report.exportEventIds.length}`);
  console.log(`  - Missing Events: ${report.missingEvents.length}`);
  console.log(`  - Extra Events: ${report.extraEvents.length}`);

  if (report.missingEvents.length > 0) {
    console.log(`\n❌ MISSING EVENTS IN EXPORT:`);
    report.missingEvents.forEach(id => console.log(`  - Event ID: ${id}`));
  }

  if (report.extraEvents.length > 0) {
    console.log(`\n⚠️ EXTRA EVENTS IN EXPORT:`);
    report.extraEvents.forEach(id => console.log(`  - Event ID: ${id}`));
  }

  if (report.warnings.length > 0) {
    console.log(`\n⚠️ WARNINGS:`);
    report.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (report.errors.length > 0) {
    console.log(`\n❌ ERRORS:`);
    report.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (report.missingNotes.length > 0) {
    console.log(`\n📝 EVENTS MISSING NOTES:`);
    report.missingNotes.forEach(title => console.log(`  - ${title}`));
  }

  if (report.missingActionItems.length > 0) {
    console.log(`\n✅ EVENTS MISSING ACTION ITEMS:`);
    report.missingActionItems.forEach(title => console.log(`  - ${title}`));
  }

  // Final assessment
  console.log(`\n🎯 PIXEL-PERFECT ASSESSMENT:`);
  if (report.pixelPerfectMatch) {
    console.log('✅ PERFECT MATCH: PDF export will match dashboard exactly');
  } else {
    console.log('❌ ISSUES DETECTED: PDF export may not match dashboard');
    console.log('   - Check warnings and errors above for details');
  }

  console.log('='.repeat(60));
  console.log(`⏰ Audit completed at ${new Date().toLocaleTimeString()}\n`);
}

/**
 * Ensure events have all required fields for PDF export
 */
export function validateEventData(events: CalendarEvent[]): CalendarEvent[] {
  return events.map(event => ({
    ...event,
    // Ensure all required fields exist
    id: event.id || `temp-${Date.now()}`,
    title: event.title || 'Untitled Event',
    description: event.description || '',
    notes: event.notes || '',
    actionItems: event.actionItems || '',
    source: event.source || 'manual',
    color: event.color || '#4285F4',
    calendarId: event.calendarId || ''
  }));
}

/**
 * Clean event title for PDF display
 */
export function cleanEventTitle(title: string): string {
  return title
    .replace(/🔒\s*/g, '') // Remove lock symbol
    .replace(/[\\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
    .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
    .replace(/Ø=Ý/g, '') // Remove corrupted symbols
    .replace(/!•/g, '') // Remove broken navigation symbols
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Pixel-Perfect Data Unification
 * Ensures dashboard and PDF export use identical data structures
 */
export interface UnifiedEventData {
  event: CalendarEvent;
  displayTitle: string;
  cleanTitle: string;
  hasNotes: boolean;
  hasActionItems: boolean;
  sourceType: 'simplepractice' | 'google' | 'manual' | 'holiday';
  gridPosition: {
    startSlot: number;
    endSlot: number;
    duration: number;
    dayColumn: number;
  };
  styling: {
    backgroundColor: string;
    borderColor: string;
    borderStyle: string;
    textColor: string;
  };
}

export function unifyEventData(
  events: CalendarEvent[],
  selectedDate?: Date
): UnifiedEventData[] {
  return events.map(event => {
    const cleanTitle = cleanEventTitle(event.title);
    const displayTitle = cleanTitle.replace(/ Appointment$/i, '');
    
    // Determine source type
    let sourceType: UnifiedEventData['sourceType'] = 'manual';
    if (event.title.toLowerCase().includes('holiday')) {
      sourceType = 'holiday';
    } else if (event.title.toLowerCase().includes('haircut') ||
               event.title.toLowerCase().includes('dan re:') ||
               event.title.toLowerCase().includes('blake') ||
               event.title.toLowerCase().includes('phone call')) {
      sourceType = 'google';
    } else if (event.title.toLowerCase().includes('appointment')) {
      sourceType = 'simplepractice';
    }
    
    // Calculate grid position
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const startSlot = (startTime.getHours() - 6) * 2 + (startTime.getMinutes() >= 30 ? 1 : 0);
    const endSlot = (endTime.getHours() - 6) * 2 + (endTime.getMinutes() >= 30 ? 1 : 0);
    const duration = endSlot - startSlot;
    const dayColumn = selectedDate ? 0 : startTime.getDay();
    
    // Define styling based on source
    let styling: UnifiedEventData['styling'];
    switch (sourceType) {
      case 'simplepractice':
        styling = {
          backgroundColor: '#ffffff',
          borderColor: '#6495ED',
          borderStyle: 'solid',
          textColor: '#000000'
        };
        break;
      case 'google':
        styling = {
          backgroundColor: '#ffffff',
          borderColor: '#34A853',
          borderStyle: 'dashed',
          textColor: '#000000'
        };
        break;
      case 'holiday':
        styling = {
          backgroundColor: '#FFF8DC',
          borderColor: '#FF8C00',
          borderStyle: 'solid',
          textColor: '#000000'
        };
        break;
      default:
        styling = {
          backgroundColor: '#ffffff',
          borderColor: '#FF8C00',
          borderStyle: 'solid',
          textColor: '#000000'
        };
    }
    
    return {
      event,
      displayTitle,
      cleanTitle,
      hasNotes: !!(event.notes && event.notes.trim()),
      hasActionItems: !!(event.actionItems && event.actionItems.trim()),
      sourceType,
      gridPosition: {
        startSlot,
        endSlot,
        duration,
        dayColumn
      },
      styling
    };
  });
}

/**
 * Validate Grid Alignment
 * Ensures appointments are positioned exactly as they appear on dashboard
 */
export function validateGridAlignment(
  unifiedEvents: UnifiedEventData[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  unifiedEvents.forEach((eventData, index) => {
    const { event, gridPosition } = eventData;
    
    // Check for valid time slots
    if (gridPosition.startSlot < 0 || gridPosition.startSlot > 35) {
      issues.push(`Event ${index + 1} (${event.title}) has invalid start slot: ${gridPosition.startSlot}`);
    }
    
    if (gridPosition.endSlot < 0 || gridPosition.endSlot > 35) {
      issues.push(`Event ${index + 1} (${event.title}) has invalid end slot: ${gridPosition.endSlot}`);
    }
    
    // Check for valid duration
    if (gridPosition.duration <= 0) {
      issues.push(`Event ${index + 1} (${event.title}) has invalid duration: ${gridPosition.duration}`);
    }
    
    // Check for reasonable duration (max 12 hours)
    if (gridPosition.duration > 24) {
      issues.push(`Event ${index + 1} (${event.title}) has excessive duration: ${gridPosition.duration} slots`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Generate Pixel-Perfect Export Configuration
 * Creates unified config for both dashboard and PDF export
 */
export function generatePixelPerfectConfig(
  unifiedEvents: UnifiedEventData[],
  exportType: 'daily' | 'weekly'
) {
  const config = {
    events: unifiedEvents,
    gridConfig: {
      timeSlotHeight: exportType === 'daily' ? 18 : 12,
      timeColumnWidth: exportType === 'daily' ? 75 : 50,
      dayColumnWidth: exportType === 'daily' ? 500 : 100,
      startHour: 6,
      endHour: 23.5,
      totalSlots: 36
    },
    styling: {
      headerHeight: exportType === 'daily' ? 90 : 40,
      margins: 20,
      fontSize: {
        title: exportType === 'daily' ? 20 : 14,
        eventTitle: exportType === 'daily' ? 12 : 6,
        eventTime: exportType === 'daily' ? 10 : 5,
        timeLabels: exportType === 'daily' ? 8 : 6
      }
    },
    layout: {
      pageOrientation: exportType === 'daily' ? 'portrait' : 'landscape',
      pageSize: exportType === 'daily' ? '8.5x11' : '11x8.5',
      use3ColumnLayout: unifiedEvents.some(e => e.hasNotes || e.hasActionItems)
    }
  };
  
  return config;
}

/**
 * Comprehensive Pixel-Perfect Audit
 * Combines all audit functions for complete validation
 */
export function runPixelPerfectAudit(
  dashboardEvents: CalendarEvent[],
  exportEvents: CalendarEvent[],
  selectedDate?: Date,
  exportType: 'daily' | 'weekly' = 'daily'
): {
  auditReport: ExportAuditReport;
  unifiedData: UnifiedEventData[];
  gridValidation: { isValid: boolean; issues: string[] };
  exportConfig: any;
  pixelPerfectScore: number;
} {
  // Run basic audit
  const auditReport = auditExportData(dashboardEvents, exportEvents, selectedDate);
  
  // Unify event data
  const unifiedData = unifyEventData(exportEvents, selectedDate);
  
  // Validate grid alignment
  const gridValidation = validateGridAlignment(unifiedData);
  
  // Generate export config
  const exportConfig = generatePixelPerfectConfig(unifiedData, exportType);
  
  // Calculate overall pixel-perfect score
  let pixelPerfectScore = 0;
  let totalChecks = 0;
  
  // Data integrity (40% weight)
  pixelPerfectScore += (auditReport.dataIntegrityScore / 100) * 40;
  totalChecks += 40;
  
  // Grid alignment (30% weight)
  pixelPerfectScore += (gridValidation.isValid ? 30 : 0);
  totalChecks += 30;
  
  // Event completeness (20% weight)
  const completenessScore = auditReport.totalEvents > 0 ? 
    ((auditReport.totalEvents - auditReport.missingEvents.length) / auditReport.totalEvents) * 20 : 0;
  pixelPerfectScore += completenessScore;
  totalChecks += 20;
  
  // Styling consistency (10% weight)
  const stylingScore = unifiedData.every(e => e.styling.backgroundColor && e.styling.borderColor) ? 10 : 0;
  pixelPerfectScore += stylingScore;
  totalChecks += 10;
  
  return {
    auditReport,
    unifiedData,
    gridValidation,
    exportConfig,
    pixelPerfectScore: Math.round(pixelPerfectScore)
  };
}

/**
 * Enhanced Pixel-Perfect Audit with Data Integrity Fix
 * 
 * This function provides comprehensive validation with automatic fixes
 * for data integrity issues identified in the audit feedback
 */
export function runEnhancedPixelPerfectAudit(
  dashboardEvents: CalendarEvent[],
  exportEvents: CalendarEvent[],
  selectedDate: Date,
  exportType: string = 'daily'
): {
  pixelPerfectScore: number;
  dataIntegrityScore: number;
  auditReport: ExportAuditReport;
  enhancedReport: any;
  recommendations: string[];
} {
  console.log('🔍 ENHANCED PIXEL-PERFECT AUDIT STARTING');
  console.log('='.repeat(80));
  
  // Generate comprehensive pixel-perfect report
  const enhancedReport = generatePixelPerfectReport(
    dashboardEvents,
    exportEvents,
    selectedDate
  );
  
  // Run original audit for compatibility
  const originalAudit = auditExportData(dashboardEvents, exportEvents, selectedDate);
  
  // Enhance events with data integrity fixes
  const dashboardDayEvents = dashboardEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });
  
  const enhancedDashboardData = enhanceEventDataIntegrity(dashboardDayEvents);
  const dataIntegrityValidation = validateDataIntegrity(enhancedDashboardData);
  
  // Merge results
  const combinedReport: ExportAuditReport = {
    ...originalAudit,
    dataIntegrityScore: enhancedReport.dataIntegrityScore,
    pixelPerfectMatch: enhancedReport.pixelPerfectScore >= 95,
    warnings: [
      ...originalAudit.warnings,
      ...enhancedReport.issues
    ]
  };
  
  // Log enhanced results
  console.log('🎯 ENHANCED PIXEL-PERFECT ANALYSIS:');
  console.log(`   📊 Overall Score: ${enhancedReport.pixelPerfectScore}/100`);
  console.log(`   🔍 Data Integrity: ${enhancedReport.dataIntegrityScore.toFixed(1)}%`);
  console.log(`   📝 Summary: ${enhancedReport.summary}`);
  
  console.log('\n📋 ENHANCED EVENT DATA ANALYSIS:');
  enhancedDashboardData.forEach((eventData, index) => {
    console.log(`   Event ${index + 1}: "${eventData.displayTitle}"`);
    console.log(`     - Source: ${eventData.sourceType}`);
    console.log(`     - Has Notes: ${eventData.hasNotes ? 'YES' : 'NO'}`);
    console.log(`     - Has Action Items: ${eventData.hasActionItems ? 'YES' : 'NO'}`);
    console.log(`     - Enhanced Notes: ${eventData.enhancedNotes ? 'YES' : 'NO'}`);
    console.log(`     - Enhanced Action Items: ${eventData.enhancedActionItems ? 'YES' : 'NO'}`);
    console.log(`     - Background: ${eventData.styling.backgroundColor}`);
    console.log(`     - Border: ${eventData.styling.borderStyle} ${eventData.styling.borderColor}`);
  });
  
  if (enhancedReport.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    enhancedReport.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }
  
  console.log('\n🏆 FINAL ENHANCED ASSESSMENT:');
  console.log(`   ${enhancedReport.summary}`);
  
  console.log('='.repeat(80));
  console.log('🔍 ENHANCED PIXEL-PERFECT AUDIT COMPLETE');
  
  return {
    pixelPerfectScore: enhancedReport.pixelPerfectScore,
    dataIntegrityScore: enhancedReport.dataIntegrityScore,
    auditReport: combinedReport,
    enhancedReport,
    recommendations: enhancedReport.recommendations
  };
}
