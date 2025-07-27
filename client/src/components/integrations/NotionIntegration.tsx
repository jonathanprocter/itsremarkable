import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, 
  FileText, 
  Calendar, 
  CheckSquare, 
  Users, 
  Clock, 
  ArrowRight, 
  RotateCcw as Sync, 
  Settings,
  Plus,
  Link,
  Bell,
  Zap
} from 'lucide-react';

interface NotionDatabase {
  id: string;
  title: string;
  type: 'tasks' | 'notes' | 'clients' | 'projects' | 'calendar';
  lastSync: string;
  recordCount: number;
  isConnected: boolean;
}

interface NotionPage {
  id: string;
  title: string;
  type: string;
  lastModified: string;
  tags: string[];
}

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun: string;
  runCount: number;
}

export default function NotionIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [recentPages, setRecentPages] = useState<NotionPage[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    action: '',
    isActive: true
  });
  
  const { toast } = useToast();

  // Initialize with sample data for demonstration
  useEffect(() => {
    // Simulate connected Notion workspace with realistic data
    setDatabases([
      {
        id: 'db-1',
        title: 'Client Management',
        type: 'clients',
        lastSync: '2025-01-27T23:45:00Z',
        recordCount: 247,
        isConnected: true
      },
      {
        id: 'db-2',
        title: 'Task Tracker',
        type: 'tasks',
        lastSync: '2025-01-27T23:30:00Z',
        recordCount: 1234,
        isConnected: true
      },
      {
        id: 'db-3',
        title: 'Session Notes',
        type: 'notes',
        lastSync: '2025-01-27T23:15:00Z',
        recordCount: 892,
        isConnected: true
      },
      {
        id: 'db-4',
        title: 'Project Pipeline',
        type: 'projects',
        lastSync: '2025-01-27T23:00:00Z',
        recordCount: 156,
        isConnected: true
      }
    ]);

    setRecentPages([
      {
        id: 'page-1',
        title: 'Weekly Review - January 2025',
        type: 'Planning Template',
        lastModified: '2025-01-27T22:30:00Z',
        tags: ['review', 'planning', 'template']
      },
      {
        id: 'page-2',
        title: 'Client Intake Protocol',
        type: 'Process Documentation',
        lastModified: '2025-01-27T20:15:00Z',
        tags: ['process', 'client', 'intake']
      },
      {
        id: 'page-3',
        title: 'Q1 2025 Goals Dashboard',
        type: 'Goal Tracking',
        lastModified: '2025-01-27T18:45:00Z',
        tags: ['goals', 'tracking', 'quarterly']
      }
    ]);

    setAutomationRules([
      {
        id: 'rule-1',
        name: 'Auto-create session notes',
        trigger: 'New appointment scheduled',
        action: 'Create Notion page with session template',
        isActive: true,
        lastRun: '2025-01-27T22:00:00Z',
        runCount: 156
      },
      {
        id: 'rule-2',
        name: 'Weekly review reminder',
        trigger: 'Every Sunday at 6 PM',
        action: 'Create weekly review template',
        isActive: true,
        lastRun: '2025-01-26T18:00:00Z',
        runCount: 12
      },
      {
        id: 'rule-3',
        name: 'Task priority sync',
        trigger: 'High priority task created',
        action: 'Add to calendar as time block',
        isActive: false,
        lastRun: '2025-01-25T14:30:00Z',
        runCount: 43
      }
    ]);

    setIsConnected(true);
  }, []);

  const handleConnect = async () => {
    setSyncStatus('syncing');
    
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setSyncStatus('idle');
      toast({
        title: "Notion Connected",
        description: "Successfully connected to your Notion workspace",
        variant: "default"
      });
    }, 2000);
  };

  const handleSync = async (databaseId?: string) => {
    setSyncStatus('syncing');
    
    // Simulate sync process
    setTimeout(() => {
      setSyncStatus('idle');
      
      // Update last sync times
      setDatabases(prev => prev.map(db => 
        !databaseId || db.id === databaseId 
          ? { ...db, lastSync: new Date().toISOString() }
          : db
      ));
      
      toast({
        title: "Sync Complete",
        description: databaseId 
          ? "Database synchronized successfully"
          : "All databases synchronized successfully",
        variant: "default"
      });
    }, 1500);
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.trigger || !newRule.action) {
      toast({
        title: "Incomplete Rule",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    const rule: AutomationRule = {
      id: `rule-${Date.now()}`,
      ...newRule,
      lastRun: new Date().toISOString(),
      runCount: 0
    };

    setAutomationRules(prev => [...prev, rule]);
    setNewRule({ name: '', trigger: '', action: '', isActive: true });
    
    toast({
      title: "Automation Created",
      description: `Rule "${rule.name}" has been created`,
      variant: "default"
    });
  };

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'tasks': return <CheckSquare className="h-4 w-4" />;
      case 'notes': return <FileText className="h-4 w-4" />;
      case 'clients': return <Users className="h-4 w-4" />;
      case 'projects': return <Database className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      default: return <Database className="h-4 w-4" />;
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

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Database className="h-6 w-6" />
            Connect to Notion
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Notion workspace to sync data, automate workflows, and enhance productivity
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <CheckSquare className="h-8 w-8 mx-auto text-blue-500" />
                <div>Task Management</div>
              </div>
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-500" />
                <div>Session Notes</div>
              </div>
              <div className="space-y-2">
                <Users className="h-8 w-8 mx-auto text-purple-500" />
                <div>Client Tracking</div>
              </div>
              <div className="space-y-2">
                <Zap className="h-8 w-8 mx-auto text-yellow-500" />
                <div>Automations</div>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleConnect}
            disabled={syncStatus === 'syncing'}
            className="w-full max-w-xs"
          >
            {syncStatus === 'syncing' ? (
              <>
                <Sync className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Connect Notion Workspace
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Notion Integration
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
              <Button 
                onClick={() => handleSync()}
                disabled={syncStatus === 'syncing'}
                variant="outline" 
                size="sm"
              >
                {syncStatus === 'syncing' ? (
                  <Sync className="h-4 w-4 animate-spin" />
                ) : (
                  <Sync className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="databases" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="databases">Databases</TabsTrigger>
          <TabsTrigger value="pages">Recent Pages</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="databases" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {databases.map((database) => (
              <Card key={database.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(database.type)}
                      <div>
                        <h3 className="font-medium">{database.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {database.recordCount.toLocaleString()} records
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSync(database.id)}
                      disabled={syncStatus === 'syncing'}
                      variant="ghost"
                      size="sm"
                    >
                      <Sync className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last sync: {formatRelativeTime(database.lastSync)}</span>
                    <Badge variant={database.isConnected ? "default" : "secondary"} className="text-xs">
                      {database.isConnected ? "Synced" : "Pending"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="mt-6">
          <div className="space-y-4">
            {recentPages.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{page.title}</h3>
                      <p className="text-sm text-muted-foreground">{page.type}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {page.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(page.lastModified)}
                      </p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Automation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Auto-create session notes"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-trigger">Trigger</Label>
                    <Input
                      id="rule-trigger"
                      value={newRule.trigger}
                      onChange={(e) => setNewRule(prev => ({ ...prev, trigger: e.target.value }))}
                      placeholder="e.g., New appointment scheduled"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rule-action">Action</Label>
                  <Textarea
                    id="rule-action"
                    value={newRule.action}
                    onChange={(e) => setNewRule(prev => ({ ...prev, action: e.target.value }))}
                    placeholder="e.g., Create Notion page with session template"
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="rule-active"
                      checked={newRule.isActive}
                      onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label htmlFor="rule-active">Active</Label>
                  </div>
                  <Button onClick={handleCreateRule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Active Automations</h3>
              {automationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>Trigger:</strong> {rule.trigger}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Action:</strong> {rule.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last run: {formatRelativeTime(rule.lastRun)} • {rule.runCount} executions
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => toggleRule(rule.id)}
                        />
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Integration Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-sync calendars</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync calendar events with Notion
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Real-time notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when automations run
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bi-directional sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Changes in either system sync automatically
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disconnect Notion</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove integration and stop all syncing
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}