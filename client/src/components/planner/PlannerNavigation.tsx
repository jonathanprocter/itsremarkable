import React from 'react';
import { Button } from '@/components/ui/button';
import { ViewMode, CalendarDay } from '@/types/calendar';

export interface PlannerNavigationProps {
  viewMode: ViewMode;
  selectedDate: Date;
  currentWeek: CalendarDay[];
  onNavigate: (
    direction: 'prev' | 'next',
    unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) => void;
  onToday: () => void;
  onRefresh: () => void;
}

/**
 * Planner Navigation Component
 *
 * Displays:
 * - Previous/Next navigation (context-aware based on view mode)
 * - Today button
 * - Refresh events button
 * - Month/Quarter navigation shortcuts
 * - Current date range display
 */
export function PlannerNavigation({
  viewMode,
  selectedDate,
  currentWeek,
  onNavigate,
  onToday,
  onRefresh,
}: PlannerNavigationProps) {
  // Handle navigation based on current view mode
  const handlePrevious = () => {
    if (viewMode === 'weekly') onNavigate('prev', 'week');
    else if (viewMode === 'daily') onNavigate('prev', 'day');
    else if (viewMode === 'monthly') onNavigate('prev', 'month');
    else if (viewMode === 'yearly') onNavigate('prev', 'year');
  };

  const handleNext = () => {
    if (viewMode === 'weekly') onNavigate('next', 'week');
    else if (viewMode === 'daily') onNavigate('next', 'day');
    else if (viewMode === 'monthly') onNavigate('next', 'month');
    else if (viewMode === 'yearly') onNavigate('next', 'year');
  };

  // Format date range display based on view mode
  const getDateRangeDisplay = () => {
    if (viewMode === 'weekly') {
      return `Week of ${currentWeek[0]?.date.toLocaleDateString()} - ${currentWeek[6]?.date.toLocaleDateString()}`;
    } else if (viewMode === 'daily') {
      return selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else if (viewMode === 'monthly') {
      return selectedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    } else {
      return selectedDate.getFullYear().toString();
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left side: Navigation controls */}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handlePrevious} size="sm">
          ← Previous
        </Button>
        <Button variant="outline" onClick={handleNext} size="sm">
          Next →
        </Button>
        <Button variant="outline" onClick={onToday} size="sm">
          Today
        </Button>
        <Button
          variant="outline"
          onClick={onRefresh}
          size="sm"
          className="bg-blue-50 text-blue-700"
        >
          🔄 Refresh Events
        </Button>

        {/* Month navigation shortcuts */}
        <Button
          variant="outline"
          onClick={() => onNavigate('prev', 'month')}
          size="sm"
        >
          ← Month
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate('next', 'month')}
          size="sm"
        >
          Month →
        </Button>

        {/* Quarter navigation shortcuts */}
        <Button
          variant="outline"
          onClick={() => onNavigate('prev', 'quarter')}
          size="sm"
        >
          ← Quarter
        </Button>
        <Button
          variant="outline"
          onClick={() => onNavigate('next', 'quarter')}
          size="sm"
        >
          Quarter →
        </Button>
      </div>

      {/* Right side: Date range display */}
      <div className="text-lg font-semibold">{getDateRangeDisplay()}</div>
    </div>
  );
}
