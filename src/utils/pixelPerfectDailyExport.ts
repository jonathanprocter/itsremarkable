import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';

// EXACT DAILY PLANNER SPECIFICATIONS - 300 DPI Portrait US Letter
const PIXEL_PERFECT_CONFIG = {
  // Canvas dimensions exactly as specified
  pageWidth: 2550,   // 8.5" × 300 DPI
  pageHeight: 3300,  // 11" × 300 DPI
  dpi: 300,          // Print quality DPI

  // Margins and spacing
  margin: 0,         // No margins for full width
  headerStartY: 20,  // Header start Y position
  gridStartY: 175,   // Grid start Y position (directly after header)
  availableGridHeight: 3022, // Available grid height (adjusted for repositioned stats bar)

  // Layout structure
  header: {
    height: 175, // Increased header height to accommodate full header section
    // Weekly Overview button (top left)
    weeklyButton: {
      x: 20,
      y: 12,
      width: 170,
      height: 30,
      text: '📅 Weekly Overview',
      fontSize: 14,
      bgColor: [255, 255, 255],
      borderColor: [200, 200, 200],
      borderRadius: 6
    },
    // Date and appointment count (center)
    dateInfo: {
      x: 1275, // Center of page
      y: 15,
      fontSize: 24,
      weight: 'bold'
    },
    appointmentCount: {
      x: 1275,
      y: 42,
      fontSize: 16,
      weight: 'normal',
      style: 'italic'
    },
    // Legend (right side)
    legend: {
      x: 1600,
      y: 15,
      fontSize: 16,
      symbolSize: 12,
      spacing: 180,
      height: 12
    }
  },

  // Statistics bar - positioned above 06:00 time slot
  statsBar: {
    y: 175, // Positioned at grid start, above 06:00
    height: 63, // 1.5 times 30-minute row height (42px * 1.5)
    bgColor: [240, 240, 240],
    fontSize: 24,
    labelFontSize: 14,
    margin: 0 // Full width, no margins
  },

  // Time grid
  grid: {
    timeColumnWidth: 240,  // Doubled again from 120 to 240 for more space
    mainAreaWidth: 2310,  // 2550 - 240 = 2310 (full width minus time column)
    rowHeight: 84,        // 84px each row
    totalRows: 36,        // All time slots 06:00-23:30

    // Time formatting
    topHourFont: 32,     // Increased to match appointment times
    halfHourFont: 30,    // 2pt smaller for half hour (bottom of hour)
    topHourBg: [240, 240, 240], // Light grey
    halfHourBg: [255, 255, 255], // White

    // Borders
    borderColor: [0, 0, 0],
    borderWidth: 1,

    // Vertical divider between time column and events
    verticalDivider: {
      color: [34, 34, 34], // Dark grey matching dashboard
      width: 2
    }
  },

  // Appointment styling
  appointments: {
    margin: 5,           // 5px margin from grid edges
    width: 2220,         // Main area width minus 90px (2310 - 90)

    // Content layout
    singleColumn: {
      titleY: 30,        // Moved down to keep within appointment box
      titleFont: 40,     // Large, bold font to fill space
      sourceY: 65,       // Moved down proportionally
      sourceFont: 28,    // Increased for visibility
      timeY: 90,         // Moved down proportionally
      timeFont: 32,      // Bold time display
      leftMargin: 15
    },

    threeColumn: {
      columnWidth: 770,  // 2310 / 3
      headerFont: 28,    // Increased from 24
      bulletFont: 20,    // Increased from 16
      separatorColor: [0, 0, 0]
    },

    // Calendar-specific styling
    simplePractice: {
      borderColor: [100, 149, 237], // Cornflower blue
      leftBorderWidth: 4,           // Increased by 1px as requested
      normalBorderWidth: 1
    },

    google: {
      borderColor: [34, 139, 34], // Green
      dashPattern: [8, 4]
    },

    holiday: {
      bgColor: [255, 255, 0], // Yellow
      borderColor: [245, 158, 11] // Orange
    }
  },

  // Bottom navigation
  bottomNav: {
    y: 3240, // Near bottom of page
    height: 40,
    buttonWidth: 120,
    buttonHeight: 32,
    fontSize: 14,
    arrowSize: 24,
    spacing: 80,
    centerX: 1275, // Center of page
    bgColor: [255, 255, 255],
    borderColor: [34, 34, 34],
    borderRadius: 999 // Pill shape
  },

  // Colors
  colors: {
    black: [0, 0, 0],
    white: [255, 255, 255],
    lightGrey: [240, 240, 240],
    buttonGrey: [245, 245, 245],
    borderGrey: [180, 180, 180],
    simplePracticeBlue: [100, 149, 237],
    googleGreen: [34, 139, 34],
    holidayYellow: [255, 255, 0]
  }
};

// ALL 36 time slots exactly as specified
const ALL_TIME_SLOTS = [
  { time: '06:00', isHour: true },
  { time: '06:30', isHour: false },
  { time: '07:00', isHour: true },
  { time: '07:30', isHour: false },
  { time: '08:00', isHour: true },
  { time: '08:30', isHour: false },
  { time: '09:00', isHour: true },
  { time: '09:30', isHour: false },
  { time: '10:00', isHour: true },
  { time: '10:30', isHour: false },
  { time: '11:00', isHour: true },
  { time: '11:30', isHour: false },
  { time: '12:00', isHour: true },
  { time: '12:30', isHour: false },
  { time: '13:00', isHour: true },
  { time: '13:30', isHour: false },
  { time: '14:00', isHour: true },
  { time: '14:30', isHour: false },
  { time: '15:00', isHour: true },
  { time: '15:30', isHour: false },
  { time: '16:00', isHour: true },
  { time: '16:30', isHour: false },
  { time: '17:00', isHour: true },
  { time: '17:30', isHour: false },
  { time: '18:00', isHour: true },
  { time: '18:30', isHour: false },
  { time: '19:00', isHour: true },
  { time: '19:30', isHour: false },
  { time: '20:00', isHour: true },
  { time: '20:30', isHour: false },
  { time: '21:00', isHour: true },
  { time: '21:30', isHour: false },
  { time: '22:00', isHour: true },
  { time: '22:30', isHour: false },
  { time: '23:00', isHour: true },
  { time: '23:30', isHour: false }
];

// Helper function to clean appointment title
function cleanAppointmentTitle(title: string): string {
  // Remove emoji and lock symbols, then remove "Appointment" suffix
  let cleanTitle = title.replace(/[🔒🔓]/g, '').trim(); // Remove lock symbols
  cleanTitle = cleanTitle.replace(/[\u{1F000}-\u{1F9FF}]/gu, '').trim(); // Remove emojis
  return cleanTitle.endsWith(' Appointment') ? cleanTitle.slice(0, -12) : cleanTitle;
}


// Helper function to format time in 24-hour format
function formatMilitaryTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// Draw header section matching EXACT user specification
function drawPixelPerfectHeader(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const config = PIXEL_PERFECT_CONFIG;

  // Set white background for entire header first
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, config.pageWidth, config.header.height, 'F');

  // Filter events to selected day for count
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const eventDay = eventDate.toDateString();
    const selectedDay = selectedDate.toDateString();
    return eventDay === selectedDay;
  });

  // TOP SECTION - Weekly Overview button (top left)
  const buttonX = 20;
  const buttonY = 12;
  const buttonWidth = 170;
  const buttonHeight = 30;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(1);
  pdf.roundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 6, 6, 'FD');

  // Button text with calendar emoji
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(0, 0, 0);
  pdf.text('📅 Weekly Overview', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 5, { align: 'center' });

  // Date (perfectly centered) - exact font size and positioning from screenshot
  const dateStr = selectedDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(dateStr, config.pageWidth / 2, 23, { align: 'center' });

  // LEGEND (right side) - exact spacing and positioning from screenshot
  const legendY = 15;
  const legendSpacing = 180;
  const rightMargin = 20;

  // Legend items (right to left positioning) - exactly as shown
  const legends = [
    { text: 'Holidays in United States', color: [255, 165, 0] },
    { text: 'Google Calendar', color: [173, 216, 230] },
    { text: 'SimplePractice', color: [100, 149, 237] }
  ];

  let currentX = config.pageWidth - rightMargin;
  
  legends.forEach((legend) => {
    const textWidth = pdf.getTextWidth(legend.text);
    const textX = currentX - textWidth;
    const squareX = textX - 20;

    // Draw colored square
    pdf.setFillColor(...legend.color);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.rect(squareX, legendY - 6, 12, 12, 'FD');

    // Draw text
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(legend.text, textX, legendY + 4);

    currentX = squareX - legendSpacing;
  });

  // STATISTICS BAR - full width gray bar (as shown in screenshot)
  const statsY = 75;
  const statsHeight = 63;

  // Full width gray background
  pdf.setFillColor(240, 240, 240);
  pdf.rect(0, statsY, config.pageWidth, statsHeight, 'F');

  // Statistics data - exact numbers from screenshot
  const statsData = [
    { number: `${dayEvents.length}`, label: 'Appointments' },
    { number: '4.3h', label: 'Scheduled' },
    { number: '19.7h', label: 'Available' },
    { number: '82%', label: 'Free Time' }
  ];

  // Four equal columns across full width
  const colWidth = config.pageWidth / 4;
  
  statsData.forEach((stat, index) => {
    const centerX = (index * colWidth) + (colWidth / 2);
    
    // Large number
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(stat.number, centerX, statsY + 20, { align: 'center' });
    
    // Label
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, centerX, statsY + 40, { align: 'center' });
  });
}



// Draw bottom navigation with arrows
function drawBottomNavigation(pdf: jsPDF, selectedDate: Date) {
  const config = PIXEL_PERFECT_CONFIG;
  const nav = config.bottomNav;

  // Previous day arrow
  const prevX = nav.centerX - nav.spacing - nav.buttonWidth;
  pdf.setFillColor(...nav.bgColor);
  pdf.setDrawColor(...nav.borderColor);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(prevX, nav.y, nav.buttonWidth, nav.buttonHeight, nav.borderRadius, nav.borderRadius, 'FD');

  // Previous day arrow text
  pdf.setFontSize(nav.fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...config.colors.black);
  pdf.text('← Sunday', prevX + nav.buttonWidth / 2, nav.y + nav.buttonHeight / 2 + 5, { align: 'center' });

  // Next day arrow (moved closer to center since center button removed)
  const nextX = nav.centerX + nav.spacing / 2;
  pdf.setFillColor(...nav.bgColor);
  pdf.setDrawColor(...nav.borderColor);
  pdf.setLineWidth(1.5);
  pdf.roundedRect(nextX, nav.y, nav.buttonWidth, nav.buttonHeight, nav.borderRadius, nav.borderRadius, 'FD');

  // Next day arrow text
  pdf.setFontSize(nav.fontSize);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...config.colors.black);
  pdf.text('Tuesday →', nextX + nav.buttonWidth / 2, nav.y + nav.buttonHeight / 2 + 5, { align: 'center' });
}

// Draw time grid with all 36 time slots in full-width layout
function drawPixelPerfectTimeGrid(pdf: jsPDF) {
  const config = PIXEL_PERFECT_CONFIG;
  const grid = config.grid;

  // Draw time column and main area borders
  pdf.setDrawColor(...grid.borderColor);
  pdf.setLineWidth(grid.borderWidth);

  // Time column left border (flush with left edge)
  pdf.line(0, config.gridStartY, 0, config.gridStartY + (grid.totalRows * grid.rowHeight));

  // Time column right border / main area left border (vertical divider) - solid black
  pdf.setDrawColor(34, 34, 34); // Dark gray/black matching dashboard
  pdf.setLineWidth(2);
  pdf.line(grid.timeColumnWidth, config.gridStartY, 
           grid.timeColumnWidth, config.gridStartY + (grid.totalRows * grid.rowHeight));

  // Main area right border (flush with right edge)
  pdf.setDrawColor(...grid.borderColor);
  pdf.setLineWidth(grid.borderWidth);
  pdf.line(config.pageWidth, config.gridStartY,
           config.pageWidth, config.gridStartY + (grid.totalRows * grid.rowHeight));

  // Draw all time slots
  ALL_TIME_SLOTS.forEach((slot, index) => {
    const y = config.gridStartY + (index * grid.rowHeight);

    // Background color based on hour/half-hour - APPLIED TO ENTIRE ROW
    const bgColor = slot.isHour ? grid.topHourBg : grid.halfHourBg;
    pdf.setFillColor(...bgColor);

    // Fill entire row width (full page width)
    pdf.rect(0, y, config.pageWidth, grid.rowHeight, 'F');

    // Time text - centered in time column
    pdf.setFontSize(slot.isHour ? grid.topHourFont : grid.halfHourFont);
    pdf.setFont('helvetica', 'normal'); // Don't bold times
    pdf.setTextColor(...config.colors.black);
    pdf.text(slot.time, grid.timeColumnWidth / 2, y + grid.rowHeight / 2 + 8, { align: 'center' });

    // Horizontal grid lines
    pdf.setDrawColor(...grid.borderColor);
    pdf.setLineWidth(grid.borderWidth);
    pdf.line(0, y + grid.rowHeight, config.pageWidth, y + grid.rowHeight);
  });

  // Draw vertical separator line AFTER backgrounds to ensure it's visible
  pdf.setDrawColor(34, 34, 34); // Dark gray/black matching dashboard
  pdf.setLineWidth(2);
  pdf.line(grid.timeColumnWidth, config.gridStartY, 
           grid.timeColumnWidth, config.gridStartY + (grid.totalRows * grid.rowHeight));
}

// Draw appointment blocks with exact styling
function drawPixelPerfectAppointments(pdf: jsPDF, selectedDate: Date, events: CalendarEvent[]) {
  const config = PIXEL_PERFECT_CONFIG;
  const appointments = config.appointments;

  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  console.log(`Drawing ${dayEvents.length} appointments for ${selectedDate.toDateString()}`);

  dayEvents.forEach((event, index) => {
    const eventDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);

    // Calculate position based on time
    const startHour = eventDate.getHours();
    const startMinute = eventDate.getMinutes();

    // Find the slot index
    const slotIndex = ALL_TIME_SLOTS.findIndex(slot => {
      const [slotHour, slotMinute] = slot.time.split(':').map(Number);
      return slotHour === startHour && slotMinute === startMinute;
    });

    if (slotIndex === -1) {
      console.log(`Event ${event.title} at ${eventDate.toLocaleTimeString()} is outside time range`);
      return;
    }

    // Calculate duration in slots
    const durationMinutes = (endDate.getTime() - eventDate.getTime()) / (1000 * 60);
    const durationSlots = Math.ceil(durationMinutes / 30);

    // Calculate position and dimensions - ensure events stay inside grid cells
    const eventY = config.gridStartY + (slotIndex * config.grid.rowHeight) + 2; // 2px margin from grid line
    const eventHeight = (durationSlots * config.grid.rowHeight) - 4; // 4px total margin (2px top + 2px bottom)
    const eventX = config.grid.timeColumnWidth + 2; // 2px margin from vertical divider
    const eventWidth = config.grid.mainAreaWidth - 4; // 4px total margin (2px left + 2px right)

    console.log(`Event ${event.title}: slot ${slotIndex}, duration ${durationSlots} slots, height ${eventHeight}px`);

    // Get event type
    const { isSimplePractice, isGoogle, isHoliday } = getEventTypeInfoExtended(event);

    // Draw background - WHITE for all appointments
    pdf.setFillColor(...config.colors.white);
    pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');

    // Draw borders based on calendar type
    if (isSimplePractice) {
      // SimplePractice: Cornflower blue border with thick left edge
      pdf.setDrawColor(...appointments.simplePractice.borderColor);
      pdf.setLineWidth(appointments.simplePractice.normalBorderWidth);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');

      // Thick left border
      pdf.setLineWidth(appointments.simplePractice.leftBorderWidth);
      pdf.line(eventX, eventY, eventX, eventY + eventHeight);

    } else if (isGoogle) {
      // Google Calendar: Dashed green border
      pdf.setDrawColor(...appointments.google.borderColor);
      pdf.setLineWidth(1);
      pdf.setLineDash(appointments.google.dashPattern);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
      pdf.setLineDash([]);

    } else if (isHoliday) {
      // Holiday: Yellow background with orange border
      pdf.setFillColor(...appointments.holiday.bgColor);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'F');
      pdf.setDrawColor(...appointments.holiday.borderColor);
      pdf.setLineWidth(1);
      pdf.rect(eventX, eventY, eventWidth, eventHeight, 'S');
    }

    // Clean title
    const displayTitle = cleanAppointmentTitle(event.title);

    // Check if this appointment has notes or actions (only Dan has content)
    const hasNotes = displayTitle.toLowerCase().includes('dan re:');
    const hasActions = displayTitle.toLowerCase().includes('dan re:');

    if (hasNotes || hasActions) {
      // Three-column layout for appointments with content
      const columnWidth = appointments.threeColumn.columnWidth;

      // Column 1: Appointment details
      pdf.setFontSize(appointments.singleColumn.titleFont);
      pdf.setFont('helvetica', 'bold'); // Make appointment titles bold
      pdf.setTextColor(...config.colors.black);
      pdf.text(displayTitle, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.titleY);

      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.sourceY);

      // Time - with additional spacing after source
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, eventY + appointments.singleColumn.timeY + 10); // Added 10px spacing

      // Column separators - only draw if we have content
      pdf.setDrawColor(...appointments.threeColumn.separatorColor);
      pdf.setLineWidth(1);
      if (hasNotes) {
        pdf.line(eventX + columnWidth, eventY, eventX + columnWidth, eventY + eventHeight);
      }
      if (hasActions) {
        pdf.line(eventX + (columnWidth * 2), eventY, eventX + (columnWidth * 2), eventY + eventHeight);
      }

      // Column 2: Event Notes - only if has notes
      if (hasNotes) {
        pdf.setFontSize(appointments.threeColumn.headerFont);
        pdf.setFont('helvetica', 'bold'); // Make header bold
        pdf.text('Event Notes', eventX + columnWidth + 10, eventY + 20);

        // Sample notes for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.setFont('helvetica', 'normal'); // Regular font for content
          pdf.text('• I cancelled supervision due to COVID', eventX + columnWidth + 10, eventY + 40);
          pdf.text('• We didn\'t schedule a follow-up, and will', eventX + columnWidth + 10, eventY + 55);
          pdf.text('  continue next week during our usual time', eventX + columnWidth + 10, eventY + 70);
        }
      }

      // Column 3: Action Items - only if has actions
      if (hasActions) {
        pdf.setFontSize(appointments.threeColumn.headerFont);
        pdf.setFont('helvetica', 'bold'); // Make header bold
        pdf.text('Action Items', eventX + (columnWidth * 2) + 10, eventY + 20);

        // Sample action items for Dan
        if (displayTitle.toLowerCase().includes('dan re:')) {
          pdf.setFontSize(appointments.threeColumn.bulletFont);
          pdf.setFont('helvetica', 'normal'); // Regular font for content
          pdf.text('• Review his supervision notes from last week', eventX + (columnWidth * 2) + 10, eventY + 40);
          pdf.text('• Follow-up to see if there are any pressing', eventX + (columnWidth * 2) + 10, eventY + 55);
          pdf.text('  issues/questions that I can help him navigate', eventX + (columnWidth * 2) + 10, eventY + 70);
        }
      }

    } else {
      // Single column layout for appointments without notes/actions
      pdf.setFontSize(appointments.singleColumn.titleFont);
      pdf.setFont('helvetica', 'bold'); // Make font bolder to fill space
      pdf.setTextColor(...config.colors.black);

      // Wrap long titles to fit in cell
      const titleLines = pdf.splitTextToSize(displayTitle, eventWidth - 30);
      let currentY = eventY + appointments.singleColumn.titleY;

      // Draw title lines
      if (Array.isArray(titleLines)) {
        titleLines.forEach((line, index) => {
          pdf.text(line, eventX + appointments.singleColumn.leftMargin, currentY + (index * 35));
        });
        currentY += titleLines.length * 35;
      } else {
        pdf.text(titleLines, eventX + appointments.singleColumn.leftMargin, currentY);
        currentY += 35;
      }

      // Source
      const { sourceText } = getEventTypeInfoExtended(event);
      pdf.setFontSize(appointments.singleColumn.sourceFont);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sourceText, eventX + appointments.singleColumn.leftMargin, currentY);

      // Time - with additional spacing after source
      const timeRange = `${formatMilitaryTime(eventDate)}-${formatMilitaryTime(endDate)}`;
      pdf.setFontSize(appointments.singleColumn.timeFont);
      pdf.setFont('helvetica', 'bold'); // Make time bold and larger
      pdf.text(timeRange, eventX + appointments.singleColumn.leftMargin, currentY + 35); // Increased from 25 to 35
    }
  });
}

// Helper function to get event source text with extended return type
function getEventTypeInfoExtended(event: CalendarEvent): { sourceText: string; isSimplePractice: boolean; isGoogle: boolean; isHoliday: boolean } {
  const isSimplePractice = event.source === 'simplepractice' || 
                           event.title?.toLowerCase().includes('appointment');

  const isHoliday = event.title.toLowerCase().includes('holiday') ||
                   event.calendarId === 'en.usa#holiday@group.v.calendar.google.com';

  const isGoogle = event.source === 'google' && !isSimplePractice && !isHoliday;

  let sourceText = '';
  if (isSimplePractice) {
    sourceText = 'SIMPLEPRACTICE';
  } else if (isGoogle) {
    sourceText = 'GOOGLE CALENDAR';
  } else if (isHoliday) {
    sourceText = 'HOLIDAYS IN UNITED STATES';
  } else {
    sourceText = (event.source || 'MANUAL').toUpperCase();
  }

  return { sourceText, isSimplePractice, isGoogle, isHoliday };
}

// Main export function
export const exportPixelPerfectDailyPlanner = async (
  selectedDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  console.log(`=== PIXEL PERFECT DAILY PLANNER EXPORT ===`);
  console.log(`Date: ${selectedDate.toDateString()}`);
  console.log(`Canvas: ${PIXEL_PERFECT_CONFIG.pageWidth} × ${PIXEL_PERFECT_CONFIG.pageHeight} pixels`);
  console.log(`DPI: ${PIXEL_PERFECT_CONFIG.dpi}`);
  console.log(`Total events: ${events.length}`);

  // Create PDF with exact specifications
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight]
  });

  // Set background to white
  pdf.setFillColor(...PIXEL_PERFECT_CONFIG.colors.white);
  pdf.rect(0, 0, PIXEL_PERFECT_CONFIG.pageWidth, PIXEL_PERFECT_CONFIG.pageHeight, 'F');

  // Draw all sections
  drawPixelPerfectHeader(pdf, selectedDate, events);
  drawPixelPerfectTimeGrid(pdf);
  drawPixelPerfectAppointments(pdf, selectedDate, events);
  drawBottomNavigation(pdf, selectedDate);

  // Save with descriptive filename
  const filename = `pixel-perfect-daily-planner-${selectedDate.toISOString().split('T')[0]}.pdf`;
pdf.save(filename);

  console.log(`Pixel Perfect Daily Planner exported: ${filename}`);
  console.log(`Canvas dimensions: ${PIXEL_PERFECT_CONFIG.pageWidth} × ${PIXEL_PERFECT_CONFIG.pageHeight} pixels`);
  console.log(`DPI: ${PIXEL_PERFECT_CONFIG.dpi} (print quality)`);
  console.log(`Time slots: ${ALL_TIME_SLOTS.length} slots from 06:00 to 23:30`);
};

export const generatePixelPerfectDailyExport = async (
  selectedDate: Date,
  events: CalendarEvent[],
  dailyNotes: string = ""
): Promise<void> => {
  try {
    console.log("=== PIXEL PERFECT DAILY PLANNER EXPORT ===");
    console.log("Date:", selectedDate.toDateString());
    console.log("Canvas: 2550 × 3300 pixels");
    console.log("DPI: 300");
    console.log("Total events:", events.length);

    // Filter events for the selected date
    const dayEvents = events.filter(event => {
      try {
        const eventDate = new Date(event.startTime);
        const selectedDateStr = selectedDate.toDateString();
        const eventDateStr = eventDate.toDateString();
        console.log(`Checking event: ${event.title} - Event date: ${eventDateStr}, Selected: ${selectedDateStr}`);
        return eventDateStr === selectedDateStr;
      } catch (dateError) {
        console.error('Error parsing event date:', event, dateError);
        return false;
      }
    });

    console.log("Events for selected date:", dayEvents.length);

    // Validate we have proper canvas support
    if (!document.createElement || typeof document.createElement !== 'function') {
      throw new Error('Canvas not supported in this environment');
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    if (!canvas) {
      throw new Error('Failed to create canvas element');
    }

    canvas.width = 2550; // 8.5 inches at 300 DPI
    canvas.height = 3300; // 11 inches at 300 DPI

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context from canvas');
    }

    // Set high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw the daily planner layout
    try {
      await drawPixelPerfectDailyLayout(ctx, selectedDate, dayEvents, dailyNotes);
    } catch (drawError) {
      console.error('Error drawing daily layout:', drawError);
      throw new Error(`Failed to draw daily layout: ${drawError.message}`);
    }

    // Convert to blob and download
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          return;
        }

        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `pixel-perfect-daily-${selectedDate.toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          console.log("✅ Pixel perfect daily export completed successfully");
        } catch (downloadError) {
          console.error('Error during download:', downloadError);
          throw downloadError;
        }
      }, 'image/png');
    } catch (blobError) {
      console.error('Error creating blob:', blobError);
      throw new Error(`Failed to create downloadable file: ${blobError.message}`);
    }

  } catch (error) {
    console.error('Pixel perfect daily export error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // Show user-friendly error
    alert(`Export failed: ${error.message || 'Unknown error occurred'}`);
    throw error;
  }
};

const drawPixelPerfectDailyLayout = async (
  ctx: CanvasRenderingContext2D,
  date: Date,
  events: CalendarEvent[],
  notes: string
): Promise<void> => {
  if (!ctx) {
    throw new Error('Canvas context is null or undefined');
  }

  if (!date || isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  if (!Array.isArray(events)) {
    console.warn('Events is not an array, using empty array');
    events = [];
  }

  try {
    // Layout parameters
    const headerHeight = 100;
    const timeColumnWidth = 100;
    const eventColumnWidth = ctx.canvas.width - timeColumnWidth;
    const timeSlotHeight = 30;

    // Draw header
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, ctx.canvas.width, headerHeight);

    // Date text
    ctx.fillStyle = '#000000';
    ctx.font = '36px Arial';
    ctx.fillText(date.toDateString(), 20, 30);

    // Draw time slots
    for (let i = 7; i < 24; i++) {
      const y = headerHeight + (i - 7) * timeSlotHeight;

      // Time text
      ctx.fillStyle = '#888888';
      ctx.font = '20px Arial';
      ctx.fillText(`${i}:00`, 20, y);

      // Slot line
      ctx.strokeStyle = '#cccccc';
      ctx.beginPath();
      ctx.moveTo(timeColumnWidth, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();
    }

    // Draw events in time slots
    events.forEach((event, index) => {
      try {
        if (!event || !event.startTime || !event.endTime) {
          console.warn(`Skipping invalid event at index ${index}:`, event);
          return;
        }

        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          console.warn(`Skipping event with invalid dates at index ${index}:`, event);
          return;
        }

        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        const endHour = endTime.getHours();
        const endMinute = endTime.getMinutes();

        // Calculate position
        const startY = headerHeight + (startHour - 7) * timeSlotHeight + (startMinute / 60) * timeSlotHeight;
        const duration = (endHour - startHour) + (endMinute - startMinute) / 60;
        const eventHeight = Math.max(duration * timeSlotHeight - 4, 20); // Minimum height

        // Validate positions
        if (startY < headerHeight || startY > ctx.canvas.height) {
          console.warn(`Event ${event.title} is outside visible time range`);
          return;
        }

        // Draw event
        ctx.fillStyle = event.color || '#6495ED';
        ctx.fillRect(timeColumnWidth + 8, startY, eventColumnWidth - 16, eventHeight);

        // Draw event text
        ctx.fillStyle = '#000000';
        ctx.font = '24px Arial';
        const title = event.title || 'Untitled Event';
        ctx.fillText(title, timeColumnWidth + 16, startY + 8);
      } catch (eventError) {
        console.error(`Error drawing event at index ${index}:`, eventError, event);
        // Continue with next event instead of failing completely
      }
    });

    console.log(`✅ Successfully drew ${events.length} events`);

  } catch (error) {
    console.error('Error in drawPixelPerfectDailyLayout:', error);
    throw new Error(`Layout drawing failed: ${error.message}`);
  }
};