import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Eye, AlertCircle } from 'lucide-react';
import { CalendarEvent, CalendarDay } from '@/types/calendar';

export type ExportType =
  | 'enhanced-weekly'
  | 'dynamic-daily'
  | 'perfect-daily'
  | 'isolated-calendar'
  | 'browser-replica'
  | 'html-template-daily'
  | 'html-template-exact-match'
  | 'new-pixel-perfect-daily';

export interface PlannerExportViewProps {
  selectedDate: Date;
  currentWeek: CalendarDay[];
  events: CalendarEvent[];
  onExportPDF: (exportType: ExportType) => Promise<void>;
  onRunAudit: () => Promise<void>;
}

/**
 * Planner Export View Component
 *
 * Provides PDF export options and audit functionality:
 * - Calendar export audit
 * - Multiple PDF export formats
 * - Test/debug export options
 */
export function PlannerExportView({
  selectedDate,
  events,
  onExportPDF,
  onRunAudit,
}: PlannerExportViewProps) {
  const handleCriticalTest = () => {
    // Check for specific events
    const amberlyEvent = events.find((e) =>
      e.title.toLowerCase().includes('amberly')
    );
    const davidEvent = events.find(
      (e) =>
        e.title.toLowerCase().includes('david') &&
        e.title.toLowerCase().includes('grossman')
    );

    // Test the PDF export
    onExportPDF('isolated-calendar');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Export Options</h3>

      {/* Audit Section */}
      <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
        <h4 className="font-medium text-orange-800 mb-2">
          📊 Audit & Analysis
        </h4>
        <Button
          onClick={onRunAudit}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
        >
          <Eye className="h-4 w-4 mr-2" />
          🔍 Run Calendar Export Audit
        </Button>
        <p className="text-sm text-orange-700 mt-2">
          Analyze current calendar export for layout, data, and formatting
          issues
        </p>
      </div>

      {/* Critical Test Section */}
      <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
        <h4 className="font-medium text-red-800 mb-2">
          🚨 Critical PDF Export Test
        </h4>
        <Button
          onClick={handleCriticalTest}
          className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          🔴 TEST FIXED PDF EXPORT
        </Button>
        <p className="text-sm text-red-700 mt-2">
          Export PDF with forced statistics (12 appointments, 11.5h scheduled,
          52% free time) and debug logging
        </p>
      </div>

      {/* Export Buttons Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => onExportPDF('enhanced-weekly')}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Enhanced Weekly
        </Button>

        <Button
          onClick={() => onExportPDF('dynamic-daily')}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          Dynamic Daily
        </Button>

        <Button
          onClick={() => onExportPDF('perfect-daily')}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          🎯 Perfect Daily Calendar
        </Button>

        <Button
          onClick={() => onExportPDF('isolated-calendar')}
          className="w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          📅 Isolated Calendar Only
        </Button>

        <Button
          onClick={() => onExportPDF('browser-replica')}
          className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          🔥 EXACT Browser HTML Replica
        </Button>

        <Button
          onClick={() => onExportPDF('html-template-daily')}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Daily Template PDF
        </Button>

        <Button
          onClick={() => onExportPDF('html-template-exact-match')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          📋 Exact Match Template
        </Button>

        <Button
          onClick={() => onExportPDF('new-pixel-perfect-daily')}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          ✨ New Pixel-Perfect Daily
        </Button>
      </div>
    </div>
  );
}
