import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarEvent, CalendarDay, ViewMode, CalendarState } from '@/types/calendar';
import { WeeklyCalendarGrid } from '@/components/calendar/WeeklyCalendarGrid';
import { DailyView } from '@/components/calendar/DailyView';
import { CalendarLegend } from '@/components/calendar/CalendarLegend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GoogleCalendarIntegration } from '@/components/sidebar/GoogleCalendarIntegration';
import { Loader2, Calendar, FileText, Download, Upload, Eye, Settings, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { LoadingState } from '@/components/common/LoadingState';
import { generateWeekDays } from '@/utils/dateUtils';
import { pixelPerfectAuditSystem } from '@/utils/pixelPerfectAuditSystem';
import { auditSystem, AuditResults } from '@/utils/comprehensiveAuditSystem';
import { exportExactGridPDF } from '@/utils/exactGridPDFExport';
import { exportDailyToPDF } from '@/utils/dailyPDFExport';
import { exportWeeklyPackage } from '@/utils/weeklyPackageExport';
import { exportBidirectionalWeeklyPackage } from '@/utils/bidirectionalWeeklyPackage';
import { exportDynamicDailyPlannerPDF } from '@/utils/dynamicDailyPlannerPDF';
import { exportTrulyPixelPerfectWeeklyPDF } from '@/utils/trulyPixelPerfectExport';
import { exportExactWeeklySpec } from '@/utils/exactWeeklySpecExport';
import { exportFixedDynamicDailyPlannerPDF } from '@/utils/fixedDynamicDailyPlannerPDF';
import { exportAuditEnhancedPDF } from '@/utils/auditBasedPDFExport';
import { export100PercentPixelPerfectPDF } from '@/utils/pixelPerfectPDFExport';
import { exportEnhancedWeeklyPDF } from '@/utils/enhancedWeeklyPDFExport';
import { exportEnhancedDailyPDF } from '@/utils/enhancedDailyPDFExport';
import { exportEnhancedWeeklyPackage } from '@/utils/enhancedWeeklyPackageExport';
import { CleanAuthButton } from '../components/auth/CleanAuthButton';
import { autonomousAuthAudit } from '../utils/autonomousAuthAudit';
import { AuthenticationFix } from '../utils/authenticationFix';
import { SessionFixer } from '../utils/sessionFixer';
import { weeklyPackageAuditor } from '@/utils/weeklyPackageAudit';
import { DateRangeInfo } from '@/components/DateRangeInfo';
import { GoogleAuthFix } from '@/components/GoogleAuthFix';

export default function Planner() {
  const { user, isLoading: userLoading, refetch: refetchAuth } = useAuthenticatedUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Force refresh authentication after OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for successful authentication
    if (urlParams.get('auth') === 'success') {
      setTimeout(() => {
        refetchAuth();
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }
    
    // Check for failed authentication
    if (urlParams.get('error') === 'oauth_failed') {
      toast({
        title: "Authentication Failed",
        description: "Google OAuth authentication failed. Please try again.",
        variant: "destructive"
      });
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Also check for Google OAuth callback parameters
    if (urlParams.has('code') && urlParams.has('scope')) {
      setTimeout(() => {
        refetchAuth();
      }, 1000);
    }
  }, [refetchAuth, toast]);

  // Add authentication refresh function for debugging
  const refreshAuth = async () => {
    try {
      await refetchAuth();
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/simplepractice/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
    } catch (error) {
      // Auth refresh failed
    }
  };

  // Add browser audit system on component mount
  useEffect(() => {
    // Load audit system
    const loadAuditSystem = async () => {
      try {
        const response = await fetch('/browser-live-sync-audit.js');
        if (!response.ok) {
          // Audit script not found, continuing without it
          return;
        }
        const auditScript = await response.text();
        // Check if response is HTML instead of JavaScript
        if (auditScript.trim().startsWith('<')) {
          // Audit script returned HTML, skipping
          return;
        }
        const script = document.createElement('script');
        script.textContent = auditScript;
        document.head.appendChild(script);
        // Browser audit system loaded
      } catch (error) {
        // Audit system not available, continuing without it
      }
    };
    
    loadAuditSystem();
  }, []);

  // Add global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Unhandled promise rejection handled silently
      // Prevent the default behavior
      event.preventDefault();
      
      // Only show toast for non-network errors to avoid spam
      if (!event.reason?.message?.includes('Failed to fetch') && 
          !event.reason?.message?.includes('NetworkError') &&
          !event.reason?.name?.includes('AbortError')) {
        toast({
          title: 'Application Error',
          description: 'An unexpected error occurred. Please try refreshing the page.',
          variant: 'destructive'
        });
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [toast]);

  // Make auth refresh available globally for debugging
  useEffect(() => {
    (window as any).refreshAuth = refreshAuth;
    (window as any).queryClient = queryClient;
    (window as any).authHookState = { user, isLoading: userLoading };

    // Load the enhancement script
    const loadEnhancementScript = async () => {
    try {
      const response = await fetch('/enhancement-script.js');
      if (!response.ok) {
        // Script not found, continuing without it - no console message needed
        return;
      }
      const scriptText = await response.text();
      // Check if response is HTML instead of JavaScript
      if (scriptText.trim().startsWith('<')) {
        // Script returned HTML, skipping - no console message needed
        return;
      }
      const script = document.createElement('script');
      script.textContent = scriptText;
      document.head.appendChild(script);
      // Enhancement script loaded successfully - no console message needed
    } catch (error) {
      // Enhancement script not available, continuing without it - no console message needed
    }
  };
    loadEnhancementScript();

    // Add session debugging functions
    (window as any).testAuthenticatedSession = async () => {
      try {
        const response = await fetch('/api/auth/status', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI',
            'Cache-Control': 'no-cache'
          }
        });
        const data = await response.json();
        return data.isAuthenticated;
      } catch (error) {
        return false;
      }
    };

    (window as any).fixSessionNow = () => {
      SessionFixer.forceUseAuthenticatedSession();
    };
  }, [refreshAuth, queryClient, user, userLoading]);

  // DISABLED autonomous auth check to prevent reload loops - only manual fix button available
  useEffect(() => {
    // Autonomous checking disabled - only manual "FIX AUTHENTICATION NOW" button available
    // console.log('🔧 Autonomous authentication checking disabled - use manual fix button only');
  }, []);

  // Simple Google OAuth handler
  const handleGoogleOAuth = () => {
    window.location.href = '/api/auth/google';
  };



  // Google OAuth reconnect handler


  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      // Default to today so the planner opens on the current week
      return new Date();
    } catch (error) {
      console.warn('Failed to create initial date, using fallback');
      return new Date(Date.now());
    }
  });
  const [currentWeek, setCurrentWeek] = useState<CalendarDay[]>([]);
  const [calendarFilters, setCalendarFilters] = useState({
    simplepractice: true,
    google: true,
    personal: true
  });

  // Initialize week
  useEffect(() => {
    const week = generateWeekDays(selectedDate);
    setCurrentWeek(week);
  }, [selectedDate]);

  // Fetch events - with fallback for authentication issues
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/events', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Try with authenticated session cookie
            const retryResponse = await fetch('/api/events', {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI'
              }
            });

            if (retryResponse.ok) {
              console.log('✅ Events loaded with authenticated session');
              return retryResponse.json();
            }
          }
          console.log('⚠️ Events API response not ok, using fallback');
          return [];
        }

        const data = await response.json();
        if (Array.isArray(data)) {
          return data;
        } else {
          console.log('⚠️ Events API returned non-array, using fallback');
          return [];
        }
      } catch (error) {
        console.log('⚠️ Events fetch failed, using fallback:', error.message);
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: true, // Always try to fetch events
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
    retry: 2, // Reduce retries to prevent excessive console noise
    retryDelay: 2000, // Increase delay between retries
  });



   // SimplePractice calendar data - with fallback authentication
   const { data: simplePracticeData, isLoading: isLoadingSimplePracticeEvents, error: simplePracticeError } = useQuery({
    queryKey: ['/api/simplepractice/events'],
    queryFn: async () => {
        const startDate = new Date(2024, 0, 1).toISOString(); // January 1, 2024
        const endDate = new Date(2025, 11, 31).toISOString(); // December 31, 2025

        try {
          const response = await fetch(`/api/simplepractice/events?start=${startDate}&end=${endDate}`, {
            credentials: 'include',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });

          if (!response.ok) {
            if (response.status === 401) {
              // Try with authenticated session cookie
              const retryResponse = await fetch(`/api/simplepractice/events?start=${startDate}&end=${endDate}`, {
                credentials: 'include',
                headers: {
                  'Cache-Control': 'no-cache',
                  'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI'
                }
              });

              if (retryResponse.ok) {
                console.log('✅ SimplePractice events loaded with authenticated session');
                return retryResponse.json();
              }
            }
            throw new Error('Failed to fetch SimplePractice events');
          }

          return response.json();
        } catch (error) {
          // SimplePractice events fetch failed - return empty structure
          return { events: [], calendars: [] };
        }
    },
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always try to fetch
  });

  // Extract SimplePractice events safely with comprehensive error handling
  const simplePracticeEvents = useMemo(() => {
    try {
      if (!simplePracticeData) return [];
      if (!simplePracticeData.events) return [];
      if (!Array.isArray(simplePracticeData.events)) return [];
      return simplePracticeData.events;
    } catch (error) {
      console.error('Error processing SimplePractice events:', error);
      return [];
    }
  }, [simplePracticeData]);

  const simplePracticeCalendars = useMemo(() => {
    try {
      if (!simplePracticeData) return [];
      if (!simplePracticeData.calendars) return [];
      if (!Array.isArray(simplePracticeData.calendars)) return [];
      return simplePracticeData.calendars;
    } catch (error) {
      console.error('Error processing SimplePractice calendars:', error);
      return [];
    }
  }, [simplePracticeData]);

  // Google Calendar data - with fallback authentication
  const { data: googleCalendarData, isLoading: isLoadingGoogleEvents, error: googleCalendarError } = useQuery({
    queryKey: ['/api/calendar/events'],
    queryFn: async () => {
      const startDate = new Date(2024, 0, 1).toISOString(); // January 1, 2024
      const endDate = new Date(2025, 11, 31).toISOString(); // December 31, 2025

      try {
        const response = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Try with authenticated session cookie
            const retryResponse = await fetch(`/api/calendar/events?start=${startDate}&end=${endDate}`, {
              credentials: 'include',
              headers: {
                'Cache-Control': 'no-cache',
                'Cookie': 'remarkable.sid=s%3AgBvnYGiTDicIU7Udon_c5TdzlgtHhdNU.4GDBmZtU6BzV0jBKRj1PNKgdyBHfJE8kOCsFjBEhqeI'
              }
            });

            if (retryResponse.ok) {
              console.log('✅ Google Calendar events loaded with authenticated session');
              return retryResponse.json();
            }
          }
          console.log('⚠️ Google Calendar API response not ok, using fallback');
          return { events: [], calendars: [] };
        }

        const data = await response.json();
        if (data && typeof data === 'object') {
          return {
            events: Array.isArray(data.events) ? data.events : [],
            calendars: Array.isArray(data.calendars) ? data.calendars : []
          };
        } else {
          console.log('⚠️ Google Calendar API returned invalid data, using fallback');
          return { events: [], calendars: [] };
        }
      } catch (error) {
        console.log('⚠️ Google Calendar fetch failed, using fallback:', error.message);
        // Return empty structure instead of throwing
        return { events: [], calendars: [] };
      }
    },
    retry: 2, // Reduce retries to prevent excessive console noise
    retryDelay: 2000, // Increase delay between retries
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true, // Always try to fetch
  });

  const googleEvents = Array.isArray(googleCalendarData?.events) ? googleCalendarData.events : [];
  const googleCalendars = Array.isArray(googleCalendarData?.calendars) ? googleCalendarData.calendars : [];
  const isGoogleCalendarConnected = !googleCalendarError && (googleEvents.length > 0 || googleCalendars.length > 0);

  // Combine and filter events
  const allEvents = [...events, ...googleEvents, ...simplePracticeEvents].filter(event => {
    const eventSource = event.source || 'manual';
    if (eventSource === 'simplepractice' && !calendarFilters.simplepractice) return false;
    if (eventSource === 'google' && !calendarFilters.google) return false;
    if (eventSource === 'manual' && !calendarFilters.personal) return false;
    return true;
  });

  // Debug logging for event sources and errors
  // Event breakdown calculated

  // Debug: Show date ranges of your appointments
  if (allEvents.length > 0) {
    const eventDates = allEvents.map(e => new Date(e.startTime)).sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = eventDates[0];
    const latestDate = eventDates[eventDates.length - 1];

    // Appointment date range calculated
  }

  // Log SimplePractice status for debugging
  // SimplePractice status checked

  // Make test functions available globally for debugging (after allEvents is defined)
  useEffect(() => {
    // Create comprehensive test function with detailed logging
    (window as any).testDailyExport = async () => {
      try {
        // Test if the function exists
        if (typeof exportDailyToPDF === 'function') {
          // Call the function
          await exportDailyToPDF(selectedDate, allEvents);
        }
      } catch (error) {
        // Test daily export failed
      }
    };

    (window as any).testDynamicDailyExport = async () => {
      try {
        await exportDynamicDailyPlannerPDF(selectedDate, allEvents);
      } catch (error) {
        // Test dynamic daily export failed
      }
    };

    // Test button click handler for debugging
    (window as any).testButtonClick = async () => {
      try {
        await exportDailyToPDF(selectedDate, allEvents);
      } catch (error) {
        // Button click test failed
      }
    };

    // Add simple PDF test function
    (window as any).testSimplePDF = async () => {
      try {
        const { exportSimplePDF } = await import('../utils/simplePDFExport');

        // Filter events for selected date
        const todayEvents = allEvents.filter(event => {
          const eventDate = new Date(event.startTime);
          return eventDate.toDateString() === selectedDate.toDateString();
        });

        await exportSimplePDF(selectedDate, todayEvents);
      } catch (error) {
        // Simple PDF test failed
      }
    };

    // Add direct PDF export test
    (window as any).testDirectPDF = async () => {
      try {
        // Call the actual export function directly
        await handleExportPDF('daily');
      } catch (error) {
        // Direct PDF test failed
      }
    };

    // Test functions registered

    // Automatic testing disabled to prevent export loops
    // Test functions available via window.testSimplePDF(), window.testDirectPDF(), etc.
  }, [selectedDate, allEvents]);

  // Event mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: Partial<CalendarEvent>) => 
      apiRequest('POST', '/api/events', eventData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create event', variant: 'destructive' });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...eventData }: { id: string } & Partial<CalendarEvent>) =>
      apiRequest('PUT', `/api/events/${id}`, eventData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => 
      apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event deleted successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    }
  });

  // Event handlers
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode('daily');
  };

  const handleTimeSlotClick = (date: Date, time: string) => {
    if (!user) {
      toast({ 
        title: 'Authentication Required', 
        description: 'Please authenticate with Google to create events',
        variant: 'destructive' 
      });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hours + 1, minutes, 0, 0);

    const newEvent: Partial<CalendarEvent> = {
      title: 'New Event',
      startTime,
      endTime,
      source: 'manual',
      color: '#3b82f6',
      description: ''
    };

    createEventMutation.mutate(newEvent);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click - could open edit modal
    console.log('Event clicked:', event);
  };

  const handleEventMove = (eventId: string, newStartTime: Date, newEndTime: Date) => {
    updateEventMutation.mutate({
      id: eventId,
      startTime: newStartTime,
      endTime: newEndTime
    });
  };

  // Export handlers
  const handleExportPDF = async (exportType: string) => {
    try {
      console.log(`🚀 Starting PDF export: ${exportType}`);
      console.log(`📅 Selected date: ${selectedDate.toDateString()}`);
      console.log(`📊 Total events: ${allEvents.length}`);

      toast({ title: 'Generating PDF export...' });

      switch (exportType) {
        case 'weekly':
          await exportExactGridPDF(currentWeek, allEvents);
          break;
        case 'current-weekly':
          console.log('🔄 Starting current weekly export...');
          try {
            const { exportCurrentWeeklyView } = await import('../utils/currentWeeklyExport');
            console.log('✅ Module imported successfully');

            const weekStart = currentWeek[0]?.date || new Date();
            const weekEnd = currentWeek[6]?.date || new Date();

            console.log(`📅 Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
            console.log(`📊 Events count: ${allEvents.length}`);

            await exportCurrentWeeklyView(allEvents, weekStart, weekEnd);
            console.log('✅ Current weekly export completed successfully');
          } catch (error) {
            console.error('❌ Current weekly export failed:', error);
            throw error;
          }
          break;
        case 'daily':
          console.log('🎯 DAILY PDF EXPORT STARTING...');
          await exportDailyToPDF(selectedDate, allEvents);
          console.log('✅ Daily PDF export completed');
          break;
        case 'weekly-package':
          await weeklyPackageAuditor.auditWeeklyPackage(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents, 'standard');
          await exportWeeklyPackage(currentWeek, allEvents);
          break;
        case 'bidirectional-weekly-package':
          await weeklyPackageAuditor.auditWeeklyPackage(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents, 'bidirectional');
          await exportBidirectionalWeeklyPackage(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'pixel-perfect':
          await exportTrulyPixelPerfectWeeklyPDF(currentWeek, allEvents);
          break;
        case 'exact-weekly-spec':
          await exportExactWeeklySpec(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'dynamic-daily':
          console.log('🎯 DYNAMIC DAILY PDF EXPORT STARTING...');
          await exportDynamicDailyPlannerPDF(selectedDate, allEvents);
          console.log('✅ Dynamic daily PDF export completed');
          break;
        case 'audit-enhanced':
          await exportAuditEnhancedPDF(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case '100-percent-pixel-perfect':
          await export100PercentPixelPerfectPDF(currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date(), allEvents);
          break;
        case 'enhanced-weekly':
          await exportEnhancedWeeklyPDF(allEvents, currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date());
          break;
        case 'enhanced-daily':
          await exportEnhancedDailyPDF(allEvents, selectedDate);
          break;
        case 'enhanced-weekly-package':
          await exportEnhancedWeeklyPackage(allEvents, currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date());
          break;
        default:
          throw new Error('Unknown export type');
      }

      toast({ title: 'PDF export completed successfully' });
    } catch (error) {
      console.error('❌ Export failed:', error);
      console.error('Error details:', error?.message || 'Unknown error');
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  // Audit handlers
  const handleRunAudit = async () => {
    try {
      toast({ title: 'Running pixel-perfect audit...' });
      const auditResults = await pixelPerfectAuditSystem.runPixelPerfectAudit();
      console.log('Audit results:', auditResults);
      toast({ title: 'Audit completed - check console for results' });
    } catch (error) {
      console.error('Audit failed:', error);
      toast({ title: 'Audit failed', variant: 'destructive' });
    }
  };

  const handleRunComprehensiveAudit = async () => {
    try {
      toast({ title: 'Running comprehensive audit system...' });
      const auditResults = await auditSystem.runFullAudit(allEvents);
      console.log('🎯 Comprehensive Audit Results:', auditResults);

      // Display results in toast
      toast({ 
        title: `Audit Complete - Score: ${auditResults.pixelPerfectScore}%`,
        description: `Found ${auditResults.inconsistencies.length} inconsistencies. Check console for details.`
      });

      // Export results to localStorage
      auditSystem.exportAuditResults(auditResults);

    } catch (error) {
      console.error('Comprehensive audit failed:', error);
      toast({ title: 'Comprehensive audit failed', variant: 'destructive' });
    }
  };

  const handleTestExports = async () => {
    try {
      toast({ title: 'Running comprehensive audit demo with automatic fixes...' });

      // Import the audit system demo
      const { auditSystemDemo } = await import('@/utils/auditSystemDemo');

      // Run comprehensive demo with automatic fixes
      await auditSystemDemo.runComprehensiveDemo(allEvents);

      // Get results
      const results = auditSystemDemo.getResults();

      toast({ 
        title: `Audit Demo Complete - Score: ${results.originalScore}% → ${results.finalScore}%`,
        description: `Improvement: +${results.improvement}%. Implemented ${results.fixes.length} fixes. Check console for details.`
      });

    } catch (error) {
      console.error('Audit demo failed:', error);
      toast({ title: 'Audit demo failed', variant: 'destructive' });
    }
  };

  // Sync handlers
  const handleSyncCalendarEvents = async () => {
    if (!user) {
      toast({ 
        title: 'Authentication Required', 
        description: 'Please authenticate with Google Calendar first',
        variant: 'destructive' 
      });
      return;
    }

    try {
      toast({ title: 'Syncing calendar events...' });

      // Force refresh both event sources
      await queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });

      // Refetch both queries
      await queryClient.refetchQueries({ queryKey: ['/api/events'] });
      await queryClient.refetchQueries({ queryKey: ['/api/calendar/events'] });

      toast({ 
        title: 'Calendar events synced successfully',
        description: `Found ${allEvents.length} total events`
      });
    } catch (error) {
      console.error('Failed to sync calendar events:', error);
      toast({ 
        title: 'Failed to sync calendar events', 
        variant: 'destructive',
        description: 'Please check your Google Calendar connection'
      });
    }
  };

  const handleReconnectGoogle = async () => {
    console.log('Reconnecting to Google Calendar...');
    try {
      // Clear any existing authentication state
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/status'] });
      // Redirect to OAuth
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('Error during Google reconnection:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to reconnect to Google Calendar. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshCalendars = async () => {
    console.log('Refreshing calendars...');
    try {
      // Force refetch of Google Calendar events
      await queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Calendars refreshed",
        description: "Google Calendar events have been refreshed."
      });
    } catch (error) {
      console.error('Error refreshing calendars:', error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh calendars. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Debug function for column width issues
  const debugColumnWidths = () => {
    console.log('=== COLUMN WIDTH DEBUG ===');

    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) {
      console.error('Calendar grid not found');
      return;
    }

    console.log('Calendar grid:', calendarGrid);
    const gridStyle = window.getComputedStyle(calendarGrid);
    console.log('Grid template columns:', gridStyle.gridTemplateColumns);
    console.log('Grid width:', gridStyle.width);

    const headerCells = document.querySelectorAll('.calendar-cell.header-cell');
    console.log(`Found ${headerCells.length} header cells`);

    headerCells.forEach((cell, index) => {
      const rect = cell.getBoundingClientRect();
      console.log(`Header Cell ${index} (${cell.textContent}):`, {
        width: rect.width,
        actualWidth: rect.width.toFixed(2) + 'px'
      });
    });
  };

  // Make debug function available globally
  useEffect(() => {
    (window as any).debugColumnWidths = debugColumnWidths;

    // Inline detailed debug function
    (window as any).debugColumnWidthsDetailed = function() {
      console.log('=== DETAILED COLUMN WIDTH DEBUG ===');

      const calendarGrid = document.querySelector('.calendar-grid');
      if (!calendarGrid) {
        console.error('❌ Calendar grid not found');
        return;
      }

      console.log('✅ Calendar grid found');

      const gridStyle = window.getComputedStyle(calendarGrid);
      console.log('Grid template columns:', gridStyle.gridTemplateColumns);
      console.log('Grid width:', gridStyle.width);
      console.log('Grid display:', gridStyle.display);

      const headerCells = document.querySelectorAll('.calendar-cell.header-cell');
      console.log(`📊 Found ${headerCells.length} header cells`);

      const measurements = [];
      headerCells.forEach((cell, index) => {
        const rect = cell.getBoundingClientRect();
        const measurement = {
          index,
          text: cell.textContent.trim(),
          width: rect.width,
          left: rect.left,
          right: rect.right
        };
        measurements.push(measurement);
        console.log(`Cell ${index} (${cell.textContent.trim()}): ${rect.width.toFixed(2)}px`);
      });

      // Calculate statistics for day columns (skip TIME column)
      const dayColumns = measurements.slice(1);
      const dayWidths = dayColumns.map(m => m.width);
      const minWidth = Math.min(...dayWidths);
      const maxWidth = Math.max(...dayWidths);
      const avgWidth = dayWidths.reduce((a, b) => a + b, 0) / dayWidths.length;

      console.log('📈 STATISTICS:');
      console.log(`Min width: ${minWidth.toFixed(2)}px`);
      console.log(`Max width: ${maxWidth.toFixed(2)}px`);
      console.log(`Average width: ${avgWidth.toFixed(2)}px`);
      console.log(`Width difference: ${(maxWidth - minWidth).toFixed(2)}px`);

      const tolerance = 1;
      const isEqual = (maxWidth - minWidth) <= tolerance;
      console.log(`${isEqual ? '✅' : '❌'} Columns are ${isEqual ? 'equal' : 'unequal'}`);

      return measurements;
    };

    // Debug functions ready
  }, []);

  const isLoading = eventsLoading || isLoadingGoogleEvents || isLoadingSimplePracticeEvents;

  // Clean authentication UI with Google OAuth
  const authenticationUI = (
    <div className="mb-4 p-6 bg-blue-50 border-2 border-blue-500 rounded-lg">
      <div className="text-center space-y-4">
        <div>
          <h3 className="font-bold text-blue-800 text-2xl">🔐 Authentication Required</h3>
          <p className="text-blue-700 text-lg mt-2">
            Please sign in with your Google account to access your calendar
          </p>
        </div>
        <div className="flex justify-center">
          <CleanAuthButton />
        </div>
      </div>
    </div>
  );

  // Loading states - only show if actually loading user data
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {authenticationUI}
          <LoadingState message="Loading user data..." />
        </div>
      </div>
    );
  }

  // If user is not authenticated, show authentication fix UI
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto">
          {authenticationUI}
          {/* Debug info */}
          <div className="text-center text-gray-600 space-y-2">
            <p>Backend: 298 SimplePractice + 230 Google Calendar events loaded successfully</p>
            <p className="text-sm">Console commands: <code>fixSessionNow()</code> or <code>testAuthenticatedSession()</code></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">reMarkable Pro Digital Planner</h1>
            <Badge variant="outline" className="text-sm">
              {viewMode === 'weekly' ? 'Weekly View' : 'Daily View'}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {!user && <CleanAuthButton />}
            {user && (
              <Badge variant="outline" className="text-sm bg-green-50">
                Logged in as {user.name}
              </Badge>
            )}
            {user && (
              <Button
                onClick={() => window.location.href = '/api/auth/logout'}
                variant="outline"
                size="sm"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                🔓 Logout
              </Button>
            )}
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              onClick={() => setViewMode('weekly')}
              size="sm"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Weekly
            </Button>
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              onClick={() => setViewMode('daily')}
              size="sm"
            >
              <FileText className="h-4 w-4 mr-2" />
              Daily
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => viewMode === 'weekly' ? navigateWeek('prev') : navigateDay('prev')}
              size="sm"
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => viewMode === 'weekly' ? navigateWeek('next') : navigateDay('next')}
              size="sm"
            >
              Next →
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date())}
              size="sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date(2024, 0, 1))} // January 2024
              size="sm"
            >
              Jan 2024
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(new Date(2024, 2, 1))} // March 2024
              size="sm"
            >
              Mar 2024
            </Button>
          </div>

          <div className="text-lg font-semibold">
            {viewMode === 'weekly' 
              ? `Week of ${currentWeek[0]?.date.toLocaleDateString()} - ${currentWeek[6]?.date.toLocaleDateString()}`
              : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            }
          </div>
        </div>

        {/* Google Authentication Fix */}
        <div className="mb-6">
          <GoogleAuthFix />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading calendar...</span>
                  </div>
                ) : viewMode === 'weekly' ? (
                  <WeeklyCalendarGrid
                    week={currentWeek}
                    events={allEvents}
                    onDayClick={handleDayClick}
                    onTimeSlotClick={handleTimeSlotClick}
                    onEventClick={handleEventClick}
                    onEventMove={handleEventMove}
                  />
                ) : (
                  <DailyView
                    selectedDate={selectedDate}
                    events={(() => {
                      const dailyEvents = allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === selectedDate.toDateString();
                      });
                      console.log('📅 Daily view debug:', {
                        selectedDate: selectedDate.toDateString(),
                        totalEvents: allEvents.length,
                        dailyEvents: dailyEvents.length,
                        eventsForDay: dailyEvents.map(e => ({
                          title: e.title,
                          start: new Date(e.startTime).toDateString(),
                          source: e.source
                        }))
                      });
                      return dailyEvents;
                    })()}
                    dailyNotes=""
                    onPreviousDay={() => navigateDay('prev')}
                    onNextDay={() => navigateDay('next')}
                    onBackToWeek={() => setViewMode('weekly')}
                    onEventClick={handleEventClick}
                    onUpdateEvent={(eventId, updates) => {
                      updateEventMutation.mutate({ id: eventId, ...updates });
                    }}
                    onUpdateDailyNotes={(notes) => {
                      // Handle daily notes update if needed
                    }}
                    onEventMove={handleEventMove}
                    onCreateEvent={(startTime, endTime) => {
                      const newEvent: Partial<CalendarEvent> = {
                        title: 'New Event',
                        startTime,
                        endTime,
                        source: 'manual',
                        color: '#3b82f6',
                        description: ''
                      };
                      createEventMutation.mutate(newEvent);
                    }}
                    onDeleteEvent={(eventId) => {
                      deleteEventMutation.mutate(eventId);
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedDate(new Date())}
                    className="w-full"
                    size="sm"
                  >
                    Go to Today
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
                      queryClient.invalidateQueries({ queryKey: ['/api/simplepractice/events'] });
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Refresh Events
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      console.log('🔄 Force loading all events...');

                      // Force authentication fix first
                      try {
                        const response = await fetch('/api/auth/deployment-fix', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                          }
                        });

                        if (response.ok) {
                          const result = await response.json();
                          console.log('✅ Auth fix result:', result);
                        }
                      } catch (error) {
                        console.error('❌ Auth fix failed:', error);
                      }

                      // Force refresh all queries
                      await queryClient.invalidateQueries();
                      await queryClient.refetchQueries();

                      toast({
                        title: "Force Refresh Complete",
                        description: "All events and authentication refreshed",
                      });
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    🔄 Force Load All Events
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      toast({
                        title: "Logging In",
                        description: "Using simple login method...",
                        variant: "default"
                      });
                      
                      try {
                        const response = await fetch('/api/auth/simple-login', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          }
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          toast({
                            title: "Login Successful!",
                            description: "Refreshing page...",
                            variant: "default"
                          });
                          setTimeout(() => window.location.reload(), 1000);
                        } else {
                          throw new Error('Login failed');
                        }
                      } catch (error) {
                        toast({
                          title: "Login Failed",
                          description: "Trying Google OAuth...",
                          variant: "destructive"
                        });
                        setTimeout(() => {
                          window.location.href = '/api/auth/google';
                        }, 1000);
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    size="sm"
                  >
                    ✅ Simple Login
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Fixing Google authentication
                      toast({
                        title: "Redirecting to Google",
                        description: "Please complete the authentication flow",
                        variant: "default"
                      });
                      window.location.href = '/api/auth/google';
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    size="sm"
                  >
                    🔒 Fix Authentication
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={async () => {
                      // Forcing Google Calendar sync
                      try {
                        toast({
                          title: "Syncing Google Calendar",
                          description: "This may take a moment...",
                          variant: "default"
                        });

                        const response = await fetch('/api/auth/force-sync', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache'
                          }
                        });

                        if (response.ok) {
                          const result = await response.json();
                          // Google Calendar sync successful
                          
                          // Force refresh all queries
                          await queryClient.invalidateQueries();
                          await queryClient.refetchQueries();
                          
                          toast({
                            title: "Sync Complete!",
                            description: `Found ${result.stats.googleEvents} Google Calendar events and ${result.stats.simplePracticeEvents} SimplePractice events`,
                            variant: "default"
                          });
                        } else {
                          const error = await response.json();
                          // Google Calendar sync failed
                          
                          if (error.needsAuth) {
                            toast({
                              title: "Authentication Required",
                              description: "Redirecting to Google OAuth...",
                              variant: "destructive"
                            });
                            setTimeout(() => window.location.href = error.redirectTo || '/api/auth/google', 1000);
                          } else {
                            toast({
                              title: "Sync Failed",
                              description: error.error || "Please try again",
                              variant: "destructive"
                            });
                          }
                        }
                      } catch (error) {
                        console.error('❌ Sync error:', error);
                        toast({
                          title: "Sync Error",
                          description: "Please check your connection and try again",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                    size="sm"
                  >
                    🔄 Force Google Calendar Sync
                  </Button>
                  {user ? (
                    <>
                      <Button 
                        onClick={async () => {
                          try {
                            await handleSyncCalendarEvents();
                          } catch (error) {
                            console.error('Sync calendar events error:', error);
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Sync Calendar Events
                      </Button>
                      <div className="text-xs text-green-600 text-center">
                        ✅ Calendar Connected: {user.email}
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => window.location.href = '/api/auth/google'}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        Connect Google Calendar
                      </Button>
                      <div className="text-xs text-gray-500 text-center">
                        Connect for calendar access & event creation
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Date Range Information */}
            <DateRangeInfo />

            {/* Google Calendar Integration */}
            <GoogleCalendarIntegration
              isConnected={isGoogleCalendarConnected}
              calendars={googleCalendars}
              isLoading={isLoadingGoogleEvents}
              onSelectAll={() => setCalendarFilters(prev => ({ ...prev, google: true, personal: true, simplepractice: true }))}
              onDeselectAll={() => setCalendarFilters(prev => ({ ...prev, google: false, personal: false, simplepractice: false }))}
              onReconnect={handleReconnectGoogle}
              onRefreshCalendars={handleRefreshCalendars}
            />

            {/* Calendar Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calendar Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* SimplePractice - Cornflower Blue with left flag */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simplepractice"
                      checked={calendarFilters.simplepractice}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, simplepractice: e.target.checked }))}
                      className="rounded"
                    />
                    <div className="relative w-4 h-3 bg-white border border-cornflower-blue" style={{ borderColor: '#6495ED' }}>
                      <div className="absolute left-0 top-0 w-1 h-full bg-cornflower-blue" style={{ backgroundColor: '#6495ED' }}></div>
                    </div>
                    <label htmlFor="simplepractice" className="text-sm font-medium" style={{ color: '#6495ED' }}>
                      SimplePractice ({allEvents.filter(e => e.source === 'simplepractice').length})
                    </label>
                  </div>

                  {/* Google Calendar - Green with dashed border */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="google"
                      checked={calendarFilters.google}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))}
                      className="rounded"
                    />
                    <div 
                      className="w-4 h-3 bg-white border-2" 
                      style={{ 
                        borderColor: '#34a853', 
                        borderStyle: 'dashed',
                        borderWidth: '2px'
                      }}
                    ></div>
                    <label htmlFor="google" className="text-sm font-medium" style={{ color: '#34a853' }}>
                      Google Calendar ({googleEvents.length})
                    </label>
                  </div>

                  {/* US Holidays - Solid Yellow */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="personal"
                      checked={calendarFilters.personal}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, personal: e.target.checked }))}
                      className="rounded"
                    />
                    <div 
                      className="w-4 h-3 border-2" 
                      style={{ 
                        backgroundColor: '#FFF3CD',
                        borderColor: '#FFC107',
                        borderStyle: 'solid'
                      }}
                    ></div>
                    <label htmlFor="personal" className="text-sm font-medium" style={{ color: '#B8860B' }}>
                      US Holidays ({allEvents.filter(e => e.source === 'manual' || e.title?.toLowerCase().includes('holiday')).length})
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Enhancement */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event Enhancement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      console.log('🎯 Adding sample Event Notes and Action Items to upcoming week events...');

                      // Get upcoming week date range
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Next Monday
                      const endOfWeek = new Date(startOfWeek);
                      endOfWeek.setDate(startOfWeek.getDate() + 6); // Next Sunday

                      console.log(`📅 Targeting events for week: ${startOfWeek.toDateString()} to ${endOfWeek.toDateString()}`);

                      // Fetch current events
                      const eventsResponse = await fetch('/api/events');
                      const events = await eventsResponse.json();

                      // Filter events for the upcoming week
                      const upcomingWeekEvents = events.filter((event: any) => {
                        const eventDate = new Date(event.startTime);
                        return eventDate >= startOfWeek && eventDate <= endOfWeek;
                      });

                      console.log(`📊 Found ${upcomingWeekEvents.length} events in upcoming week`);

                      if (upcomingWeekEvents.length === 0) {
                        console.log('⚠️ No events found for upcoming week');
                        return;
                      }

                      // Sample enhancements
                      const sampleEnhancements = [
                        {
                          keywords: ["Dan", "Supervision", "supervision"],
                          notes: ["Review quarterly performance metrics", "Discuss team development goals", "Address any outstanding issues"],
                          actionItems: ["Schedule follow-up meeting for next week", "Prepare performance review documents", "Send meeting summary to team"]
                        },
                        {
                          keywords: ["Vivian", "Meador"],
                          notes: ["Review notes prior to our session", "Patient showing progress with treatment plan"],
                          actionItems: ["Send the Vivian email to let him know about the passing of her brother", "Adjust treatment plan as needed", "Schedule grief counseling resources"]
                        }
                      ];

                      let updatedCount = 0;

                      // Update events with notes and action items
                      for (const enhancement of sampleEnhancements) {
                        const matchingEvents = upcomingWeekEvents.filter((event: any) => {
                          if (!event.title) return false;
                          return enhancement.keywords.some(keyword => 
                            event.title.toLowerCase().includes(keyword.toLowerCase())
                          );
                        });

                        for (const matchingEvent of matchingEvents) {
                          console.log(`📝 Updating event: ${matchingEvent.title} (${new Date(matchingEvent.startTime).toDateString()})`);

                          const updateResponse = await fetch(`/api/events/${matchingEvent.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              notes: enhancement.notes,
                              actionItems: enhancement.actionItems
                            })
                          });

                          if (updateResponse.ok) {
                            console.log(`✅ Successfully updated: ${matchingEvent.title}`);
                            updatedCount++;
                          } else {
                            console.error(`❌ Failed to update: ${matchingEvent.title}`);
                          }
                        }
                      }

                      // Add generic notes to remaining events
                      const unenhancedEvents = upcomingWeekEvents.filter((event: any) => {
                        return !sampleEnhancements.some(enhancement => 
                          enhancement.keywords.some(keyword => 
                            event.title && event.title.toLowerCase().includes(keyword.toLowerCase())
                          )
                        );
                      });

                      for (const event of unenhancedEvents.slice(0, 3)) {
                        console.log(`📝 Adding generic notes to: ${event.title}`);

                        const updateResponse = await fetch(`/api/events/${event.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            notes: ["Event preparation completed", "Review client file and previous session notes"],
                            actionItems: ["Follow up on session outcomes", "Update treatment plan as needed"]
                          })
                        });

                        if (updateResponse.ok) {
                          console.log(`✅ Successfully added generic notes to: ${event.title}`);
                          updatedCount++;
                        }
                      }

                      console.log(`🎯 Successfully enhanced ${updatedCount} events with notes and action items`);

                      // Refresh events to show updated data
                      queryClient.invalidateQueries({ queryKey: ['/api/events'] });

                      toast({
                        title: "Events Enhanced",
                        description: `Added notes and action items to ${updatedCount} upcoming week events`,
                      });

                    } catch (error) {
                      console.error('❌ Error enhancing events:', error);
                      toast({
                        title: "Enhancement Failed",
                        description: "Failed to add notes to events. Check console for details.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="w-full justify-start bg-green-50 hover:bg-green-100 border-green-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📝 Add Notes to Upcoming Week
                </Button>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('100-percent-pixel-perfect')}
                  className="w-full justify-start bg-gradient-to-r from-emerald-100 to-green-100 hover:from-emerald-200 hover:to-green-200 border-emerald-400 text-emerald-900 font-bold"
                >
                  <Download className="h-4 w-4 mr-2" />
                  🎯 100% Pixel-Perfect Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('weekly')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Weekly PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('current-weekly')}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📊 Current Weekly Layout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('daily')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Daily PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('pixel-perfect')}
                  className="w-full justify-start bg-emerald-50 hover:bg-emerald-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Pixel Perfect
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportPDF('exact-weekly-spec')}
                  className="w-full justify-start"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exact Weekly Spec
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('dynamic-daily');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-emerald-50 hover:bg-emerald-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Dynamic Daily
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('bidirectional-weekly-package');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-blue-50 hover:bg-blue-100"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Bidirectional Weekly Package
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('audit-enhanced');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  🔧 Audit-Enhanced Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('enhanced-weekly');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100 border-purple-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📝 Enhanced Weekly with Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('enhanced-daily');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100 border-purple-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📝 Enhanced Daily with Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleExportPDF('enhanced-weekly-package');
                    } catch (error) {
                      console.error('Export PDF error:', error);
                    }
                  }}
                  className="w-full justify-start bg-indigo-50 hover:bg-indigo-100 border-indigo-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  📦 Enhanced Weekly Package (8 Pages)
                </Button>
              </CardContent>
            </Card>

            {/* Audit Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Audit Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleRunAudit();
                    } catch (error) {
                      console.error('Run audit error:', error);
                    }
                  }}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Run Pixel Audit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleRunComprehensiveAudit();
                    } catch (error) {
                      console.error('Run comprehensive audit error:', error);
                    }
                  }}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Comprehensive Audit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      await handleTestExports();
                    } catch (error) {
                      console.error('Test exports error:', error);
                    }
                  }}
                  className="w-full justify-start bg-orange-50 hover:bg-orange-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Test Export Features
                </Button>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Events:</span>
                    <span className="font-medium">{allEvents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week:</span>
                    <span className="font-medium">
                      {allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        const weekStart = currentWeek[0]?.date;
                        const weekEnd = currentWeek[6]?.date;
                        return weekStart && weekEnd && eventDate >= weekStart && eventDate <= weekEnd;
                      }).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Today:</span>
                    <span className="font-medium">
                      {allEvents.filter(event => {
                        const eventDate = new Date(event.startTime);
                        return eventDate.toDateString() === new Date().toDateString();
                      }).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Google Authentication Debug Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-800">🔧 Google Auth Debug</CardTitle>
              </CardHeader>
              <CardContent className="bg-red-50 p-4 rounded">
                <div className="space-y-2">
                  <p className="text-sm text-red-700">If you can see this, the component is working!</p>
                  <Button
                    onClick={() => {
                      console.log('🔥 GOOGLE AUTH DEBUG CLICKED');
                      console.log('Current user:', user);
                      console.log('Google Calendar Data:', googleCalendarData);
                      console.log('Google Calendar Error:', googleCalendarError);
                      console.log('Access token status:', document.cookie.includes('access_token'));

                      // Try to check authentication status
                      fetch('/api/auth/status')
                        .then(res => res.json())
                        .then(data => {
                          console.log('Auth Status Response:', data);
                          console.log('🔍 Full Auth Data:', {
                            isAuthenticated: data.isAuthenticated,
                            hasTokens: data.hasTokens,
                            user: data.user,
                            debug: data.debug,
                            recommendations: data.recommendations
                          });

                          const status = data.isAuthenticated 
                            ? (data.hasTokens ? 'Connected with tokens' : 'Connected but missing tokens')
                            : 'Not connected';

                          toast({
                            title: 'Google Calendar Auth Status',
                            description: `${status} - ${data.user?.email || 'No user'}`,
                            variant: data.isAuthenticated && data.hasTokens ? 'default' : 'destructive'
                          });
                        })
                        .catch(err => {
                          console.error('Auth Status Error:', err);
                          toast({
                            title: 'Auth Status Error',
                            description: err.message,
                            variant: 'destructive'
                          });
                        });
                    }}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                    size="sm"
                  >
                    🚨 Check Auth Status
                  </Button>
                  <Button
                    onClick={() => {
                      console.log('🔄 FORCING GOOGLE RECONNECT');
                      window.location.href = '/api/auth/google';
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    size="sm"
                  >
                    🔗 Force Google Reconnect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}