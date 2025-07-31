import React from 'react';

interface Calendar {
  id: string;
  name: string;
  color: string;
}

interface CalendarLegendProps {
  filters: {
    simplepractice: boolean;
    google: boolean;
    personal: boolean;
  };
  onFilterChange: (filters: { simplepractice: boolean; google: boolean; personal: boolean }) => void;
}

export const CalendarLegend = ({ filters, onFilterChange }: CalendarLegendProps) => {
  const handleFilterToggle = (filterType: 'simplepractice' | 'google' | 'personal') => {
    onFilterChange({
      ...filters,
      [filterType]: !filters[filterType]
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="simplepractice"
          checked={filters.simplepractice}
          onChange={() => handleFilterToggle('simplepractice')}
          className="w-4 h-4 text-accent rounded focus:ring-accent"
        />
        <label htmlFor="simplepractice" className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-background border-2 border-accent" style={{borderLeft: '4px solid hsl(28, 43.5%, 69.4%)'}}></div>
          <span className="text-foreground font-medium">SimplePractice</span>
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="google"
          checked={filters.google}
          onChange={() => handleFilterToggle('google')}
          className="w-4 h-4 text-success rounded focus:ring-success"
        />
        <label htmlFor="google" className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-background border-2 border-success border-dashed"></div>
          <span className="text-foreground font-medium">Google Calendar</span>
        </label>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="personal"
          checked={filters.personal}
          onChange={() => handleFilterToggle('personal')}
          className="w-4 h-4 text-warning rounded focus:ring-warning"
        />
        <label htmlFor="personal" className="flex items-center space-x-2 text-sm">
          <div className="w-3 h-3 bg-warning border-2 border-warning"></div>
          <span className="text-foreground font-medium">Holidays</span>
        </label>
      </div>
    </div>
  );
};