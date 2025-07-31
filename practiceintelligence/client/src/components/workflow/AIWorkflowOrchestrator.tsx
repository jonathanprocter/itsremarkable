import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Brain, 
  Cpu, 
  Activity, 
  Target, 
  Zap,
  Eye,
  TrendingUp,
  Clock,
  Play,
  Pause,
  Settings,
  BarChart3,
  Network,
  Workflow,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface AIWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'error';
  progress: number;
  priority: 'high' | 'medium' | 'low';
  estimatedCompletion: string;
  steps: WorkflowStep[];
  metrics: WorkflowMetrics;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  aiModel: string;
  confidence: number;
  processingTime: number;
}

interface WorkflowMetrics {
  accuracy: number;
  efficiency: number;
  resourceUsage: number;
  timeSaved: number;
}

export default function AIWorkflowOrchestrator() {
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
  const [globalMetrics, setGlobalMetrics] = useState({
    totalWorkflows: 0,
    activeWorkflows: 0,
    completionRate: 0,
    averageAccuracy: 0
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with comprehensive AI workflow data
    setWorkflows([
      {
        id: 'ai-wf-1',
        name: 'Intelligent Client Onboarding',
        description: 'AI-driven client intake with document processing and sentiment analysis',
        status: 'running',
        progress: 67,
        priority: 'high',
        estimatedCompletion: '2025-01-28T09:30:00Z',
        steps: [
          {
            id: 'step-1',
            name: 'Document Analysis',
            status: 'completed',
            aiModel: 'GPT-4V',
            confidence: 94.2,
            processingTime: 2.3
          },
          {
            id: 'step-2',
            name: 'Risk Assessment',
            status: 'running',
            aiModel: 'Custom ML Model',
            confidence: 87.1,
            processingTime: 1.8
          },
          {
            id: 'step-3',
            name: 'Recommendation Generation',
            status: 'pending',
            aiModel: 'Claude 3.5',
            confidence: 0,
            processingTime: 0
          }
        ],
        metrics: {
          accuracy: 94.2,
          efficiency: 89.7,
          resourceUsage: 23.4,
          timeSaved: 4.7
        }
      },
      {
        id: 'ai-wf-2',
        name: 'Predictive Scheduling Optimization',
        description: 'Machine learning-powered scheduling with conflict prediction and resource optimization',
        status: 'running',
        progress: 89,
        priority: 'medium',
        estimatedCompletion: '2025-01-28T11:15:00Z',
        steps: [
          {
            id: 'step-4',
            name: 'Pattern Recognition',
            status: 'completed',
            aiModel: 'Neural Network',
            confidence: 91.5,
            processingTime: 3.2
          },
          {
            id: 'step-5',
            name: 'Conflict Detection',
            status: 'completed',
            aiModel: 'Decision Tree',
            confidence: 88.9,
            processingTime: 1.1
          },
          {
            id: 'step-6',
            name: 'Optimization Engine',
            status: 'running',
            aiModel: 'Genetic Algorithm',
            confidence: 92.3,
            processingTime: 5.7
          }
        ],
        metrics: {
          accuracy: 91.5,
          efficiency: 94.3,
          resourceUsage: 34.1,
          timeSaved: 8.2
        }
      },
      {
        id: 'ai-wf-3',
        name: 'Automated Quality Assurance',
        description: 'AI-powered quality control for workflows and data integrity',
        status: 'completed',
        progress: 100,
        priority: 'low',
        estimatedCompletion: '2025-01-27T16:00:00Z',
        steps: [
          {
            id: 'step-7',
            name: 'Data Validation',
            status: 'completed',
            aiModel: 'Anomaly Detection',
            confidence: 96.8,
            processingTime: 0.9
          },
          {
            id: 'step-8',
            name: 'Process Verification',
            status: 'completed',
            aiModel: 'Rule-based AI',
            confidence: 99.1,
            processingTime: 1.3
          },
          {
            id: 'step-9',
            name: 'Report Generation',
            status: 'completed',
            aiModel: 'NLP Generator',
            confidence: 93.7,
            processingTime: 2.1
          }
        ],
        metrics: {
          accuracy: 96.8,
          efficiency: 87.2,
          resourceUsage: 12.8,
          timeSaved: 3.4
        }
      }
    ]);

    setGlobalMetrics({
      totalWorkflows: 3,
      activeWorkflows: 2,
      completionRate: 94.6,
      averageAccuracy: 94.2
    });
  }, []);

  const handlePauseWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: wf.status === 'running' ? 'paused' : 'running' }
        : wf
    ));
  };

  const handleRestartWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.map(wf => 
      wf.id === workflowId 
        ? { ...wf, status: 'running', progress: 0 }
        : wf
    ));

    toast({
      title: "Workflow Restarted",
      description: "AI workflow has been restarted and is now processing",
      variant: "default"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 text-green-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'running': return <Activity className="h-3 w-3 text-blue-500 animate-pulse" />;
      case 'error': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6" />
              AI Workflow Orchestrator
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              {globalMetrics.activeWorkflows} Active
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="relative">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(workflow.status)}
                          <h3 className="text-lg font-medium">{workflow.name}</h3>
                          <Badge className={getPriorityColor(workflow.priority)}>
                            {workflow.priority} priority
                          </Badge>
                        </div>
                        <p className="text-muted-foreground">{workflow.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePauseWorkflow(workflow.id)}
                          disabled={workflow.status === 'completed'}
                        >
                          {workflow.status === 'running' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestartWorkflow(workflow.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {workflow.status !== 'completed' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{workflow.progress}%</span>
                        </div>
                        <Progress value={workflow.progress} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          Estimated completion: {formatRelativeTime(workflow.estimatedCompletion)}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Workflow Steps</h4>
                      <div className="space-y-2">
                        {workflow.steps.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium w-4 text-center">{index + 1}</span>
                              {getStepStatusIcon(step.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{step.name}</span>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{step.aiModel}</span>
                                  {step.confidence > 0 && (
                                    <span>{step.confidence}% confidence</span>
                                  )}
                                  {step.processingTime > 0 && (
                                    <span>{step.processingTime}s</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {workflow.metrics.accuracy}%
                        </div>
                        <div className="text-xs text-muted-foreground">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {workflow.metrics.efficiency}%
                        </div>
                        <div className="text-xs text-muted-foreground">Efficiency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {workflow.metrics.resourceUsage}%
                        </div>
                        <div className="text-xs text-muted-foreground">Resources</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {workflow.metrics.timeSaved}h
                        </div>
                        <div className="text-xs text-muted-foreground">Time Saved</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{globalMetrics.totalWorkflows}</p>
                    <p className="text-sm text-muted-foreground">Total Workflows</p>
                  </div>
                  <Network className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{globalMetrics.activeWorkflows}</p>
                    <p className="text-sm text-muted-foreground">Active Workflows</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{globalMetrics.completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{globalMetrics.averageAccuracy}%</p>
                    <p className="text-sm text-muted-foreground">Average Accuracy</p>
                  </div>
                  <Target className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Processing Speed</span>
                  <div className="flex items-center gap-2">
                    <Progress value={87} className="w-32" />
                    <span className="text-sm font-medium">87%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Resource Efficiency</span>
                  <div className="flex items-center gap-2">
                    <Progress value={92} className="w-32" />
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Error Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress value={8} className="w-32 [&>div]:bg-red-500" />
                    <span className="text-sm font-medium">8%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Large Language Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GPT-4V</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Claude 3.5 Sonnet</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gemini Pro</span>
                    <Badge variant="outline">Standby</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Specialized Models
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Anomaly Detection</span>
                    <Badge variant="outline">Running</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Neural Network</span>
                    <Badge variant="outline">Training</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Decision Tree</span>
                    <Badge variant="outline">Ready</Badge>
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