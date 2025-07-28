import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Workflow, 
  Calendar, 
  MessageSquare, 
  Database, 
  Users,
  Settings,
  Plus,
  Check,
  X,
  AlertCircle,
  RotateCcw as Sync,
  Clock,
  TrendingUp,
  Zap
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  syncedEvents?: number;
  category: 'calendar' | 'communication' | 'productivity' | 'storage';
}

interface SyncResult {
  integrationId: string;
  success: boolean;
  eventsProcessed: number;
  errors?: string[];
}

interface CrossPlatformSyncProps {
  onSyncComplete?: (results: SyncResult[]) => void;
}

export function CrossPlatformSync({ onSyncComplete }: CrossPlatformSyncProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with comprehensive integration data
    setIntegrations([
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync appointments and events with Google Calendar',
        icon: '📅',
        status: 'connected',
        lastSync: '2025-01-27T23:45:00Z',
        syncedEvents: 403,
        category: 'calendar'
      },
      {
        id: 'simplepractice',
        name: 'SimplePractice',
        description: 'Healthcare practice management integration',
        icon: '🏥',
        status: 'connected',
        lastSync: '2025-01-27T23:30:00Z',
        syncedEvents: 1356,
        category: 'calendar'
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Knowledge management and documentation platform',
        icon: '📝',
        status: 'connected',
        lastSync: '2025-01-27T22:15:00Z',
        syncedEvents: 0,
        category: 'productivity'
      },

      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Video conferencing and virtual meetings',
        icon: '📹',
        status: 'disconnected',
        category: 'communication'
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Business communication platform',
        icon: '🔵',
        status: 'disconnected',
        category: 'communication'
      },
      {
        id: 'drive',
        name: 'Google Drive',
        description: 'Cloud storage and file sharing',
        icon: '☁️',
        status: 'pending',
        category: 'storage'
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'File hosting and synchronization',
        icon: '📦',
        status: 'disconnected',
        category: 'storage'
      }
    ]);

    // Simulate recent sync results
    setSyncResults([
      {
        integrationId: 'google-calendar',
        success: true,
        eventsProcessed: 403
      },
      {
        integrationId: 'simplepractice',
        success: true,
        eventsProcessed: 1356
      },
      {
        integrationId: 'notion',
        success: true,
        eventsProcessed: 47
      }
    ]);
  }, []);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    
    // Simulate comprehensive sync process
    const connectedIntegrations = integrations.filter(i => i.status === 'connected');
    const results: SyncResult[] = [];
    
    for (const integration of connectedIntegrations) {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const result: SyncResult = {
        integrationId: integration.id,
        success: Math.random() > 0.1, // 90% success rate
        eventsProcessed: Math.floor(Math.random() * 100) + 10
      };
      
      if (!result.success) {
        result.errors = ['Connection timeout', 'Rate limit exceeded'];
      }
      
      results.push(result);
    }
    
    setSyncResults(results);
    setIsSyncing(false);
    
    // Update last sync times
    setIntegrations(prev => prev.map(integration => ({
      ...integration,
      lastSync: results.find(r => r.integrationId === integration.id)?.success 
        ? new Date().toISOString()
        : integration.lastSync
    })));
    
    const successCount = results.filter(r => r.success).length;
    const totalEvents = results.reduce((sum, r) => sum + (r.success ? r.eventsProcessed : 0), 0);
    
    toast({
      title: "Sync Complete",
      description: `${successCount}/${results.length} integrations synced successfully. ${totalEvents} events processed.`,
      variant: successCount === results.length ? "default" : "destructive"
    });
    
    onSyncComplete?.(results);
  };

  const handleIndividualSync = async (integrationId: string) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (!integration) return;

    setIntegrations(prev => prev.map(i => 
      i.id === integrationId ? { ...i, status: 'pending' } : i
    ));

    // Simulate individual sync
    setTimeout(() => {
      const success = Math.random() > 0.05; // 95% success rate for individual sync
      
      setIntegrations(prev => prev.map(i => 
        i.id === integrationId 
          ? { 
              ...i, 
              status: success ? 'connected' : 'error',
              lastSync: success ? new Date().toISOString() : i.lastSync,
              syncedEvents: success ? (i.syncedEvents || 0) + Math.floor(Math.random() * 20) : i.syncedEvents
            }
          : i
      ));

      toast({
        title: success ? "Sync Successful" : "Sync Failed",
        description: success 
          ? `${integration.name} synchronized successfully`
          : `Failed to sync ${integration.name}. Please try again.`,
        variant: success ? "default" : "destructive"
      });
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge variant="secondary">Syncing...</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'productivity': return <Zap className="h-4 w-4" />;
      case 'storage': return <Database className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const connectedIntegrations = integrations.filter(i => i.status === 'connected');
  const totalSyncedEvents = connectedIntegrations.reduce((sum, i) => sum + (i.syncedEvents || 0), 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Workflow className="h-6 w-6" />
              Cross-Platform Sync
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {connectedIntegrations.length} Connected
              </Badge>
              <Button 
                onClick={handleSyncAll}
                disabled={isSyncing || connectedIntegrations.length === 0}
                className="min-w-[120px]"
              >
                {isSyncing ? (
                  <>
                    <Sync className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="h-4 w-4 mr-2" />
                    Sync All
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{connectedIntegrations.length}</p>
                    <p className="text-sm text-muted-foreground">Active Integrations</p>
                  </div>
                  <Workflow className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{totalSyncedEvents.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Total Events Synced</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {syncResults.length > 0 
                        ? Math.round((syncResults.filter(r => r.success).length / syncResults.length) * 100)
                        : 100}%
                    </p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                  <Check className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {syncResults.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Sync Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {syncResults.map((result) => {
                    const integration = integrations.find(i => i.id === result.integrationId);
                    return (
                      <div key={result.integrationId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(integration?.category || 'calendar')}
                          <div>
                            <p className="font-medium">{integration?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {result.success 
                                ? `${result.eventsProcessed} events processed`
                                : `Failed: ${result.errors?.join(', ')}`}
                            </p>
                          </div>
                        </div>
                        {result.success ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="space-y-4">
            {['calendar', 'communication', 'productivity', 'storage'].map(category => {
              const categoryIntegrations = integrations.filter(i => i.category === category);
              if (categoryIntegrations.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-medium capitalize flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryIntegrations.map(integration => (
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
                              {integration.syncedEvents !== undefined && (
                                <div className="flex justify-between text-sm">
                                  <span>Events synced:</span>
                                  <span className="font-medium">{integration.syncedEvents.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm">
                                <span>Last sync:</span>
                                <span className="font-medium">
                                  {integration.lastSync ? formatRelativeTime(integration.lastSync) : 'Never'}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3">
                            {integration.status === 'connected' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIndividualSync(integration.id)}
                                disabled={isSyncing}
                              >
                                <Sync className="h-4 w-4 mr-2" />
                                Sync Now
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleIndividualSync(integration.id)}
                              >
                                Connect
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sync Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-sync enabled</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync all connected integrations every hour
                    </p>
                  </div>
                  <Switch
                    checked={autoSyncEnabled}
                    onCheckedChange={setAutoSyncEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Real-time notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when sync operations complete or fail
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Conflict resolution</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically resolve conflicts with newest data
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sync historical data</Label>
                    <p className="text-sm text-muted-foreground">
                      Include historical events from the past 6 months
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Integration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}