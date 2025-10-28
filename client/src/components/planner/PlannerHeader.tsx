import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText } from 'lucide-react';
import { ViewMode } from '@/types/calendar';

export interface PlannerHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  user: any | null;
  onLogout: () => void;
}

/**
 * Planner Header Component
 *
 * Displays:
 * - App title and current view badge
 * - User authentication status
 * - Logout button
 * - View mode toggle buttons (Weekly, Daily, Monthly, Yearly)
 */
export function PlannerHeader({
  viewMode,
  onViewModeChange,
  user,
  onLogout,
}: PlannerHeaderProps) {
  const getViewLabel = () => {
    switch (viewMode) {
      case 'weekly':
        return 'Weekly View';
      case 'daily':
        return 'Daily View';
      case 'monthly':
        return 'Monthly View';
      case 'yearly':
        return 'Yearly View';
      default:
        return 'Weekly View';
    }
  };

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Left side: Title and view badge */}
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">reMarkable Pro Digital Planner</h1>
        <Badge variant="outline" className="text-sm">
          {getViewLabel()}
        </Badge>
      </div>

      {/* Right side: User info and view toggles */}
      <div className="flex items-center gap-2">
        {user && (
          <Badge variant="outline" className="text-sm bg-green-50">
            Logged in as {user.name}
          </Badge>
        )}
        {user && (
          <Button
            onClick={onLogout}
            variant="outline"
            size="sm"
            className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
          >
            🔓 Logout
          </Button>
        )}

        {/* View mode buttons */}
        <Button
          variant={viewMode === 'weekly' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('weekly')}
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Weekly
        </Button>
        <Button
          variant={viewMode === 'daily' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('daily')}
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Daily
        </Button>
        <Button
          variant={viewMode === 'monthly' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('monthly')}
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Monthly
        </Button>
        <Button
          variant={viewMode === 'yearly' ? 'default' : 'outline'}
          onClick={() => onViewModeChange('yearly')}
          size="sm"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Yearly
        </Button>
      </div>
    </div>
  );
}
