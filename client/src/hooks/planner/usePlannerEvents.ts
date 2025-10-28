import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/types/calendar';
import { runAuthenticationFix } from '@/utils/authenticationFix';

export interface CalendarFilters {
  simplepractice: boolean;
  google: boolean;
  personal: boolean;
}

export interface UsePlannerEventsReturn {
  events: CalendarEvent[];
  filteredEvents: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  filters: CalendarFilters;
  setFilters: (filters: CalendarFilters) => void;
  toggleFilter: (source: keyof CalendarFilters) => void;
  eventStats: {
    total: number;
    google: number;
    simplepractice: number;
    manual: number;
  };
}

/**
 * Custom hook for managing planner events
 *
 * Handles:
 * - Fetching events from the unified API
 * - Filtering events by source (google, simplepractice, manual)
 * - Auto-fix authentication issues
 * - Event statistics
 */
export function usePlannerEvents(): UsePlannerEventsReturn {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CalendarFilters>({
    simplepractice: true,
    google: true,
    personal: true,
  });

  // Fetch events from unified API
  const {
    data: allEvents = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/events', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Retry with authenticated session cookie on 401
          if (response.status === 401) {
            const retryResponse = await fetch('/api/events', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
              },
            });

            if (retryResponse.ok) {
              return retryResponse.json();
            }
          }
          return [];
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          return data;
        }

        return [];
      } catch (error) {
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: true,
    staleTime: 0, // No cache - always fetch fresh data
    refetchInterval: false,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Auto-fix authentication issues when errors occur
  useEffect(() => {
    if (error && error.message?.includes('authentication')) {
      runAuthenticationFix()
        .then((result) => {
          if (result.success) {
            queryClient.invalidateQueries({ queryKey: ['/api/events'] });
          }
        })
        .catch(() => {
          // Silent catch - authentication fix failed
        });
    }
  }, [error, queryClient]);

  // Auto-fix authentication on mount
  useEffect(() => {
    const autoFixAuth = async () => {
      try {
        const statusResponse = await fetch('/api/auth/status', {
          credentials: 'include',
        });
        const status = await statusResponse.json();

        if (!status.authenticated) {
          const result = await runAuthenticationFix();
          if (result.success) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ['/api/events'] });
            }, 500);
          }
        }
      } catch (error) {
        // Silent catch - auto-fix failed
      }
    };

    autoFixAuth();
  }, [queryClient]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const eventSource = event.source || 'manual';
      if (eventSource === 'simplepractice' && !filters.simplepractice)
        return false;
      if (eventSource === 'google' && !filters.google) return false;
      if (eventSource === 'manual' && !filters.personal) return false;
      return true;
    });
  }, [allEvents, filters]);

  // Calculate event statistics
  const eventStats = useMemo(() => {
    return {
      total: allEvents.length,
      google: allEvents.filter((e) => e.source === 'google').length,
      simplepractice: allEvents.filter((e) => e.source === 'simplepractice')
        .length,
      manual: allEvents.filter((e) => e.source === 'manual').length,
    };
  }, [allEvents]);

  // Toggle a single filter
  const toggleFilter = (source: keyof CalendarFilters) => {
    setFilters((prev) => ({
      ...prev,
      [source]: !prev[source],
    }));
  };

  return {
    events: allEvents,
    filteredEvents,
    isLoading,
    error: error as Error | null,
    refetch,
    filters,
    setFilters,
    toggleFilter,
    eventStats,
  };
}
