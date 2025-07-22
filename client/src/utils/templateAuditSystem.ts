import { CalendarEvent } from '../types/calendar';

// Reference template measurements from the PDF
const REFERENCE_TEMPLATE = {
  pageSize: {
    width: 612,
    height: 792,
    description: "US Letter format"
  },
  margins: {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  },
  header: {
    height: 100,
    titleSize: 22,
    subtitleSize: 14,
    dateFormat: "Friday, July 18, 2025",
    shortDateFormat: "Fri, Jul 18",
    appointmentCountFormat: "8 appointments scheduled"
  },
  statsBar: {
    height: 60,
    sections: 4,
    values: ["8", "8.0h", "9.5h", "54%"],
    labels: ["Appointments", "Scheduled", "Available", "Free Time"]
  },
  legend: {
    height: 30,
    items: [
      { color: "#4285f4", label: "SimplePractice" },
      { color: "#34a853", label: "Google Calendar" },
      { color: "#fbbc04", label: "Holidays" }
    ]
  },
  timeGrid: {
    timeSlotHeight: 25,
    timeLabelWidth: 80,
    startTime: "06:00",
    endTime: "23:30",
    totalSlots: 36,
    fontSize: 11
  },
  appointments: {
    leftOffset: 85,
    rightOffset: 25,
    topOffset: 3,
    bottomOffset: 3,
    titleSize: 11,
    sourceSize: 9,
    styling: {
      simplepractice: {
        borderLeft: "4px solid #4285f4",
        backgroundColor: "#ffffff",
        border: "1px solid #cccccc"
      },
      google: {
        border: "2px dashed #34a853",
        backgroundColor: "#ffffff"
      },
      holidays: {
        backgroundColor: "#fbbc04",
        border: "1px solid #333333"
      }
    }
  },
  footer: {
    height: 40,
    buttons: ["< Previous Day", "Weekly Overview", "Next Day >"]
  }
};

interface AuditResult {
  section: string;
  issue: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  currentValue: any;
  expectedValue: any;
  fix: string;
}

interface TemplateAudit {
  passed: boolean;
  issues: AuditResult[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recommendations: string[];
}

class TemplateAuditSystem {
  private auditResults: AuditResult[] = [];

  /**
   * Audit the current template configuration against reference
   */
  auditTemplateConfiguration(currentConfig: any): TemplateAudit {
    this.auditResults = [];

    // Audit page dimensions
    this.auditPageDimensions(currentConfig);
    
    // Audit header configuration
    this.auditHeaderConfiguration(currentConfig);
    
    // Audit stats bar
    this.auditStatsBarConfiguration(currentConfig);
    
    // Audit time grid
    this.auditTimeGridConfiguration(currentConfig);
    
    // Audit appointments
    this.auditAppointmentConfiguration(currentConfig);
    
    // Audit footer
    this.auditFooterConfiguration(currentConfig);

    return this.generateAuditReport();
  }

  private auditPageDimensions(config: any) {
    const pageConfig = config.pageWidth && config.pageHeight ? 
      { width: config.pageWidth, height: config.pageHeight } : 
      { width: 612, height: 792 };

    if (pageConfig.width !== REFERENCE_TEMPLATE.pageSize.width) {
      this.auditResults.push({
        section: 'Page Dimensions',
        issue: 'Page width does not match reference template',
        severity: 'high',
        currentValue: pageConfig.width,
        expectedValue: REFERENCE_TEMPLATE.pageSize.width,
        fix: 'Set pageWidth to 612 points for US Letter format'
      });
    }

    if (pageConfig.height !== REFERENCE_TEMPLATE.pageSize.height) {
      this.auditResults.push({
        section: 'Page Dimensions',
        issue: 'Page height does not match reference template',
        severity: 'high',
        currentValue: pageConfig.height,
        expectedValue: REFERENCE_TEMPLATE.pageSize.height,
        fix: 'Set pageHeight to 792 points for US Letter format'
      });
    }
  }

  private auditHeaderConfiguration(config: any) {
    const headerConfig = config.headerHeight || 80;
    
    if (headerConfig !== REFERENCE_TEMPLATE.header.height) {
      this.auditResults.push({
        section: 'Header',
        issue: 'Header height does not match reference template',
        severity: 'medium',
        currentValue: headerConfig,
        expectedValue: REFERENCE_TEMPLATE.header.height,
        fix: 'Set header height to 100 points to match reference spacing'
      });
    }

    // Check font sizes
    const titleSize = config.fonts?.title?.size || 18;
    if (titleSize !== REFERENCE_TEMPLATE.header.titleSize) {
      this.auditResults.push({
        section: 'Header Typography',
        issue: 'Title font size does not match reference',
        severity: 'medium',
        currentValue: titleSize,
        expectedValue: REFERENCE_TEMPLATE.header.titleSize,
        fix: 'Set title font size to 22 points'
      });
    }

    const subtitleSize = config.fonts?.subtitle?.size || 12;
    if (subtitleSize !== REFERENCE_TEMPLATE.header.subtitleSize) {
      this.auditResults.push({
        section: 'Header Typography',
        issue: 'Subtitle font size does not match reference',
        severity: 'medium',
        currentValue: subtitleSize,
        expectedValue: REFERENCE_TEMPLATE.header.subtitleSize,
        fix: 'Set subtitle font size to 14 points'
      });
    }
  }

  private auditStatsBarConfiguration(config: any) {
    const statsHeight = config.statsBarHeight || 60;
    
    if (statsHeight !== REFERENCE_TEMPLATE.statsBar.height) {
      this.auditResults.push({
        section: 'Stats Bar',
        issue: 'Stats bar height does not match reference',
        severity: 'medium',
        currentValue: statsHeight,
        expectedValue: REFERENCE_TEMPLATE.statsBar.height,
        fix: 'Set stats bar height to 60 points'
      });
    }
  }

  private auditTimeGridConfiguration(config: any) {
    const timeSlotHeight = config.timeSlotHeight || 22;
    
    if (timeSlotHeight !== REFERENCE_TEMPLATE.timeGrid.timeSlotHeight) {
      this.auditResults.push({
        section: 'Time Grid',
        issue: 'Time slot height does not match reference template',
        severity: 'critical',
        currentValue: timeSlotHeight,
        expectedValue: REFERENCE_TEMPLATE.timeGrid.timeSlotHeight,
        fix: 'Set time slot height to 25 points for proper appointment spacing'
      });
    }

    const timeLabelWidth = config.timeColumnWidth || 65;
    if (timeLabelWidth !== REFERENCE_TEMPLATE.timeGrid.timeLabelWidth) {
      this.auditResults.push({
        section: 'Time Grid',
        issue: 'Time label width does not match reference',
        severity: 'high',
        currentValue: timeLabelWidth,
        expectedValue: REFERENCE_TEMPLATE.timeGrid.timeLabelWidth,
        fix: 'Set time label width to 80 points'
      });
    }
  }

  private auditAppointmentConfiguration(config: any) {
    const appointmentHeight = config.appointmentHeight || 22;
    const expectedHeight = REFERENCE_TEMPLATE.timeGrid.timeSlotHeight - 4; // Allow for margins
    
    if (appointmentHeight !== expectedHeight) {
      this.auditResults.push({
        section: 'Appointments',
        issue: 'Appointment height does not match time slot spacing',
        severity: 'critical',
        currentValue: appointmentHeight,
        expectedValue: expectedHeight,
        fix: 'Set appointment height to 21 points (time slot height minus margins)'
      });
    }
  }

  private auditFooterConfiguration(config: any) {
    const footerHeight = config.footerHeight || 40;
    
    if (footerHeight !== REFERENCE_TEMPLATE.footer.height) {
      this.auditResults.push({
        section: 'Footer',
        issue: 'Footer height does not match reference',
        severity: 'low',
        currentValue: footerHeight,
        expectedValue: REFERENCE_TEMPLATE.footer.height,
        fix: 'Set footer height to 40 points'
      });
    }
  }

  private generateAuditReport(): TemplateAudit {
    const summary = {
      critical: this.auditResults.filter(r => r.severity === 'critical').length,
      high: this.auditResults.filter(r => r.severity === 'high').length,
      medium: this.auditResults.filter(r => r.severity === 'medium').length,
      low: this.auditResults.filter(r => r.severity === 'low').length,
      total: this.auditResults.length
    };

    const recommendations = this.generateRecommendations();

    return {
      passed: summary.critical === 0 && summary.high === 0,
      issues: this.auditResults,
      summary,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const criticalIssues = this.auditResults.filter(r => r.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push("CRITICAL: Fix time slot height and appointment positioning for proper layout");
    }

    const highIssues = this.auditResults.filter(r => r.severity === 'high');
    if (highIssues.length > 0) {
      recommendations.push("HIGH: Adjust page dimensions and time column width for accurate spacing");
    }

    const mediumIssues = this.auditResults.filter(r => r.severity === 'medium');
    if (mediumIssues.length > 0) {
      recommendations.push("MEDIUM: Update header and stats bar dimensions for visual consistency");
    }

    if (this.auditResults.length === 0) {
      recommendations.push("Template configuration matches reference perfectly");
    }

    return recommendations;
  }

  /**
   * Audit specific appointment positioning and formatting
   */
  auditAppointmentFormatting(appointments: CalendarEvent[], selectedDate: Date): AuditResult[] {
    const issues: AuditResult[] = [];

    // Filter appointments for the selected date
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const dayAppointments = appointments.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toISOString().split('T')[0] === selectedDateString;
    });

    console.log(`🔍 Auditing ${dayAppointments.length} appointments for ${selectedDate.toDateString()}`);

    // Check for overlapping appointments
    const timeSlots = new Map<string, CalendarEvent[]>();
    dayAppointments.forEach(event => {
      const eventDate = new Date(event.startTime);
      const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      if (!timeSlots.has(timeStr)) {
        timeSlots.set(timeStr, []);
      }
      timeSlots.get(timeStr)!.push(event);
    });

    // Check for multiple appointments in same time slot
    timeSlots.forEach((events, timeStr) => {
      if (events.length > 1) {
        issues.push({
          section: 'Appointment Positioning',
          issue: `Multiple appointments in time slot ${timeStr}`,
          severity: 'high',
          currentValue: events.length,
          expectedValue: 1,
          fix: 'Implement side-by-side positioning for overlapping appointments'
        });
      }
    });

    // Check appointment titles for length and formatting
    dayAppointments.forEach(event => {
      const cleanTitle = this.cleanAppointmentTitle(event.title || '');
      
      if (cleanTitle.length > 15) {
        issues.push({
          section: 'Appointment Formatting',
          issue: `Appointment title too long: "${cleanTitle}"`,
          severity: 'medium',
          currentValue: cleanTitle.length,
          expectedValue: 15,
          fix: 'Truncate appointment titles to fit within appointment boxes'
        });
      }

      // Check for proper source identification
      if (!event.source || !['simplepractice', 'google', 'manual'].includes(event.source)) {
        issues.push({
          section: 'Appointment Source',
          issue: `Invalid or missing source for appointment: "${event.title}"`,
          severity: 'medium',
          currentValue: event.source,
          expectedValue: 'simplepractice|google|manual',
          fix: 'Ensure all appointments have valid source identification'
        });
      }
    });

    return issues;
  }

  private cleanAppointmentTitle(title: string): string {
    if (!title) return '';
    
    // Remove emoji and special characters
    let cleaned = title.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // Remove " Appointment" suffix
    cleaned = cleaned.replace(/\s+Appointment\s*$/i, '');
    
    return cleaned.trim();
  }

  /**
   * Run complete audit of template system
   */
  async runCompleteAudit(config: any, events: CalendarEvent[], selectedDate: Date): Promise<TemplateAudit> {
    console.log('🔍 Starting Complete Template Audit...');
    
    // Audit configuration
    const configAudit = this.auditTemplateConfiguration(config);
    
    // Audit appointment formatting
    const appointmentIssues = this.auditAppointmentFormatting(events, selectedDate);
    
    // Combine all issues
    const allIssues = [...configAudit.issues, ...appointmentIssues];
    
    // Recalculate summary
    const summary = {
      critical: allIssues.filter(r => r.severity === 'critical').length,
      high: allIssues.filter(r => r.severity === 'high').length,
      medium: allIssues.filter(r => r.severity === 'medium').length,
      low: allIssues.filter(r => r.severity === 'low').length,
      total: allIssues.length
    };

    const audit: TemplateAudit = {
      passed: summary.critical === 0 && summary.high === 0,
      issues: allIssues,
      summary,
      recommendations: this.generateRecommendations()
    };

    console.log('📊 Audit Complete:', audit.summary);
    console.log('🔧 Recommendations:', audit.recommendations);

    return audit;
  }

  /**
   * Generate optimized template configuration based on audit results
   */
  generateOptimizedConfig(auditResults: AuditResult[]): any {
    console.log('🔧 Generating optimized configuration...');
    
    const config = {
      // Page dimensions (exact from reference)
      pageWidth: 612,
      pageHeight: 792,
      margin: 20,
      
      // Layout measurements (corrected based on audit)
      headerHeight: 100,
      statsBarHeight: 60,
      legendHeight: 30,
      timeSlotHeight: 25,
      timeColumnWidth: 80,
      appointmentColumnWidth: 480,
      footerHeight: 40,
      
      // Typography (exact from reference)
      fonts: {
        title: { size: 22, weight: 'bold' },
        subtitle: { size: 14, weight: 'normal' },
        stats: { size: 16, weight: 'bold' },
        statsLabel: { size: 12, weight: 'normal' },
        timeLabel: { size: 11, weight: 'normal' },
        appointmentTitle: { size: 11, weight: 'bold' },
        appointmentSource: { size: 9, weight: 'normal' },
        navigationBtn: { size: 12, weight: 'normal' }
      },
      
      // Colors (exact from reference)
      colors: {
        background: '#ffffff',
        headerBg: '#f8f9fa',
        statsBg: '#f8f9fa',
        borderDark: '#333333',
        borderLight: '#cccccc',
        textPrimary: '#000000',
        textSecondary: '#666666',
        textLight: '#999999',
        simplePracticeBlue: '#4285f4',
        googleGreen: '#34a853',
        holidayYellow: '#fbbc04'
      },
      
      // Appointment styling
      appointments: {
        leftOffset: 85,
        rightOffset: 25,
        topOffset: 2,
        bottomOffset: 2,
        maxTitleLength: 15
      }
    };

    // Apply fixes based on audit results
    auditResults.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        console.log(`🔧 Applying fix for ${issue.section}: ${issue.fix}`);
      }
    });

    return config;
  }
}

// Export singleton instance
export const templateAuditSystem = new TemplateAuditSystem();
export { REFERENCE_TEMPLATE };
export type { AuditResult, TemplateAudit };