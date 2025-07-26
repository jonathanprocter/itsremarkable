import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, MapPin, Calendar, CheckCircle, X } from "lucide-react";
import { SmartCalendarIntelligence, ConflictDetection } from "@/utils/smartCalendarIntelligence";

interface ConflictDetectorProps {
  newEvent?: {
    startTime: Date;
    endTime: Date;
    location?: string;
    id?: string;
  };
  existingEvents: any[];
  onResolveConflict?: (conflictId: number) => void;
  showActiveConflicts?: boolean;
}

export function ConflictDetector({ 
  newEvent, 
  existingEvents, 
  onResolveConflict,
  showActiveConflicts = true 
}: ConflictDetectorProps) {
  const [detectedConflicts, setDetectedConflicts] = useState<ConflictDetection[]>([]);

  // Fetch existing conflicts from the database
  const { data: activeConflicts = [] } = useQuery({
    queryKey: ['/api/conflicts', { resolved: false }],
    queryFn: async () => {
      const response = await fetch('/api/conflicts?resolved=false');
      if (!response.ok) throw new Error('Failed to fetch conflicts');
      return response.json();
    },
    enabled: showActiveConflicts
  });

  // Detect conflicts when a new event is provided
  useEffect(() => {
    if (newEvent && existingEvents.length > 0) {
      const detectConflicts = async () => {
        const conflicts = await SmartCalendarIntelligence.detectConflicts(newEvent, existingEvents);
        setDetectedConflicts(conflicts);
      };
      
      detectConflicts();
    }
  }, [newEvent, existingEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'overlap': return <AlertTriangle className="h-4 w-4" />;
      case 'travel_time': return <MapPin className="h-4 w-4" />;
      case 'double_booking': return <Calendar className="h-4 w-4" />;
      case 'break_violation': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const resolveConflict = async (conflictId: number) => {
    try {
      const response = await fetch(`/api/conflicts/${conflictId}/resolve`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to resolve conflict');
      
      onResolveConflict?.(conflictId);
    } catch (error) {
      console.error('Error resolving conflict:', error);
    }
  };

  const hasConflicts = detectedConflicts.length > 0 || activeConflicts.length > 0;

  if (!hasConflicts) {
    return newEvent ? (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">No Conflicts Detected</AlertTitle>
        <AlertDescription className="text-green-700">
          This appointment slot is available with no scheduling conflicts.
        </AlertDescription>
      </Alert>
    ) : null;
  }

  return (
    <div className="space-y-4">
      {/* Real-time conflict detection for new events */}
      {detectedConflicts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-5 w-5" />
              Scheduling Conflicts Detected
            </CardTitle>
            <CardDescription>
              The following conflicts were identified for your new appointment:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detectedConflicts.map((conflict, index) => (
              <ConflictCard 
                key={index} 
                conflict={conflict} 
                isNewConflict={true}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Existing unresolved conflicts */}
      {showActiveConflicts && activeConflicts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Active Schedule Conflicts ({activeConflicts.length})
            </CardTitle>
            <CardDescription>
              These conflicts require your attention and resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeConflicts.map((conflict: any) => (
              <ConflictCard 
                key={conflict.id} 
                conflict={conflict} 
                isNewConflict={false}
                onResolve={() => resolveConflict(conflict.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ConflictCard({ 
  conflict, 
  isNewConflict, 
  onResolve 
}: { 
  conflict: ConflictDetection | any; 
  isNewConflict: boolean;
  onResolve?: () => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'overlap': return <AlertTriangle className="h-4 w-4" />;
      case 'travel_time': return <MapPin className="h-4 w-4" />;
      case 'double_booking': return <Calendar className="h-4 w-4" />;
      case 'break_violation': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={`${
      conflict.severity === 'critical' ? 'border-red-300 bg-red-50' :
      conflict.severity === 'high' ? 'border-orange-300 bg-orange-50' :
      conflict.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
      'border-blue-300 bg-blue-50'
    }`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getConflictTypeIcon(conflict.conflictType || conflict.type)}
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTitle className="text-sm font-medium">
              {conflict.message || `${conflict.conflictType || conflict.type} conflict`}
            </AlertTitle>
            <Badge variant={getSeverityColor(conflict.severity)} className="text-xs">
              {conflict.severity}
            </Badge>
          </div>
          
          <AlertDescription className="text-sm">
            {conflict.suggestedResolution || conflict.suggested_resolution}
          </AlertDescription>

          {/* Show conflicting events for new conflicts */}
          {isNewConflict && conflict.conflictingEvents && conflict.conflictingEvents.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Conflicting with:</div>
              {conflict.conflictingEvents.map((event: any, index: number) => (
                <div key={index} className="text-xs p-2 bg-white/50 rounded border">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-muted-foreground">
                    {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
                  </div>
                  {event.location && (
                    <div className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Resolve button for existing conflicts */}
          {!isNewConflict && onResolve && (
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onResolve}
                className="h-7 text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark Resolved
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  );
}

export function TravelTimeWarning({ 
  fromLocation, 
  toLocation, 
  timeBetween 
}: { 
  fromLocation: string; 
  toLocation: string; 
  timeBetween: number; 
}) {
  const travelTime = SmartCalendarIntelligence.calculateTravelTime(fromLocation, toLocation);
  const isInsufficient = timeBetween < (travelTime.estimatedMinutes + travelTime.bufferTimeNeeded);

  if (!isInsufficient || fromLocation === toLocation) {
    return null;
  }

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <MapPin className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">Travel Time Warning</AlertTitle>
      <AlertDescription className="text-orange-700">
        You have {timeBetween} minutes between {fromLocation} and {toLocation}, but need{" "}
        {travelTime.estimatedMinutes + travelTime.bufferTimeNeeded} minutes (
        {travelTime.estimatedMinutes}min travel + {travelTime.bufferTimeNeeded}min buffer).
      </AlertDescription>
    </Alert>
  );
}

export function OptimalTimeSuggestions({ 
  date, 
  duration, 
  existingEvents 
}: { 
  date: Date; 
  duration: number; 
  existingEvents: any[]; 
}) {
  const [suggestions, setSuggestions] = useState<Date[]>([]);

  useEffect(() => {
    const optimalTimes = SmartCalendarIntelligence.suggestOptimalTimes(
      date,
      duration,
      existingEvents,
      {
        preferredStartTime: "09:00",
        preferredEndTime: "17:00",
        minimumBreak: 15
      }
    );
    setSuggestions(optimalTimes);
  }, [date, duration, existingEvents]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Suggested Times
        </CardTitle>
        <CardDescription>
          Optimal appointment slots based on your schedule and preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {suggestions.map((time, index) => (
            <Button 
              key={index} 
              variant="outline" 
              className="justify-start h-auto p-3"
            >
              <div className="text-left">
                <div className="font-medium">
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {duration} minute appointment
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}