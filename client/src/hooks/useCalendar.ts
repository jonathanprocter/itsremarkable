import { useState, useEffect } from 'react';
import { CalendarState, CalendarEvent, CalendarDay, ViewMode } from '../types/calendar';
import { getWeekStartDate, getWeekEndDate, isToday, formatWeekRange, addWeeks } from '../utils/dateUtils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ConsoleManager } from '../utils/consoleManager';

interface EventsResponse {
  events: CalendarEvent[];
  calendars?: Array<{ id: string; name: string; color: string }>;
  syncTime?: string;
  isLiveSync?: boolean;
  isFallback?: boolean;
  message?: string;
}

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

  const queryClient = useQueryClient();

  const {
    data: eventsData,
    isLoading,
    error,
    refetch: refetchEvents
  } = useQuery<CalendarEvent[]>({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/events', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch events: ${response.status}`);
        }

        const data = await response.json();

        // Log event breakdown only once every 5 minutes to reduce console noise
        const lastLogKey = 'events-breakdown-last-log';
        const lastLogTime = sessionStorage.getItem(lastLogKey);
        const now = Date.now();

        if (!lastLogTime || now - parseInt(lastLogTime) > 300000) { // 5 minutes
          const breakdown = {
            total: data.length,
            manual: data.filter((e: CalendarEvent) => e.source === 'manual').length,
            google: data.filter((e: CalendarEvent) => e.source === 'google').length,
            simplepractice: data.filter((e: CalendarEvent) => e.source === 'simplepractice').length,
            sources: {
              from_live_sync: data.length,
              from_database: 0,
              simplepractice_live: data.filter((e: CalendarEvent) => e.source === 'simplepractice').length
            }
          };

          ConsoleManager.throttledLog('📊 Event breakdown (Live Sync + DB):', breakdown);
          sessionStorage.setItem(lastLogKey, now.toString());
        }

        return data;
      } catch (error) {
        ConsoleManager.throttledLog('Failed to fetch events:', error, 'error');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    gcTime: 600000, // Keep in cache for 10 minutes
  });

  // Use React Query data when available, fallback to state events
  useEffect(() => {
    if (eventsData && eventsData.length > 0) {
      updateEvents(eventsData);
    } else if (eventsData && eventsData.length === 0 && state.events.length > 0) {
      // During server reconnections, keep existing events instead of clearing them
      console.log('🔄 Preserving existing events during server reconnection');
    }
  }, [eventsData]);

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