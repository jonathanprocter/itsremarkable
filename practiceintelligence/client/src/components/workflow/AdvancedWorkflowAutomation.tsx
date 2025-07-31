import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Brain, 
  Clock, 
  Target, 
  TrendingUp,
  Users,
  Calendar,
  Mail,
  MessageSquare,
  FileText,
  Database,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Workflow
} from 'lucide-react';

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'communication' | 'scheduling' | 'data' | 'ai';
  complexity: 'simple' | 'intermediate' | 'advanced';
  estimatedTime: string;
  usageCount: number;
  isPopular: boolean;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft';
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  lastRun: string;
  runCount: number;
  successRate: number;
  nextRun?: string;
}

interface WorkflowTrigger {
  id: string;
  type: 'schedule' | 'event' | 'webhook' | 'ai-insight' | 'condition';
  config: Record<string, any>;
  description: string;
}

interface WorkflowAction {
  id: string;
  type: 'email' | 'calendar' | 'notion' | 'slack' | 'sms' | 'ai-task' | 'data-export';
  config: Record<string, any>;
  description: string;
}

interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: any;
  description: string;
}

export default function AdvancedWorkflowAutomation() {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const { toast } = useToast();

  // Initialize with comprehensive workflow data
  useEffect(() => {
    setWorkflows([
      {
        id: 'wf-1',
        name: 'Smart Client Onboarding',
        description: 'Automatically create Notion pages, schedule intake calls, and send welcome emails',
        status: 'active',
        triggers: [
          {
            id: 't1',
            type: 'event',
            config: { eventType: 'new_client_added' },
            description: 'New client added to system'
          }
        ],
        actions: [
          {
            id: 'a1',
            type: 'notion',
            config: { template: 'client_intake', database: 'clients' },
            description: 'Create client profile in Notion'
          },
          {
            id: 'a2',
            type: 'email',
            config: { template: 'welcome_email', delay: '0h' },
            description: 'Send welcome email'
          },
          {
            id: 'a3',
            type: 'calendar',
            config: { eventType: 'intake_call', duration: '60min', delay: '24h' },
            description: 'Schedule intake call'
          }
        ],
        conditions: [],
        lastRun: '2025-01-27T22:30:00Z',
        runCount: 47,
        successRate: 96.8,
        nextRun: '2025-01-28T09:00:00Z'
      },
      {
        id: 'wf-2',
        name: 'Weekly Performance Analytics',
        description: 'Generate performance reports and AI insights every week',
        status: 'active',
        triggers: [
          {
            id: 't2',
            type: 'schedule',
            config: { cron: '0 18 * * 0', timezone: 'EST' },
            description: 'Every Sunday at 6 PM'
          }
        ],
        actions: [
          {
            id: 'a4',
            type: 'ai-task',
            config: { task: 'generate_weekly_insights', includeMetrics: true },
            description: 'Generate AI performance insights'
          },
          {
            id: 'a5',
            type: 'notion',
            config: { template: 'weekly_report', database: 'analytics' },
            description: 'Create weekly report page'
          },
          {
            id: 'a6',
            type: 'email',
            config: { template: 'weekly_summary', recipients: ['self'] },
            description: 'Email weekly summary'
          }
        ],
        conditions: [],
        lastRun: '2025-01-26T18:00:00Z',
        runCount: 12,
        successRate: 100,
        nextRun: '2025-01-28T18:00:00Z'
      },
      {
        id: 'wf-3',
        name: 'Intelligent Appointment Follow-up',
        description: 'AI-powered follow-up based on session outcomes and client needs',
        status: 'active',
        triggers: [
          {
            id: 't3',
            type: 'event',
            config: { eventType: 'appointment_completed' },
            description: 'Appointment marked as completed'
          }
        ],
        actions: [
          {
            id: 'a7',
            type: 'ai-task',
            config: { 
              task: 'analyze_session_notes', 
              generateFollowUp: true,
              sentimentAnalysis: true 
            },
            description: 'AI analysis of session outcome'
          },
          {
            id: 'a8',
            type: 'email',
            config: { template: 'dynamic_followup', delay: '2h' },
            description: 'Send personalized follow-up email'
          }
        ],
        conditions: [
          {
            id: 'c1',
            field: 'session_type',
            operator: 'equals',
            value: 'therapy',
            description: 'Only for therapy sessions'
          }
        ],
        lastRun: '2025-01-27T20:15:00Z',
        runCount: 234,
        successRate: 94.2
      }
    ]);

    setTemplates([
      {
        id: 'tmp-1',
        name: 'Client Lifecycle Management',
        description: 'Complete automation from first contact to ongoing care',
        category: 'productivity',
        complexity: 'advanced',
        estimatedTime: '2-3 hours setup',
        usageCount: 156,
        isPopular: true
      },
      {
        id: 'tmp-2',
        name: 'Smart Scheduling Assistant',
        description: 'AI-powered scheduling with conflict detection and optimization',
        category: 'scheduling',
        complexity: 'intermediate',
        estimatedTime: '45 minutes setup',
        usageCount: 203,
        isPopular: true
      },
      {
        id: 'tmp-3',
        name: 'Communication Hub',
        description: 'Centralized messaging across email, SMS, and Slack',
        category: 'communication',
        complexity: 'intermediate',
        estimatedTime: '1 hour setup',
        usageCount: 89,
        isPopular: false
      },
      {
        id: 'tmp-4',
        name: 'Data Intelligence Pipeline',
        description: 'Automated data collection, analysis, and reporting',
        category: 'data',
        complexity: 'advanced',
        estimatedTime: '3-4 hours setup',
        usageCount: 67,
        isPopular: false
      },
      {
        id: 'tmp-5',
        name: 'AI-Powered Insights Engine',
        description: 'Machine learning models for predictive analytics',
        category: 'ai',
        complexity: 'advanced',
        estimatedTime: '4-5 hours setup',
        usageCount: 34,
        isPopular: false
      }
    ]);
  }, []);

  const handleCreateWorkflow = () => {
    setIsCreating(true);
    
    // Simulate workflow creation
    setTimeout(() => {
      const newWorkflow: AutomationWorkflow = {
        id: `wf-${Date.now()}`,
        name: 'New Workflow',
        description: 'Custom workflow created from template',
        status: 'draft',
        triggers: [],
        actions: [],
        conditions: [],
        lastRun: new Date().toISOString(),
        runCount: 0,
        successRate: 0
      };
      
      setWorkflows(prev => [...prev, newWorkflow]);
      setIsCreating(false);
      
      toast({
        title: "Workflow Created",
        description: "New workflow has been created successfully",
        variant: "default"
      });
    }, 1500);
  };

  const handleToggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: wf.status === 'active' ? 'paused' : 'active' }
        : wf
    ));
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'productivity': return <Target className="h-4 w-4" />;
      case 'communication': return <MessageSquare className="h-4 w-4" />;
      case 'scheduling': return <Calendar className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'ai': return <Brain className="h-4 w-4" />;
      default: return <Workflow className="h-4 w-4" />;
    }
  };

  const filteredTemplates = templates.filter(template => 
    filterCategory === 'all' || template.category === filterCategory
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-6 w-6" />
              Advanced Workflow Automation
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {workflows.filter(wf => wf.status === 'active').length} Active
              </Badge>
              <Button onClick={handleCreateWorkflow} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{workflows.length}</p>
                    <p className="text-sm text-muted-foreground">Total Workflows</p>
                  </div>
                  <Workflow className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">
                      {workflows.reduce((sum, wf) => sum + wf.runCount, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Executions</p>
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
                      {workflows.length > 0 
                        ? Math.round(workflows.reduce((sum, wf) => sum + wf.successRate, 0) / workflows.length)
                        : 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows
                  .sort((a, b) => new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime())
                  .slice(0, 5)
                  .map((workflow) => (
                    <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          workflow.status === 'active' ? 'bg-green-100' : 
                          workflow.status === 'paused' ? 'bg-yellow-100' : 'bg-gray-100'
                        }`}>
                          {workflow.status === 'active' ? (
                            <Play className="h-4 w-4 text-green-600" />
                          ) : workflow.status === 'paused' ? (
                            <Pause className="h-4 w-4 text-yellow-600" />
                          ) : (
                            <Settings className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{workflow.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Last run: {formatRelativeTime(workflow.lastRun)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {workflow.successRate}% success
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium">{workflow.name}</h3>
                        <Badge variant={
                          workflow.status === 'active' ? 'default' : 
                          workflow.status === 'paused' ? 'secondary' : 'outline'
                        }>
                          {workflow.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{workflow.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{workflow.triggers.length} triggers</span>
                        <span>{workflow.actions.length} actions</span>
                        <span>{workflow.conditions.length} conditions</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <span>Runs: {workflow.runCount}</span>
                        <span>Success: {workflow.successRate}%</span>
                        {workflow.nextRun && (
                          <span>Next: {formatRelativeTime(workflow.nextRun)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWorkflow(workflow.id)}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Workflow Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-built automation templates to get you started quickly
                </p>
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="scheduling">Scheduling</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="ai">AI & Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="relative">
                  {template.isPopular && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="bg-orange-100 text-orange-800">
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(template.category)}
                        <div className="flex-1">
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getComplexityColor(template.complexity)}>
                          {template.complexity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.estimatedTime}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Used by {template.usageCount} people
                        </span>
                        <Button 
                          size="sm"
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          Use Template
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Execution Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>This Week</span>
                    <span className="font-medium">247 runs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Week</span>
                    <span className="font-medium">189 runs</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Growth</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      +30.7%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Success Rate</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Failed Workflows</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Time Saved</span>
                    <span className="font-medium">47.3 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}