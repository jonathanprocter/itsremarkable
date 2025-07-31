import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Brain, Clock, Focus, Shield, Target, TrendingUp, Zap } from "lucide-react";
import { addMinutes, startOfDay, endOfDay, isWithinInterval, format } from "date-fns";

interface FocusTimeOptimizerProps {
  events: any[];
  selectedDate: Date;
}

export function FocusTimeOptimizer({ events, selectedDate }: FocusTimeOptimizerProps) {
  const [focusGoalHours, setFocusGoalHours] = useState(4);
  const [protectedFocusEnabled, setProtectedFocusEnabled] = useState(true);
  const [deepWorkPreference, setDeepWorkPreference] = useState("morning");
  const [minFocusBlockSize, setMinFocusBlockSize] = useState(60);

  // Calculate available focus time for selected date
  const calculateFocusTime = () => {
    const dayStart = startOfDay(selectedDate);
    const dayEnd = endOfDay(selectedDate);
    
    // Define work hours (8 AM to 6 PM)
    const workStart = new Date(dayStart);
    workStart.setHours(8, 0, 0, 0);
    const workEnd = new Date(dayStart);
    workEnd.setHours(18, 0, 0, 0);

    // Get events for the selected date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isWithinInterval(eventDate, { start: dayStart, end: dayEnd });
    });

    // Calculate busy time
    let busyMinutes = 0;
    dayEvents.forEach(event => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      const duration = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
      busyMinutes += duration;
    });

    const totalWorkMinutes = (workEnd.getTime() - workStart.getTime()) / (1000 * 60);
    const availableMinutes = Math.max(0, totalWorkMinutes - busyMinutes);
    
    return {
      totalWorkHours: totalWorkMinutes / 60,
      busyHours: busyMinutes / 60,
      availableHours: availableMinutes / 60,
      events: dayEvents
    };
  };

  // Find optimal focus time blocks
  const findFocusBlocks = () => {
    const dayStart = startOfDay(selectedDate);
    const workStart = new Date(dayStart);
    workStart.setHours(8, 0, 0, 0);
    const workEnd = new Date(dayStart);
    workEnd.setHours(18, 0, 0, 0);

    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return isWithinInterval(eventDate, { start: dayStart, end: endOfDay(selectedDate) });
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const focusBlocks = [];
    let currentTime = new Date(workStart);

    for (const event of dayEvents) {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);

      // Check for gap before this event
      if (eventStart > currentTime) {
        const gapMinutes = (eventStart.getTime() - currentTime.getTime()) / (1000 * 60);
        if (gapMinutes >= minFocusBlockSize) {
          focusBlocks.push({
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: Math.floor(gapMinutes),
            quality: calculateBlockQuality(currentTime, gapMinutes)
          });
        }
      }

      currentTime = new Date(Math.max(currentTime.getTime(), eventEnd.getTime()));
    }

    // Check for time after last event
    if (currentTime < workEnd) {
      const remainingMinutes = (workEnd.getTime() - currentTime.getTime()) / (1000 * 60);
      if (remainingMinutes >= minFocusBlockSize) {
        focusBlocks.push({
          start: new Date(currentTime),
          end: new Date(workEnd),
          duration: Math.floor(remainingMinutes),
          quality: calculateBlockQuality(currentTime, remainingMinutes)
        });
      }
    }

    return focusBlocks.sort((a, b) => b.quality - a.quality);
  };

  const calculateBlockQuality = (startTime: Date, durationMinutes: number) => {
    let quality = 50; // Base quality
    
    const hour = startTime.getHours();
    
    // Morning boost (8-11 AM)
    if (hour >= 8 && hour < 11 && deepWorkPreference === "morning") {
      quality += 30;
    }
    // Afternoon focus (1-4 PM)  
    else if (hour >= 13 && hour < 16 && deepWorkPreference === "afternoon") {
      quality += 25;
    }
    // Evening (4-6 PM)
    else if (hour >= 16 && hour < 18 && deepWorkPreference === "evening") {
      quality += 20;
    }

    // Duration bonus
    if (durationMinutes >= 120) quality += 20;
    else if (durationMinutes >= 90) quality += 15;
    else if (durationMinutes >= 60) quality += 10;

    // Avoid lunch time (12-1 PM)
    if (hour >= 12 && hour < 13) quality -= 20;

    return Math.min(100, Math.max(0, quality));
  };

  const focusData = calculateFocusTime();
  const focusBlocks = findFocusBlocks();
  const totalFocusAvailable = focusBlocks.reduce((sum, block) => sum + block.duration, 0) / 60;
  const focusGoalProgress = Math.min(100, (totalFocusAvailable / focusGoalHours) * 100);

  const getQualityBadge = (quality: number) => {
    if (quality >= 80) return <Badge className="bg-green-500">Excellent</Badge>;
    if (quality >= 60) return <Badge className="bg-blue-500">Good</Badge>;
    if (quality >= 40) return <Badge className="bg-yellow-500">Fair</Badge>;
    return <Badge variant="secondary">Low</Badge>;
  };

  const formatTimeRange = (start: Date, end: Date) => {
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Focus className="h-5 w-5 text-blue-500" />
            Focus Time Optimizer
          </CardTitle>
          <CardDescription>
            AI-powered deep work scheduling and productivity optimization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Daily Focus Goal</Label>
              <Select value={focusGoalHours.toString()} onValueChange={(value) => setFocusGoalHours(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="5">5 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Best Focus Time</Label>
              <Select value={deepWorkPreference} onValueChange={setDeepWorkPreference}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (8-11 AM)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (1-4 PM)</SelectItem>
                  <SelectItem value="evening">Evening (4-6 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Min Block Size</Label>
              <Select value={minFocusBlockSize.toString()} onValueChange={(value) => setMinFocusBlockSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Focus Protection</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={protectedFocusEnabled}
                  onCheckedChange={setProtectedFocusEnabled}
                />
                <Shield className={`h-4 w-4 ${protectedFocusEnabled ? 'text-green-500' : 'text-gray-400'}`} />
              </div>
            </div>
          </div>

          {/* Focus Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Today's Focus Progress</h3>
              <Badge variant={focusGoalProgress >= 100 ? "default" : "secondary"}>
                {Math.round(focusGoalProgress)}% of goal
              </Badge>
            </div>
            <Progress value={focusGoalProgress} className="w-full" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{totalFocusAvailable.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">Available Focus Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{focusGoalHours}h</div>
                <div className="text-sm text-muted-foreground">Daily Goal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{focusBlocks.length}</div>
                <div className="text-sm text-muted-foreground">Focus Blocks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{Math.round(focusData.busyHours * 10) / 10}h</div>
                <div className="text-sm text-muted-foreground">Scheduled Time</div>
              </div>
            </div>
          </div>

          {/* Optimal Focus Blocks */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Optimal Focus Blocks</h3>
            {focusBlocks.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                No focus blocks available for this day. Consider rescheduling some meetings.
              </div>
            ) : (
              <div className="space-y-2">
                {focusBlocks.slice(0, 5).map((block, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{formatTimeRange(block.start, block.end)}</span>
                          {getQualityBadge(block.quality)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(block.duration / 60)}h {block.duration % 60}m available
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {protectedFocusEnabled && (
                          <Button variant="outline" size="sm">
                            <Shield className="h-4 w-4 mr-1" />
                            Protect
                          </Button>
                        )}
                        <Button size="sm">
                          <Target className="h-4 w-4 mr-1" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Productivity Insights */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Productivity Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span className="font-medium">Energy Optimization</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {deepWorkPreference === "morning" 
                    ? "Your peak focus time is in the morning. Try to schedule important work between 8-11 AM."
                    : deepWorkPreference === "afternoon"
                    ? "You work best in the afternoon. Block 1-4 PM for deep work when possible."
                    : "Evening focus works for you. Protect 4-6 PM for your most important tasks."
                  }
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Schedule Efficiency</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {focusData.availableHours >= focusGoalHours
                    ? `Great! You have ${totalFocusAvailable.toFixed(1)} hours of potential focus time available.`
                    : `Limited focus time today. Consider rescheduling ${Math.ceil(focusGoalHours - totalFocusAvailable)} hours of meetings.`
                  }
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">Quick Wins</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {focusBlocks.filter(b => b.duration >= 30 && b.duration < 60).length > 0
                    ? `You have ${focusBlocks.filter(b => b.duration >= 30 && b.duration < 60).length} short blocks (30-60 min) perfect for quick tasks.`
                    : "No short focus blocks available. Use longer blocks for deep work projects."
                  }
                </p>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Focus Protection</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {protectedFocusEnabled
                    ? "Focus protection is active. Your optimal focus blocks will be defended from interruptions."
                    : "Enable focus protection to automatically block meeting requests during your optimal focus times."
                  }
                </p>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}