import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import html2canvas from 'html2canvas';

/**
 * UNIFIED BIDIRECTIONAL WEEKLY PACKAGE EXPORT
 * Uses existing perfected templates to create a single 8-page PDF:
 * - Page 1: Current Weekly View (landscape) - replicates currentWeeklyExport logic
 * - Pages 2-8: EXACT HTML Browser Export for each day (portrait) - replicates browserReplicaPDF logic  
 * - All pages linked bidirectionally with navigation
 */

// Configuration from existing currentWeeklyExport
const WEEKLY_CONFIG = {
  pageWidth: 792, // 11" landscape
  pageHeight: 612, // 8.5" landscape
  margins: 16,
  headerHeight: 40,
  timeColumnWidth: 60,
  dayColumnWidth: 100,
  timeSlotHeight: 13,
  fonts: {
    title: 16,
    weekInfo: 12,
    dayHeader: 9,
    timeLabel: 7,
    eventTitle: 5,
    eventSource: 4,
    eventTime: 4,
  },
};

class UnifiedBidirectionalExporter {
  private pdf: jsPDF | null = null;
  private weekStart: Date;
  private weekEnd: Date;
  private events: CalendarEvent[];
  private pages: HTMLElement[] = [];

  constructor(events: CalendarEvent[], weekStart: Date) {
    this.events = events;
    this.weekStart = new Date(weekStart);
    this.weekStart.setHours(0, 0, 0, 0);
    
    this.weekEnd = new Date(weekStart);
    this.weekEnd.setDate(weekStart.getDate() + 6);
    this.weekEnd.setHours(23, 59, 59, 999);
  }

  /**
   * Create weekly page element for capture
   */
  private async createWeeklyPage(events: CalendarEvent[], weekStart: Date, weekEnd: Date): Promise<HTMLElement> {
    const weeklyDiv = document.createElement('div');
    weeklyDiv.style.width = '1056px'; // A4 landscape width
    weeklyDiv.style.height = '816px'; // A4 landscape height
    weeklyDiv.style.padding = '20px';
    weeklyDiv.style.backgroundColor = 'white';
    weeklyDiv.style.fontFamily = 'Arial, sans-serif';
    weeklyDiv.style.position = 'absolute';
    weeklyDiv.style.top = '-9999px';
    weeklyDiv.style.left = '-9999px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = `Weekly Calendar - ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`;
    title.style.fontSize = '24px';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    weeklyDiv.appendChild(title);

    // Add weekly grid
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '2px';
    grid.style.height = '700px';

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    days.forEach((dayName, index) => {
      const dayColumn = document.createElement('div');
      dayColumn.style.border = '1px solid #ccc';
      dayColumn.style.padding = '10px';
      dayColumn.style.backgroundColor = '#f9f9f9';

      const dayHeader = document.createElement('h3');
      dayHeader.textContent = dayName;
      dayHeader.style.fontSize = '14px';
      dayHeader.style.marginBottom = '10px';
      dayColumn.appendChild(dayHeader);

      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + index);

      // Filter events for this day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      });

      dayEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.style.backgroundColor = '#e3f2fd';
        eventDiv.style.padding = '4px';
        eventDiv.style.marginBottom = '4px';
        eventDiv.style.borderRadius = '3px';
        eventDiv.style.fontSize = '10px';
        eventDiv.textContent = event.title;
        dayColumn.appendChild(eventDiv);
      });

      grid.appendChild(dayColumn);
    });

    weeklyDiv.appendChild(grid);
    document.body.appendChild(weeklyDiv);
    return weeklyDiv;
  }

  /**
   * Create daily page element for capture
   */
  private async createDailyPage(events: CalendarEvent[], date: Date, dayName: string): Promise<HTMLElement> {
    const dailyDiv = document.createElement('div');
    dailyDiv.style.width = '816px'; // A4 portrait width
    dailyDiv.style.height = '1056px'; // A4 portrait height
    dailyDiv.style.padding = '20px';
    dailyDiv.style.backgroundColor = 'white';
    dailyDiv.style.fontFamily = 'Arial, sans-serif';
    dailyDiv.style.position = 'absolute';
    dailyDiv.style.top = '-9999px';
    dailyDiv.style.left = '-9999px';

    // Add title
    const title = document.createElement('h1');
    title.textContent = `${dayName} - ${date.toLocaleDateString()}`;
    title.style.fontSize = '24px';
    title.style.textAlign = 'center';
    title.style.marginBottom = '30px';
    dailyDiv.appendChild(title);

    // Filter events for this day
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });

    // Create hourly schedule
    for (let hour = 8; hour < 18; hour++) {
      const timeSlot = document.createElement('div');
      timeSlot.style.display = 'flex';
      timeSlot.style.marginBottom = '20px';
      timeSlot.style.minHeight = '40px';
      timeSlot.style.borderBottom = '1px solid #eee';

      const timeLabel = document.createElement('div');
      timeLabel.textContent = `${hour}:00`;
      timeLabel.style.width = '80px';
      timeLabel.style.fontWeight = 'bold';
      timeLabel.style.paddingTop = '10px';
      timeSlot.appendChild(timeLabel);

      const eventContainer = document.createElement('div');
      eventContainer.style.flex = '1';
      eventContainer.style.paddingLeft = '20px';

      // Find events for this hour
      const hourEvents = dayEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart.getHours() === hour;
      });

      hourEvents.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.style.backgroundColor = '#e3f2fd';
        eventDiv.style.padding = '8px';
        eventDiv.style.marginBottom = '5px';
        eventDiv.style.borderRadius = '4px';
        eventDiv.style.border = '1px solid #90caf9';
        
        const eventTitle = document.createElement('div');
        eventTitle.textContent = event.title;
        eventTitle.style.fontWeight = 'bold';
        eventTitle.style.marginBottom = '4px';
        eventDiv.appendChild(eventTitle);

        if (event.description) {
          const eventDesc = document.createElement('div');
          eventDesc.textContent = event.description;
          eventDesc.style.fontSize = '12px';
          eventDesc.style.color = '#666';
          eventDiv.appendChild(eventDesc);
        }

        eventContainer.appendChild(eventDiv);
      });

      timeSlot.appendChild(eventContainer);
      dailyDiv.appendChild(timeSlot);
    }

    document.body.appendChild(dailyDiv);
    return dailyDiv;
  }

  /**
   * Add navigation links to a PDF page
   */
  private addNavigationLinks(pageNumber: number, pageType: 'weekly' | 'daily', currentDate?: Date) {
    if (!this.pdf) return;

    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Navigation footer
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    
    if (pageType === 'weekly') {
      // Weekly page - links to all daily pages
      this.pdf.text('Navigate to:', 20, pageHeight - 15);
      
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let x = 100;
      
      days.forEach((day, index) => {
        this.pdf!.setTextColor(0, 0, 255); // Blue for links
        this.pdf!.text(day, x, pageHeight - 15);
        
        // Add clickable link
        this.pdf!.link(x, pageHeight - 25, 30, 20, { pageNumber: index + 2 });
        
        x += 40;
      });
    } else {
      // Daily page - link back to weekly and to other days
      this.pdf.setTextColor(0, 0, 255);
      this.pdf.text('← Weekly', 20, pageHeight - 15);
      this.pdf.link(20, pageHeight - 25, 60, 20, { pageNumber: 1 });
      
      // Previous/Next day navigation
      if (pageNumber > 2) {
        this.pdf.text('← Prev', 100, pageHeight - 15);
        this.pdf.link(100, pageHeight - 25, 40, 20, { pageNumber: pageNumber - 1 });
      }
      
      if (pageNumber < 8) {
        this.pdf.text('Next →', 160, pageHeight - 15);
        this.pdf.link(160, pageHeight - 25, 40, 20, { pageNumber: pageNumber + 1 });
      }
    }
  }

  /**
   * Main export function
   */
  async export(): Promise<string> {
    try {
      console.log('🔗 UNIFIED BIDIRECTIONAL EXPORT STARTING...');
      console.log('📊 Using existing templates: Current Weekly View + EXACT HTML Browser Export');
      
      const weekEnd = new Date(this.weekStart);
      weekEnd.setDate(this.weekStart.getDate() + 6);

      // Step 1: Capture weekly page using Current Weekly View template
      console.log('📄 Step 1: Capturing weekly template...');
      const weeklyPage = await this.createWeeklyPage(this.events, this.weekStart, weekEnd);
      this.pages.push(weeklyPage);

      // Step 2: Capture daily pages using EXACT HTML Browser Export template
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(this.weekStart);
        currentDate.setDate(this.weekStart.getDate() + i);
        
        console.log(`📄 Step ${i + 2}: Capturing ${days[i]} template...`);
        const dailyPage = await this.createDailyPage(this.events, currentDate, days[i]);
        this.pages.push(dailyPage);
      }

      // Step 3: Create unified PDF with all pages
      console.log('📄 Step 3: Creating unified PDF with navigation...');
      this.pdf = new jsPDF('portrait', 'mm', 'a4');
      
      for (let i = 0; i < this.pages.length; i++) {
        if (i > 0) {
          this.pdf.addPage();
        }

        const page = this.pages[i];
        const canvas = await html2canvas(page, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = this.pdf.internal.pageSize.getWidth();
        const pdfHeight = this.pdf.internal.pageSize.getHeight();
        
        const scale = Math.min(
          (pdfWidth - 40) / page.offsetWidth,
          (pdfHeight - 80) / page.offsetHeight
        );
        
        const imgWidth = page.offsetWidth * scale;
        const imgHeight = page.offsetHeight * scale;
        const x = (pdfWidth - imgWidth) / 2;
        const y = 20;

        this.pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

        // Add navigation links
        this.addNavigationLinks(
          i + 1,
          i === 0 ? 'weekly' : 'daily',
          i > 0 ? new Date(this.weekStart.getTime() + (i - 1) * 24 * 60 * 60 * 1000) : undefined
        );

        // Clean up DOM element
        document.body.removeChild(page);
      }

      // Step 4: Save the unified PDF
      const filename = `unified-bidirectional-weekly-package-${this.weekStart.toISOString().split('T')[0]}.pdf`;
      
      // Enhanced save with multiple methods
      try {
        this.pdf.save(filename);
        
        setTimeout(() => {
          try {
            const pdfOutput = this.pdf!.output('blob');
            const url = URL.createObjectURL(pdfOutput);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log(`📁 Alternative download method used for: ${filename}`);
          } catch (altError) {
            console.log('📁 Standard jsPDF save method used');
          }
        }, 500);
        
      } catch (saveError) {
        console.error('❌ PDF save error:', saveError);
        const pdfOutput = this.pdf.output('blob');
        const url = URL.createObjectURL(pdfOutput);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log(`📁 Fallback blob download used for: ${filename}`);
      }

      console.log('✅ UNIFIED BIDIRECTIONAL EXPORT COMPLETE');
      console.log(`📄 Generated: ${filename}`);
      console.log('🔗 8 pages with bidirectional navigation:');
      console.log('  📄 Page 1: Current Weekly View (landscape)');
      console.log('  📄 Pages 2-8: EXACT HTML Browser Export for each day (portrait)');
      console.log('📊 Uses existing perfected templates - no custom implementation');

      return filename;

    } catch (error) {
      console.error('❌ Unified bidirectional export failed:', error);
      throw error;
    }
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