import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

/**
 * Template extraction functions for unified bidirectional export
 * These functions extract the rendering logic from existing perfect templates
 * to enable their use within the unified PDF exporter
 */

/**
 * Apply EXACT Current Weekly Export template to an existing PDF page
 * Extracts the core rendering logic from currentWeeklyExport.ts
 */
// Import the EXACT drawing functions from currentWeeklyExport.ts
import { drawCurrentWeeklyHeader, drawCurrentWeeklyGrid } from './currentWeeklyExport';
// Import the EXACT HTML daily export drawing functions
import { drawDailyHeader, drawDailyGrid, drawDailyFooter } from './htmlTemplatePDF';
// Import the scaled daily template for unified export
import { drawScaledDailyTemplate } from './scaledDailyTemplate';

export const applyCurrentWeeklyTemplate = (
  pdf: jsPDF,
  events: CalendarEvent[],
  weekStart: Date,
  weekEnd: Date
): void => {
  console.log('📄 Applying EXACT Current Weekly Export template...');
  
  // Normalize dates exactly like the original
  const normalizedWeekStart = new Date(weekStart);
  normalizedWeekStart.setHours(0, 0, 0, 0);
  
  const normalizedWeekEnd = new Date(weekEnd);
  normalizedWeekEnd.setHours(23, 59, 59, 999);
  
  // Apply EXACT template rendering from currentWeeklyExport.ts
  pdf.setFont('helvetica');
  
  // Use EXACT drawing functions from currentWeeklyExport
  drawCurrentWeeklyHeader(pdf, normalizedWeekStart, normalizedWeekEnd);
  drawCurrentWeeklyGrid(pdf, events, normalizedWeekStart);
  
  console.log('✅ Applied EXACT Current Weekly Export template');
};

/**
 * Apply EXACT HTML Daily Export template to an existing PDF page
 * Uses the EXACT htmlTemplatePDF.ts daily rendering logic
 */
export const applyHTMLDailyTemplate = (
  pdf: jsPDF,
  selectedDate: Date,
  events: CalendarEvent[],
  pageNumber: number,
  dayOfWeek: number
): void => {
  console.log('📄 Applying scaled daily template for unified export...');
  
  // Get current page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  console.log(`📐 Current page dimensions: ${pageWidth}x${pageHeight}`);
  
  // Use the scaled template that's designed for standard US Letter (612x792)
  drawScaledDailyTemplate(pdf, selectedDate, events, pageNumber, dayOfWeek);
  
  console.log('✅ Applied scaled daily template');
};

/**
 * Generate HTML for browser replica template
 */
const generateBrowserReplicaHTML = (selectedDate: Date, events: CalendarEvent[]): string => {
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Calculate statistics
  const totalAppointments = dayEvents.length;
  const scheduledHours = dayEvents.reduce((sum, event) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return sum + duration;
  }, 0);
  const workdayHours = 17.5; // 6 AM to 11:30 PM
  const availableHours = Math.max(0, workdayHours - scheduledHours);
  const freeTimePercentage = Math.round((availableHours / workdayHours) * 100);

  // Generate time slots
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(timeStr);
    }
  }

  // Generate appointments HTML
  const appointmentsHTML = dayEvents.map(event => {
    const startTime = new Date(event.startTime);
    const endTime = new Date(event.endTime);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();
    
    const startSlot = (startHour - 6) * 2 + Math.floor(startMinute / 30);
    const endSlot = (endHour - 6) * 2 + Math.ceil(endMinute / 30);
    const height = (endSlot - startSlot) * 20; // Updated to match reduced slot height
    const top = startSlot * 20; // Updated to match reduced slot height
    
    const hasNotes = event.notes && event.notes.trim().length > 0;
    const hasActionItems = event.actionItems && event.actionItems.trim().length > 0;
    const appointmentClass = hasNotes || hasActionItems ? 'three-column' : 'single-column';
    
    let sourceClass = 'appointment';
    if (event.source === 'simplepractice') sourceClass += ' simplepractice';
    else if (event.source === 'google') sourceClass += ' google-calendar';
    else if (event.source === 'manual') sourceClass += ' personal';

    const cleanTitle = event.title.replace(/🔒/g, '').replace(' Appointment', '').trim();
    const timeStr = `${startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    return `
      <div class="${sourceClass} ${appointmentClass}" style="top: ${top}px; height: ${height}px; left: 0; right: 0;">
        ${hasNotes || hasActionItems ? `
          <div class="appointment-column">
            <div class="appointment-title">${cleanTitle}</div>
            <div class="appointment-source">${event.source === 'simplepractice' ? 'SIMPLEPRACTICE' : event.source === 'google' ? 'GOOGLE CALENDAR' : 'PERSONAL'}</div>
            <div class="appointment-time">${timeStr}</div>
          </div>
          ${hasNotes ? `
          <div class="appointment-column">
            <div class="section-header">Event Notes</div>
            <div class="notes-content">${event.notes}</div>
          </div>
          ` : ''}
          ${hasActionItems ? `
          <div class="appointment-column">
            <div class="section-header">Action Items</div>
            <div class="action-items-content">${event.actionItems}</div>
          </div>
          ` : ''}
        ` : `
          <div class="appointment-main">
            <div class="appointment-title">${cleanTitle}</div>
            <div class="appointment-source">${event.source === 'simplepractice' ? 'SIMPLEPRACTICE' : event.source === 'google' ? 'GOOGLE CALENDAR' : 'PERSONAL'}</div>
            <div class="appointment-time">${timeStr}</div>
          </div>
        `}
      </div>
    `;
  }).join('');

  return `
    <div class="planner-container">
      <div class="nav-header">
        <button class="weekly-overview-btn">📅 Weekly Overview</button>
        <div class="page-title">
          <h2>${dayName}, ${dateString}</h2>
          <span class="appointment-count">${totalAppointments} appointment${totalAppointments !== 1 ? 's' : ''}</span>
        </div>
        <div class="legend">
          <div class="legend-item simplepractice">
            <div class="legend-box"></div>
            <span>SimplePractice</span>
          </div>
          <div class="legend-item google">
            <div class="legend-box"></div>
            <span>Google Calendar</span>
          </div>
          <div class="legend-item personal">
            <div class="legend-box"></div>
            <span>Personal</span>
          </div>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${totalAppointments}</div>
          <div class="stat-label">Appointments</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${scheduledHours.toFixed(1)}h</div>
          <div class="stat-label">Scheduled</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${availableHours.toFixed(1)}h</div>
          <div class="stat-label">Available</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${freeTimePercentage}%</div>
          <div class="stat-label">Free Time</div>
        </div>
      </div>

      <div class="calendar-grid">
        <div class="time-column">
          ${timeSlots.map(time => `
            <div class="time-slot" data-time="${time}">
              ${time}
            </div>
          `).join('')}
        </div>
        <div class="appointments-column">
          ${timeSlots.map(time => `
            <div class="appointment-slot" data-time="${time}"></div>
          `).join('')}
          ${appointmentsHTML}
        </div>
      </div>

      <div class="bottom-nav">
        <button class="nav-btn">&lt; Previous Day</button>
        <button class="nav-btn weekly-btn">Weekly Overview</button>
        <button class="nav-btn">Next Day &gt;</button>
      </div>
    </div>
  `;
};

/**
 * Export browser replica to canvas for embedding in unified PDF
 */
export const exportBrowserReplicaToCanvas = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<HTMLCanvasElement> => {
  const html2canvas = (await import('html2canvas')).default;
  
  // Create temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '1200px';
  container.style.backgroundColor = 'white';
  document.body.appendChild(container);

  // Get CSS from browserReplicaPDF
  const cssContent = `
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
      background: white;
      border: 2px solid #3b82f6;
      border-radius: 6px;
      color: #3b82f6;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-title h2 {
      margin: 0;
      font-size: 28px;
      color: #1e293b;
      font-weight: 700;
    }

    .appointment-count {
      font-size: 14px;
      color: #64748b;
      margin-top: 4px;
      display: block;
    }

    .legend {
      display: flex;
      gap: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #475569;
    }

    .legend-box {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .legend-item.simplepractice .legend-box {
      background: #dbeafe;
      border: 2px solid #3b82f6;
      border-left: 4px solid #3b82f6;
    }

    .legend-item.google .legend-box {
      background: #dcfce7;
      border: 2px dashed #22c55e;
    }

    .legend-item.personal .legend-box {
      background: #fef3c7;
      border: 2px solid #f59e0b;
    }

    .stats-bar {
      display: flex;
      justify-content: space-around;
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 8px;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }

    .calendar-grid {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 0;
      border: 2px solid #000000;
      border-radius: 8px;
      overflow: visible;
      background: white;
      position: relative;
      height: 720px; /* Reduced height to fit in PDF page */
    }

    .time-column {
      background: #ffffff;
      border-right: 2px solid #000000;
      height: 720px;
      overflow-y: auto;
    }

    .appointments-column {
      position: relative;
      background: white;
      height: 720px;
      overflow: visible;
    }

    .time-slot {
      height: 20px; /* Reduced to fit all 36 slots in 720px */
      padding: 2px 8px;
      border-bottom: 1px solid #000000;
      display: flex;
      font-size: 10px;
      align-items: center;
      color: #000000;
      font-size: 14px;
      font-weight: 500;
    }

    .appointment-slot {
      height: 20px; /* Matching time slot height */
      border-bottom: 1px solid #000000;
      position: relative;
    }

    .time-slot[data-time="06:00"], .time-slot[data-time="07:00"], .time-slot[data-time="08:00"], 
    .time-slot[data-time="09:00"], .time-slot[data-time="10:00"], .time-slot[data-time="11:00"],
    .time-slot[data-time="12:00"], .time-slot[data-time="13:00"], .time-slot[data-time="14:00"],
    .time-slot[data-time="15:00"], .time-slot[data-time="16:00"], .time-slot[data-time="17:00"],
    .time-slot[data-time="18:00"], .time-slot[data-time="19:00"], .time-slot[data-time="20:00"],
    .time-slot[data-time="21:00"], .time-slot[data-time="22:00"], .time-slot[data-time="23:00"] {
      background: #f1f5f9 !important;
    }

    .time-slot[data-time="06:30"], .time-slot[data-time="07:30"], .time-slot[data-time="08:30"],
    .time-slot[data-time="09:30"], .time-slot[data-time="10:30"], .time-slot[data-time="11:30"],
    .time-slot[data-time="12:30"], .time-slot[data-time="13:30"], .time-slot[data-time="14:30"],
    .time-slot[data-time="15:30"], .time-slot[data-time="16:30"], .time-slot[data-time="17:30"],
    .time-slot[data-time="18:30"], .time-slot[data-time="19:30"], .time-slot[data-time="20:30"],
    .time-slot[data-time="21:30"], .time-slot[data-time="22:30"], .time-slot[data-time="23:30"] {
      background: #ffffff !important;
    }

    .appointment-slot[data-time="06:00"], .appointment-slot[data-time="07:00"], .appointment-slot[data-time="08:00"],
    .appointment-slot[data-time="09:00"], .appointment-slot[data-time="10:00"], .appointment-slot[data-time="11:00"],
    .appointment-slot[data-time="12:00"], .appointment-slot[data-time="13:00"], .appointment-slot[data-time="14:00"],
    .appointment-slot[data-time="15:00"], .appointment-slot[data-time="16:00"], .appointment-slot[data-time="17:00"],
    .appointment-slot[data-time="18:00"], .appointment-slot[data-time="19:00"], .appointment-slot[data-time="20:00"],
    .appointment-slot[data-time="21:00"], .appointment-slot[data-time="22:00"], .appointment-slot[data-time="23:00"] {
      background: #f1f5f9 !important;
    }

    .appointment-slot[data-time="06:30"], .appointment-slot[data-time="07:30"], .appointment-slot[data-time="08:30"],
    .appointment-slot[data-time="09:30"], .appointment-slot[data-time="10:30"], .appointment-slot[data-time="11:30"],
    .appointment-slot[data-time="12:30"], .appointment-slot[data-time="13:30"], .appointment-slot[data-time="14:30"],
    .appointment-slot[data-time="15:30"], .appointment-slot[data-time="16:30"], .appointment-slot[data-time="17:30"],
    .appointment-slot[data-time="18:30"], .appointment-slot[data-time="19:30"], .appointment-slot[data-time="20:30"],
    .appointment-slot[data-time="21:30"], .appointment-slot[data-time="22:30"], .appointment-slot[data-time="23:30"] {
      background: #ffffff !important;
    }

    .appointment {
      position: absolute;
      background: #dbeafe;
      border: 2px solid #3b82f6;
      border-left: 6px solid #3b82f6;
      border-radius: 4px;
      padding: 2px 6px 4px 6px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: visible;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      margin: 0;
      top: 0;
      line-height: 1.2;
    }

    .appointment.single-column {
      padding: 8px 12px;
    }

    .appointment.three-column {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      align-items: start;
      padding: 8px;
    }

    .appointment.google-calendar {
      background: #dcfce7;
      border: 2px dashed #22c55e;
      border-left: 6px solid #22c55e;
    }

    .appointment.personal {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-left: 6px solid #f59e0b;
    }

    .appointment-main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      overflow: visible;
    }

    .appointment-column {
      border-right: 1px solid #d1d5db;
      padding: 4px 8px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-start;
      height: 100%;
      margin: 0;
      overflow: visible;
    }

    .appointment-column:last-child {
      border-right: none;
    }

    .appointment-title {
      font-size: 14px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.3;
      margin-bottom: 4px;
    }

    .appointment-source {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin: 0;
      padding: 0;
      line-height: 1;
      margin-bottom: 6px;
    }

    .appointment-time {
      font-size: 24px;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1;
      margin-top: auto;
    }

    .section-header {
      font-size: 11px;
      font-weight: 700;
      color: #1e293b;
      text-decoration: underline;
      margin-bottom: 4px;
    }

    .notes-content,
    .action-items-content {
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }

    .bottom-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      padding: 0 20px;
    }

    .nav-btn {
      padding: 10px 20px;
      background: #f3f4f6;
      border: 2px solid #d1d5db;
      border-radius: 6px;
      color: #374151;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .nav-btn:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
    }

    .nav-btn.weekly-btn {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .nav-btn.weekly-btn:hover {
      background: #2563eb;
      border-color: #2563eb;
    }
  `;

  // Add styles to container
  const style = document.createElement('style');
  style.textContent = cssContent;
  container.appendChild(style);

  // Add HTML content
  container.innerHTML += generateBrowserReplicaHTML(selectedDate, events);

  // Wait for rendering
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create canvas with proper height to include bottom navigation
  const canvas = await html2canvas(container, {
    width: 1200,
    height: 900, // Reduced to match reduced grid height (720px grid + header + footer)
    scale: 1.0,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false
  });

  // Cleanup
  document.body.removeChild(container);

  return canvas;
};

/**
 * Apply EXACT Browser Replica PDF template to an existing PDF page
 * Uses HTML2Canvas approach to maintain pixel-perfect fidelity
 */
export const applyBrowserReplicaTemplate = async (
  pdf: jsPDF,
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('📄 Applying EXACT Browser Replica PDF template logic...');
  
  try {
    // Generate canvas using the browser replica HTML
    const canvas = await exportBrowserReplicaToCanvas(selectedDate, events);
    
    // Get current PDF page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate scaling to fit the canvas content on the PDF page
    const imgData = canvas.toDataURL('image/png');
    const canvasAspectRatio = canvas.width / canvas.height;
    const pageAspectRatio = pageWidth / pageHeight;
    
    let imgWidth, imgHeight, xOffset = 0, yOffset = 0;
    
    if (canvasAspectRatio > pageAspectRatio) {
      // Canvas is wider than page ratio - fit by width
      imgWidth = pageWidth;
      imgHeight = pageWidth / canvasAspectRatio;
      yOffset = (pageHeight - imgHeight) / 2;
    } else {
      // Canvas is taller than page ratio - fit by height
      imgHeight = pageHeight;
      imgWidth = pageHeight * canvasAspectRatio;
      xOffset = (pageWidth - imgWidth) / 2;
    }
    
    // Add the image to the current PDF page
    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
    
    console.log('✅ Applied EXACT Browser Replica PDF template logic');
  } catch (error) {
    console.error('❌ Error applying browser replica template:', error);
    // Fallback to simplified drawing if HTML approach fails
    console.log('⚠️ Falling back to simplified drawing...');
    
    // Draw a simple message indicating the page
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.setTextColor(30, 41, 59);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = selectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.text(`${dayName}, ${dateString}`, pageWidth / 2, 100, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(14);
    pdf.text('Daily Schedule', pageWidth / 2, 130, { align: 'center' });
  }
};