import React, { useState, useEffect, useMemo } from 'react';
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
import { exportExactWeeklyPackage } from '@/utils/exactWeeklyPackageExport';
import { exportLinkedWeeklyPackage } from '@/utils/bidirectionalWeeklyPackageLinked';


import { export100PercentPixelPerfectPDF } from '@/utils/pixelPerfectPDFExport';
import { exportEnhancedWeeklyPDF } from '@/utils/enhancedWeeklyPDFExport';
import { exportEnhancedDailyPDF } from '@/utils/enhancedDailyPDFExport';
import { exportEnhancedWeeklyPackage } from '@/utils/enhancedWeeklyPackageExport';
import { exportHtmlTemplateDailyPDF } from '@/utils/htmlTemplateDailyExport';
import { exportHTMLTemplatePerfect } from '@/utils/htmlTemplatePerfectExport';
import { exportPerfectDailyCalendarPDF } from '@/utils/perfectDailyCalendarPDF';
import { exportIsolatedCalendarPDF } from '@/utils/isolatedCalendarPDF';
import { runIsolatedCalendarAudit } from '@/utils/isolatedCalendarAudit';
import { exportBrowserReplicaPDF } from '@/utils/browserReplicaPDF';
import { SimpleOAuth } from '@/components/auth/SimpleOAuth';
import { AuthMonitor } from '@/components/auth/AuthMonitor';
import { dailyPDFAudit } from '@/utils/dailyPDFAudit';
import { NewOAuthTest } from '@/components/auth/NewOAuthTest';
import { DateRangeInfo } from '@/components/DateRangeInfo';
import { runAuthenticationFix } from '@/utils/authenticationFix';
import { runSimpleAuthFix, testAuthenticationStatus, forceCalendarSync } from '@/utils/simpleAuthFix';
import { AppointmentStatusView, AppointmentStats } from '@/components/calendar/AppointmentStatusView';
import { AppointmentStatusModal } from '@/components/calendar/AppointmentStatusModal';

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

      // Show user-friendly error message
      toast({
        title: 'Application Error',
        description: 'An unexpected error occurred. Please try refreshing the page.',
        variant: 'destructive'
      });
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

    // Removed problematic enhancement script loader that was causing fetch errors

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
  // Unified events loading - combines all sources from database
  const { data: allEvents = [], isLoading: eventsLoading, error: eventsError, refetch: refetchEvents } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      try {
        console.log('🔄 Fetching events from /api/events...');
        const response = await fetch('/api/events', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        console.log(`📡 Events API response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          console.log(`⚠️ Events API response status: ${response.status} ${response.statusText}`);
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
        console.log('📦 Raw API response data:', data);

        if (Array.isArray(data)) {
          console.log('📊 Loaded events from unified API:', {
            total: data.length,
            google: data.filter(e => e.source === 'google').length,
            simplepractice: data.filter(e => e.source === 'simplepractice').length,
            manual: data.filter(e => e.source === 'manual').length
          });
          return data;
        } else {
          console.log('⚠️ Events API returned non-array, using fallback. Data type:', typeof data);
          return [];
        }
      } catch (error) {
        console.error('❌ Events fetch completely failed:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        // Return empty array instead of throwing to prevent UI crashes
        return [];
      }
    },
    enabled: true, // Always try to fetch events
    staleTime: 0, // No cache - always fetch fresh data
    refetchInterval: false, // Disable auto-refetch for now
    retry: 1, // Reduce retries to prevent excessive console noise
    retryDelay: 1000, // Faster retry
    refetchOnWindowFocus: false, // Disable refetch on focus for debugging
  });

  // Auto-fix authentication issues
  React.useEffect(() => {
    if (eventsError && eventsError.message?.includes('authentication')) {
      console.log('🔧 Detected authentication error, attempting auto-fix...');
      runAuthenticationFix().then(result => {
        if (result.success) {
          console.log('✅ Authentication fixed, refetching data...');
          queryClient.invalidateQueries({ queryKey: ['/api/events'] });
        } else if (result.requiresAction) {
          console.log('⚠️ Manual authentication required:', result.message);
        }
      });
    }
  }, [eventsError, queryClient]);

  // Unified sync mutation for calendar events
  const syncCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sync/calendar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to sync calendar events');
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log('✅ Calendar sync successful:', data);
      // Refetch events after successful sync
      refetchEvents();
    },
    onError: (error) => {
      console.error('❌ Calendar sync failed:', error);
    }
  });

  // Filter events based on calendar filters
  const filteredEvents = allEvents.filter(event => {
    const eventSource = event.source || 'manual';
    if (eventSource === 'simplepractice' && !calendarFilters.simplepractice) return false;
    if (eventSource === 'google' && !calendarFilters.google) return false;
    if (eventSource === 'manual' && !calendarFilters.personal) return false;
    return true;
  });

  // Debug event breakdown
  const simplePracticeFromLive = allEvents.filter(e => e.source === 'simplepractice').length;
  const googleFromLive = allEvents.filter(e => e.source === 'google').length;
  const manualFromDB = allEvents.filter(e => e.source === 'manual').length;

  console.log('📊 Event breakdown (Live Sync + DB):', {
    total: allEvents.length,
    manual: manualFromDB,
    google: googleFromLive,
    simplepractice: simplePracticeFromLive,
    sources: {
      'from_live_sync': googleFromLive + simplePracticeFromLive,
      'from_database': manualFromDB,
      'simplepractice_live': simplePracticeFromLive
    }
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event created successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to create event', variant: 'destructive' });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, ...eventData }: { id: string } & Partial<CalendarEvent>) =>
      apiRequest('PUT', `/api/events/${id}`, eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({ title: 'Event updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update event', variant: 'destructive' });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => 
      apiRequest('DELETE', `/api/events/${eventId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
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

  // New pixel-perfect PDF export handler
  const handleNewPixelPerfectExport = async () => {
    try {
      console.log('🎯 NEW PIXEL-PERFECT DAILY PDF EXPORT STARTING...');
      console.log('📅 Selected date:', selectedDate.toDateString());
      console.log('📊 Total events:', allEvents.length);

      const { generatePDFFromComponent } = await import('../components/PDFGeneratorService.tsx');
      const DailySchedulePDFExport = (await import('../components/DailySchedulePDFExport')).default;

      // Filter events for the selected date
      const dailyEvents = allEvents.filter(event => {
        const eventDate = new Date(event.startTime);
        const targetDate = new Date(selectedDate);
        const matches = eventDate.toDateString() === targetDate.toDateString();
        if (matches) {
          console.log(`✓ Event included: ${event.title} at ${eventDate.toTimeString()}`);
        }
        return matches;
      });

      console.log(`📊 Found ${dailyEvents.length} events for ${selectedDate.toDateString()}`);

      // Transform the events to match the expected format for the PDF component
      const transformedAppointments = dailyEvents.map(event => {
        const startTime = new Date(event.startTime);
        const endTime = new Date(event.endTime);

        // Format time as HH:MM for the component
        const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
        const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

        const durationMs = endTime.getTime() - startTime.getTime();
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Duration in hours

        // Clean up the client name by removing common suffixes
        let clientName = event.title;
        clientName = clientName.replace(/ Appointment$/i, '');
        clientName = clientName.replace(/^🔒 /, ''); // Remove lock emoji if present

        console.log(`  → ${clientName}: ${startTimeStr} - ${endTimeStr} (${durationHours}h)`);

        return {
          id: event.id,
          title: event.title,
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: (event.status as 'confirmed' | 'clinician_canceled' | 'client_canceled') || 'confirmed',
          clientName: clientName,
          duration: durationHours,
          source: event.source || 'manual'
        };
      });

      // Calculate schedule metrics
      const totalAppointments = transformedAppointments.length;
      const scheduledHours = transformedAppointments.reduce((sum, apt) => sum + apt.duration, 0);
      const workdayHours = 10; // 8 AM to 6 PM
      const availableHours = Math.max(0, workdayHours - scheduledHours);
      const freeTimePercentage = Math.round((availableHours / workdayHours) * 100);

      const scheduleData = {
        date: selectedDate.toISOString().split('T')[0],
        appointments: transformedAppointments,
        totalAppointments,
        scheduledHours,
        availableHours,
        freeTimePercentage
      };

      console.log('📊 Final schedule data for PDF:', {
        date: scheduleData.date,
        totalAppointments: scheduleData.totalAppointments,
        scheduledHours: scheduleData.scheduledHours,
        availableHours: scheduleData.availableHours,
        freeTimePercentage: scheduleData.freeTimePercentage,
        appointmentCount: scheduleData.appointments.length
      });

      // Create temporary container for PDF generation
      const container = document.createElement('div');
      container.id = 'pdf-export-temp';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1200px';
      container.style.height = '1600px';
      container.style.backgroundColor = '#ffffff';
      container.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      document.body.appendChild(container);

      console.log('📄 Created temporary container for PDF rendering');

      // Use React to render the component
      const React = await import('react');
      const ReactDOM = await import('react-dom/client');

      const root = ReactDOM.createRoot(container);

      console.log('⚛️ Rendering React component...');

      await new Promise<void>((resolve) => {
        root.render(
          React.createElement(DailySchedulePDFExport, { data: scheduleData })
        );

        // Wait longer for rendering to complete
        setTimeout(() => {
          console.log('✅ React component rendered successfully');
          resolve();
        }, 3000);
      });

      console.log('📸 Generating PDF from rendered component...');

      // Generate PDF with a descriptive filename
      const dateStr = selectedDate.toISOString().split('T')[0];
      const filename = `daily-schedule-${dateStr}.pdf`;

      await generatePDFFromComponent('pdf-export-temp', filename);

      console.log(`💾 PDF saved as: ${filename}`);

      // Cleanup
      try {
        root.unmount();
      } catch (e) {
        console.warn('Could not unmount React root:', e);
      }

      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }

      console.log('🧹 Cleanup completed');
      console.log('✅ New pixel-perfect PDF export completed successfully');

    } catch (error) {
      console.error('❌ New pixel-perfect export failed:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Audit handler
  const handleRunAudit = async () => {
    if (!allEvents.length) {
      toast({
        title: "No events",
        description: "No events available to audit",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🔍 Running isolated calendar audit...');
      await runIsolatedCalendarAudit(selectedDate, allEvents);
      toast({
        title: "Audit Completed",
        description: "Check console for detailed audit report",
        variant: "default"
      });
    } catch (error) {
      console.error('❌ Audit failed:', error);
      toast({
        title: "Audit Failed",
        description: "Failed to run audit. Check console for details.",
        variant: "destructive"
      });
    }
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

        case 'custom-weekly':
          console.log('🎯 CUSTOM WEEKLY EXPORT STARTING...');
          try {
            const { exportCustomWeeklyCalendar } = await import('../utils/customWeeklyExport');
            const weekStart = currentWeek[0]?.date || new Date();
            const weekEnd = currentWeek[6]?.date || new Date();
            await exportCustomWeeklyCalendar(weekStart, weekEnd, allEvents);
            console.log('✅ Custom weekly export completed');
          } catch (error) {
            console.error('❌ Custom weekly export failed:', error);
            throw error;
          }
          break;

        case 'exact-weekly-package':
          console.log('🎯 EXACT WEEKLY PACKAGE EXPORT STARTING...');
          try {
            const weekStart = currentWeek[0]?.date || new Date();
            const weekEnd = currentWeek[6]?.date || new Date();
            console.log(`📅 Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
            console.log(`📊 Events count: ${allEvents.length}`);
            await exportExactWeeklyPackage(weekStart, weekEnd, allEvents);
            console.log('✅ Exact weekly package export completed');
          } catch (error) {
            console.error('❌ Exact weekly package export failed:', error);
            throw error;
          }
          break;

        case 'bidirectional-weekly-package':
          console.log('🔗 BIDIRECTIONAL WEEKLY PACKAGE EXPORT STARTING...');
          try {
            const weekStart = currentWeek[0]?.date || new Date();
            const weekEnd = currentWeek[6]?.date || new Date();
            console.log(`📅 Week range: ${weekStart.toDateString()} to ${weekEnd.toDateString()}`);
            console.log(`📊 Events count: ${allEvents.length}`);
            await exportLinkedWeeklyPackage(weekStart, weekEnd, allEvents);
            console.log('✅ Bidirectional weekly package export completed');
          } catch (error) {
            console.error('❌ Bidirectional weekly package export failed:', error);
            throw error;
          }
          break;

        case 'dynamic-daily':
          console.log('🎯 DYNAMIC DAILY PDF EXPORT STARTING...');
          // Always use today's date for daily export, not the selected date
          const todayDynamic = new Date();
          await exportDynamicDailyPlannerPDF(todayDynamic, allEvents);
          console.log('✅ Dynamic daily PDF export completed');
          break;

        case 'perfect-daily':
          console.log('🎯 PERFECT DAILY CALENDAR PDF EXPORT STARTING...');
          console.log('📅 Selected date:', selectedDate.toDateString());
          console.log('📊 Available events:', allEvents.length);

          await exportPerfectDailyCalendarPDF({
            selectedDate,
            events: allEvents,
            showStats: true
          });
          console.log('✅ Perfect daily calendar PDF export completed');
          break;

        case 'isolated-calendar':
          console.log('🎯 ISOLATED CALENDAR PDF EXPORT STARTING...');
          console.log('📅 Selected date:', selectedDate.toDateString());
          console.log('📊 Available events:', allEvents.length);

          await exportIsolatedCalendarPDF({
            selectedDate,
            events: allEvents,
            showStats: true
          });
          console.log('✅ Isolated calendar PDF export completed');
          break;

        case 'browser-replica':
          console.log('🎯 BROWSER REPLICA PDF EXPORT STARTING...');
          console.log('📅 Using selected date:', selectedDate.toDateString());
          console.log('📊 Available events:', allEvents.length);

          await exportBrowserReplicaPDF(allEvents, selectedDate);
          console.log('✅ Browser replica PDF export completed');
          break;

        case 'enhanced-weekly':
          await exportEnhancedWeeklyPDF(allEvents, currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date());
          break;

        case 'html-template-daily':
          console.log('🎯 DAILY TEMPLATE PDF EXPORT STARTING...');
          await exportHtmlTemplateDailyPDF(selectedDate, allEvents);
          console.log('✅ Daily template PDF export completed');
          break;

        case 'html-template-perfect':
          console.log('🎯 HTML TEMPLATE PERFECT PDF EXPORT STARTING...');
          const { exportHTMLTemplatePerfectFixed } = await import('../utils/htmlTemplatePerfectFixed');
          await exportHTMLTemplatePerfectFixed(selectedDate, allEvents, 'usLetter');
          console.log('✅ HTML template perfect PDF export completed');
          break;

        case 'html-template-perfect-remarkable':
          console.log('🎯 HTML TEMPLATE PERFECT REMARKABLE PDF EXPORT STARTING...');
          const { exportHTMLTemplatePerfectFixed: exportRemarkable } = await import('../utils/htmlTemplatePerfectFixed');
          await exportRemarkable(selectedDate, allEvents, 'remarkable');
          console.log('✅ HTML template perfect remarkable PDF export completed');
          break;

        case 'html-template-exact-match':
          console.log('🎯 HTML TEMPLATE EXACT MATCH PDF EXPORT STARTING...');
          const { exportHTMLTemplateExactMatch } = await import('../utils/htmlTemplateExactMatch');
          await exportHTMLTemplateExactMatch(selectedDate, allEvents);
          console.log('✅ HTML template exact match PDF export completed');
          break;

        case 'pixel-perfect-template':
          console.log('🎯 PIXEL-PERFECT TEMPLATE PDF EXPORT STARTING...');
          const { exportPixelPerfectTemplate } = await import('../utils/htmlTemplatePixelPerfect');
          await exportPixelPerfectTemplate(selectedDate, allEvents);
          console.log('✅ Pixel-perfect template PDF export completed');
          break;

        case 'new-pixel-perfect-daily':
          console.log('🎯 NEW PIXEL-PERFECT DAILY PDF EXPORT STARTING...');
          await handleNewPixelPerfectExport();
          console.log('✅ New pixel-perfect daily PDF export completed');
          break;

        case 'enhanced-daily-export':
          console.log('🎯 ENHANCED DAILY PDF EXPORT STARTING...');
          const { exportEnhancedDailyPDF } = await import('../utils/enhancedDailyPDFExport');
          await exportEnhancedDailyPDF(selectedDate, allEvents);
          console.log('✅ Enhanced daily PDF export completed');
          break;

        case 'comprehensive-daily-export':
          console.log('🎯 COMPREHENSIVE DAILY PDF EXPORT STARTING...');
          const { exportComprehensiveDailyPDF } = await import('../utils/comprehensiveDailyPDFExport');
          await exportComprehensiveDailyPDF(selectedDate, allEvents);
          console.log('✅ Comprehensive daily PDF export completed');
          break;

        case 'fixed-pdf-export':
          console.log('🎯 FIXED PDF EXPORT STARTING...');
          const { generateCorrectPDF } = await import('../components/FixedPDFExport');

          // Filter events for the selected date and transform to the correct format
          const dailyEvents = allEvents.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === selectedDate.toDateString();
          });

          // Transform events to the format expected by the fixed PDF export
          const transformedEvents = dailyEvents.map(event => {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
            const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

            // Clean up client name
            let clientName = event.title;
            clientName = clientName.replace(/ Appointment$/i, '');
            clientName = clientName.replace(/^🔒 /, '');

            return {
              id: event.id,
              startTime: startTimeStr,
              endTime: endTimeStr,
              clientName: clientName,
              status: event.status || 'confirmed'
            };
          });

          await generateCorrectPDF(transformedEvents);
          console.log('✅ Fixed PDF export completed');
          break;

        case 'application-replica':
          console.log('🎯 APPLICATION REPLICA PDF EXPORT STARTING...');
          const { generateApplicationReplicaPDF } = await import('../components/ApplicationReplicaPDF');

          // Filter events for the selected date and transform to the correct format
          const replicaDailyEvents = allEvents.filter(event => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === selectedDate.toDateString();
          });

          // Transform events to the format expected by the application replica
          const replicaTransformedEvents = replicaDailyEvents.map(event => {
            const startTime = new Date(event.startTime);
            const endTime = new Date(event.endTime);

            const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
            const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

            // Clean up client name
            let clientName = event.title;
            clientName = clientName.replace(/ Appointment$/i, '');
            clientName = clientName.replace(/^🔒 /, '');

            return {
              id: event.id,
              startTime: startTimeStr,
              endTime: endTimeStr,
              clientName: clientName,
              status: event.status === 'clinician_canceled' ? 'clinician_canceled' : 
                      event.status === 'client_canceled' ? 'client_canceled' : 'confirmed',
              title: event.title
            };
          });

          await generateApplicationReplicaPDF(replicaTransformedEvents);
          console.log('✅ Application replica PDF export completed');
          break;

        case 'perfect-daily-replica':
          console.log('🎯 PERFECT DAILY REPLICA PDF EXPORT STARTING...');
          const { generatePerfectDailyReplicaPDF } = await import('../components/PerfectDailyReplicaPDF');
          await generatePerfectDailyReplicaPDF(selectedDate, allEvents);
          console.log('✅ Perfect daily replica PDF export completed');
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

  // Audit handlers removed duplicate function

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

  const handleRunDailyPDFAudit = async () => {
    try {
      toast({ title: 'Running daily PDF export audit...' });
      const auditResult = await dailyPDFAudit.auditDailyPDFExport(selectedDate, allEvents);

      console.log('📊 DAILY PDF AUDIT RESULTS:');
      console.log(`Score: ${auditResult.score}%`);
      console.log('Issues found:', auditResult.issues);
      console.log('Recommendations:', auditResult.recommendations);
      console.log('Passed checks:', auditResult.passed);
      console.log('Failed checks:', auditResult.failed);

      toast({ 
        title: `Daily PDF Audit Complete - Score: ${auditResult.score}%`,
        description: `Found ${auditResult.issues.length} issues, ${auditResult.passed.length} passed checks. Check console for details.`,
        variant: auditResult.score > 80 ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Daily PDF audit failed:', error);
      toast({ title: 'Daily PDF audit failed', variant: 'destructive' });
    }
  };

  const handleTestExports = async () => {
    try {
      toast({ title: 'Testing export functionality...' });

      // Test a simple export
      await exportEnhancedWeeklyPDF(allEvents, currentWeek[0]?.date || new Date(), currentWeek[6]?.date || new Date());

      toast({ 
        title: 'Export Test Complete',
        description: 'Weekly PDF export test completed successfully'
      });

    } catch (error) {
      console.error('Export test failed:', error);
      toast({ title: 'Export test failed', variant: 'destructive' });
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

      // Use the token restoration endpoint
      const tokenResponse = await fetch('/api/auth/force-env-tokens', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!tokenResponse.ok) {
        throw new Error('Token restoration failed');
      }

      const tokenResult = await tokenResponse.json();
      console.log('✅ Token restoration result:', tokenResult);

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
        description: 'Please try reconnecting to Google Calendar'
      });

      // Redirect to OAuth if token issues persist
      window.location.href = '/api/auth/google';
    }
  };

  const handleTokenRestoration = async () => {
    try {
      console.log('🔧 Attempting token restoration...');

      toast({ title: 'Fixing authentication...' });

      const response = await fetch('/api/auth/force-env-tokens', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.requiresReauth) {
          toast({
            title: 'Re-authentication Required',
            description: 'Please log in with Google again',
            variant: 'destructive'
          });
          window.location.href = '/api/auth/google';
          return;
        }

        throw new Error(`Token restoration failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Token restoration result:', result);

      // Force refresh all queries after token restoration
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries();

      toast({
        title: 'Authentication Fixed',
        description: 'OAuth tokens have been restored successfully',
      });

      return result;
    } catch (error) {
      console.error('❌ Token restoration failed:', error);
      toast({
        title: 'Token Restoration Failed',
        description: 'Please try logging out and logging back in',
        variant: 'destructive'
      });

      // Redirect to OAuth as fallback
      window.location.href = '/api/auth/google';
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const navigateQuarter = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 3 : -3));
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

  const isLoading = eventsLoading || syncCalendarMutation.isPending;
  const isGoogleAuthenticated = user && allEvents.filter(e => e.source === 'google').length > 0;
  const authError = eventsError && eventsError.message?.includes('authentication');

  // Calculate event breakdown
  const eventBreakdown = useMemo(() => {
    console.log('🔍 Calculating event breakdown for events:', allEvents);
    console.log('🔍 Events type:', typeof allEvents, 'isArray:', Array.isArray(allEvents));

    if (!Array.isArray(allEvents)) {
      console.warn('⚠️ Events is not an array:', allEvents);
      return {
        total: 0,
        manual: 0,
        google: 0,
        simplepractice: 0,
        sources: {
          from_live_sync: 0,
          from_database: 0,
          simplepractice_live: 0
        }
      };
    }

    const breakdown = {
      total: allEvents.length,
      manual: 0,
      google: 0,
      simplepractice: 0,
      sources: {
        from_live_sync: allEvents.length,
        from_database: 0,
        simplepractice_live: 0
      }
    };

    allEvents.forEach((event, index) => {
      console.log(`🔍 Event ${index}:`, { title: event?.title, source: event?.source });

      if (event?.source === 'manual') {
        breakdown.manual++;
      } else if (event?.source === 'google') {
        breakdown.google++;
      } else if (event?.source === 'simplepractice') {
        breakdown.simplepractice++;
        breakdown.sources.simplepractice_live++;
      }
    });

    console.log('📊 Event breakdown (Live Sync + DB):', breakdown);
    return breakdown;
  }, [allEvents]);


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
          <SimpleOAuth />
        </div>
        <div className="mt-6">
          {/* <NewOAuthTest /> */}
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
              onClick={() => {
                console.log('🔄 Manual refetch triggered');
                refetchEvents();
              }}
              size="sm"
              className="bg-blue-50 text-blue-700"
            >
              🔄 Refresh Events
            </Button>

            <Button
              variant="outline"
              onClick={() => navigateMonth('prev')}
              size="sm"
            >
              ← Month
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateMonth('next')}
              size="sm"
            >
              Month →
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateQuarter('prev')}
              size="sm"
            >
              ← Quarter
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateQuarter('next')}
              size="sm"
            >
              Quarter →
            </Button>
          </div>

          <div className="text-lg font-semibold">
            {viewMode === 'weekly' 
              ? `Week of ${currentWeek[0]?.date.toLocaleDateString()} - ${currentWeek[6]?.date.toLocaleDateString()}`
              : selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            }
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View with Tabs */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="appointments">Appointments</TabsTrigger>
                    <TabsTrigger value="export">Export</TabsTrigger>
                  </TabsList>

                  <TabsContent value="calendar" className="mt-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading calendar...</span>
                      </div>
                    ) : viewMode === 'weekly' ? (
                      <WeeklyCalendarGrid
                        week={currentWeek}
                        events={filteredEvents}
                        onDayClick={handleDayClick}
                        onTimeSlotClick={handleTimeSlotClick}
                        onEventClick={handleEventClick}
                        onEventMove={handleEventMove}
                      />
                    ) : (
                      <DailyView
                        selectedDate={selectedDate}
                        events={(() => {
                          const dailyEvents = filteredEvents.filter(event => {
                            const eventDate = new Date(event.startTime);
                            return eventDate.toDateString() === selectedDate.toDateString();
                          });
                          console.log('📅 Daily view debug:', {
                            selectedDate: selectedDate.toDateString(),
                            totalEvents: filteredEvents.length,
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
                  </TabsContent>

                  <TabsContent value="appointments" className="mt-6">
                    <div className="space-y-4">
                      <AppointmentStats events={filteredEvents} selectedDate={selectedDate} />
                      <AppointmentStatusView 
                        events={filteredEvents} 
                        selectedDate={selectedDate}
                        onEventClick={handleEventClick}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="export" className="mt-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Export Options</h3>

                      {/* Audit Section */}
                      <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
                        <h4 className="font-medium text-orange-800 mb-2">📊 Audit & Analysis</h4>
                        <Button 
                          onClick={handleRunAudit} 
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          🔍 Run Calendar Export Audit
                        </Button>
                        <p className="text-sm text-orange-700 mt-2">
                          Analyze current calendar export for layout, data, and formatting issues
                        </p>
                      </div>

                      {/* Critical Test Section */}
                      <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
                        <h4 className="font-medium text-red-800 mb-2">🚨 Critical PDF Export Test</h4>
                        <Button 
                          onClick={() => {
                            console.log('=== CRITICAL PDF EXPORT TEST ===');
                            console.log('Current date:', selectedDate);
                            console.log('Total events loaded:', allEvents.length);

                            // Check for Amberly Comeau specifically
                            const amberlyEvent = allEvents.find(e => e.title.toLowerCase().includes('amberly'));
                            console.log('Amberly Comeau found:', !!amberlyEvent);
                            if (amberlyEvent) {
                              console.log('Amberly event:', amberlyEvent);
                            }

                            // Check for David Grossman specifically
                            const davidEvent = allEvents.find(e => e.title.toLowerCase().includes('david') && e.title.toLowerCase().includes('grossman'));
                            console.log('David Grossman found:', !!davidEvent);
                            if (davidEvent) {
                              console.log('David event:', davidEvent);
                            }

                            // Test the PDF export with fixed values
                            handleExportPDF('isolated-calendar');
                          }} 
                          className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white"
                        >
                          <AlertCircle className="h-4 w-4 mr-2" />
                          🔴 TEST FIXED PDF EXPORT
                        </Button>
                        <p className="text-sm text-red-700 mt-2">
                          Export PDF with forced statistics (12 appointments, 11.5h scheduled, 52% free time) and debug logging
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleExportPDF('enhanced-weekly')} className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Enhanced Weekly
                        </Button>
                        <Button onClick={() => handleExportPDF('dynamic-daily')} className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Dynamic Daily
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('perfect-daily')} 
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          🎯 Perfect Daily Calendar
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('isolated-calendar')} 
                          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          📅 Isolated Calendar Only
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('browser-replica')} 
                          className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          🔥 EXACT Browser HTML Replica
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('html-template-daily')} 
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Daily Template PDF
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('html-template-exact-match')} 
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          📋 Exact Match Template
                        </Button>
                        <Button 
                          onClick={() => handleExportPDF('new-pixel-perfect-daily')} 
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ✨ New Pixel-Perfect Daily
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Google Calendar Authentication Monitor */}
            <AuthMonitor />

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
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Refresh Events
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => syncCalendarMutation.mutate()}
                    disabled={syncCalendarMutation.isPending}
                    className="w-full bg-blue-50 hover:bg-blue-100 border-blue-300"
                    size="sm"
                  >
                    {syncCalendarMutation.isPending ? 'Syncing...' : '🔄 Sync Calendar'}
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



                </div>
              </CardContent>
            </Card>

            {/* Date Range Information */}
            <DateRangeInfo />

            {/* Calendar Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calendar Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="simplepractice"
                      checked={calendarFilters.simplepractice}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, simplepractice: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="simplepractice" className="text-sm">SimplePractice</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="google"
                      checked={calendarFilters.google}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, google: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="google" className="text-sm">Google Calendar</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="personal"
                      checked={calendarFilters.personal}
                      onChange={(e) => setCalendarFilters(prev => ({ ...prev, personal: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="personal" className="text-sm">Personal Events</label>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      SimplePractice ({eventBreakdown.simplepractice})
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
                      Google Calendar ({eventBreakdown.google})
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
                      US Holidays ({eventBreakdown.manual})
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">


                {/* Daily Exports */}
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-gray-600 mb-2 font-medium">📅 Daily Exports</p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('dynamic-daily')}
                    className="w-full justify-start bg-emerald-50 hover:bg-emerald-100 mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Dynamic Daily
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('html-template-perfect')}
                    className="w-full justify-start bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🎯 HTML Template Perfect
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('html-template-perfect-remarkable')}
                    className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📱 reMarkable Perfect
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('html-template-exact-match')}
                    className="w-full justify-start bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📋 EXACT MATCH TEMPLATE
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('pixel-perfect-template')}
                    className="w-full justify-start bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🎯 PIXEL PERFECT TEMPLATE
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      console.log('🔍 Running Template Audit...');
                      try {
                        const { templateAuditSystem } = await import('../utils/templateAuditSystem');
                        const auditResult = await templateAuditSystem.runCompleteAudit(
                          { /* current config */ },
                          allEvents,
                          selectedDate
                        );
                        console.log('📊 Audit Results:', auditResult);
                        console.log('🔧 Issues Found:', auditResult.issues);
                        console.log('💡 Recommendations:', auditResult.recommendations);

                        toast({
                          title: "Template Audit Complete",
                          description: `${auditResult.issues.length} issues found. Check console for details.`,
                        });
                      } catch (error) {
                        console.error('❌ Audit failed:', error);
                        toast({
                          title: "Audit Failed",
                          description: "Check console for error details",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="w-full justify-start bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🔍 RUN TEMPLATE AUDIT
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunDailyPDFAudit}
                    className="w-full justify-start bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📊 AUDIT DAILY PDF
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('enhanced-daily-export')}
                    className="w-full justify-start bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    ✅ FIXED DAILY EXPORT
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('fixed-pdf-export')}
                    className="w-full justify-start bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🔧 COMPLETE FIXED PDF
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('application-replica')}
                    className="w-full justify-start bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🎯 TRUE APPLICATION REPLICA
                  </Button>

                </div>

                {/* Weekly Exports */}
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-gray-600 mb-2 font-medium">📅 Weekly Exports</p>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('current-weekly')}
                    className="w-full justify-start bg-blue-50 hover:bg-blue-100 border-blue-300 mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📊 Current Weekly Layout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('custom-weekly')}
                    className="w-full justify-start bg-orange-50 hover:bg-orange-100 border-orange-300 mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🎨 Custom Weekly Calendar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('exact-weekly-package')}
                    className="w-full justify-start bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📦 EXACT Weekly Package (8 Pages)
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportPDF('bidirectional-weekly-package')}
                    className="w-full justify-start bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white mb-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    🔗 Bidirectional Weekly Package (8 Pages)
                  </Button>

                </div>






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
                  onClick={handleRunAudit}
                  className="w-full justify-start"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Run Pixel Audit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRunComprehensiveAudit}
                  className="w-full justify-start bg-purple-50 hover:bg-purple-100"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Comprehensive Audit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestExports}
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
                    <span className="font-medium">{eventBreakdown.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>This Week:</span>
                    <span className="font-medium">
                      {filteredEvents.filter(event => {
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
                      {filteredEvents.filter(event => {
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

            {/* Comprehensive Google Authentication Monitor */}
            <AuthMonitor />
          </div>
        </div>
      </div>
    </div>
  );
}