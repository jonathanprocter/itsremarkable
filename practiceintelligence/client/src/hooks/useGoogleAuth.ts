import { useState, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
}

interface AuthStatus {
  authenticated: boolean;
  user: GoogleUser | null;
}

export const useGoogleAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    user: null
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch('/api/auth/status', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Ensure cookies are sent
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (typeof data.authenticated !== 'boolean') {
        throw new Error('Invalid auth response format');
      }

      // Enhanced auth status with token validation
      const enhancedAuthStatus = {
        authenticated: data.authenticated,
        user: data.user,
        hasValidTokens: data.hasValidTokens || false,
        environment: data.environment || {}
      };

      setAuthStatus(enhancedAuthStatus);
      
      // Save authentication timestamp for session persistence
      if (data.authenticated) {
        localStorage.setItem('google_auth_recent', Date.now().toString());
        console.log('✅ Authentication verified:', {
          user: data.user?.email,
          hasTokens: data.hasValidTokens,
          envTokens: data.environment
        });
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Auth status check timed out');
      } else {
        console.error('Auth status check failed:', error);
      }
      
      setAuthStatus({ authenticated: false, user: null });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
    
    // Check for connection success in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success' || urlParams.get('connected') === 'true' || urlParams.get('google_auth') === 'complete') {
      console.log('✅ OAuth authentication completed successfully');
      // Remove the parameters from URL
      window.history.replaceState({}, document.title, '/');
      // Force authentication status to true since we know the user just authenticated
      setAuthStatus({ authenticated: true, user: { id: 'google', email: 'authenticated', name: 'Google User' } });
      // Refresh auth status and force calendar refresh
      setTimeout(() => {
        checkAuthStatus();
        // Force a calendar refresh
        window.location.reload();
      }, 1000);
    } else if (urlParams.get('error') && (urlParams.get('error') === 'oauth_failed' || urlParams.get('error') === 'auth_failed')) {
      // Handle authentication failure
      const errorMessage = urlParams.get('message') || 'OAuth authentication failed';
      console.error('Google OAuth authentication failed:', errorMessage);
      alert(`Google authentication failed: ${errorMessage}`);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const connectGoogle = () => {
    console.log('🔗 Initiating Google OAuth connection...');
    // Clear any existing auth state
    localStorage.removeItem('google_auth_recent');
    // Use the fresh OAuth endpoint for better reliability
    window.location.href = '/api/auth/google/fresh';
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      setAuthStatus({ authenticated: false, user: null });
      await queryClient.invalidateQueries();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchCalendarEvents = async (timeMin?: string, timeMax?: string) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout for calendar API

    try {
      const params = new URLSearchParams();
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const response = await fetch(`/api/calendar/events?${params}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch calendar events: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.events || !Array.isArray(data.events)) {
        throw new Error('Invalid calendar response format');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Calendar fetch timed out');
        throw new Error('Calendar fetch timed out. Please try again.');
      } else {
        console.error('Calendar fetch failed:', error);
        throw error;
      }
    }
  };

  const uploadToDrive = async (filename: string, content: string, mimeType: string = 'application/pdf') => {
    try {
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename,
          content,
          mimeType
        })
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Drive upload failed:', error);
      throw error;
    }
  };

  const updateCalendarEvent = async (eventId: string, startTime: Date, endTime: Date, calendarId: string) => {
    try {
      const response = await fetch(`/api/calendar/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          calendarId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update calendar event: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Update calendar event failed:', error);
      throw error;
    }
  };

  return {
    authStatus,
    isLoading,
    connectGoogle,
    logout,
    fetchCalendarEvents,
    uploadToDrive,
    updateCalendarEvent,
    refreshAuthStatus: checkAuthStatus
  };
};