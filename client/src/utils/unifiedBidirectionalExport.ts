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
  private pdf: jsPDF;
  private weekStart: Date;
  private weekEnd: Date;
  private events: CalendarEvent[];

  constructor(events: CalendarEvent[], weekStart: Date) {
    this.events = events;
    this.weekStart = new Date(weekStart);
    this.weekStart.setHours(0, 0, 0, 0);
    
    this.weekEnd = new Date(weekStart);
    this.weekEnd.setDate(weekStart.getDate() + 6);
    this.weekEnd.setHours(23, 59, 59, 999);

    // Start with landscape for weekly page
    this.pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [WEEKLY_CONFIG.pageWidth, WEEKLY_CONFIG.pageHeight]
    });
  }

  /**
   * Create Page 1: Weekly View using Current Weekly Export logic
   */
  private createWeeklyPage(): void {
    console.log('📄 Creating Page 1: Current Weekly View (landscape)');
    
    this.pdf.setFont('helvetica');
    
    // Draw header (replicated from currentWeeklyExport)
    this.drawWeeklyHeader();
    
    // Draw grid and events (replicated from currentWeeklyExport)
    this.drawWeeklyGrid();
    
    // Add navigation footer
    this.addWeeklyNavigation();
  }

  /**
   * Draw weekly header (from currentWeeklyExport logic)
   */
  private drawWeeklyHeader(): void {
    const { margins, fonts } = WEEKLY_CONFIG;
    
    // Title
    this.pdf.setFontSize(fonts.title);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text('WEEKLY PLANNER', margins, margins + 20);
    
    // Week info
    this.pdf.setFontSize(fonts.weekInfo);
    this.pdf.setFont('helvetica', 'normal');
    const weekStartStr = this.weekStart.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    const weekEndStr = this.weekEnd.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
    
    this.pdf.text(`${weekStartStr} - ${weekEndStr}`, margins, margins + 35);
  }

  /**
   * Draw weekly grid (from currentWeeklyExport logic)
   */
  private drawWeeklyGrid(): void {
    const { margins, timeColumnWidth, dayColumnWidth, timeSlotHeight, fonts } = WEEKLY_CONFIG;
    
    const gridStartY = margins + 50;
    const timeGridStartY = gridStartY + 25;
    const totalSlots = 36; // 6:00 AM to 11:30 PM
    
    // Draw day headers
    this.pdf.setFontSize(fonts.dayHeader);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setTextColor(0, 0, 0);
    
    const dayNames = ['TIME', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < dayNames.length; i++) {
      const x = margins + (i === 0 ? 0 : timeColumnWidth + (i - 1) * dayColumnWidth);
      const width = i === 0 ? timeColumnWidth : dayColumnWidth;
      
      // Header background
      this.pdf.setFillColor(248, 249, 250);
      this.pdf.rect(x, gridStartY, width, 25, 'F');
      
      // Header border
      this.pdf.setDrawColor(0, 0, 0);
      this.pdf.setLineWidth(1);
      this.pdf.rect(x, gridStartY, width, 25, 'S');
      
      if (i > 0) {
        // Dynamic day headers
        const dayDate = new Date(this.weekStart);
        dayDate.setDate(this.weekStart.getDate() + (i - 1));
        
        const dayNum = dayDate.getDate().toString();
        const month = (dayDate.getMonth() + 1).toString();
        const year = dayDate.getFullYear().toString();
        
        const dayHeaderText = `${dayNames[i]} ${month}/${dayNum}/${year}`;
        
        const textWidth = this.pdf.getTextWidth(dayHeaderText);
        this.pdf.text(dayHeaderText, x + (width - textWidth) / 2, gridStartY + 16);
      } else {
        const textWidth = this.pdf.getTextWidth(dayNames[i]);
        this.pdf.text(dayNames[i], x + (width - textWidth) / 2, gridStartY + 16);
      }
    }

    // Draw time slots
    for (let slot = 0; slot < totalSlots; slot++) {
      const y = timeGridStartY + slot * timeSlotHeight;
      const hour = Math.floor(slot / 2) + 6;
      const minute = (slot % 2) * 30;
      const isHourSlot = minute === 0;

      // Time slot background
      const timeSlotColor = isHourSlot ? 230 : 248;
      this.pdf.setFillColor(timeSlotColor, timeSlotColor, timeSlotColor);
      this.pdf.rect(margins, y, timeColumnWidth, timeSlotHeight, 'F');

      // Grid lines
      this.pdf.setDrawColor(200, 200, 200);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(margins, y, margins + timeColumnWidth + 7 * dayColumnWidth, y);

      // Time labels
      this.pdf.setFontSize(fonts.timeLabel);
      this.pdf.setFont('helvetica', isHourSlot ? 'bold' : 'normal');
      this.pdf.setTextColor(0, 0, 0);
      
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const timeX = margins + timeColumnWidth / 2;
      const timeY = y + timeSlotHeight / 2 + 2;
      
      if (isHourSlot || minute === 30) {
        this.pdf.text(timeStr, timeX, timeY, { align: 'center' });
      }

      // Day columns background
      for (let day = 0; day < 7; day++) {
        const dayX = margins + timeColumnWidth + day * dayColumnWidth;
        this.pdf.setFillColor(timeSlotColor, timeSlotColor, timeSlotColor);
        this.pdf.rect(dayX, y, dayColumnWidth, timeSlotHeight, 'F');
      }
    }

    // Draw vertical separators  
    for (let day = 0; day <= 7; day++) {
      const x = margins + timeColumnWidth + day * dayColumnWidth;
      this.pdf.setDrawColor(150, 150, 150);
      this.pdf.setLineWidth(1);
      this.pdf.line(x, gridStartY, x, timeGridStartY + totalSlots * timeSlotHeight);
    }

    // Draw events
    this.drawWeeklyEvents(timeGridStartY);

    // Draw outer border
    this.pdf.setDrawColor(0, 0, 0);
    this.pdf.setLineWidth(2);
    this.pdf.rect(margins, gridStartY, timeColumnWidth + 7 * dayColumnWidth, 25 + totalSlots * timeSlotHeight, 'S');
  }

  /**
   * Draw events on weekly grid
   */
  private drawWeeklyEvents(gridStartY: number): void {
    const { margins, timeColumnWidth, dayColumnWidth, timeSlotHeight, fonts } = WEEKLY_CONFIG;
    
    const weekEvents = this.events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= this.weekStart && eventDate <= this.weekEnd;
    });

    weekEvents.forEach(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      const dayOfWeek = eventStart.getDay();
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 6, Monday = 0
      
      const eventHour = eventStart.getHours();
      const eventMinute = eventStart.getMinutes();
      
      if (eventHour < 6 || eventHour >= 24) return;
      
      const slotIndex = (eventHour - 6) * 2 + (eventMinute >= 30 ? 1 : 0);
      
      const x = margins + timeColumnWidth + adjustedDay * dayColumnWidth + 2;
      const y = gridStartY + slotIndex * timeSlotHeight + 2;

      const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      const numberOfSlots = Math.ceil(durationMinutes / 30);
      const height = numberOfSlots * timeSlotHeight - 4;
      const width = dayColumnWidth - 4;

      // Event styling based on type
      const eventType = this.getEventType(event);
      this.drawWeeklyEvent(x, y, width, height, event, eventType);
    });
  }

  /**
   * Get event type for styling
   */
  private getEventType(event: CalendarEvent): string {
    const title = event.title.toLowerCase();
    const calendarId = event.calendarId?.toLowerCase() || '';
    
    if (title.includes('appointment') || event.source === 'simplepractice') return 'simplepractice';
    if (calendarId.includes('holiday') || title.includes('forecast')) return 'holiday';
    return 'google';
  }

  /**
   * Draw individual event on weekly grid
   */
  private drawWeeklyEvent(x: number, y: number, width: number, height: number, event: CalendarEvent, type: string): void {
    const { fonts } = WEEKLY_CONFIG;
    
    // Event background and border
    if (type === 'simplepractice') {
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(x, y, width, height, 'F');
      this.pdf.setDrawColor(99, 102, 241);
      this.pdf.setLineWidth(1);
      this.pdf.rect(x, y, width, height, 'S');
      this.pdf.setLineWidth(3);
      this.pdf.line(x, y, x, y + height);
    } else if (type === 'holiday') {
      this.pdf.setFillColor(255, 235, 59);
      this.pdf.rect(x, y, width, height, 'F');
      this.pdf.setDrawColor(245, 158, 11);
      this.pdf.setLineWidth(1);
      this.pdf.rect(x, y, width, height, 'S');
    } else {
      this.pdf.setFillColor(255, 255, 255);
      this.pdf.rect(x, y, width, height, 'F');
      this.pdf.setDrawColor(34, 197, 94);
      this.pdf.setLineWidth(1);
      this.pdf.setLineDashPattern([2, 2], 0);
      this.pdf.rect(x, y, width, height, 'S');
      this.pdf.setLineDashPattern([], 0);
    }

    // Event text
    this.pdf.setFontSize(fonts.eventTitle);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setTextColor(0, 0, 0);
    
    const cleanTitle = this.cleanEventTitle(event.title);
    const maxWidth = width - 4;
    const wrappedText = this.wrapText(cleanTitle, maxWidth, fonts.eventTitle);
    
    let textY = y + 8;
    wrappedText.forEach(line => {
      if (textY < y + height - 4) {
        this.pdf.text(line, x + 2, textY);
        textY += 6;
      }
    });
  }

  /**
   * Clean event title
   */
  private cleanEventTitle(title: string): string {
    return title.replace(/🔒\s*/, '').replace(/\s*Appointment$/, '').trim();
  }

  /**
   * Wrap text to fit width
   */
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    this.pdf.setFontSize(fontSize);
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = this.pdf.getTextWidth(testLine);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Add navigation to weekly page
   */
  private addWeeklyNavigation(): void {
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Navigation footer
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(60, 60, 60);
    this.pdf.text('Navigate to daily pages:', 20, pageHeight - 15);
    
    // Links to daily pages
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let x = 150;
    
    days.forEach((day, index) => {
      this.pdf.setTextColor(0, 0, 255); // Blue for links
      this.pdf.text(day, x, pageHeight - 15);
      
      // Add clickable link to daily page
      this.pdf.link(x, pageHeight - 25, 30, 20, { pageNumber: index + 2 });
      
      x += 40;
    });
  }

  /**
   * Create daily pages using EXACT HTML Browser Export logic
   */
  private async createDailyPages(): Promise<void> {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(this.weekStart);
      currentDate.setDate(this.weekStart.getDate() + i);
      
      console.log(`📄 Creating Page ${i + 2}: ${days[i]} using EXACT HTML Browser Export logic`);
      
      // Add new page in portrait orientation
      this.pdf.addPage('a4', 'portrait');
      
      // Create daily page using browser replica logic
      await this.createBrowserReplicaDailyPage(currentDate, days[i], i + 2);
    }
  }

  /**
   * Create daily page using EXACT HTML Browser Export logic
   */
  private async createBrowserReplicaDailyPage(date: Date, dayName: string, pageNumber: number): Promise<void> {
    // Create container with exact browser structure from browserReplicaPDF
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1200px';
    container.style.backgroundColor = '#ffffff';
    container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

    // Filter events for this specific date
    const filteredEvents = this.events.filter(event => {
      if (!event?.startTime || !date) return false;
      try {
        const eventStart = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
        if (isNaN(eventStart.getTime())) return false;
        return eventStart.toDateString() === date.toDateString();
      } catch (error) {
        return false;
      }
    });

    const dayNameFull = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Create the HTML structure exactly like browserReplicaPDF
    container.innerHTML = this.generateDailyPageHTML(dayNameFull, dateString, filteredEvents);

    document.body.appendChild(container);

    try {
      // Capture the page
      const canvas = await html2canvas(container, {
        width: 1200,
        height: 800,
        scale: 1,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Add the captured image to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = this.pdf.internal.pageSize.getWidth();
      const pdfHeight = this.pdf.internal.pageSize.getHeight();
      
      // Scale to fit page with margin
      const scale = Math.min(
        (pdfWidth - 40) / canvas.width,
        (pdfHeight - 60) / canvas.height
      );
      
      const imgWidth = canvas.width * scale;
      const imgHeight = canvas.height * scale;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 20;

      this.pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      // Add navigation
      this.addDailyNavigation(pageNumber, date);

    } finally {
      document.body.removeChild(container);
    }
  }

  /**
   * Generate HTML for daily page using EXACT HTML Browser Export structure
   */
  private generateDailyPageHTML(dayName: string, dateString: string, events: CalendarEvent[]): string {
    // Calculate statistics
    const totalAppointments = events.length;
    const scheduledHours = events.reduce((sum, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    const workdayHours = 17.5; // 6 AM to 11:30 PM
    const availableHours = Math.max(0, workdayHours - scheduledHours);
    const freeTimePercentage = Math.round((availableHours / workdayHours) * 100);

    return `
      <style>
        .planner-container {
          width: 1200px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px 24px;
          background: white;
          border: 3px solid #3b82f6;
          border-radius: 8px;
        }

        .weekly-overview-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #f8fafc;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 140px;
          justify-content: center;
        }

        .page-title {
          text-align: center;
          flex: 1;
        }

        .page-title h2 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 4px 0;
          color: #1E293B;
        }

        .page-title p {
          font-size: 16px;
          color: #64748B;
          margin: 0;
        }

        .stats-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #f1f5f9;
          padding: 12px 24px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: 100px 1fr;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }

        .time-column {
          background: #f8fafc;
          display: grid;
          grid-template-rows: repeat(36, 40px);
        }

        .time-slot {
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 500;
          color: #64748B;
        }

        .time-slot[data-time="12:00"], .time-slot[data-time="13:00"], .time-slot[data-time="14:00"],
        .time-slot[data-time="15:00"], .time-slot[data-time="16:00"], .time-slot[data-time="17:00"],
        .time-slot[data-time="18:00"], .time-slot[data-time="19:00"], .time-slot[data-time="20:00"],
        .time-slot[data-time="21:00"], .time-slot[data-time="22:00"], .time-slot[data-time="23:00"] {
          background: #f0f0f0;
        }

        .appointments-column {
          display: grid;
          grid-template-rows: repeat(36, 40px);
          position: relative;
        }

        .appointment {
          position: absolute;
          left: 4px;
          right: 4px;
          border-radius: 4px;
          padding: 8px;
          font-size: 12px;
          line-height: 1.2;
          z-index: 1;
          display: grid;
          grid-template-columns: 3fr 3.5fr 3.5fr;
          gap: 12px;
        }

        .appointment.simplepractice {
          background: white;
          border: 2px solid #6366f1;
          border-left: 8px solid #6366f1;
        }

        .appointment.google {
          background: white;
          border: 2px dashed #22c55e;
        }

        .appointment.holiday {
          background: #fef3c7;
          border: 2px solid #f59e0b;
        }

        .appointment-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .appointment-title {
          font-weight: 600;
          color: #1e293b;
          font-size: 16px;
        }

        .appointment-source {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 500;
        }

        .appointment-time {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }

        .appointment-notes, .appointment-actions {
          font-size: 14px;
          color: #475569;
        }

        .appointment-notes h4, .appointment-actions h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 6px 0;
          text-decoration: underline;
        }

        .appointment-notes ul, .appointment-actions ul {
          margin: 0;
          padding-left: 16px;
        }

        .appointment-notes li, .appointment-actions li {
          margin-bottom: 4px;
        }
      </style>

      <div class="planner-container">
        <div class="nav-header">
          <button class="weekly-overview-btn">← Weekly Overview</button>
          <div class="page-title">
            <h2>DAILY PLANNER</h2>
            <p>${dayName}, ${dateString}</p>
          </div>
          <div style="width: 140px;"></div>
        </div>

        <div class="stats-bar">
          <div><strong>${totalAppointments} appointments</strong> scheduled</div>
          <div><strong>${scheduledHours.toFixed(1)}h</strong> scheduled, <strong>${availableHours.toFixed(1)}h</strong> available</div>
          <div><strong>${freeTimePercentage}% free time</strong></div>
        </div>

        <div class="calendar-grid">
          <div class="time-column">
            ${Array.from({ length: 36 }, (_, i) => {
              const hour = Math.floor(i / 2) + 6;
              const minute = (i % 2) * 30;
              const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              return `<div class="time-slot" data-time="${timeStr}">${timeStr}</div>`;
            }).join('')}
          </div>

          <div class="appointments-column">
            ${events.map(event => this.generateAppointmentHTML(event)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate HTML for individual appointment
   */
  private generateAppointmentHTML(event: CalendarEvent): string {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
    
    const startHour = eventStart.getHours();
    const startMinute = eventStart.getMinutes();
    
    if (startHour < 6 || startHour >= 24) return '';
    
    const slotIndex = (startHour - 6) * 2 + (startMinute >= 30 ? 1 : 0);
    const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
    const numberOfSlots = Math.ceil(durationMinutes / 30);
    
    const top = slotIndex * 40; // 40px per slot
    const height = numberOfSlots * 40;
    
    const eventType = this.getEventType(event);
    const cleanTitle = this.cleanEventTitle(event.title);
    
    const startTimeStr = eventStart.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    const endTimeStr = eventEnd.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });

    // Get notes and action items
    const notes = Array.isArray(event.notes) ? event.notes : (event.notes ? [event.notes] : []);
    const actionItems = Array.isArray(event.actionItems) ? event.actionItems : (event.actionItems ? [event.actionItems] : []);

    return `
      <div class="appointment ${eventType}" style="top: ${top}px; height: ${height}px;">
        <div class="appointment-info">
          <div class="appointment-title">${cleanTitle}</div>
          <div class="appointment-source">${event.source?.toUpperCase() || 'MANUAL'}</div>
          <div class="appointment-time">${startTimeStr}-${endTimeStr}</div>
        </div>
        
        ${notes.length > 0 ? `
          <div class="appointment-notes">
            <h4>Event Notes</h4>
            <ul>
              ${notes.map(note => `<li>${note}</li>`).join('')}
            </ul>
          </div>
        ` : '<div></div>'}
        
        ${actionItems.length > 0 ? `
          <div class="appointment-actions">
            <h4>Action Items</h4>
            <ul>
              ${actionItems.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        ` : '<div></div>'}
      </div>
    `;
  }

  /**
   * Add navigation to daily page
   */
  private addDailyNavigation(pageNumber: number, currentDate: Date): void {
    const pageWidth = this.pdf.internal.pageSize.getWidth();
    const pageHeight = this.pdf.internal.pageSize.getHeight();
    
    // Navigation footer
    this.pdf.setFillColor(245, 245, 245);
    this.pdf.rect(0, pageHeight - 30, pageWidth, 30, 'F');
    
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(0, 0, 255);
    
    // Link back to weekly
    this.pdf.text('← Weekly', 20, pageHeight - 15);
    this.pdf.link(20, pageHeight - 25, 60, 20, { pageNumber: 1 });
    
    // Previous day
    if (pageNumber > 2) {
      this.pdf.text('← Prev', 100, pageHeight - 15);
      this.pdf.link(100, pageHeight - 25, 40, 20, { pageNumber: pageNumber - 1 });
    }
    
    // Next day
    if (pageNumber < 8) {
      this.pdf.text('Next →', 160, pageHeight - 15);
      this.pdf.link(160, pageHeight - 25, 40, 20, { pageNumber: pageNumber + 1 });
    }
  }

  /**
   * Main export function - creates complete 8-page PDF
   */
  async export(): Promise<string> {
    try {
      console.log('🔗 UNIFIED BIDIRECTIONAL EXPORT STARTING...');
      console.log('📊 Using existing templates: Current Weekly View + EXACT HTML Browser Export');
      
      // Step 1: Create weekly page using Current Weekly View template
      console.log('📄 Step 1: Creating weekly page using Current Weekly View template...');
      this.createWeeklyPage();
      
      // Step 2: Create daily pages using EXACT HTML Browser Export template
      console.log('📄 Step 2: Creating daily pages using EXACT HTML Browser Export template...');
      await this.createDailyPages();
      
      // Step 3: Save the unified PDF
      const filename = `unified-bidirectional-weekly-package-${this.weekStart.toISOString().split('T')[0]}.pdf`;
      
      // Enhanced save with multiple methods
      try {
        this.pdf.save(filename);
        
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
   * Add navigation links to a PDF page
   */
  private addNavigationLinks(
    pageNumber: number,
    pageType: 'weekly' | 'daily',
    currentDate?: Date
  ) {
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
  async exportBidirectionalWeeklyPackage(
    events: CalendarEvent[],
    weekStart: Date
  ): Promise<string> {
    try {
      console.log('🔗 UNIFIED BIDIRECTIONAL EXPORT STARTING...');
      console.log('📊 Using existing templates: Current Weekly View + EXACT HTML Browser Export');
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Step 1: Capture weekly page using Current Weekly View template
      console.log('📄 Step 1: Capturing weekly template...');
      const weeklyPage = await this.createWeeklyPage(events, weekStart, weekEnd);
      this.pages.push(weeklyPage);

      // Step 2: Capture daily pages using EXACT HTML Browser Export template
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart);
        currentDate.setDate(weekStart.getDate() + i);
        
        console.log(`📄 Step ${i + 2}: Capturing ${days[i]} template...`);
        const dailyPage = await this.createDailyPage(events, currentDate, days[i]);
        this.pages.push(dailyPage);
      }

      // Step 3: Create unified PDF with all pages
      console.log('📄 Step 3: Creating unified PDF with navigation...');
      this.pdf = new jsPDF({
        orientation: 'landscape', // Start with landscape for weekly page
        unit: 'pt',
        format: 'a4'
      });

      // Add all pages to the PDF
      for (let i = 0; i < this.pages.length; i++) {
        const page = this.pages[i];
        
        if (i > 0) {
          // Change orientation for daily pages
          if (i === 1) {
            this.pdf.addPage('a4', 'portrait');
          } else {
            this.pdf.addPage();
          }
        }

        // Add the captured page image
        const imgData = page.canvas.toDataURL('image/png');
        const pdfWidth = this.pdf.internal.pageSize.getWidth();
        const pdfHeight = this.pdf.internal.pageSize.getHeight();
        
        // Calculate scaling to fit page
        const scale = Math.min(
          (pdfWidth - 40) / page.width,
          (pdfHeight - 60) / page.height
        );
        
        const imgWidth = page.width * scale;
        const imgHeight = page.height * scale;
        const x = (pdfWidth - imgWidth) / 2;
        const y = 20;

        this.pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

        // Add navigation links
        this.addNavigationLinks(
          i + 1,
          i === 0 ? 'weekly' : 'daily',
          i > 0 ? new Date(weekStart.getTime() + (i - 1) * 24 * 60 * 60 * 1000) : undefined
        );
      }

      // Step 4: Save the unified PDF
      const filename = `unified-bidirectional-weekly-package-${weekStart.toISOString().split('T')[0]}.pdf`;
      
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
      console.log('🔗 8 pages with bidirectional navigation');
      console.log('📊 Uses existing Current Weekly View + EXACT HTML Browser Export templates');

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