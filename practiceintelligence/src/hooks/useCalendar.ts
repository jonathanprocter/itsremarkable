import { useState, useEffect } from 'react';
import { CalendarState, CalendarEvent, CalendarDay, ViewMode } from '../types/calendar';
import { getWeekStartDate, getWeekEndDate, isToday, formatWeekRange, addWeeks } from '../utils/dateUtils';

// No sample events - only use real calendar data from API

const initialState: CalendarState = {
  currentDate: new Date(2025, 6, 7), // July 7, 2025 (Monday)
  selectedDate: new Date(2025, 6, 7), // July 7, 2025 (Monday)
  viewMode: 'weekly',
  currentWeek: {
    weekNumber: 1,
    startDate: new Date(),
    endDate: new Date(),
    days: []
  },
  events: [], // Start with empty events array
  dailyNotes: {},
  isGoogleConnected: true,
  isOnline: true
};

export const useCalendar = () => {
  const [state, setState] = useState<CalendarState>(() => {
    // Load persisted events from localStorage
    const savedEvents = localStorage.getItem('calendar_events');
    const persistedEvents = savedEvents ? JSON.parse(savedEvents) : [];

    // Convert string dates back to Date objects
    const convertedEvents = persistedEvents.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    }));

    return {
      ...initialState,
      events: convertedEvents // Only use persisted manual events, no samples
    };
  });

  useEffect(() => {
    updateCurrentWeek(state.currentDate);
  }, [state.currentDate]);

  // Force update to July 7, 2025 week on mount
  useEffect(() => {
    const targetDate = new Date(2025, 6, 7); // July 7, 2025
    setCurrentDate(targetDate);
  }, []);

  // Persist manual events to localStorage whenever they change
  useEffect(() => {
    const manualEvents = state.events.filter(event => event.source === 'manual');
    localStorage.setItem('calendar_events', JSON.stringify(manualEvents));
  }, [state.events]);

  const updateCurrentWeek = (date: Date, events = state.events) => {
    const startDate = getWeekStartDate(date);
    const endDate = getWeekEndDate(date);

    console.log(`Updating week for date: ${date.toDateString()}, week: ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      days.push({
        date: currentDate,
        dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: currentDate.getDate(),
        events: events.filter(event => {
          const eventDate = new Date(event.startTime);
          const eventDateStr = eventDate.toDateString();
          const currentDateStr = currentDate.toDateString();

          // Debug for Monday July 7th specifically
          if (eventDateStr === 'Mon Jul 07 2025' && currentDateStr.includes('Jul 07')) {
            console.log(`✅ MONDAY MATCH: ${event.title} matched with day ${currentDateStr}`);
          }

          return eventDateStr === currentDateStr;
        })
      });
    }

    setState(prev => ({
      ...prev,
      currentWeek: {
        weekNumber: Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate,
        endDate,
        days
      }
    }));
  };

  const setCurrentDate = (date: Date) => {
    setState(prev => ({ ...prev, currentDate: date }));
  };

  const setSelectedDate = (date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  };

  const setViewMode = (mode: ViewMode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const goToPreviousWeek = () => {
    const previousWeek = addWeeks(state.currentDate, -1);
    setCurrentDate(previousWeek);
  };

  const goToNextWeek = () => {
    const nextWeek = addWeeks(state.currentDate, 1);
    setCurrentDate(nextWeek);
  };

  const goToPreviousDay = () => {
    const previousDay = new Date(state.selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedDate(previousDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(state.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const addEvent = (event: CalendarEvent) => {
    setState(prev => {
      const newEvents = [...prev.events, event];

      // Recalculate current week with new event
      const startDate = getWeekStartDate(prev.currentDate);
      const endDate = getWeekEndDate(prev.currentDate);

      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        days.push({
          date: currentDate,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: currentDate.getDate(),
          events: newEvents.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === currentDate.toDateString();
          })
        });
      }

      return {
        ...prev,
        events: newEvents,
        currentWeek: {
          weekNumber: Math.ceil((prev.currentDate.getTime() - new Date(prev.currentDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate,
          endDate,
          days
        }
      };
    });
  };

  const updateEvents = (events: CalendarEvent[]) => {
    setState(prev => {
      const newState = {
        ...prev,
        events: events
      };

      // Immediately update current week with new events
      console.log('Updating current week with events:', events.length);

      // Recalculate current week with new events
      const startDate = getWeekStartDate(prev.currentDate);
      const endDate = getWeekEndDate(prev.currentDate);

      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        days.push({
          date: currentDate,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: currentDate.getDate(),
          events: events.filter(event => {
            const eventDate = new Date(event.startTime);
            const eventDateStr = eventDate.toDateString();
            const currentDateStr = currentDate.toDateString();

            // Debug for Monday July 7th specifically
            if (eventDateStr === 'Mon Jul 07 2025' && currentDateStr.includes('Jul 07')) {
              console.log(`✅ MONDAY MATCH: ${event.title} matched with day ${currentDateStr}`);
            }

            return eventDateStr === currentDateStr;
          })
        });
      }

      newState.currentWeek = {
        weekNumber: Math.ceil((prev.currentDate.getTime() - new Date(prev.currentDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        startDate,
        endDate,
        days
      };

      return newState;
    });
  };

  const updateEvent = (eventId: string, updates: Partial<CalendarEvent>) => {
    setState(prev => {
      const updatedEvents = prev.events.map(event => 
        event.id === eventId ? { ...event, ...updates } : event
      );

      // Recalculate current week with updated events
      const startDate = getWeekStartDate(prev.currentDate);
      const endDate = getWeekEndDate(prev.currentDate);

      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        days.push({
          date: currentDate,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: currentDate.getDate(),
          events: updatedEvents.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === currentDate.toDateString();
          })
        });
      }

      return {
        ...prev,
        events: updatedEvents,
        currentWeek: {
          weekNumber: Math.ceil((prev.currentDate.getTime() - new Date(prev.currentDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate,
          endDate,
          days
        }
      };
    });
  };

  const deleteEvent = (eventId: string) => {
    setState(prev => {
      const filteredEvents = prev.events.filter(event => event.id !== eventId);

      // Recalculate current week with filtered events
      const startDate = getWeekStartDate(prev.currentDate);
      const endDate = getWeekEndDate(prev.currentDate);

      const days: CalendarDay[] = [];
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        days.push({
          date: currentDate,
          dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'short' }),
          dayNumber: currentDate.getDate(),
          events: filteredEvents.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === currentDate.toDateString();
          })
        });
      }

      return {
        ...prev,
        events: filteredEvents,
        currentWeek: {
          weekNumber: Math.ceil((prev.currentDate.getTime() - new Date(prev.currentDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          startDate,
          endDate,
          days
        }
      };
    });
  };

  const updateDailyNote = (date: string, content: string) => {
    setState(prev => ({
      ...prev,
      dailyNotes: {
        ...prev.dailyNotes,
        [date]: content
      }
    }));
  };

  const getWeekRangeString = () => {
    return formatWeekRange(state.currentWeek.startDate, state.currentWeek.endDate);
  };

  const isCurrentWeek = () => {
    return isToday(state.currentDate);
  };

  return {
    state,
    setCurrentDate,
    setSelectedDate,
    setViewMode,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousDay,
    goToNextDay,
    addEvent,
    updateEvents,
    updateEvent,
    deleteEvent,
    updateDailyNote,
    getWeekRangeString,
    isCurrentWeek
  };
};