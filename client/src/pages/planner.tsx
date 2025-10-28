import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useTabTransitions } from '@/hooks/useTabTransitions';
import { ViewMode } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AuthMonitor } from '@/components/auth/AuthMonitor';

// Import custom hooks
import {
  usePlannerAuth,
  usePlannerEvents,
  usePlannerMutations,
  usePlannerNavigation,
  usePlannerSync,
} from '@/hooks/planner';

// Import components
import {
  PlannerHeader,
  PlannerNavigation,
  PlannerCalendarView,
  PlannerClientsView,
  PlannerAppointmentsView,
  PlannerExportView,
  PlannerProductivityView,
  ExportType,
} from '@/components/planner';

// Import export utilities (these remain as they are complex domain logic)
// import { exportExactGridPDF } from '@/utils/exactGridPDFExport';
// import { exportDailyToPDF } from '@/utils/dailyPDFExport';
// import { exportWeeklyPackage } from '@/utils/weeklyPackageExport';
import { exportBidirectionalWeeklyPackage } from '@/utils/bidirectionalWeeklyPackage';
import { exportDynamicDailyPlannerPDF } from '@/utils/dynamicDailyPlannerPDF';
// import { exportTrulyPixelPerfectWeeklyPDF } from '@/utils/trulyPixelPerfectExport';
// import { exportExactWeeklySpec } from '@/utils/exactWeeklySpecExport';
// import { exportExactWeeklyPackage } from '@/utils/exactWeeklyPackageExport';
import { export100PercentPixelPerfectPDF } from '@/utils/pixelPerfectPDFExport';
import { exportEnhancedWeeklyPDF } from '@/utils/enhancedWeeklyPDFExport';
// import { exportEnhancedDailyPDF } from '@/utils/enhancedDailyPDFExport';
// import { exportEnhancedWeeklyPackage } from '@/utils/enhancedWeeklyPackageExport';
import { exportHtmlTemplateDailyPDF } from '@/utils/htmlTemplateDailyExport';
import { exportHTMLTemplatePerfect } from '@/utils/htmlTemplatePerfectExport';
import { exportPerfectDailyCalendarPDF } from '@/utils/perfectDailyCalendarPDF';
import { exportIsolatedCalendarPDF } from '@/utils/isolatedCalendarPDF';
import { runIsolatedCalendarAudit } from '@/utils/isolatedCalendarAudit';
import { exportBrowserReplicaPDF } from '@/utils/browserReplicaPDF';
// import { pixelPerfectAuditSystem } from '@/utils/pixelPerfectAuditSystem';

/**
 * Planner Component (Refactored)
 *
 * Main planner orchestrator that uses custom hooks and components
 * to manage calendar, events, productivity features, and exports.
 *
 * Reduced from 2,701 lines to ~400 lines by extracting:
 * - Custom hooks for state management
 * - UI components for rendering
 * - Proper separation of concerns
 */
export default function Planner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  // Custom hooks
  const { user, handleOAuthLogin, handleLogout } =
    usePlannerAuth();

  const {
    events: allEvents,
    filteredEvents,
    isLoading: eventsLoading,
    refetch: refetchEvents,
    eventStats,
  } = usePlannerEvents();

  const { createEvent, updateEvent, deleteEvent } = usePlannerMutations();

  const {
    selectedDate,
    currentWeek,
    navigateWeek,
    navigateDay,
    navigateMonth,
    navigateQuarter,
    navigateYear,
    goToToday,
    setSelectedDate,
  } = usePlannerNavigation();

  const { syncCalendar, isSyncing } = usePlannerSync(() => {
    refetchEvents();
  });

  // Tab transitions
  const { handleTabChange, isTransitioning } = useTabTransitions({
    enableSoundEffects: true,
    enableHapticFeedback: true,
    transitionDuration: 400,
  });

  // OAuth callback handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('auth') === 'success') {
      setTimeout(() => {
        refetchEvents();
        window.history.replaceState({}, document.title, window.location.pathname);
      }, 1000);
    }

    if (urlParams.get('error') === 'oauth_failed') {
      toast({
        title: 'Authentication Failed',
        description: 'Google OAuth authentication failed. Please try again.',
        variant: 'destructive',
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (urlParams.has('code') && urlParams.has('scope')) {
      setTimeout(() => {
        refetchEvents();
      }, 1000);
    }
  }, [refetchEvents, toast]);

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
        variant: 'destructive',
      });
      return;
    }

    const [hours, minutes] = time.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(hours + 1, minutes, 0, 0);

    createEvent({
      title: 'New Event',
      startTime,
      endTime,
      source: 'manual',
      color: '#3b82f6',
      description: '',
    });
  };

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const handleEventMove = (
    eventId: string,
    newStartTime: Date,
    newEndTime: Date
  ) => {
    updateEvent(eventId, {
      startTime: newStartTime,
      endTime: newEndTime,
    });
  };

  const handleCreateEvent = (startTime: Date, endTime: Date) => {
    createEvent({
      title: 'New Event',
      startTime,
      endTime,
      source: 'manual',
      color: '#3b82f6',
      description: '',
    });
  };

  const handleNavigate = (
    direction: 'prev' | 'next',
    unit: 'day' | 'week' | 'month' | 'quarter' | 'year'
  ) => {
    if (unit === 'day') navigateDay(direction);
    else if (unit === 'week') navigateWeek(direction);
    else if (unit === 'month') navigateMonth(direction);
    else if (unit === 'quarter') navigateQuarter(direction);
    else if (unit === 'year') navigateYear(direction);
  };

  // Export handler (complex domain logic kept here)
  const handleExportPDF = async (exportType: ExportType) => {
    try {
      toast({ title: 'Generating PDF export...' });

      switch (exportType) {
        case 'enhanced-weekly':
          // Calculate week start and end dates for enhanced weekly export
          const enhancedWeekStart = new Date(selectedDate);
          enhancedWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          const enhancedWeekEnd = new Date(enhancedWeekStart);
          enhancedWeekEnd.setDate(enhancedWeekStart.getDate() + 6);
          await exportEnhancedWeeklyPDF(allEvents, enhancedWeekStart, enhancedWeekEnd);
          break;
        case 'bidirectional-weekly':
          // Calculate week start and end dates for bidirectional export
          const weekStart = new Date(selectedDate);
          weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          await exportBidirectionalWeeklyPackage(weekStart, weekEnd, allEvents);
          break;
        case 'dynamic-daily':
          await exportDynamicDailyPlannerPDF(new Date(), allEvents);
          break;
        case 'perfect-daily':
          await exportPerfectDailyCalendarPDF({ selectedDate, events: allEvents });
          break;
        case 'isolated-calendar':
          await exportIsolatedCalendarPDF({ selectedDate, events: allEvents });
          break;
        case 'browser-replica':
          await exportBrowserReplicaPDF(allEvents, selectedDate);
          break;
        case 'html-template-daily':
          await exportHtmlTemplateDailyPDF(selectedDate, allEvents);
          break;
        case 'html-template-exact-match':
          await exportHTMLTemplatePerfect(selectedDate, allEvents);
          break;
        case 'new-pixel-perfect-daily':
          // Calculate week start and end dates for pixel perfect export
          const pixelWeekStart = new Date(selectedDate);
          pixelWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          const pixelWeekEnd = new Date(pixelWeekStart);
          pixelWeekEnd.setDate(pixelWeekStart.getDate() + 6);
          await export100PercentPixelPerfectPDF(pixelWeekStart, pixelWeekEnd, allEvents);
          break;
        default:
          throw new Error(`Unknown export type: ${exportType}`);
      }

      toast({
        title: 'Export Complete',
        description: 'PDF has been generated successfully',
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Audit handler
  const handleRunAudit = async () => {
    try {
      toast({ title: 'Running audit...' });
      await runIsolatedCalendarAudit(selectedDate, allEvents);
      toast({
        title: 'Audit Complete',
        description: 'Check console for detailed results',
      });
    } catch (error) {
      console.error('Audit failed:', error);
      toast({
        title: 'Audit Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Sync complete handler
  const handleSyncComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    toast({
      title: 'Sync Complete',
      description: 'Calendar data has been updated successfully',
    });
  };

  const isLoading = eventsLoading || isSyncing;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="w-full mx-auto">
        {/* Header */}
        <PlannerHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          user={user}
          onLogout={handleLogout}
        />

        {/* Navigation */}
        <PlannerNavigation
          viewMode={viewMode}
          selectedDate={selectedDate}
          currentWeek={currentWeek}
          onNavigate={handleNavigate}
          onToday={goToToday}
          onRefresh={refetchEvents}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View with Tabs */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <Tabs defaultValue="calendar" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger
                      value="calendar"
                      onClick={(e) => handleTabChange('calendar', e)}
                      className={isTransitioning ? 'pointer-events-none' : ''}
                    >
                      Calendar
                    </TabsTrigger>
                    <TabsTrigger
                      value="clients"
                      onClick={(e) => handleTabChange('clients', e)}
                      className={isTransitioning ? 'pointer-events-none' : ''}
                    >
                      Clients
                    </TabsTrigger>
                    <TabsTrigger
                      value="productivity"
                      onClick={(e) => handleTabChange('productivity', e)}
                      className={isTransitioning ? 'pointer-events-none' : ''}
                    >
                      Productivity
                    </TabsTrigger>
                    <TabsTrigger
                      value="appointments"
                      onClick={(e) => handleTabChange('appointments', e)}
                      className={isTransitioning ? 'pointer-events-none' : ''}
                    >
                      Appointments
                    </TabsTrigger>
                    <TabsTrigger
                      value="export"
                      onClick={(e) => handleTabChange('export', e)}
                      className={isTransitioning ? 'pointer-events-none' : ''}
                    >
                      Export
                    </TabsTrigger>
                  </TabsList>

                  {/* Calendar Tab */}
                  <TabsContent value="calendar" className="mt-6">
                    <PlannerCalendarView
                      viewMode={viewMode}
                      selectedDate={selectedDate}
                      currentWeek={currentWeek}
                      events={filteredEvents}
                      isLoading={isLoading}
                      onDayClick={handleDayClick}
                      onTimeSlotClick={handleTimeSlotClick}
                      onEventClick={handleEventClick}
                      onEventMove={handleEventMove}
                      onUpdateEvent={updateEvent}
                      onCreateEvent={handleCreateEvent}
                      onDeleteEvent={deleteEvent}
                      onViewModeChange={setViewMode}
                      onDateChange={setSelectedDate}
                      onNavigateDay={navigateDay}
                    />
                  </TabsContent>

                  {/* Clients Tab */}
                  <TabsContent value="clients" className="mt-6">
                    <PlannerClientsView />
                  </TabsContent>

                  {/* Productivity Tab */}
                  <TabsContent value="productivity" className="mt-6">
                    <PlannerProductivityView
                      events={filteredEvents}
                      selectedDate={selectedDate}
                      onCreateEvent={createEvent}
                      onSyncComplete={handleSyncComplete}
                      isTransitioning={isTransitioning}
                      onTabChange={handleTabChange}
                    />
                  </TabsContent>

                  {/* Appointments Tab */}
                  <TabsContent value="appointments" className="mt-6">
                    <PlannerAppointmentsView
                      events={filteredEvents}
                      selectedDate={selectedDate}
                      onEventClick={handleEventClick}
                    />
                  </TabsContent>

                  {/* Export Tab */}
                  <TabsContent value="export" className="mt-6">
                    <PlannerExportView
                      selectedDate={selectedDate}
                      currentWeek={currentWeek}
                      events={allEvents}
                      onExportPDF={handleExportPDF}
                      onRunAudit={handleRunAudit}
                    />
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
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={goToToday}
                    className="w-full"
                    size="sm"
                  >
                    Go to Today
                  </Button>
                  <Button
                    variant="outline"
                    onClick={refetchEvents}
                    className="w-full"
                    size="sm"
                  >
                    Refresh Events
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOAuthLogin}
                    className="w-full bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
                    size="sm"
                  >
                    🔐 Re-authenticate Google
                  </Button>
                  <Button
                    variant="outline"
                    onClick={syncCalendar}
                    disabled={isSyncing}
                    className="w-full bg-blue-50 hover:bg-blue-100 border-blue-300"
                    size="sm"
                  >
                    {isSyncing ? 'Syncing...' : '🔄 Sync Calendar'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Event Stats */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-2">Event Stats</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{eventStats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Google:</span>
                    <span className="font-medium">{eventStats.google}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SimplePractice:</span>
                    <span className="font-medium">
                      {eventStats.simplepractice}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manual:</span>
                    <span className="font-medium">{eventStats.manual}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
