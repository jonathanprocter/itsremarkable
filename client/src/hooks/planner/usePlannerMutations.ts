import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarEvent } from '@/types/calendar';
import { useToast } from '@/hooks/use-toast';

export interface UsePlannerMutationsReturn {
  createEvent: (event: Partial<CalendarEvent>) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

/**
 * Custom hook for managing planner event mutations
 *
 * Handles:
 * - Creating new events
 * - Updating existing events
 * - Deleting events
 * - Automatic query invalidation
 * - Toast notifications
 */
export function usePlannerMutations(): UsePlannerMutationsReturn {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: Partial<CalendarEvent>) =>
      apiRequest('POST', '/api/events', eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event created successfully' });
    },
    onError: () => {
      toast({
        title: 'Failed to create event',
        variant: 'destructive',
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: ({
      id,
      ...eventData
    }: { id: string } & Partial<CalendarEvent>) =>
      apiRequest('PUT', `/api/events/${id}`, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event updated successfully' });
    },
    onError: () => {
      toast({
        title: 'Failed to update event',
        variant: 'destructive',
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event deleted successfully' });
    },
    onError: () => {
      toast({
        title: 'Failed to delete event',
        variant: 'destructive',
      });
    },
  });

  return {
    createEvent: (event: Partial<CalendarEvent>) =>
      createEventMutation.mutate(event),
    updateEvent: (id: string, updates: Partial<CalendarEvent>) =>
      updateEventMutation.mutate({ id, ...updates }),
    deleteEvent: (id: string) => deleteEventMutation.mutate(id),
    isCreating: createEventMutation.isPending,
    isUpdating: updateEventMutation.isPending,
    isDeleting: deleteEventMutation.isPending,
  };
}
