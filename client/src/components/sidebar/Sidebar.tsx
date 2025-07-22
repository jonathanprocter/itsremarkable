import { MiniCalendar } from './MiniCalendar';
import { GoogleCalendarIntegration } from './GoogleCalendarIntegration';
import { QuickActions } from './QuickActions';
import { ExportToPDF } from './ExportToPDF';
import { DailyNotes } from './DailyNotes';
import { AuthAuditSystem } from './AuthAuditSystem';
import { ComprehensiveOAuthFix } from '../ComprehensiveOAuthFix';
import { CalendarState } from '../../types/calendar';

interface SidebarProps {
  state: CalendarState;
  onDateSelect: (date: Date) => void;
  onGoToToday: () => void;
  onGoToDate: () => void;
  onRefreshEvents: () => void;
  onSyncNotes: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExportCurrentView: (type?: string) => void;
  onExportWeeklyPackage: () => void;
  onExportDailyView: () => void;
  onExportFullMonth: () => void;
  onExportToGoogleDrive: (type: string) => void;
  onSaveNotes: (notes: string) => void;
}

export const Sidebar = ({
  state,
  onDateSelect,
  onGoToToday,
  onGoToDate,
  onRefreshEvents,
  onSyncNotes,
  onSelectAll,
  onDeselectAll,
  onExportCurrentView,
  onExportWeeklyPackage,
  onExportDailyView,
  onExportFullMonth,
  onExportToGoogleDrive,
  onSaveNotes
}: SidebarProps) => {
  const currentDateString = state.selectedDate.toISOString().split('T')[0];
  const dailyNotes = state.dailyNotes[currentDateString] || '';

  return (
    <div className="w-64 bg-gray-50 p-4 border-r border-gray-200 overflow-y-auto h-full">
      <MiniCalendar
        currentDate={state.currentDate}
        selectedDate={state.selectedDate}
        onDateSelect={onDateSelect}
      />
      
      <GoogleCalendarIntegration
        isConnected={state.isGoogleConnected}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
      />
      
      <QuickActions
        onGoToToday={onGoToToday}
        onGoToDate={onGoToDate}
        onRefreshEvents={onRefreshEvents}
        onSyncNotes={onSyncNotes}
      />
      
      <ExportToPDF
        isGoogleConnected={state.isGoogleConnected}
        onExportCurrentView={onExportCurrentView}
        onExportWeeklyPackage={onExportWeeklyPackage}
        onExportDailyView={onExportDailyView}
        onExportFullMonth={onExportFullMonth}
        onExportToGoogleDrive={onExportToGoogleDrive}
      />
      
      <ComprehensiveOAuthFix />
      
      <DailyNotes
        notes={dailyNotes}
        onSaveNotes={onSaveNotes}
      />
      
      <div className="mt-4 p-4 bg-red-100 border border-red-500 rounded">
        <h3 className="font-bold text-red-800">🚨 AUTHENTICATION AUTO-FIX</h3>
        <p className="text-sm text-red-700">Click to automatically detect and fix authentication sync issues</p>
        <div className="mt-2">
          <button 
            onClick={async () => {
              console.log('🔄 Manual authentication audit triggered');
              const result = await (window as any).autonomousAuthAudit?.runComprehensiveAudit();
              if (result?.fixed) {
                console.log('✅ Authentication fixed successfully');
              } else {
                console.log('❌ Authentication issues remain');
              }
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            🔧 Auto-Fix Authentication Now
          </button>
        </div>
      </div>
    </div>
  );
};
