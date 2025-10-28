import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarEvent } from '@/types/calendar';
import { ProductivityHubTab } from './productivity/ProductivityHubTab';
import { SmartSchedulingTab } from './productivity/SmartSchedulingTab';
import { AutomationTab } from './productivity/AutomationTab';
import { IntegrationsTab } from './productivity/IntegrationsTab';

export interface PlannerProductivityViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onCreateEvent: (event: Partial<CalendarEvent>) => void;
  onSyncComplete?: () => void;
  isTransitioning?: boolean;
  onTabChange?: (tabId: string, e: React.MouseEvent) => void;
}

/**
 * Planner Productivity View Component
 *
 * Orchestrates the productivity tab with 4 sub-tabs:
 * - Overview: Productivity hub dashboard
 * - Smart Scheduling: Intelligent appointment scheduling
 * - Automation: Task and workflow automation (3 levels)
 * - Integrations: Cross-platform integrations (3 types)
 *
 * Handles nested tab navigation and event delegation
 */
export function PlannerProductivityView({
  events,
  selectedDate,
  onCreateEvent,
  onSyncComplete,
  isTransitioning = false,
  onTabChange,
}: PlannerProductivityViewProps) {
  return (
    <Tabs defaultValue="hub" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger
          value="hub"
          onClick={(e) => onTabChange?.('productivity-hub', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="smart"
          onClick={(e) => onTabChange?.('productivity-smart', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Smart Scheduling
        </TabsTrigger>
        <TabsTrigger
          value="automation"
          onClick={(e) => onTabChange?.('productivity-automation', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Automation
        </TabsTrigger>
        <TabsTrigger
          value="integrations"
          onClick={(e) => onTabChange?.('productivity-integrations', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Integrations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="hub" className="mt-4">
        <ProductivityHubTab events={events} selectedDate={selectedDate} />
      </TabsContent>

      <TabsContent value="smart" className="mt-4">
        <SmartSchedulingTab
          selectedDate={selectedDate}
          events={events}
          onCreateEvent={onCreateEvent}
        />
      </TabsContent>

      <TabsContent value="automation" className="mt-4">
        <AutomationTab
          events={events}
          isTransitioning={isTransitioning}
          onTabChange={onTabChange}
        />
      </TabsContent>

      <TabsContent value="integrations" className="mt-4">
        <IntegrationsTab
          isTransitioning={isTransitioning}
          onTabChange={onTabChange}
          onSyncComplete={onSyncComplete}
        />
      </TabsContent>
    </Tabs>
  );
}
