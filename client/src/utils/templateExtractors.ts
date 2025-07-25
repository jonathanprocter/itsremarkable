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
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
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
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return sum + duration;
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
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);
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
  });
  
  console.log('✅ Applied EXACT Browser Replica PDF template logic');
};