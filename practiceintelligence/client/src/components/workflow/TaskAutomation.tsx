import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Calendar, CheckCircle, Clock, Plus, Settings, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskAutomationProps {
  events: any[];
}

export function TaskAutomation({ events }: TaskAutomationProps) {
  const [selectedTrigger, setSelectedTrigger] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [automationName, setAutomationName] = useState("");
  const [automationDescription, setAutomationDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing automations
  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['/api/automations'],
    queryFn: async () => {
      const response = await fetch('/api/automations').catch(error => console.error("Fetch error:", error));
      if (!response.ok) throw new Error('Failed to fetch automations');
      return response.json();
    }
  });

  // Create automation mutation
  const createAutomationMutation = useMutation({
    mutationFn: async (automationData: any) => {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationData).catch(error => console.error("Fetch error:", error))
      });
      if (!response.ok) throw new Error('Failed to create automation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
      toast({
        title: "Automation Created",
        description: "Your workflow automation has been successfully created.",
      });
      setAutomationName("");
      setAutomationDescription("");
      setSelectedTrigger("");
      setSelectedAction("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create automation",
        variant: "destructive"
      });
    }
  });

  // Toggle automation mutation
  const toggleAutomationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }).catch(error => console.error("Fetch error:", error))
      });
      if (!response.ok) throw new Error('Failed to update automation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/automations'] });
    }
  });

  const handleCreateAutomation = () => {
    if (!automationName || !selectedTrigger || !selectedAction) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const automationData = {
      name: automationName,
      description: automationDescription,
      triggerType: selectedTrigger,
      actionType: selectedAction,
      isActive,
      triggerConfig: getTriggerConfig(),
      actionConfig: getActionConfig()
    };

    createAutomationMutation.mutate(automationData);
  };

  const getTriggerConfig = () => {
    switch (selectedTrigger) {
      case 'appointment_created':
        return { eventTypes: ['simplepractice', 'manual'], timeWindow: 'immediate' };
      case 'appointment_canceled':
        return { eventTypes: ['simplepractice'], notificationDelay: 5 };
      case 'daily_schedule':
        return { time: '07:00', weekdays: [1, 2, 3, 4, 5] };
      case 'conflict_detected':
        return { severity: ['high', 'medium'], autoResolve: false };
      default:
        return {};
    }
  };

  const getActionConfig = () => {
    switch (selectedAction) {
      case 'send_notification':
        return { channels: ['email', 'browser'], template: 'default' };
      case 'create_task':
        return { priority: 'normal', assignToSelf: true };
      case 'update_calendar':
        return { addBuffer: 15, location: 'auto' };
      case 'generate_report':
        return { format: 'pdf', includeNotes: true };
      default:
        return {};
    }
  };

  const triggerOptions = [
    { value: 'appointment_created', label: 'New Appointment Created', description: 'Triggers when a new appointment is scheduled' },
    { value: 'appointment_canceled', label: 'Appointment Canceled', description: 'Triggers when an appointment is canceled' },
    { value: 'daily_schedule', label: 'Daily Schedule Ready', description: 'Triggers at start of each workday' },
    { value: 'conflict_detected', label: 'Schedule Conflict Detected', description: 'Triggers when scheduling conflicts are found' },
    { value: 'client_created', label: 'New Client Added', description: 'Triggers when a new client is added to the system' },
    { value: 'revenue_milestone', label: 'Revenue Milestone Reached', description: 'Triggers when monthly revenue goals are met' }
  ];

  const actionOptions = [
    { value: 'send_notification', label: 'Send Notification', description: 'Send email, SMS, or browser notification' },
    { value: 'create_task', label: 'Create Task', description: 'Automatically create a follow-up task' },
    { value: 'update_calendar', label: 'Update Calendar', description: 'Modify calendar events or add buffer time' },
    { value: 'generate_report', label: 'Generate Report', description: 'Create automated reports or summaries' },
    { value: 'sync_external', label: 'Sync External System', description: 'Update CRM, practice management, or other tools' },
    { value: 'archive_event', label: 'Archive Event', description: 'Move completed events to archive storage' }
  ];

  const getStatusBadge = (automation: any) => {
    if (!automation.isActive) return <Badge variant="secondary">Inactive</Badge>;
    if (automation.lastTriggered) return <Badge variant="default">Active</Badge>;
    return <Badge variant="outline">Waiting</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Workflow Automation
          </CardTitle>
          <CardDescription>
            Automate routine tasks and streamline your productivity workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Automation</TabsTrigger>
              <TabsTrigger value="manage">Manage Automations</TabsTrigger>
            </TabsList>

            {/* Create Automation Tab */}
            <TabsContent value="create" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Automation Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Auto-create follow-up tasks"
                    value={automationName}
                    onChange={(e) => setAutomationName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <span className="text-sm text-muted-foreground">
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this automation does..."
                  value={automationDescription}
                  onChange={(e) => setAutomationDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>When (Trigger)</Label>
                  <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="space-y-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Then (Action)</Label>
                  <Select value={selectedAction} onValueChange={setSelectedAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action to perform" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="space-y-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCreateAutomation}
                disabled={createAutomationMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Automation
              </Button>
            </TabsContent>

            {/* Manage Automations Tab */}
            <TabsContent value="manage" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-6">Loading automations...</div>
              ) : automations.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No automations created yet. Create your first automation to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {automations.map((automation: any) => (
                    <Card key={automation.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{automation.name}</h3>
                              {getStatusBadge(automation)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              When {triggerOptions.find(t => t.value === automation.triggerType)?.label} → 
                              Then {actionOptions.find(a => a.value === automation.actionType)?.label}
                            </p>
                            {automation.description && (
                              <p className="text-xs text-muted-foreground">{automation.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={automation.isActive}
                              onCheckedChange={(checked) => 
                                toggleAutomationMutation.mutate({ id: automation.id, isActive: checked })
                              }
                            />
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Automation Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Automation Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{automations.filter((a: any) => a.isActive).length}</div>
              <div className="text-sm text-muted-foreground">Active Automations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {automations.reduce((sum: number, a: any) => sum + (a.timesTriggered || 0), 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Triggers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(automations.reduce((sum: number, a: any) => sum + (a.timeSaved || 0), 0) / 60)}h
              </div>
              <div className="text-sm text-muted-foreground">Time Saved</div>
            </div>
          </div>

          {/* Quick Setup Suggestions */}
          <div className="mt-6 space-y-2">
            <h3 className="font-medium">Quick Setup Suggestions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Daily Schedule Prep</div>
                <div className="text-xs text-blue-600">Auto-generate daily task list from calendar events</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">Conflict Resolution</div>
                <div className="text-xs text-green-600">Automatically notify when scheduling conflicts arise</div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-sm font-medium text-purple-800">Client Follow-up</div>
                <div className="text-xs text-purple-600">Create follow-up tasks after appointments</div>
              </div>
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-sm font-medium text-orange-800">Revenue Tracking</div>
                <div className="text-xs text-orange-600">Update revenue records when sessions are completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}