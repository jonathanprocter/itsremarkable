import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, Users, TrendingUp, Clock, Calendar, AlertTriangle } from "lucide-react";
import { ClientManager } from "@/components/professionalWorkflow/ClientManager";
import { ConflictDetector, OptimalTimeSuggestions } from "@/components/smartCalendar/ConflictDetector";
import { useQuery } from "@tanstack/react-query";

interface SmartSchedulingPanelProps {
  currentDate: Date;
  events: any[];
  onScheduleAppointment?: (appointmentData: any) => void;
}

export function SmartSchedulingPanel({ 
  currentDate, 
  events, 
  onScheduleAppointment 
}: SmartSchedulingPanelProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("conflicts");

  // Fetch revenue analytics for the current month
  const { data: revenueAnalytics } = useQuery({
    queryKey: ['/api/revenue/analytics', currentDate.getFullYear(), currentDate.getMonth()],
    queryFn: async () => {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const response = await fetch(
        `/api/revenue/analytics?startDate=${startDate.toISOString().catch(error => console.error("Fetch error:", error))}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      return response.json();
    }
  });

  // Fetch appointment templates
  const { data: templates = [] } = useQuery({
    queryKey: ['/api/templates'],
    queryFn: async () => {
      const response = await fetch('/api/templates').catch(error => console.error("Fetch error:", error));
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    }
  });

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Smart Calendar Intelligence
          </CardTitle>
          <CardDescription>
            AI-powered scheduling optimization and practice management insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenueAnalytics && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {revenueAnalytics.totalSessions || 0}
                </div>
                <div className="text-sm text-muted-foreground">Sessions This Month</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(revenueAnalytics.totalActualRevenue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Revenue This Month</div>
              </div>
              <div className="text-center p-3 bg-white/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(revenueAnalytics.averageSessionValue || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Session Value</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Conflicts
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="scheduling" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Smart Scheduling
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conflicts" className="space-y-4">
          <ConflictDetector
            existingEvents={events}
            showActiveConflicts={true}
          />
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <ClientManager
            onSelectClient={setSelectedClient}
            selectedClientId={selectedClient?.id}
          />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <div className="grid gap-4">
            {/* Quick Appointment Templates */}
            {templates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quick Appointment Templates</CardTitle>
                  <CardDescription>
                    Use saved templates to quickly schedule common appointment types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {templates.map((template: any) => (
                      <Button
                        key={template.id}
                        variant="outline"
                        className="justify-start h-auto p-3"
                        onClick={() => onScheduleAppointment?.(template)}
                      >
                        <div className="text-left w-full">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{template.name}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {template.duration || 60}min
                              </Badge>
                              {template.defaultRate && (
                                <Badge variant="outline" className="text-xs">
                                  {formatCurrency(template.defaultRate)}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {template.description && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {template.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Optimal Time Suggestions */}
            <OptimalTimeSuggestions
              date={currentDate}
              duration={60}
              existingEvents={events}
            />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <RevenueAnalyticsDashboard analytics={revenueAnalytics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RevenueAnalyticsDashboard({ analytics }: { analytics: any }) {
  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No revenue data available for this period.
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const revenueGapPercentage = analytics.totalPlannedRevenue > 0 
    ? ((analytics.revenueGap / analytics.totalPlannedRevenue) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Revenue Analytics</CardTitle>
          <CardDescription>
            Financial performance for {new Date(analytics.period?.startDate).toLocaleDateString()} 
            - {new Date(analytics.period?.endDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800">Planned Revenue</div>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(analytics.totalPlannedRevenue)}
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-blue-800">Actual Revenue</div>
                <div className="text-2xl font-bold text-blue-900">
                  {formatCurrency(analytics.totalActualRevenue)}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-800">Total Sessions</div>
                <div className="text-2xl font-bold text-purple-900">
                  {analytics.totalSessions}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                analytics.revenueGap > 0 ? 'bg-red-50' : 'bg-green-50'
              }`}>
                <div className={`text-sm font-medium ${
                  analytics.revenueGap > 0 ? 'text-red-800' : 'text-green-800'
                }`}>
                  Revenue Gap
                </div>
                <div className={`text-2xl font-bold ${
                  analytics.revenueGap > 0 ? 'text-red-900' : 'text-green-900'
                }`}>
                  {analytics.revenueGap > 0 ? '-' : ''}{formatCurrency(Math.abs(analytics.revenueGap))}
                </div>
                <div className={`text-xs ${
                  analytics.revenueGap > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {revenueGapPercentage}% {analytics.revenueGap > 0 ? 'below' : 'above'} planned
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-2">Performance Insights</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>• Average session value: {formatCurrency(analytics.averageSessionValue)}</div>
              <div>• Sessions per day: {(analytics.totalSessions / 30).toFixed(1)}</div>
              {analytics.revenueGap > 0 && (
                <div className="text-orange-600">
                  • Consider reviewing no-shows and cancellations to reduce revenue gap
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}