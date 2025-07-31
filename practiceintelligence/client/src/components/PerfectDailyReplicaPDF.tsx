import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { CalendarEvent } from '../types/calendar';
import { generateTimeSlots } from '../utils/timeSlots';
import { getLocationDisplay } from '../utils/locationUtils';

interface PerfectDailyReplicaProps {
  selectedDate: Date;
  events: CalendarEvent[];
}

// Perfect Daily Replica Component for PDF Export
const PerfectDailyReplica: React.FC<PerfectDailyReplicaProps> = ({ selectedDate, events }) => {
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    if (!event || !event.startTime || !event.endTime || !selectedDate) return false;
    try {
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      
      if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || isNaN(selectedDate.getTime())) {
        return false;
      }

      const selectedDateString = selectedDate.toDateString();
      const eventDateString = startTime.toDateString();
      return eventDateString === selectedDateString;
    } catch (error) {
      return false;
    }
  });

  // Calculate daily statistics
  const totalEvents = dayEvents.length;
  const totalHours = dayEvents.reduce((sum, event) => {
    try {
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return sum;
      return sum + (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    } catch (error) {
      return sum;
    }
  }, 0);
  const availableHours = 24 - totalHours;
  const freeTimePercentage = Math.round((availableHours / 24) * 100);

  // Generate time slots (6:00 to 23:30)
  const timeSlots = generateTimeSlots().map(slot => ({
    ...slot,
    isHour: slot.minute === 0
  }));

  // Get event positioning and styling
  const getEventStyle = (event: CalendarEvent) => {
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { className: 'appointment', style: { gridRowStart: 1, gridRowEnd: 2, zIndex: 10 } };
    }

    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // Calculate grid positions (each 30-minute slot = 1 grid row)
    const startSlot = Math.max(0, (startHour - 6) * 2 + Math.floor(startMinute / 30));
    const endSlot = Math.max(startSlot + 1, (endHour - 6) * 2 + Math.ceil(endMinute / 30));

    const gridRowStart = startSlot + 1;
    const gridRowEnd = endSlot + 1;

    // Source-specific styling
    let className = 'appointment ';
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.calendarId === '0np7sib5u30o7oc297j5pb259g' ||
                           event.title?.toLowerCase().includes('appointment');

    if (isSimplePractice) {
      className += 'simplepractice ';
    } else if (event.source === 'google') {
      className += 'google-calendar ';
    } else {
      className += 'personal ';
    }

    if (event.status) {
      className += `status-${event.status} `;
    }

    // CRITICAL FIX: Check for overlapping appointments and calculate horizontal offset
    const overlappingEvents = timedEvents.filter((otherEvent) => {
      if (otherEvent.id === event.id) return false;
      
      const otherStart = otherEvent.startTime instanceof Date ? otherEvent.startTime : new Date(otherEvent.startTime);
      const otherEnd = otherEvent.endTime instanceof Date ? otherEvent.endTime : new Date(otherEvent.endTime);
      
      if (isNaN(otherStart.getTime()) || isNaN(otherEnd.getTime())) return false;
      
      // Check if there's time overlap
      return eventStart < otherEnd && eventEnd > otherStart;
    });
    
    // Calculate horizontal positioning for overlaps
    const overlapCount = overlappingEvents.length;
    const totalOverlaps = overlapCount + 1; // +1 for current event
    
    // Find position of current event among overlapping events (by start time, then by index)
    const sortedOverlappingEvents = [...overlappingEvents, event].sort((a, b) => {
      const aStart = a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
      const bStart = b.startTime instanceof Date ? b.startTime : new Date(b.startTime);
      if (aStart.getTime() !== bStart.getTime()) {
        return aStart.getTime() - bStart.getTime();
      }
      // If same start time, sort by event ID for consistency
      return a.id.localeCompare(b.id);
    });
    
    const eventPosition = sortedOverlappingEvents.findIndex(e => e.id === event.id);
    
    // Width and position calculations for overlaps
    const baseWidth = totalOverlaps > 1 ? `${Math.floor(95 / totalOverlaps)}%` : '100%';
    const leftPosition = totalOverlaps > 1 ? `${(eventPosition * 95) / totalOverlaps + 2}%` : '0%';

    return {
      className,
      style: {
        gridRowStart: gridRowStart,
        gridRowEnd: gridRowEnd,
        zIndex: 10 + eventPosition,
        width: baseWidth,
        left: leftPosition,
        position: 'relative' as const
      }
    };
  };

  // Format event time
  const formatEventTime = (event: CalendarEvent) => {
    const start = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const end = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid time';
    }

    return `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}-${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  // Date formatting functions
  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const getDateString = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Filter all-day events
  const allDayEvents = dayEvents.filter(event => {
    const isMarkedAllDay = (event as any).isAllDay;
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return false;
    }

    const duration = endTime.getTime() - startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return isMarkedAllDay || isFullDay || hours >= 20;
  });

  // Filter timed events
  const timedEvents = dayEvents.filter(event => {
    const isMarkedAllDay = (event as any).isAllDay;
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (!startTime || !endTime || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return false;
    }

    const duration = endTime.getTime() - startTime.getTime();
    const hours = duration / (1000 * 60 * 60);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
    return !(isMarkedAllDay || isFullDay || hours >= 20);
  });

  return (
    <div className="perfect-daily-replica" style={{
      width: '1200px',
      minHeight: '1600px',
      backgroundColor: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* Daily View Styles */}
      <style>{`
        .perfect-daily-replica .planner-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
        }

        .perfect-daily-replica .nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 2px solid #000000;
          margin-bottom: 16px;
        }

        .perfect-daily-replica .nav-btn {
          padding: 8px 16px;
          border: 2px solid #000000;
          border-radius: 6px;
          background: #ffffff;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        .perfect-daily-replica .page-title {
          text-align: center;
          flex: 1;
        }

        .perfect-daily-replica .page-title h2 {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
          color: #000000;
        }

        .perfect-daily-replica .appointment-count {
          font-size: 14px;
          color: #6b7280;
          display: block;
          margin-top: 4px;
        }

        .perfect-daily-replica .legend {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .perfect-daily-replica .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .perfect-daily-replica .legend-symbol {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .perfect-daily-replica .legend-symbol.simplepractice {
          background-color: #3b82f6;
        }

        .perfect-daily-replica .legend-symbol.google-calendar {
          background-color: #10b981;
        }

        .perfect-daily-replica .legend-symbol.personal {
          background-color: #8b5cf6;
        }

        .perfect-daily-replica .daily-stats {
          display: flex;
          justify-content: space-around;
          padding: 16px 0;
          margin-bottom: 16px;
          border: 2px solid #000000;
          border-radius: 8px;
          background: #f9fafb;
        }

        .perfect-daily-replica .stat-item {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .perfect-daily-replica .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #000000;
        }

        .perfect-daily-replica .all-day-section {
          margin-bottom: 16px;
          border: 2px solid #000000;
          border-radius: 8px;
          padding: 12px;
        }

        .perfect-daily-replica .all-day-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .perfect-daily-replica .all-day-events {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .perfect-daily-replica .all-day-event {
          background: #e5e7eb;
          border: 1px solid #9ca3af;
          border-radius: 4px;
          padding: 8px;
          min-width: 200px;
        }

        .perfect-daily-replica .schedule-grid {
          display: grid;
          grid-template-columns: 80px 1fr;
          grid-template-rows: repeat(36, 40px);
          flex: 1;
          border: 2px solid #000000;
          border-radius: 8px;
          overflow: hidden;
          background: #ffffff;
          position: relative;
        }

        .perfect-daily-replica .time-column {
          background: transparent;
          border-right: 2px solid #000000;
          grid-column: 1;
          grid-row: 1 / -1;
          display: grid;
          grid-template-rows: repeat(36, 40px);
        }

        .perfect-daily-replica .appointments-column {
          position: relative;
          background: #ffffff;
          grid-column: 2;
          grid-row: 1 / -1;
          display: grid;
          grid-template-rows: repeat(36, 40px);
        }

        .perfect-daily-replica .time-slot {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
          background: transparent;
        }

        .perfect-daily-replica .time-slot.hour {
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #000000;
          background: #f3f4f6;
        }

        .perfect-daily-replica .time-slot:not(.hour) {
          background: #ffffff;
          border-bottom: 1px solid #e5e7eb;
        }

        .perfect-daily-replica .schedule-grid::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            repeating-linear-gradient(
              to bottom,
              transparent 0px,
              transparent 39px,
              #e5e7eb 39px,
              #e5e7eb 40px,
              transparent 40px,
              transparent 79px,
              #000000 79px,
              #000000 80px
            );
          pointer-events: none;
          z-index: 1;
        }

        .perfect-daily-replica .appointment {
          z-index: 10;
          position: relative;
          border: 2px solid #000000;
          border-radius: 4px;
          padding: 4px;
          margin: 2px;
          overflow: hidden;
          font-size: 12px;
          line-height: 1.2;
        }

        .perfect-daily-replica .appointment.simplepractice {
          background-color: #dbeafe;
          border-color: #3b82f6;
        }

        .perfect-daily-replica .appointment.google-calendar {
          background-color: #d1fae5;
          border-color: #10b981;
        }

        .perfect-daily-replica .appointment.personal {
          background-color: #ede9fe;
          border-color: #8b5cf6;
        }

        .perfect-daily-replica .appointment-layout {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          padding: 4px;
          height: 100%;
        }

        .perfect-daily-replica .appointment-title-bold {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 2px;
          color: #000000;
        }

        .perfect-daily-replica .appointment-calendar {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        .perfect-daily-replica .appointment-time {
          font-size: 11px;
          color: #374151;
          font-weight: 500;
        }

        .perfect-daily-replica .appointment-notes-header,
        .perfect-daily-replica .appointment-actions-header {
          font-weight: bold;
          font-size: 10px;
          margin-bottom: 2px;
          color: #374151;
        }

        .perfect-daily-replica .note-item,
        .perfect-daily-replica .action-item {
          font-size: 10px;
          color: #4b5563;
          margin-bottom: 1px;
          position: relative;
          padding-left: 8px;
        }

        .perfect-daily-replica .note-item:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #6b7280;
        }

        .perfect-daily-replica .action-item:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
        }
      `}</style>

      <div className="planner-container daily-planner daily-view">
        {/* Header Navigation Bar */}
        <div className="nav-header">
          <div className="nav-btn weekly-btn">
            📅 Weekly Overview
          </div>
          <div className="page-title">
            <h2>{getDayName(selectedDate)}, {getDateString(selectedDate)}</h2>
            <span className="appointment-count">{totalEvents} appointments</span>
          </div>
          <div className="legend">
            <div className="legend-item">
              <span className="legend-symbol simplepractice"></span>SimplePractice
            </div>
            <div className="legend-item">
              <span className="legend-symbol google-calendar"></span>Google Calendar
            </div>
            <div className="legend-item">
              <span className="legend-symbol personal"></span>Holidays in United States
            </div>
          </div>
        </div>

        {/* Daily Statistics */}
        <div className="daily-stats">
          <div className="stat-item">
            <span className="stat-number">{totalEvents}</span>
            Appointments
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalHours.toFixed(1)}h</span>
            Scheduled
          </div>
          <div className="stat-item">
            <span className="stat-number">{availableHours.toFixed(1)}h</span>
            Available
          </div>
          <div className="stat-item">
            <span className="stat-number">{freeTimePercentage}%</span>
            Free Time
          </div>
        </div>

        {/* All-Day Events Section */}
        {allDayEvents.length > 0 && (
          <div className="all-day-section">
            <h4 className="all-day-title">All Day</h4>
            <div className="all-day-events">
              {allDayEvents.map((event, allDayIndex) => (
                <div
                  key={`all-day-${event.id}-${allDayIndex}`}
                  className="all-day-event"
                >
                  <div className="event-title">{event.title}</div>
                  {event.description && (
                    <div className="event-description">{event.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule Grid */}
        <div className="schedule-grid">
          {/* Time Column */}
          <div className="time-column">
            {timeSlots.map((slot, index) => (
              <div key={index} className={`time-slot ${slot.isHour ? 'hour' : ''}`}>
                <span className={slot.minute === 0 ? 'text-sm' : 'text-xs'}>
                  {slot.time}
                </span>
              </div>
            ))}
          </div>

          {/* Appointments Column */}
          <div className="appointments-column">
            {/* Render timed events */}
            {timedEvents.map((event, eventIndex) => {
              const { className, style } = getEventStyle(event);
              const calendarClass = event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ? 'personal' : 
                                    event.calendarId === '0np7sib5u30o7oc297j5pb259g' ? 'simplepractice' :
                                    (event.title.toLowerCase().includes('haircut') ||
                                     event.title.toLowerCase().includes('dan re:') ||
                                     event.title.toLowerCase().includes('blake') ||
                                     event.title.toLowerCase().includes('phone call')) ? 'google-calendar' :
                                    event.source === 'simplepractice' ? 'simplepractice' : 'google-calendar';
              
              const statusClass = event.status ? `status-${event.status}` : '';
              
              return (
                <div
                  key={`event-container-${event.id}-${eventIndex}`}
                  className={`appointment ${calendarClass} ${statusClass} ${className}`}
                  style={style}
                >
                  <div className="appointment-layout">
                    {/* Left: Event title, calendar, and time */}
                    <div className="appointment-left">
                      <div className="appointment-title-bold">{event.title}</div>
                      <div className="appointment-calendar">
                        {event.calendarId === '0np7sib5u30o7oc297j5pb259g' || event.source === 'simplepractice' ? 'SimplePractice' : 
                         event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ? 'Holidays in United States' : 
                         'Google Calendar'}
                        {event.location && getLocationDisplay(event.location) && (
                          <span> | {getLocationDisplay(event.location)?.display}</span>
                        )}
                      </div>
                      <div className="appointment-time">{formatEventTime(event)}</div>
                    </div>

                    {/* Center: Event Notes */}
                    <div className="appointment-center">
                      {event.notes && (
                        <div className="appointment-notes">
                          <div className="appointment-notes-header">Event Notes</div>
                          {event.notes.split('\n')
                            .filter(note => note.trim().length > 0)
                            .map(note => note.trim().replace(/^[•\s-]+/, '').trim())
                            .filter(note => note.length > 0 && note !== '•' && note !== '-')
                            .map((note, index) => (
                              <div key={index} className="note-item">{note}</div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Right: Action Items */}
                    <div className="appointment-right">
                      {event.actionItems && (
                        <div className="appointment-actions">
                          <div className="appointment-actions-header">Action Items</div>
                          {event.actionItems.split('\n')
                            .filter(item => item.trim().length > 0)
                            .map(item => item.trim().replace(/^[•\s-]+/, '').trim())
                            .filter(item => item.length > 0 && item !== '•' && item !== '-')
                            .map((item, index) => (
                              <div key={index} className="action-item">{item}</div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export function
export const generatePerfectDailyReplicaPDF = async (selectedDate: Date, events: CalendarEvent[]) => {
  console.log('🎯 PERFECT DAILY REPLICA PDF EXPORT STARTING...');
  
  try {
    const container = document.createElement('div');
    container.id = 'perfect-daily-replica-container';
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '1200px';
    container.style.backgroundColor = '#ffffff';
    document.body.appendChild(container);

    const React = await import('react');
    const { createRoot } = await import('react-dom/client');
    
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        React.createElement(PerfectDailyReplica, { 
          selectedDate, 
          events 
        })
      );
      setTimeout(resolve, 100);
    });

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate PDF with high quality
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 1200,
      height: container.scrollHeight,
      allowTaint: false,
      removeContainer: false
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const imgWidth = pdfWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If the content is too tall, scale it down to fit
    if (imgHeight > pdfHeight - 20) {
      const scaledHeight = pdfHeight - 20;
      const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
      pdf.addImage(imgData, 'PNG', (pdfWidth - scaledWidth) / 2, 10, scaledWidth, scaledHeight);
    } else {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }

    const dateStr = selectedDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).replace(/\//g, '-');
    
    pdf.save(`perfect-daily-replica-${dateStr}.pdf`);

    // Cleanup
    document.body.removeChild(container);
    console.log('✅ Perfect daily replica PDF generated successfully!');

  } catch (error) {
    console.error('❌ Perfect daily replica PDF generation failed:', error);
    throw error;
  }
};