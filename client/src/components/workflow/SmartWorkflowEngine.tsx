import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Cpu, 
  Activity, 
  TrendingUp, 
  Zap, 
  Eye, 
  Target, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Settings,
  Play,
  Pause,
  BarChart3,
  Lightbulb,
  Workflow,
  Bot
} from 'lucide-react';

interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'optimization' | 'prediction' | 'anomaly' | 'recommendation';
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  timestamp: string;
}

interface SmartRule {
  id: string;
  name: string;
  description: string;
  aiModel: 'pattern_detection' | 'predictive_analytics' | 'sentiment_analysis' | 'optimization';
  isActive: boolean;
  learningEnabled: boolean;
  accuracy: number;
  lastTrained: string;
  runsCount: number;
}

interface WorkflowMetrics {
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  timeSaved: number;
  errorCount: number;
  optimizationOpportunities: number;
}

export default function SmartWorkflowEngine() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [smartRules, setSmartRules] = useState<SmartRule[]>([]);
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('pattern_detection');
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with comprehensive AI insights and smart rules
    setInsights([
      {
        id: 'insight-1',
        title: 'Optimal Scheduling Pattern Detected',
        description: 'AI analysis shows 23% higher client satisfaction when appointments are scheduled with 15-minute buffers between sessions.',
        type: 'optimization',
        confidence: 94.2,
        impact: 'high',
        actionable: true,
        timestamp: '2025-01-27T23:30:00Z'
      },
      {
        id: 'insight-2',
        title: 'Predicted Capacity Constraint',
        description: 'Machine learning models predict 78% probability of overbooking in Week 6 of February based on current trends.',
        type: 'prediction',
        confidence: 78.5,
        impact: 'high',
        actionable: true,
        timestamp: '2025-01-27T22:15:00Z'
      },
      {
        id: 'insight-3',
        title: 'Communication Pattern Anomaly',
        description: 'Unusual spike in follow-up email response times detected. Average increased from 2.3h to 8.7h over past week.',
        type: 'anomaly',
        confidence: 89.1,
        impact: 'medium',
        actionable: true,
        timestamp: '2025-01-27T21:45:00Z'
      },
      {
        id: 'insight-4',
        title: 'Workflow Efficiency Recommendation',
        description: 'Implementing auto-categorization for session notes could save approximately 47 minutes per week.',
        type: 'recommendation',
        confidence: 85.7,
        impact: 'medium',
        actionable: true,
        timestamp: '2025-01-27T20:30:00Z'
      }
    ]);

    setSmartRules([
      {
        id: 'rule-1',
        name: 'Intelligent Session Preparation',
        description: 'AI prepares personalized session materials based on client history and recent communications',
        aiModel: 'pattern_detection',
        isActive: true,
        learningEnabled: true,
        accuracy: 92.4,
        lastTrained: '2025-01-27T18:00:00Z',
        runsCount: 156
      },
      {
        id: 'rule-2',
        name: 'Predictive Scheduling Assistant',
        description: 'Machine learning optimizes appointment scheduling based on client preferences and success patterns',
        aiModel: 'predictive_analytics',
        isActive: true,
        learningEnabled: true,
        accuracy: 87.9,
        lastTrained: '2025-01-27T12:00:00Z',
        runsCount: 203
      },
      {
        id: 'rule-3',
        name: 'Sentiment-Based Follow-up',
        description: 'Natural language processing analyzes session notes to customize follow-up communications',
        aiModel: 'sentiment_analysis',
        isActive: false,
        learningEnabled: true,
        accuracy: 84.2,
        lastTrained: '2025-01-26T16:30:00Z',
        runsCount: 78
      },
      {
        id: 'rule-4',
        name: 'Workflow Optimization Engine',
        description: 'Continuous optimization of task sequences and resource allocation based on performance data',
        aiModel: 'optimization',
        isActive: true,
        learningEnabled: true,
        accuracy: 91.7,
        lastTrained: '2025-01-27T14:15:00Z',
        runsCount: 134
      }
    ]);

    setMetrics({
      totalExecutions: 2847,
      successRate: 94.2,
      averageExecutionTime: 3.7,
      timeSaved: 127.4,
      errorCount: 12,
      optimizationOpportunities: 5
    });
  }, []);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      const newInsight: AIInsight = {
        id: `insight-${Date.now()}`,
        title: 'New AI Insight Generated',
        description: 'Fresh analysis completed using latest workflow data and machine learning models.',
        type: 'optimization',
        confidence: Math.round(Math.random() * 20 + 80),
        impact: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as 'high' | 'medium' | 'low',
        actionable: true,
        timestamp: new Date().toISOString()
      };
      
      setInsights(prev => [newInsight, ...prev]);
      setIsAnalyzing(false);
      
      toast({
        title: "AI Analysis Complete",
        description: "New insights and recommendations generated",
        variant: "default"
      });
    }, 3000);
  };

  const toggleSmartRule = (ruleId: string) => {
    setSmartRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const toggleLearning = (ruleId: string) => {
    setSmartRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, learningEnabled: !rule.learningEnabled } : rule
    ));
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <Target className="h-4 w-4" />;
      case 'prediction': return <TrendingUp className="h-4 w-4" />;
      case 'anomaly': return <AlertTriangle className="h-4 w-4" />;
      case 'recommendation': return <Lightbulb className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModelIcon = (model: string) => {
    switch (model) {
      case 'pattern_detection': return <Eye className="h-4 w-4" />;
      case 'predictive_analytics': return <TrendingUp className="h-4 w-4" />;
      case 'sentiment_analysis': return <Activity className="h-4 w-4" />;
      case 'optimization': return <Target className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              Smart Workflow Engine
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                AI Powered
              </Badge>
              <Button 
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                variant="outline"
              >
                {isAnalyzing ? (
                  <>
                    <Cpu className="h-4 w-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4 mr-2" />
                    Run AI Analysis
                  </>
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="smart-rules">Smart Rules</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">AI-Generated Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Machine learning analysis of your workflow patterns and performance
                </p>
              </div>
              <Badge variant="outline">
                {insights.length} Active Insights
              </Badge>
            </div>

            {insights.map((insight) => (
              <Card key={insight.id} className="relative">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${
                      insight.type === 'optimization' ? 'bg-blue-100' :
                      insight.type === 'prediction' ? 'bg-purple-100' :
                      insight.type === 'anomaly' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {getInsightIcon(insight.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{insight.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {insight.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Confidence: {insight.confidence}%</span>
                        <span>Generated: {formatRelativeTime(insight.timestamp)}</span>
                        <Badge variant="outline" className="text-xs">
                          {insight.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="smart-rules" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Smart Automation Rules</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered rules that learn and adapt to your workflow patterns
                </p>
              </div>
              <Button>
                <Bot className="h-4 w-4 mr-2" />
                Create Smart Rule
              </Button>
            </div>

            {smartRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {getModelIcon(rule.aiModel)}
                        <div>
                          <h4 className="font-medium">{rule.name}</h4>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {rule.aiModel.replace('_', ' ')}
                        </Badge>
                        <span>Accuracy: {rule.accuracy}%</span>
                        <span>{rule.runsCount} executions</span>
                        <span>Trained: {formatRelativeTime(rule.lastTrained)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`learning-${rule.id}`} className="text-sm">
                          Learning
                        </Label>
                        <Switch
                          id={`learning-${rule.id}`}
                          checked={rule.learningEnabled}
                          onCheckedChange={() => toggleLearning(rule.id)}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`active-${rule.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch
                          id={`active-${rule.id}`}
                          checked={rule.isActive}
                          onCheckedChange={() => toggleSmartRule(rule.id)}
                        />
                      </div>
                      
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

        <TabsContent value="metrics" className="mt-6">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.totalExecutions.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">Total Executions</p>
                    </div>
                    <Workflow className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.successRate}%</p>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.timeSaved}h</p>
                      <p className="text-sm text-muted-foreground">Time Saved</p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.averageExecutionTime}s</p>
                      <p className="text-sm text-muted-foreground">Avg Execution Time</p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.errorCount}</p>
                      <p className="text-sm text-muted-foreground">Error Count</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{metrics.optimizationOpportunities}</p>
                      <p className="text-sm text-muted-foreground">Optimization Opportunities</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="models" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Pattern Detection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Identifies recurring patterns in workflows and user behavior to suggest optimizations.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Accuracy</span>
                    <Badge variant="outline">92.4%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Training Data</span>
                    <Badge variant="outline">15.2k samples</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Retrain Model
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Predictive Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Forecasts future workload, capacity needs, and potential scheduling conflicts.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Accuracy</span>
                    <Badge variant="outline">87.9%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Prediction Horizon</span>
                    <Badge variant="outline">30 days</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Update Forecasts
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Analyzes communication tone and client feedback to improve interactions.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Model Accuracy</span>
                    <Badge variant="outline">84.2%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Languages</span>
                    <Badge variant="outline">12 supported</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Configure Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Workflow Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Continuously optimizes task sequences and resource allocation for maximum efficiency.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Optimization Score</span>
                    <Badge variant="outline">91.7%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Rules</span>
                    <Badge variant="outline">{smartRules.filter(r => r.isActive).length}</Badge>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Run Optimization
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}