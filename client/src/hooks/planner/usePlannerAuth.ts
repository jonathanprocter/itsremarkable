import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useQueryClient } from '@tanstack/react-query';

export interface UsePlannerAuthReturn {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetchAuth: () => void;
  handleOAuthLogin: () => void;
  handleLogout: () => void;
}

/**
 * Custom hook for managing planner authentication
 *
 * Handles:
 * - User authentication state
 * - OAuth login flow
 * - Logout functionality
 * - Auth refresh
 */
export function usePlannerAuth(): UsePlannerAuthReturn {
  const { user, isLoading, refetch } = useAuthenticatedUser();
  const queryClient = useQueryClient();

  // Refresh authentication and invalidate all queries
  const refreshAuth = async () => {
    try {
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      await queryClient.invalidateQueries({
        queryKey: ['/api/simplepractice/events'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['/api/calendar/events'],
      });
    } catch (error) {
      // Silent catch - auth refresh failed
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // Handle logout
  const handleLogout = () => {
    window.location.href = '/api/auth/logout';
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    refetchAuth: refreshAuth,
    handleOAuthLogin,
    handleLogout,
  };
}
