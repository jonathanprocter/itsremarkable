import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { exportCurrentWeeklyView } from './currentWeeklyExport';
import { exportBrowserReplicaPDF } from './browserReplicaPDF';

/**
 * Enhanced Bidirectional PDF Export System
 * Creates a single linked PDF with navigation between weekly and daily views
 */

interface PDFPage {
  type: 'weekly' | 'daily';
  title: string;
  date?: Date;
  pageNumber: number;
  content: any;
}

export class BidirectionalPDFManager {
  private pages: PDFPage[] = [];
  private pdf: jsPDF;
  private linkColor = [0, 0, 255]; // Blue for links
  private navigationHeight = 30;

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });
  }

  /**
   * Add navigation links to each page
   */
  private addNavigationLinks(pageNumber: number, pageType: 'weekly' | 'daily', currentDate?: Date) {
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Navigation bar background
    this.pdf.setFillColor(240, 240, 240);
    this.pdf.rect(0, pageHeight - this.navigationHeight, pageWidth, this.navigationHeight, 'F');
    
    // Navigation text
    this.pdf.setFontSize(8);
    this.pdf.setTextColor(60, 60, 60);
    
    let navText = '';
    const links: Array<{text: string, x: number, y: number, page: number}> = [];
    
    if (pageType === 'weekly') {
      navText = 'Weekly Overview - Navigate to: ';
      let x = 50;
      
      // Add links to each daily page
      for (let i = 0; i < 7; i++) {
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
        const targetPage = i + 2; // Daily pages start at page 2
        
        links.push({
          text: dayName,
          x: x,
          y: pageHeight - 15,
          page: targetPage
        });
        
        x += 40;
      }
    } else if (pageType === 'daily' && currentDate) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = currentDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      navText = `${dayName} ${dateStr} - `;
      
      // Link back to weekly overview
      links.push({
        text: 'Weekly Overview',
        x: 50,
        y: pageHeight - 15,
        page: 1
      });
      
      // Links to other daily pages
      let x = 150;
      for (let i = 0; i < 7; i++) {
        const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i];
        const targetPage = i + 2;
        
        if (targetPage !== pageNumber) {
          links.push({
            text: dayName,
            x: x,
            y: pageHeight - 15,
            page: targetPage
          });
          x += 40;
        }
      }
    }
    
    // Add navigation text
    this.pdf.text(navText, 20, pageHeight - 15);
    
    // Add clickable links
    this.pdf.setTextColor(...this.linkColor);
    links.forEach(link => {
      // Add text
      this.pdf.text(link.text, link.x, link.y);
      
      // Add clickable area as a link
      const textWidth = this.pdf.getTextWidth(link.text);
      this.pdf.link(link.x, link.y - 10, textWidth, 12, {
        pageNumber: link.page
      });
    });
    
    // Reset text color
    this.pdf.setTextColor(0, 0, 0);
  }

  /**
   * Create weekly overview page with enhanced navigation
   */
  private async createWeeklyPage(events: CalendarEvent[], weekStart: Date, weekEnd: Date): Promise<void> {
    console.log('📄 Creating enhanced weekly overview page...');
    
    // Create temporary container for weekly content
    const weeklyContainer = document.createElement('div');
    weeklyContainer.style.position = 'absolute';
    weeklyContainer.style.left = '-9999px';
    weeklyContainer.style.top = '0';
    weeklyContainer.style.width = '1100px';
    weeklyContainer.style.height = '800px';
    weeklyContainer.style.backgroundColor = '#ffffff';
    weeklyContainer.style.padding = '20px';
    
    // Add weekly calendar content
    const weeklyHTML = this.generateWeeklyHTML(events, weekStart, weekEnd);
    weeklyContainer.innerHTML = weeklyHTML;
    
    document.body.appendChild(weeklyContainer);
    
    try {
      // Capture weekly content
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(weeklyContainer, {
        width: 1100,
        height: 750, // Leave space for navigation
        backgroundColor: '#ffffff',
        scale: 1
      });
      
      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      this.pdf.addImage(imgData, 'PNG', 20, 20, 752, 550);
      
      // Add navigation
      this.addNavigationLinks(1, 'weekly');
      
      console.log('✅ Weekly overview page created');
      
    } finally {
      document.body.removeChild(weeklyContainer);
    }
  }

  /**
   * Create daily page with enhanced navigation
   */
  private async createDailyPage(events: CalendarEvent[], date: Date, pageNumber: number): Promise<void> {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    console.log(`📄 Creating enhanced ${dayName} page...`);
    
    // Filter events for this date
    const dailyEvents = events.filter(event => {
      if (!event?.startTime) return false;
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
    
    // Create temporary container for daily content
    const dailyContainer = document.createElement('div');
    dailyContainer.style.position = 'absolute';
    dailyContainer.style.left = '-9999px';
    dailyContainer.style.top = '0';
    dailyContainer.style.width = '1100px';
    dailyContainer.style.height = '800px';
    dailyContainer.style.backgroundColor = '#ffffff';
    dailyContainer.style.padding = '20px';
    
    // Add daily calendar content
    const dailyHTML = this.generateDailyHTML(dailyEvents, date);
    dailyContainer.innerHTML = dailyHTML;
    
    document.body.appendChild(dailyContainer);
    
    try {
      // Add new page
      if (pageNumber > 1) {
        this.pdf.addPage();
      }
      
      // Capture daily content
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(dailyContainer, {
        width: 1100,
        height: 750,
        backgroundColor: '#ffffff',
        scale: 1
      });
      
      // Add to PDF
      const imgData = canvas.toDataURL('image/png');
      this.pdf.addImage(imgData, 'PNG', 20, 20, 752, 550);
      
      // Add navigation
      this.addNavigationLinks(pageNumber, 'daily', date);
      
      console.log(`✅ ${dayName} page created`);
      
    } finally {
      document.body.removeChild(dailyContainer);
    }
  }

  /**
   * Generate weekly calendar HTML
   */
  private generateWeeklyHTML(events: CalendarEvent[], weekStart: Date, weekEnd: Date): string {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = this.generateTimeSlots();
    
    let weeklyHTML = `
      <style>
        .weekly-container {
          font-family: Inter, sans-serif;
          width: 100%;
          height: 100%;
        }
        .weekly-header {
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .weekly-grid {
          display: grid;
          grid-template-columns: 80px repeat(7, 1fr);
          gap: 1px;
          background-color: #e5e7eb;
          border: 1px solid #d1d5db;
        }
        .time-slot {
          background: #f9fafb;
          padding: 4px;
          font-size: 8px;
          text-align: center;
          border-right: 1px solid #d1d5db;
        }
        .day-header {
          background: #3b82f6;
          color: white;
          padding: 8px 4px;
          font-size: 10px;
          font-weight: bold;
          text-align: center;
        }
        .day-cell {
          background: white;
          min-height: 15px;
          position: relative;
          padding: 2px;
        }
        .event-block {
          background: #dbeafe;
          border: 1px solid #3b82f6;
          border-radius: 2px;
          padding: 1px 2px;
          font-size: 6px;
          color: #1e40af;
          margin: 1px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      </style>
      
      <div class="weekly-container">
        <div class="weekly-header">
          Weekly Overview: ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}
        </div>
        
        <div class="weekly-grid">
          <div class="time-slot"></div>
          ${days.map(day => `<div class="day-header">${day}</div>`).join('')}
          
          ${timeSlots.map(timeSlot => `
            <div class="time-slot">${timeSlot}</div>
            ${days.map((_, dayIndex) => {
              const dayDate = new Date(weekStart);
              dayDate.setDate(weekStart.getDate() + dayIndex);
              const dayEvents = this.getEventsForTimeSlot(events, dayDate, timeSlot);
              
              return `
                <div class="day-cell">
                  ${dayEvents.map(event => `
                    <div class="event-block" title="${event.title}">
                      ${event.title.substring(0, 15)}${event.title.length > 15 ? '...' : ''}
                    </div>
                  `).join('')}
                </div>
              `;
            }).join('')}
          `).join('')}
        </div>
      </div>
    `;
    
    return weeklyHTML;
  }

  /**
   * Generate daily calendar HTML
   */
  private generateDailyHTML(events: CalendarEvent[], date: Date): string {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const timeSlots = this.generateTimeSlots();
    
    let dailyHTML = `
      <style>
        .daily-container {
          font-family: Inter, sans-serif;
          width: 100%;
          height: 100%;
        }
        .daily-header {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .daily-grid {
          display: grid;
          grid-template-columns: 100px 1fr;
          gap: 1px;
          background-color: #e5e7eb;
          border: 1px solid #d1d5db;
        }
        .time-label {
          background: #f9fafb;
          padding: 8px;
          font-size: 10px;
          text-align: center;
          border-bottom: 1px solid #d1d5db;
        }
        .time-content {
          background: white;
          padding: 8px;
          min-height: 30px;
          border-bottom: 1px solid #d1d5db;
          position: relative;
        }
        .event-item {
          background: #dbeafe;
          border: 1px solid #3b82f6;
          border-radius: 4px;
          padding: 4px 8px;
          margin: 2px 0;
          font-size: 9px;
          color: #1e40af;
        }
        .event-title {
          font-weight: bold;
          margin-bottom: 2px;
        }
        .event-time {
          font-size: 8px;
          color: #6b7280;
        }
      </style>
      
      <div class="daily-container">
        <div class="daily-header">
          ${dayName}, ${dateString}
        </div>
        
        <div class="daily-grid">
          ${timeSlots.map(timeSlot => {
            const slotEvents = this.getEventsForTimeSlot(events, date, timeSlot);
            
            return `
              <div class="time-label">${timeSlot}</div>
              <div class="time-content">
                ${slotEvents.map(event => `
                  <div class="event-item">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">
                      ${new Date(event.startTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })} - 
                      ${new Date(event.endTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    
    return dailyHTML;
  }

  /**
   * Generate time slots for the day
   */
  private generateTimeSlots(): string[] {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      const timeString = hour === 12 ? '12:00 PM' : 
                        hour > 12 ? `${hour - 12}:00 PM` : 
                        hour === 0 ? '12:00 AM' : 
                        `${hour}:00 AM`;
      slots.push(timeString);
    }
    return slots;
  }

  /**
   * Get events for a specific time slot
   */
  private getEventsForTimeSlot(events: CalendarEvent[], date: Date, timeSlot: string): CalendarEvent[] {
    const slotHour = this.parseTimeSlot(timeSlot);
    
    return events.filter(event => {
      if (!event?.startTime) return false;
      
      const eventDate = new Date(event.startTime);
      if (eventDate.toDateString() !== date.toDateString()) return false;
      
      const eventHour = eventDate.getHours();
      return eventHour === slotHour;
    });
  }

  /**
   * Parse time slot string to hour number
   */
  private parseTimeSlot(timeSlot: string): number {
    const match = timeSlot.match(/(\d+):00 (AM|PM)/);
    if (!match) return 0;
    
    let hour = parseInt(match[1]);
    const period = match[2];
    
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    return hour;
  }

  /**
   * Export the complete bidirectional PDF
   */
  async exportBidirectionalWeeklyPackage(
    events: CalendarEvent[], 
    weekStart: Date
  ): Promise<string> {
    try {
      console.log('🔗 Starting Bidirectional Weekly Package Export...');
      
      // Calculate week end
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Create weekly overview page
      await this.createWeeklyPage(events, weekStart, weekEnd);
      
      // Create daily pages
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        
        await this.createDailyPage(events, currentDate, i + 2);
      }
      
      // Generate filename
      const filename = `bidirectional-weekly-package-${weekStart.toISOString().split('T')[0]}.pdf`;
      
      // Save PDF with enhanced download mechanism
      try {
        // Try standard save first
        this.pdf.save(filename);
        
        // Add a small delay and try alternative download method if needed
        setTimeout(() => {
          try {
            const pdfOutput = this.pdf.output('blob');
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
        // Fallback to blob download
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
      
      console.log(`✅ Bidirectional Weekly Package exported: ${filename}`);
      console.log('🔗 PDF includes clickable navigation between all pages');
      
      return filename;
      
    } catch (error) {
      console.error('❌ Bidirectional export failed:', error);
      throw error;
    }
  }
}

/**
 * Main export function - simplified interface
 */
export const exportBidirectionalWeeklyPackage = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<string> => {
  const manager = new BidirectionalPDFManager();
  return await manager.exportBidirectionalWeeklyPackage(events, weekStart);
};

/**
 * Enhanced export function with return path for API integration
 */
export const exportBidirectionalWeeklyPackageWithPath = async (
  events: CalendarEvent[],
  weekStart: Date
): Promise<{ filename: string; path: string }> => {
  const filename = await exportBidirectionalWeeklyPackage(events, weekStart);
  return {
    filename,
    path: `./${filename}` // Adjust path as needed for your setup
  };
};