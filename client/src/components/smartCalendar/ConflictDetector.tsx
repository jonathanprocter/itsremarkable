import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock, MapPin, Calendar, CheckCircle2, RefreshCw } from "lucide-react";
import { SmartCalendarIntelligence } from "@/utils/smartCalendarIntelligence";

interface ConflictDetectorProps {
  existingEvents: any[];
  showActiveConflicts?: boolean;
}

interface OptimalTimeSuggestionsProps {
  date: Date;
  duration: number;
  existingEvents: any[];
}

export function ConflictDetector({ existingEvents, showActiveConflicts = true }: ConflictDetectorProps) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch active conflicts from the backend
  const { data: backendConflicts = [], refetch: refetchConflicts } = useQuery({
    queryKey: ['/api/conflicts'],
    queryFn: async () => {
      const response = await fetch('/api/conflicts?resolved=false').catch(error => console.error("Fetch error:", error));
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      return response.json();
    },
    enabled: showActiveConflicts
  });

  const analyzeConflicts = async () => {
    setIsAnalyzing(true);
    try {
      const detectedConflicts = [];
      
      // Check for overlapping appointments
      for (let i = 0; i < existingEvents.length; i++) {
        for (let j = i + 1; j < existingEvents.length; j++) {
          const event1 = existingEvents[i];
          const event2 = existingEvents[j];
          
          const start1 = new Date(event1.startTime);
          const end1 = new Date(event1.endTime);
          const start2 = new Date(event2.startTime);
          const end2 = new Date(event2.endTime);
          
          // Check for overlap
          if (start1 < end2 && start2 < end1) {
            detectedConflicts.push({
              id: `overlap-${event1.id}-${event2.id}`,
              type: 'overlap',
              severity: 'high',
              title: 'Overlapping Appointments',
              description: `${event1.title} overlaps with ${event2.title}`,
              events: [event1, event2],
              suggestedAction: 'Reschedule one of the appointments',
              timeRange: `${start1.toLocaleTimeString()} - ${end2.toLocaleTimeString()}`
            });
          }
        }
      }

      // Check for travel time conflicts
      const sortedEvents = [...existingEvents].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        
        const currentEnd = new Date(current.endTime);
        const nextStart = new Date(next.startTime);
        const timeBetween = nextStart.getTime() - currentEnd.getTime();
        const minutesBetween = Math.floor(timeBetween / (1000 * 60));
        
        // Check if different locations require travel time
        if (current.location && next.location && 
            current.location !== next.location && 
            minutesBetween < 30) {
          detectedConflicts.push({
            id: `travel-${current.id}-${next.id}`,
            type: 'travel',
            severity: 'medium',
            title: 'Insufficient Travel Time',
            description: `Only ${minutesBetween} minutes between appointments at different locations`,
            events: [current, next],
            suggestedAction: 'Add 30-minute buffer for travel',
            timeRange: `${currentEnd.toLocaleTimeString()} - ${nextStart.toLocaleTimeString()}`
          });
        }
      }

      // Check for back-to-back intensive appointments
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const current = sortedEvents[i];
        const next = sortedEvents[i + 1];
        
        const currentEnd = new Date(current.endTime);
        const nextStart = new Date(next.startTime);
        const timeBetween = nextStart.getTime() - currentEnd.getTime();
        
        // Check for high-intensity appointment types
        const isIntensive = (title: string) => 
          title.toLowerCase().includes('therapy') || 
          title.toLowerCase().includes('counseling') ||
          title.toLowerCase().includes('evaluation');
        
        if (isIntensive(current.title) && isIntensive(next.title) && timeBetween < 15 * 60 * 1000) {
          detectedConflicts.push({
            id: `intensive-${current.id}-${next.id}`,
            type: 'intensive',
            severity: 'low',
            title: 'Back-to-Back Intensive Sessions',
            description: 'Consider adding break time between intensive appointments',
            events: [current, next],
            suggestedAction: 'Add 15-minute buffer for preparation',
            timeRange: `${currentEnd.toLocaleTimeString()} - ${nextStart.toLocaleTimeString()}`
          });
        }
      }

      setConflicts(detectedConflicts);
    } catch (error) {
      console.error('Error analyzing conflicts:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (existingEvents.length > 0) {
      analyzeConflicts();
    }
  }, [existingEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <Calendar className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const allConflicts = [...conflicts, ...backendConflicts];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Schedule Conflict Detection
          </CardTitle>
          <CardDescription>
            Automatically detect and resolve scheduling conflicts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Analyzing {existingEvents.length} appointments for conflicts
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  analyzeConflicts();
                  refetchConflicts();
                }}
                disabled={isAnalyzing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>

            {allConflicts.length === 0 ? (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  No scheduling conflicts detected. Your calendar looks great!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {allConflicts.map((conflict, index) => (
                  <Alert key={conflict.id || index} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getSeverityIcon(conflict.severity)}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{conflict.title}</div>
                          <Badge variant={getSeverityColor(conflict.severity) as any}>
                            {conflict.severity}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {conflict.description}
                        </div>
                        {conflict.timeRange && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {conflict.timeRange}
                          </div>
                        )}
                        {conflict.suggestedAction && (
                          <div className="text-sm font-medium text-blue-600">
                            Suggestion: {conflict.suggestedAction}
                          </div>
                        )}
                        {conflict.events && conflict.events.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {conflict.events.map((event: any, eventIndex: number) => (
                              <Badge key={eventIndex} variant="outline" className="text-xs">
                                {event.title}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Alert>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OptimalTimeSuggestions({ date, duration, existingEvents }: OptimalTimeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const generateSuggestions = () => {
      const optimalTimes = SmartCalendarIntelligence.findOptimalTimeSlots(
        date,
        duration,
        existingEvents
      );
      setSuggestions(optimalTimes);
    };

    generateSuggestions();
  }, [date, duration, existingEvents]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Optimal Time Suggestions
        </CardTitle>
        <CardDescription>
          AI-recommended time slots for {duration}-minute appointments on {date.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No optimal time slots found for the selected criteria.
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    {formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Score: {suggestion.score}/100 • {suggestion.reason}
                  </div>
                  {suggestion.bufferBefore > 0 && (
                    <div className="text-xs text-green-600">
                      {suggestion.bufferBefore} min buffer before
                    </div>
                  )}
                  {suggestion.bufferAfter > 0 && (
                    <div className="text-xs text-green-600">
                      {suggestion.bufferAfter} min buffer after
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Select
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}