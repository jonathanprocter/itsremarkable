import { useQuery } from '@tanstack/react-query';

interface AuthResponse {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    displayName: string;
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
  };
  hasTokens: boolean;
}

export const useAuthenticatedUser = () => {
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      try {
        const response = await fetch('/api/auth/status', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch auth status: ${response.status}`);
        }
        
        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          throw new Error('Auth status request timed out');
        }
        
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  const user = data?.user;
  const isAuthenticated = data?.isAuthenticated || false;
  const hasTokens = data?.hasTokens || false;

  return {
    user,
    isAuthenticated,
    hasTokens,
    isLoading,
    error,
    refetch
  };
};