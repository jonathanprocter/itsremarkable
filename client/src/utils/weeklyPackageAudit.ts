
/**
 * Weekly Package Audit System
 * Validates weekly package exports and provides detailed audit reports
 */

import { CalendarEvent } from '../types/calendar';

export interface WeeklyPackageAuditResult {
  packageType: string;
  eventsCount: number;
  validEvents: number;
  invalidEvents: number;
  weekStart: string;
  weekEnd: string;
  exportSuccess: boolean;
  auditScore: number;
  issues: string[];
  recommendations: string[];
  timestamp: string;
}

export class WeeklyPackageAuditor {
  private issues: string[] = [];
  private recommendations: string[] = [];

  async auditWeeklyPackage(
    weekStartDate: Date,
    weekEndDate: Date,
    events: CalendarEvent[],
    packageType: string = 'standard'
  ): Promise<WeeklyPackageAuditResult> {
    console.log('🔍 STARTING WEEKLY PACKAGE AUDIT');
    
    this.issues = [];
    this.recommendations = [];

    // Event validation
    const validEvents = events.filter(event => 
      event.title && event.startTime && event.endTime
    );
    const invalidEvents = events.length - validEvents.length;

    if (invalidEvents > 0) {
      this.issues.push(`${invalidEvents} events are missing required data`);
      this.recommendations.push('Ensure all events have title, startTime, and endTime');
    }

    // Date range validation
    const weekDiff = (weekEndDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24);
    if (weekDiff !== 6) {
      this.issues.push(`Invalid week range: ${weekDiff} days instead of 7`);
      this.recommendations.push('Ensure week spans exactly 7 days');
    }

    // Event distribution check
    const eventsPerDay = this.analyzeEventDistribution(weekStartDate, weekEndDate, validEvents);
    const daysWithEvents = Object.values(eventsPerDay).filter(count => count > 0).length;
    
    if (daysWithEvents === 0) {
      this.issues.push('No events found for this week');
      this.recommendations.push('Check date filtering and event data');
    }

    // Calculate audit score
    let auditScore = 100;
    auditScore -= invalidEvents * 10; // -10 per invalid event
    auditScore -= this.issues.length * 5; // -5 per issue
    auditScore = Math.max(0, auditScore);

    const auditResult: WeeklyPackageAuditResult = {
      packageType,
      eventsCount: events.length,
      validEvents: validEvents.length,
      invalidEvents,
      weekStart: weekStartDate.toISOString().split('T')[0],
      weekEnd: weekEndDate.toISOString().split('T')[0],
      exportSuccess: this.issues.length === 0,
      auditScore,
      issues: this.issues,
      recommendations: this.recommendations,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Weekly Package Audit Results:', auditResult);
    
    // Store results for testing
    localStorage.setItem('latestWeeklyPackageAudit', JSON.stringify(auditResult));

    return auditResult;
  }

  private analyzeEventDistribution(
    weekStart: Date,
    weekEnd: Date,
    events: CalendarEvent[]
  ): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const dayKey = d.toISOString().split('T')[0];
      distribution[dayKey] = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === d.toDateString();
      }).length;
    }

    return distribution;
  }

  getLastAuditResults(): WeeklyPackageAuditResult | null {
    const stored = localStorage.getItem('latestWeeklyPackageAudit');
    return stored ? JSON.parse(stored) : null;
  }
}

// Global test function for audit validation
declare global {
  interface Window {
    testWeeklyPackageAudit: () => void;
  }
}

window.testWeeklyPackageAudit = () => {
  const auditor = new WeeklyPackageAuditor();
  const lastResults = auditor.getLastAuditResults();
  
  console.log('🧪 WEEKLY PACKAGE AUDIT TEST');
  console.log('='.repeat(50));
  
  if (lastResults) {
    console.log('📊 Last Audit Results:', lastResults);
    console.log(`✅ Audit Score: ${lastResults.auditScore}%`);
    console.log(`📅 Week: ${lastResults.weekStart} to ${lastResults.weekEnd}`);
    console.log(`📊 Events: ${lastResults.validEvents}/${lastResults.eventsCount} valid`);
    
    if (lastResults.issues.length > 0) {
      console.log('❌ Issues:', lastResults.issues);
      console.log('💡 Recommendations:', lastResults.recommendations);
    } else {
      console.log('✅ No issues found - audit passed!');
    }
  } else {
    console.log('❌ No audit results found. Run a weekly package export first.');
  }
};

export const weeklyPackageAuditor = new WeeklyPackageAuditor();
