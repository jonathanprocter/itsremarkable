/**
 * Dynamic Daily Planner Generator for reMarkable Paper Pro
 * Based on the comprehensive specifications provided
 * Optimized for US Letter paper in portrait mode with 30-minute time slots
 */

import { CalendarEvent } from '../types/calendar';
import { format } from 'date-fns';

export interface AppointmentData {
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'canceled';
  event_notes: string[];
  action_items: string[];
  source?: string;
}

export interface DailyStatistics {
  total_appointments: number;
  scheduled_count: number;
  canceled_count: number;
  utilization: number;
  total_scheduled_minutes: number;
  total_free_minutes: number;
  daily_utilization: number;
  weekly_appointments: number;
  weekly_scheduled_hours: number;
}

export class DynamicDailyPlannerGenerator {
  private timeSlots: string[] = [];

  constructor() {
    this.timeSlots = this.generateTimeSlots();
  }

  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    const startHour = 6;
    const endHour = 23;
    const endMinute = 30;

    console.log('🕐 GENERATING TIME SLOTS: 06:00 to 23:30');

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === endHour && minute > endMinute) break;

        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }

    console.log(`🕐 GENERATED ${slots.length} TIME SLOTS:`, slots.slice(0, 3), '...', slots.slice(-3));
    console.log('🕐 FIRST SLOT:', slots[0], 'LAST SLOT:', slots[slots.length - 1]);

    return slots;
  }

  public convertCalendarEventsToAppointments(events: CalendarEvent[]): AppointmentData[] {
    return events.map(event => {
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Extract notes and action items from event properties
      const eventNotes = event.notes ? event.notes.split('\n').filter(note => note.trim()) : [];
      const actionItems = event.actionItems ? event.actionItems.split('\n').filter(item => item.trim()) : [];

      return {
        title: event.title,
        start_time: format(startTime, 'HH:mm'),
        end_time: format(endTime, 'HH:mm'),
        duration_minutes: duration,
        status: event.status === 'canceled' ? 'canceled' : 'scheduled',
        event_notes: eventNotes,
        action_items: actionItems,
        source: event.calendarId === '0np7sib5u30o7oc297j5pb259g' ? 'SimplePractice' : 'Google Calendar'
      };
    });
  }

  private calculateFreeTimeSlots(appointments: AppointmentData[]): string[] {
    const occupiedSlots = new Set<string>();

    appointments.forEach(apt => {
      if (apt.status === 'scheduled') {
        const startIndex = this.timeSlots.indexOf(apt.start_time);
        const slotsNeeded = Math.ceil(apt.duration_minutes / 30);

        for (let i = 0; i < slotsNeeded && startIndex + i < this.timeSlots.length; i++) {
          occupiedSlots.add(this.timeSlots[startIndex + i]);
        }
      }
    });

    return this.timeSlots.filter(slot => !occupiedSlots.has(slot));
  }

  private calculateStatistics(appointments: AppointmentData[], currentDate: Date, allEvents: CalendarEvent[]): DailyStatistics {
    // Calculate weekly statistics (reset every Monday)
    const currentWeekStart = this.getWeekStart(currentDate);
    const currentWeekEnd = this.getWeekEnd(currentDate);

    console.log(`📊 Statistics calculation for ${currentDate.toDateString()}`);
    console.log(`📅 Week range: ${currentWeekStart.toDateString()} to ${currentWeekEnd.toDateString()}`);
    console.log(`📋 Total events passed: ${allEvents.length}`);
    console.log(`📋 Daily appointments: ${appointments.length}`);

    // Filter events for the current week
    const weeklyEvents = allEvents.filter(event => {
      const eventDate = new Date(event.startTime);
      const inWeek = eventDate >= currentWeekStart && eventDate <= currentWeekEnd;
      if (inWeek) {
        console.log(`✅ Weekly event: ${event.title} on ${eventDate.toDateString()}`);
      }
      return inWeek;
    });

    // Convert weekly events to weekly statistics
    const weeklyScheduledEvents = weeklyEvents.filter(event => 
      !event.title.toLowerCase().includes('canceled') && 
      !event.title.toLowerCase().includes('cancelled')
    );

    const weeklyTotalMinutes = weeklyScheduledEvents.reduce((sum, event) => {
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

      // Validate dates
      if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.warn('Invalid date found in event:', event);
        return sum;
      }

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      return sum + duration;
    }, 0);

    // Calculate weekly available time (5 working days × 17.5 hours = 87.5 hours)
    const weeklyAvailableMinutes = 5 * 17.5 * 60; // 5250 minutes
    const weeklyUtilization = Math.round((weeklyTotalMinutes / weeklyAvailableMinutes) * 100);

    // Daily statistics for the current day
    const scheduledAppointments = appointments.filter(apt => apt.status === 'scheduled');
    const totalScheduledMinutes = scheduledAppointments.reduce((sum, apt) => sum + apt.duration_minutes, 0);
    const totalAvailableMinutes = this.timeSlots.length * 30;
    const dailyUtilization = Math.round((totalScheduledMinutes / totalAvailableMinutes) * 100);

    return {
      total_appointments: appointments.length,
      scheduled_count: scheduledAppointments.length,
      canceled_count: appointments.filter(apt => apt.status === 'canceled').length,
      utilization: weeklyUtilization, // Use weekly utilization
      total_scheduled_minutes: weeklyTotalMinutes, // Use weekly total
      total_free_minutes: weeklyAvailableMinutes - weeklyTotalMinutes, // Use weekly free time
      daily_utilization: dailyUtilization,
      weekly_appointments: weeklyEvents.length,
      weekly_scheduled_hours: Math.round(weeklyTotalMinutes / 60 * 10) / 10
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  private getWeekEnd(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  }

  private getAppointmentHeight(durationMinutes: number): number {
    const slotsNeeded = Math.max(1, Math.ceil(durationMinutes / 30));
    return slotsNeeded * 40; // 40px per 30-minute slot
  }

  private renderAppointmentHTML(appointment: AppointmentData): string {
    const height = this.getAppointmentHeight(appointment.duration_minutes);
    const statusClass = appointment.status;
    const hasContent = appointment.event_notes.length > 0 || appointment.action_items.length > 0;
    const middleClass = hasContent ? "appointment-middle has-content" : "appointment-middle";

    // Generate event notes HTML with enhanced formatting
    const eventNotesHTML = appointment.event_notes.length > 0 ? `
      <div class="detail-header">
        <div class="detail-icon">📝</div>
        <div class="detail-label">Event Notes:</div>
      </div>
      <div class="detail-content">
        <ul class="detail-list">
          ${appointment.event_notes.map(note => `<li class="detail-item">${note.trim()}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    // Generate action items HTML with enhanced formatting
    const actionItemsHTML = appointment.action_items.length > 0 ? `
      <div class="detail-header">
        <div class="detail-icon">✅</div>
        <div class="detail-label">Action Items:</div>
      </div>
      <div class="detail-content">
        <ul class="detail-list">
          ${appointment.action_items.map(item => `<li class="detail-item">${item.trim()}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const durationText = `${appointment.start_time} - ${appointment.end_time} • ${appointment.duration_minutes} min`;
    const statusDisplay = appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
    const statusButtonClass = `status-${appointment.status}`;

    return `
      <div class="appointment ${statusClass}" style="height: ${height}px;">
        <div class="appointment-left">
          <div class="appointment-title">${appointment.title}</div>
          <div class="appointment-time">${durationText}</div>
          <div class="appointment-status ${statusButtonClass}">${statusDisplay}</div>
        </div>
        <div class="${middleClass}">
          ${eventNotesHTML ? `<div class="content-section">${eventNotesHTML}</div>` : '<!-- No event notes -->'}
        </div>
        <div class="appointment-right">
          ${actionItemsHTML ? `<div class="content-section">${actionItemsHTML}</div>` : '<!-- No action items -->'}
        </div>
      </div>
    `;
  }

  private generateTimeColumnHTML(freeTimeSlots: string[]): string {
    return this.timeSlots.map(slot => {
      let cssClass = "time-slot";
      if (freeTimeSlots.includes(slot)) {
        if (['06:00', '06:30', '07:00'].includes(slot)) {
          cssClass += " early-morning";
        } else {
          cssClass += " free-time";
        }
      }
      return `<div class="${cssClass}">${slot}</div>`;
    }).join('\n');
  }

  private generateAppointmentsColumnHTML(appointments: AppointmentData[]): string {
    let html = '';
    const processedSlots = new Set<number>();

    for (let i = 0; i < this.timeSlots.length; i++) {
      if (processedSlots.has(i)) {
        continue; // Skip already processed slots
      }

      const slot = this.timeSlots[i];
      // Find ALL appointments that start at this time slot
      const overlappingAppointments = appointments.filter(apt => apt.start_time === slot);

      if (overlappingAppointments.length > 0) {
        // Handle overlapping appointments - render side by side
        const maxDuration = Math.max(...overlappingAppointments.map(apt => apt.duration_minutes));
        const slotsToSkip = Math.ceil(maxDuration / 30);

        // Create container for overlapping appointments
        html += `<div class="time-block overlapping-container" style="height: ${slotsToSkip * 40}px;">\n`;

        // Render each overlapping appointment with horizontal offset
        overlappingAppointments.forEach((appointment, index) => {
          const horizontalOffset = index * 33; // 33% width for each appointment
          const appointmentWidth = Math.min(100 / overlappingAppointments.length, 30); // Max 30% width

          html += `<div class="overlapping-appointment" style="left: ${horizontalOffset}%; width: ${appointmentWidth}%;">\n`;
          html += this.renderAppointmentHTML(appointment);
          html += `</div>\n`;
        });

        html += `</div>\n`;

        // Mark covered slots as processed
        for (let j = 1; j < slotsToSkip && i + j < this.timeSlots.length; j++) {
          processedSlots.add(i + j);
        }
      } else {
        html += `<div class="time-block"></div> <!-- ${slot} -->\n`;
      }
    }

    return html;
  }

  private generateNotesColumnHTML(): string {
    let html = '<div class="notes-header">Handwritten Notes</div>\n';
    for (let i = 0; i < this.timeSlots.length; i++) {
      html += '<div class="note-space"></div>\n';
    }
    return html;
  }

  public generateCompleteDailyPlannerHTML(date: Date, events: CalendarEvent[]): string {
    // CRITICAL FIX: Filter events by selected date FIRST
    const targetDateStr = format(date, 'yyyy-MM-dd');
    const dailyEvents = events.filter(event => {
      const eventDateStr = format(new Date(event.startTime), 'yyyy-MM-dd');
      return eventDateStr === targetDateStr;
    });

    console.log(`🔧 FILTERED EVENTS: ${dailyEvents.length} events for ${targetDateStr} (from ${events.length} total)`);

    const appointments = this.convertCalendarEventsToAppointments(dailyEvents);
    const freeTimeSlots = this.calculateFreeTimeSlots(appointments);
    const statistics = this.calculateStatistics(appointments, date, events);
    const dateString = format(date, 'EEEE, MMMM d, yyyy');

    const timeColumnHTML = this.generateTimeColumnHTML(freeTimeSlots);
    const appointmentsColumnHTML = this.generateAppointmentsColumnHTML(appointments);
    const notesColumnHTML = this.generateNotesColumnHTML();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Planner - ${dateString}</title>
    <style>
        /* Color Palette Variables */
        :root {
            --cornflower: #6495ED;
            --navy: #243B53;
            --warm-white: #FAFAF7;
            --cool-grey: #AAB8C2;
            --seafoam: #60B6B1;
            --coral: #F6A99A;
            --light-grey: #F8F9FA;
            --border-grey: #E8E9EA;
            --free-time: #F5F7FA;
        }

        /* reMarkable Paper Pro Optimized Print Styles */
        @page {
            size: letter portrait;
            margin: 0.75in;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', serif;
            font-size: 14px;
            line-height: 1.4;
            color: var(--navy);
            background: var(--warm-white);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .daily-planner {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5rem;
            background: var(--warm-white);
        }

        /* Header Section */
        .header-section {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid var(--border-grey);
            page-break-inside: avoid;
        }

        .header-section h1 {
            font-size: 28px;
            font-weight: 400;
            margin-bottom: 0.5rem;
            color: var(--navy);
            letter-spacing: -0.5px;
        }

        .day-stats {
            margin-top: 1rem;
            font-size: 12px;
            color: var(--cool-grey);
            display: flex;
            justify-content: center;
            gap: 2rem;
        }

        /* Navigation Section (hidden in print) */
        .navigation-section {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .nav-button {
            padding: 0.5rem 1rem;
            background: var(--light-grey);
            border: 1px solid var(--border-grey);
            border-radius: 4px;
            text-decoration: none;
            color: var(--navy);
            font-size: 12px;
            font-weight: 500;
        }

        .nav-button:hover {
            background: var(--cool-grey);
            color: white;
        }

        @media print {
            .navigation-section {
                display: none;
            }
        }

        /* Main Content Layout - Exact measurements for pixel-perfect audit */
        .main-content {
            display: grid;
            grid-template-columns: 90px 1fr 120px;
            gap: 1.5rem;
            max-width: 100%;
            width: 100%;
        }

        /* Time Column */
        .time-column {
            display: flex;
            flex-direction: column;
        }

        .time-slot {
            font-size: 13px;
            color: var(--cool-grey);
            font-weight: 500;
            text-align: right;
            padding-right: 1rem;
            border-right: 1px solid var(--border-grey);
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
        }

        .time-slot.early-morning {
            color: var(--cornflower);
            font-weight: 600;
            border-right: 2px solid var(--cornflower);
        }

        .time-slot.free-time {
            color: var(--cornflower);
            font-weight: 600;
            border-right: 2px solid var(--cornflower);
        }

        /* Appointments Column */
        .appointments-column {
            display: flex;
            flex-direction: column;
        }

        .time-block {
            height: 40px;
            position: relative;
            border-bottom: 1px solid var(--border-grey);
        }

        .appointment {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--border-grey);
            border-radius: 4px;
            padding: 0.6rem;
            display: grid;
            grid-template-columns: 2fr 1.5fr 1.5fr;
            gap: 0.6rem;
            page-break-inside: avoid;
            min-height: 40px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .appointment.scheduled {
            border-left: 4px solid var(--cornflower);
        }

        .appointment.canceled {
            border-left: 4px solid var(--coral);
            background: #FFF5F5;
        }

        /* Overlapping Appointments Styles */
        .overlapping-container {
            position: relative;
            display: flex;
            flex-direction: row;
            gap: 0.25rem;
        }

        .overlapping-appointment {
            position: absolute;
            top: 0;
            bottom: 0;
            z-index: 1;
            opacity: 0.95;
        }

        .overlapping-appointment:hover {
            z-index: 2;
            opacity: 1;
        }

        .appointment-left {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }

        .appointment-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--navy);
            line-height: 1.2;
            margin-bottom: 0.1rem;
        }

        .appointment-time {
            font-size: 8px;
            color: var(--cool-grey);
            font-weight: 500;
        }

        .appointment-status {
            font-size: 8px;
            text-transform: uppercase;
            padding: 0.2rem 0.4rem;
            border-radius: 2px;
            text-align: center;
            font-weight: 600;
        }

        .status-scheduled {
            background: var(--cornflower);
            color: white;
        }

        .status-canceled {
            background: var(--coral);
            color: white;
        }

        .appointment-middle {
            border-left: 1px solid var(--border-grey);
            padding-left: 0.5rem;
        }

        .appointment-middle.has-content {
            border-right: 1px solid var(--border-grey);
        }

        .appointment-right {
            padding-left: 0.5rem;
        }

        .detail-header {
            display: flex;
            align-items: center;
            gap: 0.2rem;
            margin-bottom: 0.25rem;
        }

        .detail-icon {
            font-size: 6px;
        }

        .detail-label {
            font-size: 6px;
            text-transform: uppercase;
            color: var(--navy);
            font-weight: 600;
        }

        .detail-content ul.detail-list {
            list-style: none;
            padding-left: 0.8rem;
            margin: 0;
        }

        .detail-content li.detail-item {
            font-size: 6px;
            color: var(--navy);
            line-height: 1.3;
            margin-bottom: 0.2rem;
            padding-left: 0.6rem;
            position: relative;
            word-wrap: break-word;
            hyphens: auto;
        }

        .detail-content li.detail-item:before {
            content: "•";
            position: absolute;
            left: 0;
            color: var(--cornflower);
            font-weight: bold;
            font-size: 7px;
        }

        /* Notes Column */
        .notes-column {
            display: flex;
            flex-direction: column;
        }

        .notes-header {
            font-size: 10px;
            font-weight: 600;
            color: var(--navy);
            text-align: center;
            padding: 0.5rem;
            border-bottom: 1px solid var(--border-grey);
            margin-bottom: 1rem;
        }

        .note-space {
            height: 40px;
            border-bottom: 1px dotted var(--border-grey);
        }

        /* Day Summary Section */
        .day-summary {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 2px solid var(--border-grey);
        }

        .summary-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .stat-item {
            text-align: center;
            padding: 0.5rem;
            background: var(--light-grey);
            border-radius: 4px;
        }

        .stat-value {
            font-size: 16px;
            font-weight: 600;
            color: var(--navy);
        }

        .stat-label {
            font-size: 10px;
            color: var(--cool-grey);
            margin-top: 0.2rem;
        }

        .reflection-area {
            border: 2px dashed var(--border-grey);
            border-radius: 4px;
            padding: 1rem;
            min-height: 100px;
        }

        .reflection-label {
            font-size: 10px;
            color: var(--cool-grey);
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="daily-planner">
        <div class="header-section">
            <h1>Daily Planner</h1>
            <div class="day-stats">
                <span>📅 ${dateString}</span>
                <span>📊 ${statistics.total_appointments} appointments today</span>
                <span>📈 ${statistics.weekly_appointments} appointments this week</span>
                <span>⏰ ${statistics.utilization}% weekly utilization</span>
                <span>🕐 ${statistics.weekly_scheduled_hours}h scheduled this week</span>
            </div>
        </div>

        <div class="navigation-section">
            <a href="#" class="nav-button">← Previous Day</a>
            <a href="#" class="nav-button">Today</a>
            <a href="#" class="nav-button">Next Day →</a>
        </div>

        <div class="main-content">
            <div class="time-column">
                ${timeColumnHTML}
            </div>

            <div class="appointments-column">
                ${appointmentsColumnHTML}
            </div>

            <div class="notes-column">
                ${notesColumnHTML}
            </div>
        </div>

        <div class="day-summary">
            <div class="summary-stats">
                <div class="stat-item">
                    <div class="stat-value">${statistics.total_appointments}</div>
                    <div class="stat-label">Today's Appointments</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${statistics.weekly_appointments}</div>
                    <div class="stat-label">Weekly Appointments</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${statistics.weekly_scheduled_hours}h</div>
                    <div class="stat-label">Weekly Scheduled Hours</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${statistics.utilization}%</div>
                    <div class="stat-label">Weekly Utilization</div>
                </div>
            </div>

            <div class="reflection-area">
                <div class="reflection-label">Daily Reflection & Notes:</div>
                <!-- Space for handwritten notes -->
            </div>
        </div>
    </div>
</body>
</html>`;
  }
}