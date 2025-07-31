window.testCurrentWeeklyExport = async () => {
  try {
    // Testing Current Weekly Export
    const { exportCurrentWeeklyView } = await import('./src/utils/currentWeeklyExport');
    
    // Mock data for testing
    const mockEvents = [];
    const weekStart = new Date('2025-07-07');
    const weekEnd = new Date('2025-07-13');
    
    // Calling exportCurrentWeeklyView
    await exportCurrentWeeklyView(mockEvents, weekStart, weekEnd);
    // Export completed successfully
  } catch (error) {
    // Export failed
  }
};
