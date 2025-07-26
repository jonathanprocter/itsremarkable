import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TaskAutomation } from "../workflow/TaskAutomation";
import { FocusTimeOptimizer } from "./FocusTimeOptimizer";
import { CrossPlatformSync } from "../integrations/CrossPlatformSync";
import { Brain, Calendar, Gauge, Link, Target, TrendingUp, Workflow, Zap } from "lucide-react";

interface ProductivityHubProps {
  events: any[];
  selectedDate: Date;
}

export function ProductivityHub({ events, selectedDate }: ProductivityHubProps) {
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate productivity metrics
  const calculateProductivityMetrics = () => {
    const today = new Date();
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === today.toDateString();
    });

    const thisWeekEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });

    // Calculate efficiency metrics
    const totalMeetings = todayEvents.length;
    const focusBlocks = calculateFocusBlocks(todayEvents);
    const utilizationRate = calculateUtilizationRate(todayEvents);
    const weeklyProductivity = calculateWeeklyProductivity(thisWeekEvents);

    return {
      todayMeetings: totalMeetings,
      focusBlocks: focusBlocks.length,
      utilizationRate,
      weeklyProductivity,
      focusTime: focusBlocks.reduce((sum, block) => sum + block.duration, 0),
      conflictsToday: detectDailyConflicts(todayEvents)
    };
  };

  const calculateFocusBlocks = (dayEvents: any[]) => {
    // Sort events by start time
    const sortedEvents = dayEvents.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    const focusBlocks = [];
    const workStart = new Date();
    workStart.setHours(8, 0, 0, 0);
    const workEnd = new Date();
    workEnd.setHours(18, 0, 0, 0);

    let currentTime = new Date(workStart);

    for (const event of sortedEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      if (eventStart > currentTime) {
        const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
        if (gapMinutes >= 30) { // Minimum 30-minute focus block
          focusBlocks.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: Math.floor(gapMinutes)
          });
        }
      }
      currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
    }

    // Check for time after last event
    if (currentTime < workEnd) {
      const remainingMinutes = (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (remainingMinutes >= 30) {
        focusBlocks.push({
          start: new Date(currentTime),
          end: new Date(workEnd),
          duration: Math.floor(remainingMinutes)
        });
      }
    }

    return focusBlocks;
  };

  const calculateUtilizationRate = (dayEvents: any[]) => {
    const totalWorkMinutes = 10 * 60; // 10 hours work day
    const busyMinutes = dayEvents.reduce((sum, event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      return sum + Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
    }, 0);
    
    return Math.min(100, Math.round((busyMinutes / totalWorkMinutes) * 100));
  };

  const calculateWeeklyProductivity = (weekEvents: any[]) => {
    const completedTasks = weekEvents.filter(e => 
      !e.title.toLowerCase().includes('canceled') && 
      new Date(e.endTime) < new Date()
    ).length;
    
    const totalTasks = weekEvents.length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const detectDailyConflicts = (dayEvents: any[]) => {
    let conflicts = 0;
    for (let i = 0; i < dayEvents.length - 1; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i];
        const event2 = dayEvents[j];
        const start1 = new Date(event1.startTime);
        const end1 = new Date(event1.endTime);
        const start2 = new Date(event2.startTime);
        const end2 = new Date(event2.endTime);
        
        if ((start1 < end2 && end1 > start2)) {
          conflicts++;
        }
      }
    }
    return conflicts;
  };

  const metrics = calculateProductivityMetrics();

  const getMetricColor = (value: number, type: 'percentage' | 'count') => {
    if (type === 'percentage') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-blue-600';
      if (value >= 40) return 'text-yellow-600';
      return 'text-red-600';
    } else {
      if (value === 0) return 'text-green-600';
      if (value <= 2) return 'text-yellow-600';
      return 'text-red-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-purple-500" />
            Productivity Hub
          </CardTitle>
          <CardDescription>
            AI-powered productivity optimization and workflow management center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="automation">Automation</TabsTrigger>
              <TabsTrigger value="focus">Focus Time</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Daily Productivity Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Today's Productivity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{metrics.todayMeetings}</div>
                      <div className="text-sm text-muted-foreground">Meetings Today</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold">{metrics.focusBlocks}</div>
                      <div className="text-sm text-muted-foreground">Focus Blocks</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                      <div className={`text-2xl font-bold ${getMetricColor(metrics.utilizationRate, 'percentage')}`}>
                        {metrics.utilizationRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Utilization</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 text-center">
                      <Brain className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                      <div className="text-2xl font-bold">{Math.round(metrics.focusTime / 60)}h</div>
                      <div className="text-sm text-muted-foreground">Focus Time</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Weekly Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Weekly Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Productivity Score</span>
                      </div>
                      <div className={`text-3xl font-bold ${getMetricColor(metrics.weeklyProductivity, 'percentage')}`}>
                        {metrics.weeklyProductivity}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on completed vs scheduled tasks
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">Efficiency Rating</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">A+</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Optimal schedule utilization
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Conflicts</span>
                      </div>
                      <div className={`text-3xl font-bold ${getMetricColor(metrics.conflictsToday, 'count')}`}>
                        {metrics.conflictsToday}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Scheduling conflicts today
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("automation")}>
                    <CardContent className="p-4 text-center">
                      <Workflow className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <div className="font-medium">Create Automation</div>
                      <div className="text-xs text-muted-foreground">Automate routine tasks</div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("focus")}>
                    <CardContent className="p-4 text-center">
                      <Target className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <div className="font-medium">Optimize Focus</div>
                      <div className="text-xs text-muted-foreground">Find focus time blocks</div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setActiveTab("integrations")}>
                    <CardContent className="p-4 text-center">
                      <Link className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <div className="font-medium">Sync Platforms</div>
                      <div className="text-xs text-muted-foreground">Connect integrations</div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardContent className="p-4 text-center">
                      <Brain className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                      <div className="font-medium">AI Insights</div>
                      <div className="text-xs text-muted-foreground">Get recommendations</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Productivity Insights */}
              <div>
                <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
                <div className="space-y-3">
                  {metrics.focusBlocks === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>No Focus Time Available:</strong> Your schedule is fully booked today. 
                        Consider rescheduling some meetings to create focus blocks.
                      </p>
                    </div>
                  )}
                  
                  {metrics.utilizationRate > 90 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>High Utilization Warning:</strong> Your calendar is {metrics.utilizationRate}% full. 
                        Consider blocking time for breaks and preparation.
                      </p>
                    </div>
                  )}
                  
                  {metrics.conflictsToday > 0 && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Scheduling Conflicts Detected:</strong> You have {metrics.conflictsToday} overlapping 
                        appointments today. Review your schedule and resolve conflicts.
                      </p>
                    </div>
                  )}
                  
                  {metrics.weeklyProductivity >= 85 && metrics.conflictsToday === 0 && metrics.focusBlocks > 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Excellent Productivity:</strong> You're having a highly productive week with optimal 
                        schedule balance and focus time allocation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Automation Tab */}
            <TabsContent value="automation">
              <TaskAutomation events={events} />
            </TabsContent>

            {/* Focus Time Tab */}
            <TabsContent value="focus">
              <FocusTimeOptimizer events={events} selectedDate={selectedDate} />
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <CrossPlatformSync />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}