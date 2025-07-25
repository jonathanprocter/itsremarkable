import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { applyCurrentWeeklyTemplate, applyBrowserReplicaTemplate } from './templateExtractors';

/**
 * TRUE UNIFIED BIDIRECTIONAL WEEKLY PACKAGE EXPORT
 * 
 * Creates a single PDF with bidirectional navigation by:
 * 1. Executing existing template functions to generate their content
 * 2. Intercepting the PDF output and adding it to our unified document
 * 3. Adding clickable navigation links between pages
 * 4. Using the ACTUAL existing templates without modification
 */

class UnifiedBidirectionalExporter {
  private events: CalendarEvent[];
  private weekStart: Date;
  private weekEnd: Date;
  private pdf: jsPDF;
  private linkColor = [0, 0, 255]; // Blue for links

  constructor(events: CalendarEvent[], weekStart: Date) {
    this.events = events;
    this.weekStart = new Date(weekStart);
    this.weekStart.setHours(0, 0, 0, 0);
    
    this.weekEnd = new Date(weekStart);
    this.weekEnd.setDate(weekStart.getDate() + 6);
    this.weekEnd.setHours(23, 59, 59, 999);

    // Initialize PDF in landscape for weekly view (matching Current Weekly Export)
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [792, 612] // Exact dimensions from Current Weekly Export
    });
  }



  /**
   * Add professional navigation utilizing actual template buttons and cells
   */
  private addProfessionalNavigation(pageNumber: number, pageType: 'weekly' | 'daily', currentDate?: Date) {
    if (pageType === 'weekly') {
      this.addWeeklyNavigationButtons();
    } else if (pageType === 'daily' && currentDate) {
      this.addDailyNavigationButtons(pageNumber, currentDate);
    }
  }

  /**
   * Add professional weekly navigation using ACTUAL day column headers as clickable areas
   */
  private addWeeklyNavigationButtons() {
    // Use EXACT coordinates from Current Weekly Export template
    // These match the actual day column headers that users see
    
    const config = {
      margins: 16,           // From CURRENT_WEEKLY_CONFIG
      timeColumnWidth: 60,   // From CURRENT_WEEKLY_CONFIG  
      dayColumnWidth: 100,   // From CURRENT_WEEKLY_CONFIG
      headerHeight: 40       // From CURRENT_WEEKLY_CONFIG
    };
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      // Calculate EXACT position of day column headers from template
      const x = config.margins + config.timeColumnWidth + (dayIndex * config.dayColumnWidth);
      const y = config.margins;
      const width = config.dayColumnWidth;
      const height = config.headerHeight;
      
      // Make the entire day column header clickable (invisible clickable area)
      // This overlays exactly on the existing day headers from the template
      this.pdf.link(x, y, width, height, {
        pageNumber: dayIndex + 2 // Daily pages start at page 2
      });
      
      console.log(`🔗 Enhanced ${days[dayIndex]} header clickability at coordinates (${x}, ${y}) -> page ${dayIndex + 2}`);
    }
    
    // Add professional navigation instructions utilizing existing footer space
    this.addWeeklyNavigationFooter();
  }

  /**
   * Add professional daily navigation using ACTUAL browser replica buttons
   */
  private addDailyNavigationButtons(pageNumber: number, currentDate: Date) {
    // Utilize the EXACT "Weekly Overview" button from Browser Replica template
    // Button coordinates from .nav-header and .weekly-overview-btn CSS
    
    // The button is positioned in nav-header with these exact measurements:
    // - Container padding: 20px
    // - Nav-header padding: 16px 24px  
    // - Button position: left side of nav-header
    const buttonX = 20 + 24; // Container padding + nav-header left padding
    const buttonY = 20 + 16;  // Container padding + nav-header top padding
    const buttonWidth = 140;  // min-width from CSS
    const buttonHeight = 32;  // Calculated from padding 8px * 2 + font height
    
    // Make the ACTUAL "Weekly Overview" button clickable
    this.pdf.link(buttonX, buttonY, buttonWidth, buttonHeight, {
      pageNumber: 1 // Back to weekly overview
    });
    
    console.log(`🔗 Enhanced ACTUAL "Weekly Overview" button at (${buttonX}, ${buttonY}) -> page 1`);
    
    // Add discrete day navigation that integrates with existing template
    this.addDiscreteNavigationEnhancements(pageNumber, currentDate);
  }

  /**
   * Add discrete navigation enhancements that integrate seamlessly with existing template
   */
  private addDiscreteNavigationEnhancements(pageNumber: number, currentDate: Date) {
    // Add minimal, discrete day navigation that doesn't interfere with template aesthetics
    // Position in the right margin area to avoid template content overlap
    
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const navigationX = pageWidth - 180; // Right margin area
    const navigationY = 160; // Below header, above content
    
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']; // Single letters for minimal space
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Add very subtle background for navigation area
    this.pdf.setFillColor(252, 252, 252);
    this.pdf.rect(navigationX - 10, navigationY - 15, 160, 25, 'F');
    
    // Add discrete border
    this.pdf.setDrawColor(240, 240, 240);
    this.pdf.rect(navigationX - 10, navigationY - 15, 160, 25, 'S');
    
    // Add navigation title
    this.pdf.setFontSize(7);
    this.pdf.setTextColor(120, 120, 120);
    this.pdf.text('Quick Navigate:', navigationX - 5, navigationY - 5);
    
    let x = navigationX;
    
    for (let i = 0; i < 7; i++) {
      const targetPage = i + 2;
      
      if (targetPage !== pageNumber) {
        // Add clickable day button
        this.pdf.setFillColor(248, 248, 248);
        this.pdf.circle(x + 8, navigationY + 2, 8, 'F');
        
        this.pdf.setDrawColor(220, 220, 220);
        this.pdf.circle(x + 8, navigationY + 2, 8, 'S');
        
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(this.linkColor[0], this.linkColor[1], this.linkColor[2]);
        this.pdf.text(days[i], x + 5, navigationY + 5);
        
        // Make button clickable
        this.pdf.link(x, navigationY - 6, 16, 16, {
          pageNumber: targetPage
        });
        
        console.log(`🔗 Added discrete navigation for ${dayNames[i]} -> page ${targetPage}`);
      } else {
        // Current day indicator
        this.pdf.setFillColor(59, 130, 246); // Blue for current day
        this.pdf.circle(x + 8, navigationY + 2, 8, 'F');
        
        this.pdf.setFontSize(8);
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.text(days[i], x + 5, navigationY + 5);
      }
      
      x += 20;
    }
    
    // Reset styling
    this.pdf.setTextColor(0, 0, 0);
  }

  /**
   * Add professional weekly navigation footer
   */
  private addWeeklyNavigationFooter() {
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Professional footer with instructions
    this.pdf.setFillColor(250, 250, 250);
    this.pdf.rect(0, pageHeight - 25, pageWidth, 25, 'F');
    
    this.pdf.setDrawColor(220, 220, 220);
    this.pdf.line(0, pageHeight - 25, pageWidth, pageHeight - 25);
    
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(100, 100, 100);
    this.pdf.text('📅 Click any day column header above to view detailed daily planner', pageWidth / 2, pageHeight - 12, { align: 'center' });
    
    // Add page indicator
    this.pdf.setFontSize(7);
    this.pdf.text('Page 1 of 8 | Weekly Overview', pageWidth - 10, pageHeight - 5, { align: 'right' });
  }

  /**
   * Apply template-consistent styling enhancements for pixel-perfect quality
   */
  private applyPixelPerfectEnhancements() {
    // Add subtle template quality markers that don't interfere with existing content
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Add minimal footer with page indicator only
    this.pdf.setFontSize(6);
    this.pdf.setTextColor(180, 180, 180);
    this.pdf.text('Unified Bidirectional Export', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    // Reset styling
    this.pdf.setTextColor(0, 0, 0);
  }

  /**
   * Main export function - Creates single bidirectional PDF using ACTUAL existing templates
   */
  async export(): Promise<string> {
    try {
      console.log('🔗 TRUE UNIFIED BIDIRECTIONAL EXPORT STARTING...');
      console.log('📊 Using ACTUAL existing templates: Current Weekly Export + Browser Replica PDF');
      
      // Step 1: Use ACTUAL Current Weekly Export template logic for Page 1
      console.log('📄 Page 1: Calling ACTUAL Current Weekly Export template...');
      
      // Import and replicate the EXACT logic from currentWeeklyExport.ts
      await this.createActualWeeklyPage();
      
      // Step 2: Use ACTUAL Browser Replica PDF template logic for Pages 2-8
      console.log('📄 Pages 2-8: Calling ACTUAL Browser Replica PDF templates...');
      
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDate = new Date(this.weekStart);
        currentDate.setDate(this.weekStart.getDate() + dayIndex);
        
        console.log(`📄 Page ${dayIndex + 2}: Creating ${days[dayIndex]} using ACTUAL Browser Replica template...`);
        
        // Add new page in portrait orientation
        this.pdf.addPage([612, 792], 'portrait'); // US Letter portrait
        
        // Call ACTUAL Browser Replica PDF template logic
        await this.createActualDailyPage(currentDate, dayIndex + 2);
      }
      
      console.log('🎯 UNIFIED BIDIRECTIONAL EXPORT COMPLETE');
      
      // Save the file
      const filename = `unified-bidirectional-weekly-package-${this.weekStart.toISOString().split('T')[0]}.pdf`;
      this.pdf.save(filename);
      
      return filename;
      
    } catch (error) {
      console.error('❌ Unified Bidirectional Export failed:', error);
      throw error;
    }
  }

  /**
   * Create page 1 using ACTUAL Current Weekly Export template function
   */
  private async createActualWeeklyPage(): Promise<void> {
    console.log('📄 Page 1: Calling ACTUAL Current Weekly Export template...');
    
    // Use the extracted template function to apply the EXACT rendering
    applyCurrentWeeklyTemplate(this.pdf, this.events, this.weekStart, this.weekEnd);
    
    // Add professional navigation utilizing actual template elements
    this.addProfessionalNavigation(1, 'weekly');
  }

  /**
   * Create daily page using ACTUAL Browser Replica PDF template
   */
  private async createActualDailyPage(currentDate: Date, pageNumber: number): Promise<void> {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`📄 Page ${pageNumber}: Creating ${dayName} using ACTUAL Browser Replica template...`);
    
    // Use the extracted template function to apply the EXACT rendering
    await applyBrowserReplicaTemplate(this.pdf, this.events, currentDate);
    
    // Add professional navigation utilizing actual template elements
    this.addProfessionalNavigation(pageNumber, 'daily', currentDate);
  }
}

/**
 * Main export function - Creates unified 8-page bidirectional weekly package
 * Uses existing perfected templates: Current Weekly View + EXACT HTML Browser Export
 */
export const exportUnifiedBidirectionalWeeklyPackage = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<string> => {
  console.log('🔗 STARTING UNIFIED BIDIRECTIONAL EXPORT...');
  console.log('📊 Integrating existing templates: Current Weekly View + EXACT HTML Browser Export');
  
  const exporter = new UnifiedBidirectionalExporter(events, weekStart);
  return await exporter.export();
};