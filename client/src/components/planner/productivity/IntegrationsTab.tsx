import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrossPlatformSync } from '@/components/integrations/CrossPlatformSync';
import NotionIntegration from '@/components/integrations/NotionIntegration';
import AdvancedWorkflowAutomation from '@/components/workflow/AdvancedWorkflowAutomation';
import SmartWorkflowEngine from '@/components/workflow/SmartWorkflowEngine';

export interface IntegrationsTabProps {
  isTransitioning?: boolean;
  onTabChange?: (tabId: string, e: React.MouseEvent) => void;
  onSyncComplete?: () => void;
}

/**
 * Integrations Tab Component
 *
 * Provides integration options:
 * - Overview: Cross-platform sync overview
 * - Notion: Notion integration
 * - Advanced: Advanced workflow integrations
 */
export function IntegrationsTab({
  isTransitioning = false,
  onTabChange,
  onSyncComplete,
}: IntegrationsTabProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger
          value="overview"
          onClick={(e) => onTabChange?.('integrations-overview', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="notion"
          onClick={(e) => onTabChange?.('integrations-notion', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Notion
        </TabsTrigger>
        <TabsTrigger
          value="workflows"
          onClick={(e) => onTabChange?.('integrations-workflows', e)}
          className={isTransitioning ? 'pointer-events-none' : ''}
        >
          Advanced
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <CrossPlatformSync onSyncComplete={onSyncComplete} />
      </TabsContent>

      <TabsContent value="notion" className="mt-4">
        <NotionIntegration />
      </TabsContent>

      <TabsContent value="workflows" className="mt-4">
        <div className="space-y-6">
          <AdvancedWorkflowAutomation />
          <SmartWorkflowEngine />
        </div>
      </TabsContent>
    </Tabs>
  );
}
