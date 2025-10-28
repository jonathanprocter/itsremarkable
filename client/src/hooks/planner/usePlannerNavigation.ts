import { useState, useEffect } from 'react';
import { CalendarDay } from '@/types/calendar';
import { generateWeekDays } from '@/utils/dateUtils';

export interface UsePlannerNavigationReturn {
  selectedDate: Date;
  currentWeek: CalendarDay[];
  navigateWeek: (direction: 'prev' | 'next') => void;
  navigateDay: (direction: 'prev' | 'next') => void;
  navigateMonth: (direction: 'prev' | 'next') => void;
  navigateQuarter: (direction: 'prev' | 'next') => void;
  navigateYear: (direction: 'prev' | 'next') => void;
  goToToday: () => void;
  setSelectedDate: (date: Date) => void;
}

/**
 * Custom hook for managing planner date navigation
 *
 * Handles:
 * - Current selected date
 * - Week calculation
 * - Navigation by day/week/month/quarter/year
 * - Go to today functionality
 */
export function usePlannerNavigation(): UsePlannerNavigationReturn {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      // Default to today so the planner opens on the current week
      return new Date();
    } catch (error) {
      return new Date(Date.now());
    }
  });

  const [currentWeek, setCurrentWeek] = useState<CalendarDay[]>([]);

  // Update current week when selected date changes
  useEffect(() => {
    const week = generateWeekDays(selectedDate);
    setCurrentWeek(week);
  }, [selectedDate]);

  // Navigate by week
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  // Navigate by day
  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Navigate by month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Navigate by quarter
  const navigateQuarter = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
    setSelectedDate(newDate);
  };

  // Navigate by year
  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(
      newDate.getFullYear() + (direction === 'next' ? 1 : -1)
    );
    setSelectedDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };

  return {
    selectedDate,
    currentWeek,
    navigateWeek,
    navigateDay,
    navigateMonth,
    navigateQuarter,
    navigateYear,
    goToToday,
    setSelectedDate,
  };
}
