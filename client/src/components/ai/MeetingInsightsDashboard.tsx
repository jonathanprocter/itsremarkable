import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  BarChart3,
  Zap,
  Star
} from 'lucide-react';

interface MeetingInsight {
  id: string;
  meetingTitle: string;
  client: string;
  date: Date;
  duration: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  engagement: number;
  keyTopics: string[];
  actionItems: string[];
  followUpNeeded: boolean;
  riskFactors: string[];
  insights: string[];
}

interface AIRecommendation {
  id: string;
  type: 'scheduling' | 'preparation' | 'follow-up' | 'intervention';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  client?: string;
  impact: string;
}

export function MeetingInsightsDashboard({ events }: { events: any[] }) {
  const [insights, setInsights] = useState<MeetingInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<MeetingInsight | null>(null);

  useEffect(() => {
    // Generate AI insights from calendar events
    const generateInsights = () => {
      const recentAppointments = events
        .filter(event => event.title.toLowerCase().includes('appointment'))
        .slice(0, 10);

      const mockInsights: MeetingInsight[] = recentAppointments.map((event, index) => ({
        id: event.id || index.toString(),
        meetingTitle: event.title,
        client: event.title.replace(' Appointment', ''),
        date: new Date(event.startTime),
        duration: 60,
        sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
        engagement: Math.floor(Math.random() * 40) + 60, // 60-100
        keyTopics: [
          'Progress Review',
          'Goal Setting',
          'Coping Strategies',
          'Family Dynamics',
          'Work Stress'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        actionItems: [
          'Schedule follow-up session',
          'Prepare homework exercises',
          'Research additional resources',
          'Coordinate with family members'
        ].slice(0, Math.floor(Math.random() * 2) + 1),
        followUpNeeded: Math.random() > 0.3,
        riskFactors: Math.random() > 0.7 ? ['Session cancellation pattern', 'Missed payments'] : [],
        insights: [
          'Client showing significant improvement',
          'May benefit from group therapy',
          'Consider CBT techniques',
          'Family support system is strong'
        ].slice(0, Math.floor(Math.random() * 2) + 1)
      }));

      const mockRecommendations: AIRecommendation[] = [
        {
          id: '1',
          type: 'intervention',
          priority: 'high',
          title: 'Client Engagement Alert',
          description: 'Sarah Palladino has shown decreased engagement in last 3 sessions',
          client: 'Sarah Palladino',
          impact: 'Risk of treatment dropout'
        },
        {
          id: '2',
          type: 'scheduling',
          priority: 'medium',
          title: 'Optimal Session Timing',
          description: 'Brian Kolsch shows 23% better engagement in morning sessions',
          client: 'Brian Kolsch',
          impact: 'Improved treatment outcomes'
        },
        {
          id: '3',
          type: 'preparation',
          priority: 'medium',
          title: 'Resource Recommendation',
          description: 'Multiple clients could benefit from stress management workshop',
          impact: 'Efficiency improvement'
        },
        {
          id: '4',
          type: 'follow-up',
          priority: 'low',
          title: 'Progress Milestone',
          description: 'Max Moskowitz has completed 12 sessions - consider graduation plan',
          client: 'Max Moskowitz',
          impact: 'Treatment completion'
        }
      ];

      setInsights(mockInsights);
      setRecommendations(mockRecommendations);
    };

    generateInsights();
  }, [events]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😟';
      default: return '😐';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const averageEngagement = insights.length > 0 
    ? Math.round(insights.reduce((sum, i) => sum + i.engagement, 0) / insights.length)
    : 0;

  const positiveOutcomes = insights.filter(i => i.sentiment === 'positive').length;
  const followUpRequired = insights.filter(i => i.followUpNeeded).length;
  const riskClients = insights.filter(i => i.riskFactors.length > 0).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageEngagement}%</div>
            <Progress value={averageEngagement} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Outcomes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{positiveOutcomes}</div>
            <p className="text-xs text-muted-foreground">
              of {insights.length} recent sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpRequired}</div>
            <p className="text-xs text-muted-foreground">
              requiring attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{riskClients}</div>
            <p className="text-xs text-muted-foreground">
              clients at risk
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">Session Insights</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="trends">Trends & Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Session Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {insights.slice(0, 8).map((insight) => (
                    <div 
                      key={insight.id} 
                      className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedInsight(insight)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium truncate">{insight.client}</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getSentimentIcon(insight.sentiment)}</span>
                          <Badge variant="outline" className="text-xs">
                            {insight.engagement}% engagement
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {insight.date.toLocaleDateString()} • {insight.duration}min session
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {insight.keyTopics.slice(0, 2).map((topic, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {insight.riskFactors.length > 0 && (
                          <Badge className="text-xs bg-red-100 text-red-800">
                            ⚠️ Risk
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedInsight && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Session Details</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedInsight(null)}
                    >
                      ×
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Client: {selectedInsight.client}</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedInsight.date.toLocaleDateString()} • {selectedInsight.duration} minutes
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Key Topics Discussed</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedInsight.keyTopics.map((topic, idx) => (
                        <Badge key={idx} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">AI Insights</h4>
                    <ul className="space-y-1">
                      {selectedInsight.insights.map((insight, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Action Items</h4>
                    <ul className="space-y-1">
                      {selectedInsight.actionItems.map((item, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedInsight.riskFactors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Risk Factors</h4>
                      <ul className="space-y-1">
                        {selectedInsight.riskFactors.map((risk, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          {rec.priority.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {rec.type.replace('-', ' ').toUpperCase()}
                        </Badge>
                        {rec.client && (
                          <Badge variant="secondary">
                            {rec.client}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium mb-1">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        <span className="text-blue-600">{rec.impact}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Review
                      </Button>
                      <Button size="sm">
                        Implement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Engagement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, idx) => {
                    const engagement = Math.floor(Math.random() * 30) + 70;
                    return (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day}</span>
                        <div className="flex items-center gap-3 w-32">
                          <Progress value={engagement} className="flex-1" />
                          <span className="text-sm w-8 text-right">{engagement}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Progress Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">High Performers</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(insights.length * 0.3)} clients showing excellent progress
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Breakthrough Sessions</div>
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(insights.length * 0.15)} significant breakthroughs this week
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">Engagement Score</div>
                    <div className="text-sm text-muted-foreground">
                      Average {averageEngagement}% (↑ 8% from last week)
                    </div>
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