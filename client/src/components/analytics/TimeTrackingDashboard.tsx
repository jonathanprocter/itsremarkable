import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Target, 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign,
  BarChart3,
  Timer,
  Play,
  Pause,
  Square,
  CheckCircle
} from 'lucide-react';

interface TimeEntry {
  id: string;
  task: string;
  client: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  category: 'focused' | 'meeting' | 'admin' | 'break';
  billable: boolean;
  rate?: number;
}

interface ProductivityMetrics {
  totalHours: number;
  billableHours: number;
  focusedHours: number;
  meetingHours: number;
  utilization: number;
  revenue: number;
  efficiency: number;
}

export function TimeTrackingDashboard({ events }: { events: any[] }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState('');
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    totalHours: 0,
    billableHours: 0,
    focusedHours: 0,
    meetingHours: 0,
    utilization: 0,
    revenue: 0,
    efficiency: 0
  });

  useEffect(() => {
    // Initialize with sample data and calculate metrics from events
    const mockEntries: TimeEntry[] = [
      {
        id: '1',
        task: 'Client Session - Sarah Palladino',
        client: 'Sarah Palladino', 
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() - 2700000),
        duration: 60,
        category: 'meeting',
        billable: true,
        rate: 150
      },
      {
        id: '2',
        task: 'Session Notes Review',
        client: 'Admin',
        startTime: new Date(Date.now() - 2700000),
        endTime: new Date(Date.now() - 2400000),
        duration: 30,
        category: 'focused',
        billable: false
      },
      {
        id: '3',
        task: 'Client Prep - Brian Kolsch',
        client: 'Brian Kolsch',
        startTime: new Date(Date.now() - 2400000),
        endTime: new Date(Date.now() - 2100000),
        duration: 30,
        category: 'focused',
        billable: true,
        rate: 75
      }
    ];

    setTimeEntries(mockEntries);
    calculateMetrics(mockEntries, events);
  }, [events]);

  const calculateMetrics = (entries: TimeEntry[], calendarEvents: any[]) => {
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
    const billableMinutes = entries.filter(e => e.billable).reduce((sum, entry) => sum + entry.duration, 0);
    const focusedMinutes = entries.filter(e => e.category === 'focused').reduce((sum, entry) => sum + entry.duration, 0);
    const meetingMinutes = entries.filter(e => e.category === 'meeting').reduce((sum, entry) => sum + entry.duration, 0);
    
    const revenue = entries
      .filter(e => e.billable && e.rate)
      .reduce((sum, entry) => sum + (entry.duration / 60) * (entry.rate || 0), 0);

    const workingHours = 8; // Standard work day
    const utilization = Math.min(100, (totalMinutes / (workingHours * 60)) * 100);
    const efficiency = billableMinutes > 0 ? (revenue / (billableMinutes / 60)) : 0;

    setMetrics({
      totalHours: totalMinutes / 60,
      billableHours: billableMinutes / 60,
      focusedHours: focusedMinutes / 60,
      meetingHours: meetingMinutes / 60,
      utilization,
      revenue,
      efficiency
    });
  };

  const startTimer = (task: string) => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      task,
      client: 'Current',
      startTime: new Date(),
      duration: 0,
      category: 'focused',
      billable: false
    };
    
    setTimeEntries(prev => [...prev, newEntry]);
    setActiveTimer(newEntry.id);
    setCurrentTask(task);
  };

  const stopTimer = () => {
    if (activeTimer) {
      setTimeEntries(prev => prev.map(entry => {
        if (entry.id === activeTimer) {
          const endTime = new Date();
          const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 60000);
          return { ...entry, endTime, duration };
        }
        return entry;
      }));
      setActiveTimer(null);
      setCurrentTask('');
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meeting': return 'bg-blue-100 text-blue-800';
      case 'focused': return 'bg-green-100 text-green-800';
      case 'admin': return 'bg-yellow-100 text-yellow-800';
      case 'break': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalHours.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.billableHours.toFixed(1)} billable
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.utilization.toFixed(0)}%</div>
            <Progress value={metrics.utilization} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.revenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Today's earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Focus Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.focusedHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Deep work sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Timer */}
      {activeTimer && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Active Timer
              </div>
              <Button onClick={stopTimer} variant="outline" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{currentTask}</div>
            <div className="text-sm text-muted-foreground">Started at {new Date().toLocaleTimeString()}</div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Meetings</span>
                  </div>
                  <span>{metrics.meetingHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Focused Work</span>
                  </div>
                  <span>{metrics.focusedHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Admin Tasks</span>
                  </div>
                  <span>0.5h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => startTimer('Session Notes Review')}
                  disabled={!!activeTimer}
                >
                  <Timer className="h-4 w-4 mr-2" />
                  Start Session Notes
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => startTimer('Client Preparation')}
                  disabled={!!activeTimer}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Start Client Prep
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => startTimer('Administrative Work')}
                  disabled={!!activeTimer}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Start Admin Work
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{entry.task}</div>
                      <div className="text-sm text-muted-foreground">
                        {entry.startTime.toLocaleTimeString()} - {entry.endTime?.toLocaleTimeString() || 'Running'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getCategoryColor(entry.category)}>
                        {entry.category}
                      </Badge>
                      <span className="font-medium">{formatDuration(entry.duration)}</span>
                      {entry.billable && (
                        <Badge variant="secondary">
                          ${entry.rate ? ((entry.duration / 60) * entry.rate).toFixed(0) : '0'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Monday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm">6.8h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tuesday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-20" />
                      <span className="text-sm">7.4h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Wednesday</span>
                    <div className="flex items-center gap-2">
                      <Progress value={78} className="w-20" />
                      <span className="text-sm">6.2h</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-blue-600 font-medium">
                    <span>Today</span>
                    <div className="flex items-center gap-2">
                      <Progress value={metrics.utilization} className="w-20" />
                      <span className="text-sm">{metrics.totalHours.toFixed(1)}h</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">High Focus Sessions</div>
                    <div className="text-sm text-muted-foreground">
                      3 uninterrupted work blocks today
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Productivity Trend</div>
                    <div className="text-sm text-muted-foreground">
                      15% improvement from last week
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Revenue Efficiency</div>
                    <div className="text-sm text-muted-foreground">
                      ${metrics.efficiency.toFixed(0)}/hour average rate
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