import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskAutomation } from '@/components/workflow/TaskAutomation';
import AdvancedWorkflowAutomation from '@/components/workflow/AdvancedWorkflowAutomation';
import SmartWorkflowEngine from '@/components/workflow/SmartWorkflowEngine';
import { CalendarEvent } from '@/types/calendar';

export interface AutomationTabProps {
  events: CalendarEvent[];
  isTransitioning?: boolean;
  onTabChange?: (tabId: string, e: React.MouseEvent) => void;
}

/**
 * Automation Tab Component
 *
 * Provides three levels of automation:
 * - Basic Automation: Simple task automation
 * - Advanced Workflows: Complex workflow automation
 * - AI Engine: Smart AI-powered workflow engine
 */
export function AutomationTab({
  events,
  isTransitioning = false,
  onTabChange,
}: AutomationTabProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger
          value="basic"
          onClick={(e) => onTabChange?.('automation-basic', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Basic Automation
        </TabsTrigger>
        <TabsTrigger
          value="workflows"
          onClick={(e) => onTabChange?.('automation-workflows', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Advanced Workflows
        </TabsTrigger>
        <TabsTrigger
          value="ai-engine"
          onClick={(e) => onTabChange?.('automation-ai', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          AI Engine
        </TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="mt-4">
        <TaskAutomation events={events} />
      </TabsContent>

      <TabsContent value="workflows" className="mt-4">
        <AdvancedWorkflowAutomation />
      </TabsContent>

      <TabsContent value="ai-engine" className="mt-4">
        <SmartWorkflowEngine />
      </TabsContent>
    </Tabs>
  );
}
