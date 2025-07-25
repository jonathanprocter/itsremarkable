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
   * Add navigation links to the PDF
   */
  private addNavigationLinks(pageNumber: number, pageType: 'weekly' | 'daily', currentDate?: Date) {
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Navigation bar background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    
    // Navigation text
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(60, 60, 60);
    
    if (pageType === 'weekly') {
      this.pdf.text('Weekly Overview - Click to navigate: ', 20, pageHeight - 15);
      
      // Add links to each daily page
      let x = 180;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const dayName = days[i];
        const targetPage = i + 2; // Daily pages start at page 2
        
        this.pdf.setTextColor(this.linkColor[0], this.linkColor[1], this.linkColor[2]);
        this.pdf.text(dayName, x, pageHeight - 15);
        
        // Add clickable link
        const textWidth = this.pdf.getTextWidth(dayName);
        this.pdf.link(x, pageHeight - 25, textWidth, 12, {
          pageNumber: targetPage
        });
        
        x += 40;
      }
    } else if (pageType === 'daily' && currentDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      this.pdf.text(`${dayName} ${dateStr} - `, 20, pageHeight - 15);
      
      // Link back to weekly overview
      this.pdf.setTextColor(this.linkColor[0], this.linkColor[1], this.linkColor[2]);
      this.pdf.text('Weekly Overview', 120, pageHeight - 15);
      this.pdf.link(120, pageHeight - 25, this.pdf.getTextWidth('Weekly Overview'), 12, {
        pageNumber: 1
      });
      
      // Links to other daily pages
      let x = 220;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      
      for (let i = 0; i < 7; i++) {
        const dayName = days[i];
        const targetPage = i + 2;
        
        if (targetPage !== pageNumber) {
          this.pdf.setTextColor(this.linkColor[0], this.linkColor[1], this.linkColor[2]);
          this.pdf.text(dayName, x, pageHeight - 15);
          
          const textWidth = this.pdf.getTextWidth(dayName);
          this.pdf.link(x, pageHeight - 25, textWidth, 12, {
            pageNumber: targetPage
          });
          x += 40;
        }
      }
    }
    
    // Reset text color
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
    
    // Add navigation links
    this.addNavigationLinks(1, 'weekly');
  }

  /**
   * Create daily page using ACTUAL Browser Replica PDF template
   */
  private async createActualDailyPage(currentDate: Date, pageNumber: number): Promise<void> {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log(`📄 Page ${pageNumber}: Creating ${dayName} using ACTUAL Browser Replica template...`);
    
    // Use the extracted template function to apply the EXACT rendering
    await applyBrowserReplicaTemplate(this.pdf, this.events, currentDate);
    
    // Add navigation links
    this.addNavigationLinks(pageNumber, 'daily', currentDate);
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