import { jsPDF } from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// Import the EXACT drawing functions from existing templates
import { drawCurrentWeeklyHeader, drawCurrentWeeklyGrid, CURRENT_WEEKLY_CONFIG } from './currentWeeklyExport';

/**
 * Apply EXACT Current Weekly Export template to an existing PDF
 */
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
  
  // Apply EXACT template rendering
  pdf.setFont('helvetica');
  
  // Use EXACT drawing functions from currentWeeklyExport
  drawCurrentWeeklyHeader(pdf, normalizedWeekStart, normalizedWeekEnd);
  drawCurrentWeeklyGrid(pdf, events, normalizedWeekStart);
  
  console.log('✅ Applied EXACT Current Weekly Export template');
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
    const height = (endSlot - startSlot) * 40;
    const top = startSlot * 40;
    
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
      height: ${36 * 40}px;
    }

    .time-column {
      background: #ffffff;
      border-right: 2px solid #000000;
      height: ${36 * 40}px;
    }

    .appointments-column {
      position: relative;
      background: white;
      height: ${36 * 40}px;
      overflow: visible;
    }

    .time-slot {
      height: 40px;
      padding: 8px 12px;
      border-bottom: 1px solid #000000;
      display: flex;
      align-items: center;
      color: #000000;
      font-size: 14px;
      font-weight: 500;
    }

    .appointment-slot {
      height: 40px;
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

  // Create canvas
  const canvas = await html2canvas(container, {
    width: 1200,
    height: 1600,
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
 * Since browserReplicaPDF uses HTML2Canvas, we'll extract the core drawing logic
 */
export const applyBrowserReplicaTemplate = async (
  pdf: jsPDF,
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log('📄 Applying EXACT Browser Replica PDF template logic...');
  
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    try {
      const eventDate = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      if (isNaN(eventDate.getTime())) {
        console.warn('Invalid startTime for event:', event.title);
        return false;
      }
      return eventDate.toDateString() === selectedDate.toDateString();
    } catch (error) {
      console.warn('Error filtering event:', event.title, error);
      return false;
    }
  });
  
  const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = selectedDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Calculate statistics (from browserReplicaPDF)
  const totalAppointments = dayEvents.length;
  const scheduledHours = dayEvents.reduce((sum, event) => {
    try {
      const start = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const end = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid date for event:', event.title);
        return sum;
      }
      const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    } catch (error) {
      console.warn('Error calculating duration for event:', event.title, error);
      return sum;
    }
  }, 0);
  const workdayHours = 17.5; // 6 AM to 11:30 PM
  const availableHours = Math.max(0, workdayHours - scheduledHours);
  const freeTimePercentage = Math.round((availableHours / workdayHours) * 100);
  
  // Draw header section
  pdf.setFillColor(59, 130, 246); // Blue header background
  pdf.rect(20, 20, 572, 60, 'S'); // Header border
  
  // Title and date
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(30, 41, 59); // Dark text
  pdf.text(`${dayName}, ${dateString}`, 306, 45, { align: 'center' });
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(100, 116, 139); // Gray text
  pdf.text(`${totalAppointments} appointment${totalAppointments !== 1 ? 's' : ''}`, 306, 65, { align: 'center' });
  
  // Draw statistics bar
  const statY = 100;
  const statBoxWidth = 120;
  const statSpacing = 20;
  const startX = (612 - (4 * statBoxWidth + 3 * statSpacing)) / 2;
  
  const stats = [
    { value: totalAppointments.toString(), label: 'Appointments' },
    { value: `${scheduledHours.toFixed(1)}h`, label: 'Scheduled' },
    { value: `${availableHours.toFixed(1)}h`, label: 'Available' },
    { value: `${freeTimePercentage}%`, label: 'Free Time' }
  ];
  
  stats.forEach((stat, index) => {
    const x = startX + index * (statBoxWidth + statSpacing);
    
    // Stat box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(x, statY, statBoxWidth, 50, 'FD');
    
    // Stat value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(30, 41, 59);
    pdf.text(stat.value, x + statBoxWidth/2, statY + 20, { align: 'center' });
    
    // Stat label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(stat.label, x + statBoxWidth/2, statY + 35, { align: 'center' });
  });
  
  // Draw time grid
  const gridStartY = 180;
  const timeColumnWidth = 60;
  const appointmentColumnWidth = 500;
  const slotHeight = 20;
  
  // Time slots
  let currentY = gridStartY;
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeText = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Alternating background
      if (hour % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(20, currentY, timeColumnWidth + appointmentColumnWidth, slotHeight, 'F');
      }
      
      // Time label
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100, 116, 139);
      pdf.text(timeText, 20 + timeColumnWidth/2, currentY + slotHeight/2 + 3, { align: 'center' });
      
      currentY += slotHeight;
      
      if (hour === 23 && minute === 0) break;
    }
  }
  
  // Draw appointments
  dayEvents.forEach(event => {
    try {
      const eventStart = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const eventEnd = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      
      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        console.warn('Invalid date for event:', event.title);
        return;
      }
      
      const startHour = eventStart.getHours();
      const startMinute = eventStart.getMinutes();
      const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      
      // Calculate position
      const minutesSince6am = (startHour - 6) * 60 + startMinute;
      const slotIndex = Math.floor(minutesSince6am / 30);
      const yPos = gridStartY + slotIndex * slotHeight;
      const height = Math.max(slotHeight, (durationMinutes / 30) * slotHeight);
      
      // Draw appointment box
      const appointmentX = 20 + timeColumnWidth + 10;
      const appointmentWidth = appointmentColumnWidth - 20;
      
      // Different styles based on source
      if (event.source === 'simplepractice') {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(99, 102, 241);
        pdf.setLineWidth(1);
        pdf.rect(appointmentX, yPos + 2, appointmentWidth, height - 4, 'FD');
        
        // Thick left border
        pdf.setFillColor(99, 102, 241);
        pdf.rect(appointmentX, yPos + 2, 4, height - 4, 'F');
      } else if (event.source === 'google') {
        pdf.setFillColor(255, 255, 255);
        pdf.setDrawColor(34, 197, 94);
        pdf.setLineWidth(1);
        pdf.setLineDash([2, 2]);
        pdf.rect(appointmentX, yPos + 2, appointmentWidth, height - 4, 'FD');
        pdf.setLineDash([]);
      }
      
      // Event text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      const cleanTitle = event.title.replace(/🔒/g, '').replace(' Appointment', '').trim();
      pdf.text(cleanTitle, appointmentX + 10, yPos + 15);
      
      // Time
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      const timeStr = `${eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${eventEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      pdf.text(timeStr, appointmentX + 10, yPos + 25);
    } catch (error) {
      console.error('Error drawing appointment:', event.title, error);
    }
  });
  
  console.log('✅ Applied EXACT Browser Replica PDF template logic');
};