import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Cloud, Link, RefreshCw, Settings, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CrossPlatformSyncProps {
  onSyncComplete?: () => void;
}

export function CrossPlatformSync({ onSyncComplete }: CrossPlatformSyncProps) {
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integration status
  const { data: integrations = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/integrations'],
    queryFn: async () => {
      const response = await fetch('/api/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    }
  });

  // Sync specific integration
  const syncIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to sync integration');
      return response.json();
    },
    onSuccess: (data, integrationId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Sync Completed",
        description: `Successfully synced ${getIntegrationName(integrationId)}`,
      });
      onSyncComplete?.();
    },
    onError: (error: any, integrationId) => {
      toast({
        title: "Sync Failed",
        description: `Failed to sync ${getIntegrationName(integrationId)}: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Bulk sync all active integrations
  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      setSyncInProgress(true);
      const response = await fetch('/api/integrations/bulk-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to perform bulk sync');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Bulk Sync Completed",
        description: `Synced ${data.synced} integrations successfully`,
      });
      setSyncInProgress(false);
      onSyncComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Sync Failed",
        description: error.message || "Failed to complete bulk sync",
        variant: "destructive"
      });
      setSyncInProgress(false);
    }
  });

  // Configure integration
  const configureIntegrationMutation = useMutation({
    mutationFn: async ({ id, config }: { id: string, config: any }) => {
      const response = await fetch(`/api/integrations/${id}/configure`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Failed to configure integration');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/integrations'] });
      toast({
        title: "Configuration Updated",
        description: "Integration settings have been saved",
      });
    }
  });

  const availableIntegrations = [
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Sync appointments and events from Google Calendar',
      icon: '📅',
      status: 'connected',
      lastSync: '2025-01-26T10:00:00Z',
      enabled: true,
      syncedEvents: 403,
      category: 'calendar'
    },
    {
      id: 'simplepractice',
      name: 'SimplePractice',
      description: 'Healthcare practice management integration',
      icon: '🏥',
      status: 'connected',
      lastSync: '2025-01-26T09:45:00Z',
      enabled: true,
      syncedEvents: 1356,
      category: 'healthcare'
    },
    {
      id: 'outlook_calendar',
      name: 'Outlook Calendar',
      description: 'Microsoft Outlook calendar synchronization',
      icon: '📧',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'calendar'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and status updates',
      icon: '💬',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'communication'
    },
    {
      id: 'zoom',
      name: 'Zoom',
      description: 'Video conferencing integration',
      icon: '📹',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'communication'
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Project management and notes sync',
      icon: '📝',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'productivity'
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description: 'Database and project tracking',
      icon: '🗃️',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'productivity'
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Customer relationship management',
      icon: '🎯',
      status: 'available',
      lastSync: null,
      enabled: false,
      syncedEvents: 0,
      category: 'crm'
    }
  ];

  const getIntegrationName = (id: string) => {
    return availableIntegrations.find(i => i.id === id)?.name || id;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'syncing':
        return <Badge className="bg-blue-500">Syncing</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const connectedIntegrations = availableIntegrations.filter(i => i.status === 'connected');
  const availableCount = availableIntegrations.filter(i => i.status === 'available').length;
  const totalEvents = connectedIntegrations.reduce((sum, i) => sum + i.syncedEvents, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-500" />
            Cross-Platform Sync
          </CardTitle>
          <CardDescription>
            Integrate and synchronize data across all your productivity tools
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={() => bulkSyncMutation.mutate()}
              disabled={syncInProgress || bulkSyncMutation.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${syncInProgress ? 'animate-spin' : ''}`} />
              Sync All
            </Button>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{connectedIntegrations.length}</div>
                    <div className="text-sm text-muted-foreground">Connected</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{totalEvents}</div>
                    <div className="text-sm text-muted-foreground">Synced Events</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{availableCount}</div>
                    <div className="text-sm text-muted-foreground">Available</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">24/7</div>
                    <div className="text-sm text-muted-foreground">Auto Sync</div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Integrations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Integrations</h3>
                <div className="space-y-2">
                  {connectedIntegrations.map(integration => (
                    <Card key={integration.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{integration.icon}</span>
                            <div>
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {integration.syncedEvents} events • Last sync: {formatLastSync(integration.lastSync)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(integration.status)}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncIntegrationMutation.mutate(integration.id)}
                              disabled={syncIntegrationMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableIntegrations.map(integration => (
                  <Card key={integration.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <div className="font-medium">{integration.name}</div>
                            <div className="text-sm text-muted-foreground">{integration.description}</div>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      
                      {integration.status === 'connected' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Events synced:</span>
                            <span className="font-medium">{integration.syncedEvents}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Last sync:</span>
                            <span className="font-medium">{formatLastSync(integration.lastSync)}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => syncIntegrationMutation.mutate(integration.id)}
                              disabled={syncIntegrationMutation.isPending}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sync
                            </Button>
                            <Button size="sm" variant="outline">
                              <Settings className="h-4 w-4 mr-1" />
                              Configure
                            </Button>
                          </div>
                        </div>
                      )}

                      {integration.status === 'available' && (
                        <div className="mt-3">
                          <Button size="sm" variant="outline" className="w-full">
                            <Zap className="h-4 w-4 mr-1" />
                            Connect
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sync Settings</CardTitle>
                  <CardDescription>Configure how your integrations sync data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Auto Sync Frequency</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="number" defaultValue="15" className="w-20" />
                        <span className="text-sm text-muted-foreground">minutes</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Sync Window</Label>
                      <div className="flex items-center space-x-2">
                        <Input type="number" defaultValue="30" className="w-20" />
                        <span className="text-sm text-muted-foreground">days lookback</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Real-time Sync</Label>
                        <p className="text-sm text-muted-foreground">Sync changes immediately when detected</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Conflict Resolution</Label>
                        <p className="text-sm text-muted-foreground">Automatically resolve sync conflicts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sync Notifications</Label>
                        <p className="text-sm text-muted-foreground">Get notified when sync completes</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your synced data and storage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline">
                      <Cloud className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Force Refresh
                    </Button>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Reset Sync
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}