import { useQuery } from "@tanstack/react-query";
import { ConsoleManager } from "../utils/consoleManager";

interface User {
  id: string;
  email: string;
  name: string;
  displayName?: string;
  provider?: string;
}

interface AuthResponse {
  authenticated: boolean;
  hasValidTokens: boolean;
  user: User | null;
  needsAuth?: boolean;
}

export function useAuthenticatedUser() {
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: ["auth-status"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Auth status check failed: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        ConsoleManager.throttledLog("Auth status check failed:", error, "error");
        throw error;
      }
    },
    staleTime: 600000, // 10 minutes
    refetchInterval: 60000, // Refetch every 60 seconds
    retry: 1, // Only retry once on failure
    retryDelay: 5000, // Wait 5 seconds before retry
    refetchOnWindowFocus: false,
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  return {
    user: data?.user || null,
    isAuthenticated: data?.authenticated || false,
    hasValidTokens: data?.hasValidTokens || false,
    isLoading,
    error,
    refetch,
    needsAuth: data?.needsAuth || false,
  };
}