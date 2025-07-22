import { generateTimeSlots, getEventDurationInSlots, isEventInTimeSlot } from '../../utils/timeSlots';
import { formatDateShort } from '../../utils/dateUtils';
import { cleanEventTitle } from '../../utils/textCleaner';
import { wrapText } from '../../utils/textWrappers';
import { CalendarEvent, CalendarDay } from '../../types/calendar';
import { cn } from '@/lib/utils';

interface WeeklyCalendarGridProps {
  week: CalendarDay[];
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventMove?: (eventId: string, newStartTime: Date, newEndTime: Date) => void;
}

export const WeeklyCalendarGrid = ({
  week,
  events,
  onDayClick,
  onTimeSlotClick,
  onEventClick,
  onEventMove
}: WeeklyCalendarGridProps) => {
  const timeSlots = generateTimeSlots();

  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    // Ensure dates are properly parsed
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    
    // Skip invalid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return;
    }
    
    e.dataTransfer.setData('text/plain', JSON.stringify({
      eventId: event.id,
      originalStartTime: startTime.toISOString(),
      originalEndTime: endTime.toISOString(),
      duration: endTime.getTime() - startTime.getTime()
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, date: Date, timeSlot: { hour: number; minute: number }) => {
    e.preventDefault();
    if (!onEventMove) return;

    try {
      const dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const newStartTime = new Date(date);
      newStartTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

      const newEndTime = new Date(newStartTime.getTime() + dragData.duration);

      onEventMove(dragData.eventId, newStartTime, newEndTime);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const getAllDayEventsForDate = (date: Date) => {
    return events.filter(event => {
      // Ensure dates are properly parsed
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      
      // Skip invalid dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
      }
      
      const eventDate = startTime;

      // Check if backend marked it as all-day
      const isMarkedAllDay = (event as any).isAllDay;

      // Check if event is all-day by looking at duration and time patterns
      const duration = endTime.getTime() - startTime.getTime();
      const hours = duration / (1000 * 60 * 60);
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
      const isAllDayEvent = isMarkedAllDay || isFullDay || hours >= 20;

      if (!isAllDayEvent) return false;

      // For all-day events, check if the date falls within the event range
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const eventStartOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const eventEndDate = endTime;
      const eventEndOnly = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());

      return dateOnly >= eventStartOnly && dateOnly < eventEndOnly;
    });
  };

  const getEventsForTimeSlot = (date: Date, timeSlot: { time: string; hour: number; minute: number }) => {
    const filteredEvents = events.filter(event => {
      // Ensure dates are properly parsed
      const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
      const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
      
      // Skip invalid dates
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
      }
      
      const eventDate = startTime;

      // Filter out all-day events from time slots
      const isMarkedAllDay = (event as any).isAllDay;
      const duration = endTime.getTime() - startTime.getTime();
      const hours = duration / (1000 * 60 * 60);
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const isFullDay = startHour === 0 && startMinute === 0 && (hours === 24 || hours % 24 === 0);
      const isAllDayEvent = isMarkedAllDay || isFullDay || hours >= 20;

      // Skip all-day events
      if (isAllDayEvent) return false;

      // For timed events, use simple date string comparison
      const eventDateStr = eventDate.toDateString();
      const targetDateStr = date.toDateString();
      
      if (eventDateStr !== targetDateStr) return false;

      return isEventInTimeSlot({ startTime, endTime }, timeSlot);
    });
    
    // Debug logging disabled to reduce console noise
    // if (filteredEvents.length > 0) {
    //   console.log(`Found ${filteredEvents.length} events for ${date.toDateString()} at ${timeSlot.time}`, 
    //     filteredEvents.map(e => ({ title: e.title, start: new Date(e.startTime).toLocaleString() })));
    // }
    
    return filteredEvents;
  };

  const getEventStyle = (event: CalendarEvent) => {
    // Ensure dates are properly parsed
    const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
    const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    
    // Skip invalid dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return { height: '30px', marginBottom: '2px', zIndex: 20 };
    }
    
    const duration = getEventDurationInSlots({ startTime, endTime });
    // Calculate precise height based on actual duration
    const actualDurationMs = endTime.getTime() - startTime.getTime();
    const actualDurationHours = actualDurationMs / (1000 * 60 * 60);
    const slotHeight = 30; // 30px per 30-minute slot
    const preciseHeight = Math.min(duration * slotHeight, actualDurationHours * 2 * slotHeight);

    return {
      height: `${preciseHeight}px`,
      marginBottom: duration > 1 ? '0px' : '2px',
      zIndex: 20 // Ensure events appear above other elements
    };
  }

  const getEventSourceClass = (event: CalendarEvent) => {
    // Check if it's a SimplePractice appointment
    const isSimplePractice = event.source === 'simplepractice' || 
                           event.notes?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('simple practice') ||
                           event.description?.toLowerCase().includes('simple practice') ||
                           event.title?.toLowerCase().includes('appointment'); // SimplePractice appointments sync as "X Appointment"

    if (isSimplePractice) {
      return 'event-block simplepractice';
    } else if (event.source === 'google') {
      return 'event-block google';
    } else {
      return 'event-block manual';
    }
  };

  const cleanEventTitle = (title: string) => {
    // Remove lock symbols and other problematic characters
    return title
      .replace(/🔒\s*/g, '') // Remove lock symbol and following space
      .replace(/[\u{1F500}-\u{1F6FF}]/gu, '') // Remove emoji symbols
      .replace(/Ø=ÜÅ/g, '') // Remove corrupted symbols
      .replace(/Ø=Ý/g, '') // Remove corrupted symbols
      .replace(/!•/g, '') // Remove broken navigation symbols
      .replace(/!•\s*/g, '') // Remove broken navigation symbols with spaces
      .replace(/Page \d+ of \d+/g, '') // Remove page numbers
      .replace(/Back to Weekly Overview/g, '') // Remove navigation text
      .replace(/Weekly Overview/g, '') // Remove navigation text
      .replace(/Sunday Tuesday/g, '') // Remove broken day text
      .replace(/[\u{2022}\u{2023}\u{2024}\u{2025}]/gu, '') // Remove bullet points
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };


  return (
    <div className="weekly-calendar">
      <div className="calendar-grid">
      {/* Headers */}
      <div className="calendar-cell header-cell">
        TIME
      </div>
      {week.map((day, index) => (
        <div
          key={index}
          className="calendar-cell header-cell"
          onClick={() => onDayClick(day.date)}
        >
          {day.dayOfWeek} {day.date.getMonth() + 1}/{day.date.getDate()}/{day.date.getFullYear()}
        </div>
      ))}

      {/* All-Day Events Section */}
      <div className="calendar-cell all-day-header">
        ALL DAY
      </div>
      {week.map((day, dayIndex) => {
        const allDayEvents = getAllDayEventsForDate(day.date);
        return (
          <div key={`allday-${dayIndex}`} className="calendar-cell all-day-slot">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                className="event-in-grid event-personal"
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick(event);
                }}
              >
                {cleanEventTitle(event.title)}
              </div>
            ))}
          </div>
        );
      })}

      {/* Time slots */}
      {timeSlots.map((timeSlot, slotIndex) => (
        <div key={slotIndex} className="contents">
          {/* Time column */}
          <div className={cn(
            "calendar-cell time-cell",
            timeSlot.minute === 0 ? "hour" : "half-hour",
            slotIndex === 0 ? "first-time-slot" : ""
          )}>
            {timeSlot.time}
          </div>

          {/* Day columns */}
          {week.map((day, dayIndex) => {
            const slotEvents = getEventsForTimeSlot(day.date, timeSlot);
            const isFirstSlotOfEvent = (event: CalendarEvent) => {
              const eventStart = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
              
              // Skip invalid dates
              if (isNaN(eventStart.getTime())) {
                return false;
              }
              
              // Check if this event starts in this exact time slot
              const eventStartMinutes = eventStart.getHours() * 60 + eventStart.getMinutes();
              const slotStartMinutes = timeSlot.hour * 60 + timeSlot.minute;
              const slotEndMinutes = slotStartMinutes + 30;

              // Return true only if the event starts within this 30-minute slot
              return eventStartMinutes >= slotStartMinutes && eventStartMinutes < slotEndMinutes;
            };

            return (
              <div
                key={dayIndex}
                className={cn(
                  "calendar-cell",
                  timeSlot.minute === 0 ? "hour" : "half-hour",
                  slotIndex === 0 ? "first-time-slot" : ""
                )}
                onClick={() => onTimeSlotClick(day.date, timeSlot.time)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.date, timeSlot)}
              >
                {slotEvents.map((event, eventIndex) => {
                  const isFirstSlot = isFirstSlotOfEvent(event);
                  
                  // Debug log for troubleshooting (disabled to reduce console noise)
                  // if (slotEvents.length > 0 && eventIndex === 0) {
                  //   console.log(`Rendering event ${event.title} at ${timeSlot.time} - isFirstSlot: ${isFirstSlot}`);
                  // }
                  
                  if (!isFirstSlot) return null;

                  const eventSourceClass = getEventSourceClass(event);
                  const isSimplePractice = eventSourceClass.includes('simplepractice');
                  const isGoogle = eventSourceClass.includes('google');

                  // Calculate appointment height based on exact duration
                  const eventStart = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
                  const eventEnd = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
                  const durationMinutes = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
                  
                  // Dynamic height calculation: 1px per minute with proper containment
                  // Subtract 4px total margin (2px top + 2px bottom) to ensure appointments don't blend into grid lines
                  let appointmentHeight;
                  if (durationMinutes <= 30) {
                    // 30-minute appointments: Always use the full 26px height for optimal content fitting
                    appointmentHeight = 26;
                  } else {
                    // Longer appointments get dynamic sizing with proper margins
                    appointmentHeight = Math.max(durationMinutes - 4, 26);
                  }
                  
                  // Debug logging disabled to reduce console noise
                  // const durationText = durationMinutes <= 30 ? "30-min block" : `${durationMinutes} minutes`;
                  // console.log(`📊 ${event.title}: ${durationText} -> ${appointmentHeight}px height (contained within grid lines)`);
                  
                  // Additional debug for specific problem events (disabled)
                  // if (event.title.includes('Angelica') || event.title.includes('Dan') || event.title.includes('Sherrifa') || event.title.includes('Blake')) {
                  //   console.log(`🔍 DETAILED: ${event.title}: ${durationText} -> ${appointmentHeight}px height`);
                  // }

                  return (
                    <div
                      key={eventIndex}
                      className={cn(
                        "event-in-grid appointment",
                        event.calendarId === 'en.usa#holiday@group.v.calendar.google.com' ? "personal" : 
                        (event.title.toLowerCase().includes('haircut') ||
                         event.title.toLowerCase().includes('hair and beard') ||
                         event.title.toLowerCase().includes('dan re:') ||
                         event.title.toLowerCase().includes('supervision') ||
                         event.title.toLowerCase().includes('blake') ||
                         event.title.toLowerCase().includes('phone call') ||
                         event.title.toLowerCase().includes('call with')) ? "google-calendar" :
                        "simplepractice"
                      )}
                      style={{
                        ...getEventStyle(event),
                        position: 'absolute',
                        width: 'calc(100% - 8px)',
                        height: `${appointmentHeight}px`,
                        top: '2px', // Add 2px margin from top grid line
                        left: '4px',
                        zIndex: 10,
                        minHeight: `${appointmentHeight}px`,
                        maxHeight: `${appointmentHeight}px`,
                        marginBottom: '2px' // Add 2px margin from bottom grid line
                      }}
                      draggable={event.source === 'google'}
                      onDragStart={(e) => handleDragStart(e, event)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      <div className="appointment-name" style={{ 
                        fontSize: durationMinutes <= 30 ? '7px' : '9px',
                        lineHeight: durationMinutes <= 30 ? '1.0' : '1.1',
                        fontWeight: 'bold',
                        height: durationMinutes <= 30 ? '12px' : 'auto',
                        overflow: 'hidden',
                        whiteSpace: durationMinutes <= 30 ? 'nowrap' : 'normal',
                        textOverflow: durationMinutes <= 30 ? 'ellipsis' : 'clip'
                      }}>
                        {durationMinutes <= 30 ? 
                          cleanEventTitle(event.title) :
                          wrapText(cleanEventTitle(event.title), 18).map((line, index) => (
                            <div key={index}>{line}</div>
                          ))
                        }
                      </div>
                      <div className="appointment-spacer" style={{ 
                        height: durationMinutes <= 30 ? '1px' : '2px',
                        borderBottom: '1px solid #ccc',
                        margin: durationMinutes <= 30 ? '1px 0' : '2px 0'
                      }}></div>
                      <div className="appointment-time" style={{ 
                        fontSize: durationMinutes <= 30 ? '6px' : '8px',
                        lineHeight: '1.0',
                        height: durationMinutes <= 30 ? '10px' : 'auto'
                      }}>
                        {(() => {
                          const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
                          const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
                          
                          // Skip invalid dates
                          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                            return 'Invalid time';
                          }
                          
                          return `${startTime.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                          })} - ${endTime.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            hour12: false 
                          })}`;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    </div>
  );
};