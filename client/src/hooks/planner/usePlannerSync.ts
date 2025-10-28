import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export interface UsePlannerSyncReturn {
  syncCalendar: () => void;
  isSyncing: boolean;
}

/**
 * Custom hook for managing calendar synchronization
 *
 * Handles:
 * - Syncing events from Google Calendar
 * - Authentication error handling
 * - Toast notifications for sync status
 */
export function usePlannerSync(onSyncSuccess?: () => void): UsePlannerSyncReturn {
  const { toast } = useToast();

  // Calendar sync mutation
  const syncCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/calendar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401 || errorData.needsReauth) {
          throw new Error(
            `Authentication required: ${errorData.message || 'Please re-authenticate with Google'}`
          );
        }

        throw new Error(
          errorData.message || 'Failed to sync calendar events'
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Successful',
        description: `Synced ${data.events || 0} calendar events`,
      });

      // Call optional success callback (e.g., to refetch events)
      if (onSyncSuccess) {
        onSyncSuccess();
      }
    },
    onError: (error) => {
      if (error.message?.includes('Authentication required')) {
        toast({
          title: 'Authentication Required',
          description: 'Google OAuth tokens have expired. Please re-authenticate.',
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/api/auth/google')}
            >
              Re-authenticate
            </Button>
          ),
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: error.message || 'Failed to sync calendar events',
          variant: 'destructive',
        });
      }
    },
  });

  return {
    syncCalendar: () => syncCalendarMutation.mutate(),
    isSyncing: syncCalendarMutation.isPending,
  };
}
