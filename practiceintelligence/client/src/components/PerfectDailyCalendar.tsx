import React from 'react';
import { CalendarEvent } from '../types/calendar';
import { Button } from './ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface PerfectDailyCalendarProps {
  selectedDate: Date;
  events: CalendarEvent[];
  onDateChange?: (date: Date) => void;
  onExportPDF?: () => void;
}

export const PerfectDailyCalendar: React.FC<PerfectDailyCalendarProps> = ({
  selectedDate,
  events,
  onDateChange,
  onExportPDF
}) => {
  // Filter events for the selected date
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  // Generate time slots (every 30 minutes from 6:00 to 23:30)
  const generateTimeSlots = () => {
    const slots: string[] = [];
    for (let hour = 6; hour <= 23; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < 23) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Helper function to format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Find appointment for time slot
  const findAppointmentForTimeSlot = (timeSlot: string) => {
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    const slotTotalMinutes = slotHours * 60 + slotMinutes;
    
    return dayEvents.find(event => {
      const eventStart = new Date(event.startTime);
      const eventHours = eventStart.getHours();
      const eventMinutes = eventStart.getMinutes();
      const eventTotalMinutes = eventHours * 60 + eventMinutes;
      
      return eventTotalMinutes >= slotTotalMinutes && eventTotalMinutes < slotTotalMinutes + 30;
    });
  };

  // Navigation handlers
  const goToPreviousDay = () => {
    if (onDateChange) {
      const prevDate = new Date(selectedDate);
      prevDate.setDate(prevDate.getDate() - 1);
      onDateChange(prevDate);
    }
  };

  const goToNextDay = () => {
    if (onDateChange) {
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      onDateChange(nextDate);
    }
  };

  const goToToday = () => {
    if (onDateChange) {
      onDateChange(new Date());
    }
  };

  // Statistics
  const totalAppointments = dayEvents.length;
  const confirmedAppointments = dayEvents.filter(e => !e.title.toLowerCase().includes('canceled')).length;
  const canceledAppointments = totalAppointments - confirmedAppointments;
  const busyHours = Math.round(confirmedAppointments * 1.5);

  return (
    <div className="bg-white" id="perfect-daily-calendar">
      {/* HEADER SECTION - Total height: 88px */}
      <div className="h-[88px] bg-white border border-gray-300">
        {/* Top section - 54px */}
        <div className="h-[54px] flex items-center justify-between px-4">
          {/* LEFT: Weekly Overview Button */}
          <Button
            variant="outline"
            className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-normal text-gray-700 border-0"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Weekly Overview
          </Button>
          
          {/* CENTER: Title Section */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {dayEvents.length} appointments
            </p>
          </div>
          
          {/* RIGHT: Calendar Sources */}
          <div className="flex items-center gap-6 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
              <span>SimplePractice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
              <span>Google</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-sm"></div>
              <span>Holidays</span>
            </div>
          </div>
        </div>
        
        {/* STATISTICS BAR - 34px */}
        <div className="h-[34px] bg-gray-50 border-t border-gray-300 flex">
          {[
            { number: totalAppointments.toString(), label: 'Total Appointments' },
            { number: confirmedAppointments.toString(), label: 'Confirmed' },
            { number: canceledAppointments.toString(), label: 'Canceled' },
            { number: `${busyHours}h`, label: 'Busy Hours' }
          ].map((stat, index, array) => (
            <div 
              key={stat.label}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-1 ${
                index < array.length - 1 ? 'border-r border-gray-300' : ''
              }`}
            >
              <div className="text-lg font-semibold text-gray-900">{stat.number}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TIME GRID */}
      <div className="border border-gray-300">
        {timeSlots.map((timeSlot, index) => {
          const appointment = findAppointmentForTimeSlot(timeSlot);
          const isEvenRow = index % 2 === 0;
          
          return (
            <div key={timeSlot} className="h-10 flex border-b border-gray-300 last:border-b-0">
              {/* Time column - 70px wide */}
              <div className={`w-[70px] flex items-center justify-center border-r border-gray-300 text-sm font-medium text-gray-700 pt-2 ${
                isEvenRow ? 'bg-white' : 'bg-gray-50'
              }`}>
                {formatTime(timeSlot)}
              </div>
              
              {/* Appointment area */}
              <div className={`flex-1 relative ${isEvenRow ? 'bg-white' : 'bg-gray-50'}`}>
                {appointment && (
                  <div className="absolute inset-1 bg-white border border-gray-300 rounded border-l-4 border-l-blue-500 shadow-sm p-3">
                    {/* Green dot */}
                    <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full"></div>
                    
                    {/* Appointment content */}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600 mb-1">
                        {appointment.title}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {new Date(appointment.startTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })} - {new Date(appointment.endTime).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </div>
                    </div>
                    
                    {/* Status badge */}
                    {appointment.title.toLowerCase().includes('canceled') ? (
                      <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-xl">
                        CANCELED
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-xl">
                        UPCOMING
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER - 56px */}
      <div className="h-14 bg-white border-t border-gray-300 flex items-center justify-between px-4">
        <Button
          variant="ghost"
          onClick={goToPreviousDay}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous Day
        </Button>
        
        <Button
          variant="outline"
          onClick={goToToday}
          className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
        >
          Today
        </Button>
        
        <Button
          variant="ghost"
          onClick={goToNextDay}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Next Day
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      
      {/* Export Button */}
      {onExportPDF && (
        <div className="p-4 border-t border-gray-300">
          <Button onClick={onExportPDF} className="w-full">
            Export Perfect Daily PDF
          </Button>
        </div>
      )}
    </div>
  );
};