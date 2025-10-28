import React from 'react';
import { ProductivityHub } from '@/components/productivity/ProductivityHub';
import { CalendarEvent } from '@/types/calendar';

export interface ProductivityHubTabProps {
  events: CalendarEvent[];
  selectedDate: Date;
}

/**
 * Productivity Hub Tab Component
 *
 * Displays the productivity overview dashboard
 * Wraps the ProductivityHub component
 */
export function ProductivityHubTab({
  events,
  selectedDate,
}: ProductivityHubTabProps) {
  return <ProductivityHub events={events} selectedDate={selectedDate} />;
}
