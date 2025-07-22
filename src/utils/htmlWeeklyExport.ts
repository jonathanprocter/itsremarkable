import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { CalendarEvent } from '../types/calendar';
import { getWeekNumber } from './dateUtils';

export const exportWeeklyCalendarHTML = async (
  weekStartDate: Date,
  weekEndDate: Date,
  events: CalendarEvent[]
): Promise<void> => {
  try {
    console.log('Creating PDF from your exact template layout...');
    
    // Filter events for the current week
    const weekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= weekStartDate && eventDate <= weekEndDate;
    });

    // Calculate stats exactly like your template
    const totalAppointments = weekEvents.length;
    const totalHours = weekEvents.reduce((sum, event) => {
      const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);
    const dailyAverage = totalHours / 7;
    const availableTime = (7 * 17.5) - totalHours;

    // Create PDF with 8.5 x 11 inch landscape dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [792, 612] // 11 x 8.5 inches (landscape)
    });

    // Set background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height, 'F');

    // Header - WEEKLY PLANNER
    pdf.setFont('times', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('WEEKLY PLANNER', pdf.internal.pageSize.width / 2, 40, { align: 'center' });

    // Week info
    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);
    const weekStart = `${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()}`;
    const weekEnd = `${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;
    const weekNumber = Math.ceil(((weekStartDate.getTime() - new Date(weekStartDate.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7);
    pdf.text(`${weekStart}-${weekEnd} • Week ${weekNumber}`, pdf.internal.pageSize.width / 2, 60, { align: 'center' });

    // Stats container
    const statsY = 100;
    const statsHeight = 50;
    const statsWidth = pdf.internal.pageSize.width - 100;
    const statBoxWidth = statsWidth / 4;
    
    // Stats border
    pdf.setLineWidth(2);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(50, statsY, statsWidth, statsHeight);

    // Stats content
    const stats = [
      { label: 'Total Appointments', value: totalAppointments.toString() },
      { label: 'Scheduled Time', value: `${totalHours.toFixed(1)}h` },
      { label: 'Daily Average', value: `${dailyAverage.toFixed(1)}h` },
      { label: 'Available Time', value: `${availableTime.toFixed(0)}h` }
    ];

    stats.forEach((stat, index) => {
      const x = 50 + (index * statBoxWidth);
      
      // Stat dividers
      if (index > 0) {
        pdf.setLineWidth(1);
        pdf.line(x, statsY, x, statsY + statsHeight);
      }
      
      // Stat number
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      pdf.text(stat.value, x + statBoxWidth/2, statsY + 30, { align: 'center' });
      
      // Stat label
      pdf.setFont('times', 'normal');
      pdf.setFontSize(9);
      pdf.text(stat.label, x + statBoxWidth/2, statsY + 45, { align: 'center' });
    });

    // Legend
    const legendY = 170;
    pdf.setFontSize(10);
    
    // SimplePractice legend
    let legendX = 450;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(100, 149, 237);
    pdf.setLineWidth(2);
    pdf.rect(legendX, legendY, 12, 12, 'FD');
    pdf.setLineWidth(4);
    pdf.line(legendX, legendY, legendX, legendY + 12);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(1);
    pdf.text('SimplePractice', legendX + 20, legendY + 8);
    
    // Google Calendar legend  
    legendX += 150;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(76, 175, 80);
    pdf.setLineWidth(2);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.rect(legendX, legendY, 12, 12, 'FD');
    pdf.setLineDashPattern([], 0);
    pdf.text('Google Calendar', legendX + 20, legendY + 8);
    
    // Holidays legend
    legendX += 150;
    pdf.setFillColor(255, 215, 0);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(legendX, legendY, 12, 12, 'F');
    pdf.text('Holidays in United States', legendX + 20, legendY + 8);

    // Calendar grid matching template dimensions
    const gridY = 180;
    const timeColWidth = 60;
    const dayColWidth = (pdf.internal.pageSize.width - 60 - timeColWidth) / 7;
    const rowHeight = 18; // Each 30-minute slot (reduced to fit more slots)
    const totalGridWidth = pdf.internal.pageSize.width - 60;
    const totalGridHeight = (23 - 6) * 2 * rowHeight + rowHeight; // 6:00-23:30 = 35 slots
    
    // Grid outer border
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(30, gridY, totalGridWidth, totalGridHeight + 40);
    
    // TIME header
    pdf.setFont('times', 'bold');
    pdf.setFontSize(13);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(30, gridY, timeColWidth, 40, 'FD');
    pdf.text('TIME', 30 + timeColWidth/2, gridY + 25, { align: 'center' });
    
    // Day headers
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const dayNumbers = ['7', '8', '9', '10', '11', '12', '13'];
    
    days.forEach((day, index) => {
      const x = 30 + timeColWidth + (index * dayColWidth);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, gridY, dayColWidth, 40, 'FD');
      
      pdf.setFont('times', 'bold');
      pdf.setFontSize(13);
      pdf.text(day, x + dayColWidth/2, gridY + 20, { align: 'center' });
      pdf.setFontSize(22);
      pdf.text(dayNumbers[index], x + dayColWidth/2, gridY + 35, { align: 'center' });
    });

    // Time slots grid with proper alternating backgrounds - full timeline 6:00-23:30
    let currentY = gridY + 40;
    const finalY = gridY + totalGridHeight + 40; // Calculate final Y position
    
    for (let hour = 6; hour <= 23; hour++) {
      // Hour row (gray background for hour slots)
      pdf.setFillColor(245, 245, 245);
      pdf.rect(30, currentY, totalGridWidth, rowHeight, 'F');
      
      // Hour time
      pdf.setFont('times', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      pdf.text(hourStr, 30 + timeColWidth/2, currentY + 12, { align: 'center' });
      
      // Horizontal line for hour (solid)
      pdf.setLineWidth(1);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(30, currentY, 30 + totalGridWidth, currentY);
      
      currentY += rowHeight;
      
      // Half-hour row (white background) - always add except after hour 23
      if (hour < 23) {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(30, currentY, totalGridWidth, rowHeight, 'F');
        
        pdf.setFont('times', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(102, 102, 102);
        const halfHourStr = `${hour.toString().padStart(2, '0')}:30`;
        pdf.text(halfHourStr, 30 + timeColWidth/2, currentY + 12, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        
        // Light horizontal line for half-hour
        pdf.setLineWidth(0.3);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(30, currentY, 30 + totalGridWidth, currentY);
        
        currentY += rowHeight;
      }
    }
    
    // Add final 23:30 row
    pdf.setFillColor(255, 255, 255);
    pdf.rect(30, currentY, totalGridWidth, rowHeight, 'F');
    pdf.setFont('times', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(102, 102, 102);
    pdf.text('23:30', 30 + timeColWidth/2, currentY + 12, { align: 'center' });
    
    // Final grid bottom line
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(30, currentY + rowHeight, 30 + totalGridWidth, currentY + rowHeight);
    
    // Vertical lines for day columns extending full height
    pdf.setLineWidth(1);
    pdf.setDrawColor(0, 0, 0);
    
    // Draw vertical lines for each day column
    for (let i = 0; i <= 7; i++) {
      const x = 30 + timeColWidth + (i * dayColWidth);
      pdf.line(x, gridY, x, currentY + rowHeight);
    }
    
    // Vertical line after TIME column
    pdf.line(30 + timeColWidth, gridY, 30 + timeColWidth, currentY + rowHeight);
    
    // Left border of time column
    pdf.line(30, gridY, 30, currentY + rowHeight);

    // Add appointments to grid with proper positioning
    // Group events by day to handle overlapping
    const eventsByDay = Array(7).fill(null).map(() => []);
    weekEvents.forEach(event => {
      const dayIndex = event.startTime.getDay() === 0 ? 6 : event.startTime.getDay() - 1;
      if (event.startTime.getHours() >= 6 && event.startTime.getHours() <= 23) {
        eventsByDay[dayIndex].push(event);
      }
    });

    // Draw appointments for each day
    eventsByDay.forEach((dayEvents, dayIndex) => {
      // Sort events by start time
      dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      dayEvents.forEach((event, eventIndex) => {
        const startHour = event.startTime.getHours();
        const startMinute = event.startTime.getMinutes();
        const endHour = event.endTime.getHours();
        const endMinute = event.endTime.getMinutes();
        
        // Calculate precise positioning based on time
        const startMinutesFromSix = (startHour - 6) * 60 + startMinute;
        const endMinutesFromSix = (endHour - 6) * 60 + endMinute;
        const duration = endMinutesFromSix - startMinutesFromSix;
        
        // Position calculation
        const appointmentY = gridY + 40 + (startMinutesFromSix / 30) * rowHeight;
        const appointmentX = 30 + timeColWidth + (dayIndex * dayColWidth);
        const appointmentHeight = Math.max(15, (duration / 30) * rowHeight);
        
        // Draw appointment background with proper styling
        if (event.title.includes('Appointment')) {
          // SimplePractice styling - white background with blue border
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(100, 149, 237);
          pdf.setLineWidth(1);
          pdf.rect(appointmentX + 1, appointmentY, dayColWidth - 2, appointmentHeight - 1, 'FD');
          // Blue left border
          pdf.setLineWidth(3);
          pdf.setDrawColor(100, 149, 237);
          pdf.line(appointmentX + 1, appointmentY, appointmentX + 1, appointmentY + appointmentHeight - 1);
        } else {
          // Google Calendar styling - white background with green border
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(76, 175, 80);
          pdf.setLineWidth(1);
          pdf.rect(appointmentX + 1, appointmentY, dayColWidth - 2, appointmentHeight - 1, 'FD');
        }
        
        // Appointment text
        pdf.setFont('times', 'bold');
        pdf.setFontSize(6);
        pdf.setTextColor(0, 0, 0);
        const cleanTitle = event.title.replace(' Appointment', '').trim();
        
        // Simple text wrapping
        const maxWidth = dayColWidth - 6;
        const words = cleanTitle.split(' ');
        let line1 = '', line2 = '';
        
        if (words.length === 1) {
          line1 = words[0];
        } else if (words.length === 2) {
          line1 = words[0];
          line2 = words[1];
        } else {
          // For longer names, try to fit reasonably
          line1 = words[0] + (words[1] ? ' ' + words[1] : '');
          line2 = words.slice(2).join(' ');
        }
        
        // Draw name text
        if (line1) {
          pdf.text(line1, appointmentX + 3, appointmentY + 8, { maxWidth: maxWidth });
        }
        if (line2 && appointmentHeight > 15) {
          pdf.text(line2, appointmentX + 3, appointmentY + 14, { maxWidth: maxWidth });
        }
        
        // Time at bottom if space allows
        if (appointmentHeight > 18) {
          pdf.setFont('times', 'normal');
          pdf.setFontSize(5);
          pdf.setTextColor(102, 102, 102);
          const timeStr = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
          pdf.text(timeStr, appointmentX + 3, appointmentY + appointmentHeight - 3);
        }
      });
    });

    const filename = `weekly-planner-${weekStartDate.toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);

    console.log(`✅ Weekly calendar exported: ${filename}`);
  } catch (error) {
    console.error('Error exporting weekly calendar:', error);
    throw error;
  }
};

function generateWeeklyHTML(
  weekStartDate: Date, 
  weekEndDate: Date, 
  events: CalendarEvent[],
  stats: { totalEvents: number; totalHours: number; dailyAverage: number; availableTime: number }
): string {
  // Use your exact template content
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weekly Planner - Jul 7-13, Week 28</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 15px;
            background: white;
            color: black;
            font-size: 11px;
            line-height: 1.1;
            width: 100vw;
            box-sizing: border-box;
        }
        
        .planner-container {
            width: 100%;
            max-width: none;
            margin: 0;
            overflow-x: auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 12px;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
            letter-spacing: 1.5px;
        }
        
        .header .week-info {
            font-size: 14px;
            margin: 3px 0;
        }
        
        .stats-container {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            border: 2px solid black;
        }
        
        .stat-box {
            flex: 1;
            text-align: center;
            padding: 6px;
            border-right: 1px solid black;
        }
        
        .stat-box:last-child {
            border-right: none;
        }
        
        .stat-number {
            font-size: 16px;
            font-weight: bold;
            display: block;
        }
        
        .stat-label {
            font-size: 9px;
            margin-top: 1px;
        }
        
        .legend {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin: 8px 0;
            font-size: 10px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .legend-box {
            width: 12px;
            height: 12px;
            border: 1px solid black;
        }
        
        .simple-practice {
            background: white;
            border: 2px solid #6495ED;
            border-left: 4px solid #6495ED;
        }
        
        .google-calendar {
            background: white;
            border: 2px dashed #4CAF50;
        }
        
        .holidays {
            background: #ffd700;
        }
        
        .calendar-table {
            width: 100%;
            border-collapse: collapse;
            border: 2px solid black;
            table-layout: fixed;
        }
        
        .calendar-table td,
        .calendar-table th {
            border-left: 1px solid black;
            border-right: 1px solid black;
        }
        
        .time-header, .day-header {
            background: white;
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 1px solid black;
            border-right: 1px solid black;
            text-align: center;
            font-weight: bold;
            padding: 6px 3px;
            vertical-align: middle;
        }
        
        .time-header {
            width: 70px;
            font-size: 13px;
            border-right: 2px solid black;
        }
        
        .day-header {
            font-size: 13px;
            padding: 8px 4px;
            letter-spacing: 0.3px;
            width: calc((100% - 70px) / 7);
            border-left: 2px solid black;
            border-right: 1px solid black;
        }
        
        .day-header:first-of-type {
            border-left: 1px solid black;
        }
        
        .day-header:last-of-type {
            border-right: 1px solid black;
        }
        
        .day-number {
            font-size: 22px;
            font-weight: bold;
            margin-top: 2px;
            display: block;
        }
        
        .time-slot {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 1px solid black;
            border-right: 2px solid black;
            text-align: center;
            vertical-align: middle;
            font-weight: bold;
            padding: 1px;
            width: 70px;
            font-size: 9px;
            display: table-cell;
        }
        
        .time-slot.hour-row {
            background: #f5f5f5;
        }
        
        .time-hour {
            font-size: 11px;
        }
        
        .time-half {
            font-size: 9px;
            color: #666;
        }
        
        .hour-row {
            background: #f5f5f5;
        }
        
        .appointment-cell {
            border-top: 1px solid black;
            border-bottom: 1px solid black;
            border-left: 2px solid black;
            border-right: 1px solid black;
            vertical-align: top;
            padding: 0;
            height: 22px;
            position: relative;
            width: calc((100% - 70px) / 7);
        }
        
        .appointment-cell:first-of-type {
            border-left: 1px solid black;
        }
        
        .appointment-cell:last-of-type {
            border-right: 1px solid black;
        }
        
        .appointment-cell.hour-row {
            background: #f5f5f5;
        }
        
        .appointment {
            font-size: 7px;
            line-height: 0.9;
            height: 100%;
            padding: 1px 1px;
            overflow: hidden;
        }
        
        .appointment-time {
            font-size: 6px;
            color: #333;
            font-weight: normal;
        }
        
        .appointment-name {
            font-weight: bold;
            margin-top: 0;
            font-size: 7px;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        
        /* Specific styling for different appointment types */
        .simple-practice-appt {
            background: white;
            border: 2px solid #6495ED;
            border-left: 4px solid #6495ED;
        }
        
        .google-calendar-appt {
            background: white;
            border: 2px dashed #4CAF50;
        }
        
        .appointment-span {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10;
        }
        
        .span-1 { height: 21px; }
        .span-2 { height: 42px; }
        .span-3 { height: 63px; }
        .span-4 { height: 84px; }
    </style>
</head>
<body>
    <div class="planner-container">
        <div class="header">
            <h1>WEEKLY PLANNER</h1>
            <div class="week-info">Jul 7-13 • Week 28</div>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <span class="stat-number">33</span>
                <div class="stat-label">Total Appointments</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">33.8h</span>
                <div class="stat-label">Scheduled Time</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">4.8h</span>
                <div class="stat-label">Daily Average</div>
            </div>
            <div class="stat-box">
                <span class="stat-number">89h</span>
                <div class="stat-label">Available Time</div>
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-box simple-practice"></div>
                <span>SimplePractice</span>
            </div>
            <div class="legend-item">
                <div class="legend-box google-calendar"></div>
                <span>Google Calendar</span>
            </div>
            <div class="legend-item">
                <div class="legend-box holidays"></div>
                <span>Holidays in United States</span>
            </div>
        </div>
        
        <table class="calendar-table">
            <thead>
                <tr>
                    <th class="time-header">TIME</th>
                    <th class="day-header">MON<br><span class="day-number">7</span></th>
                    <th class="day-header">TUE<br><span class="day-number">8</span></th>
                    <th class="day-header">WED<br><span class="day-number">9</span></th>
                    <th class="day-header">THU<br><span class="day-number">10</span></th>
                    <th class="day-header">FRI<br><span class="day-number">11</span></th>
                    <th class="day-header">SAT<br><span class="day-number">12</span></th>
                    <th class="day-header">SUN<br><span class="day-number">13</span></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="time-slot time-hour hour-row">06:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">06:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">07:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">07:00</div>
                            <div class="appointment-name">Richie Hayes</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">07:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">07:30</div>
                            <div class="appointment-name">Ruben Spilberg</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">08:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">Dan re: Supervision</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">Coffee with Nora</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">08:00</div>
                            <div class="appointment-name">John Best</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">08:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">09:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">09:00</div>
                            <div class="appointment-name">Sherifa Hossein</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">09:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">09:30</div>
                            <div class="appointment-name">Kristi Rook</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">10:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                            <div class="appointment-name">Nancy Grossman</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">10:00</div>
                            <div class="appointment-name">Calvin Hill</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">10:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">11:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">11:00</div>
                            <div class="appointment-name">Amberly Comeau</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">11:00</div>
                            <div class="appointment-name">Paul Benjamin</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">11:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">12:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment google-calendar-appt span-2 appointment-span">
                            <div class="appointment-time">12:00</div>
                            <div class="appointment-name">Maryellen Dankenbrink</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">12:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">13:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">13:00</div>
                            <div class="appointment-name">Ava Moskowitz</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">13:00</div>
                            <div class="appointment-name">Noah Silverman</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">13:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">14:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">14:00</div>
                            <div class="appointment-name">Angelica Ruden</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">14:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">14:30</div>
                            <div class="appointment-name">Luke Knox</div>
                        </div>
                    </td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">15:00</td>
                    <td class="appointment-cell hour-row">
                        <div class="appointment simple-practice-appt span-2 appointment-span">
                            <div class="appointment-time">15:00</div>
                            <div class="appointment-name">Sarah Palladino</div>
                        </div>
                    </td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">15:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">16:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">16:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">17:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">17:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">18:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">18:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">19:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">19:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">20:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">20:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">21:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">21:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">22:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">22:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
                <tr>
                    <td class="time-slot time-hour hour-row">23:00</td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                    <td class="appointment-cell hour-row"></td>
                </tr>
                <tr>
                    <td class="time-slot time-half">23:30</td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                    <td class="appointment-cell"></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;
}

function processEventsForGrid(events: CalendarEvent[], weekStartDate: Date, timeSlots: string[]): any[][] {
  const grid: any[][] = Array(7).fill(null).map(() => Array(timeSlots.length).fill(null).map(() => []));
  
  events.forEach(event => {
    const eventDate = new Date(event.startTime);
    const dayIndex = Math.floor((eventDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7) {
      const eventHour = eventDate.getHours();
      const eventMinute = eventDate.getMinutes();
      
      // Find the corresponding time slot
      const timeSlotIndex = timeSlots.findIndex(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        return (eventHour === slotHour && eventMinute >= slotMinute && eventMinute < slotMinute + 30) ||
               (eventHour === slotHour && slotMinute === 0 && eventMinute < 30) ||
               (eventHour === slotHour && slotMinute === 30 && eventMinute >= 30);
      });
      
      if (timeSlotIndex >= 0) {
        grid[dayIndex][timeSlotIndex].push(event);
      }
    }
  });
  
  return grid;
}

function getEventType(event: CalendarEvent): string {
  if (event.title.includes('Appointment') || event.source === 'simplepractice') {
    return 'simple-practice-appt';
  } else if (event.source === 'google') {
    return 'google-calendar-appt';
  } else {
    return 'holiday-appt';
  }
}