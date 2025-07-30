import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, User, Zap, Plus } from "lucide-react";
import { OptimalTimeSuggestions } from "./ConflictDetector";
import { useToast } from "@/hooks/use-toast";

interface SmartSchedulingProps {
  selectedClient?: any;
  existingEvents: any[];
  onScheduleAppointment?: (appointmentData: any) => void;
}

export function SmartScheduling({ selectedClient, existingEvents, onScheduleAppointment }: SmartSchedulingProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isScheduling, setIsScheduling] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch appointment templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates').catch(error => console.error("Fetch error:", error));
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: any) => {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData).catch(error => console.error("Fetch error:", error))
      });
      if (!response.ok) throw new Error('Failed to create appointment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Appointment Scheduled",
        description: "Your appointment has been successfully scheduled.",
      });
      setIsScheduling(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive"
      });
    }
  });

  const handleScheduleAppointment = (timeSlot: any) => {
    if (!selectedClient) {
      toast({
        title: "Client Required",
        description: "Please select a client first",
        variant: "destructive"
      });
      return;
    }

    const appointmentData = {
      title: `${selectedClient.name} Appointment`,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      location: selectedClient.preferredLocation || 'woodbury',
      source: 'manual',
      clientId: selectedClient.id,
      templateId: selectedTemplate?.id
    };

    createAppointmentMutation.mutate(appointmentData);
    onScheduleAppointment?.(appointmentData);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setSelectedDuration(template.duration);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'woodbury': return '🏢';
      case 'rvc': return '🏥';
      case 'telehealth': return '💻';
      default: return '📍';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Smart Scheduling
          </CardTitle>
          <CardDescription>
            AI-powered appointment scheduling with optimal time suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Client Selection Status */}
            {selectedClient ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Selected Client: {selectedClient.name}</span>
                </div>
                <div className="mt-2 flex gap-4 text-sm text-green-700">
                  {selectedClient.preferredLocation && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedClient.preferredLocation === 'woodbury' ? 'Woodbury Office' : 
                       selectedClient.preferredLocation === 'rvc' ? 'RVC Office' : 'Telehealth'}
                    </div>
                  )}
                  {selectedClient.defaultRate && (
                    <div className="flex items-center gap-1">
                      <span>Rate: ${(selectedClient.defaultRate / 100).toFixed(0)}/hour</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">
                  <strong>No client selected.</strong> Please select a client from the Clients section to enable smart scheduling.
                </p>
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <h3 className="text-sm font-medium mb-3">Quick Appointment Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {templates.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-muted-foreground">
                    No templates available. Create templates to get started.
                  </div>
                ) : (
                  templates.map((template: any) => (
                    <Card 
                      key={template.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {template.duration} min
                            {template.defaultRate && (
                              <>
                                <span>•</span>
                                <span>${(template.defaultRate / 100).toFixed(0)}</span>
                              </>
                            )}
                          </div>
                          {template.preferredLocation && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{getLocationIcon(template.preferredLocation)}</span>
                              {template.preferredLocation === 'woodbury' ? 'Woodbury' : 
                               template.preferredLocation === 'rvc' ? 'RVC' : 'Telehealth'}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Scheduling Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  className="w-full"
                  disabled={!selectedClient}
                  onClick={() => setIsScheduling(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Find Times
                </Button>
              </div>
            </div>

            {/* Selected Date Display */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4" />
                <span>Scheduling for {formatDate(selectedDate)}</span>
                <Badge variant="secondary">{selectedDuration} minutes</Badge>
              </div>
            </div>

            {/* Optimal Time Suggestions */}
            {isScheduling && selectedClient && (
              <OptimalTimeSuggestions 
                date={selectedDate}
                duration={selectedDuration}
                existingEvents={existingEvents}
              />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{existingEvents.length}</div>
                <div className="text-sm text-muted-foreground">Total Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {existingEvents.filter(e => 
                    new Date(e.startTime).toDateString() === selectedDate.toDateString()
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Events Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{templates.length}</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}