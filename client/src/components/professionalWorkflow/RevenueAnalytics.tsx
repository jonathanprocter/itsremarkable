import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Calendar, Users, Clock, RefreshCw } from "lucide-react";

interface RevenueAnalyticsProps {
  events: any[];
}

export function RevenueAnalytics({ events }: RevenueAnalyticsProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Calculate date range for selected month
  const startDate = new Date(selectedYear, selectedMonth, 1);
  const endDate = new Date(selectedYear, selectedMonth + 1, 0);

  // Fetch revenue analytics from backend
  const { data: analytics, isLoading, refetch } = useQuery({
    queryKey: ['/api/revenue/analytics', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(
        `/api/revenue/analytics?startDate=${startDate.toISOString().catch(error => console.error("Fetch error:", error))}&endDate=${endDate.toISOString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      return response.json();
    }
  });

  // Calculate analytics from events for current month
  const calculateEventAnalytics = () => {
    const monthEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.getMonth() === selectedMonth && 
             eventDate.getFullYear() === selectedYear &&
             event.source === 'simplepractice'; // Only count SimplePractice appointments
    });

    const totalSessions = monthEvents.length;
    const confirmedSessions = monthEvents.filter(e => 
      !e.title.toLowerCase().includes('canceled') && 
      !e.title.toLowerCase().includes('cancelled')
    ).length;

    // Estimate revenue based on average session rate
    const estimatedHourlyRate = 150; // Default rate
    const avgSessionLength = 1; // 1 hour average
    const estimatedRevenue = confirmedSessions * estimatedHourlyRate * avgSessionLength;

    // Calculate revenue per day
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const workingDays = daysInMonth * (5/7); // Assume 5 working days per week
    const avgRevenuePerDay = estimatedRevenue / workingDays;

    return {
      totalSessions,
      confirmedSessions,
      canceledSessions: totalSessions - confirmedSessions,
      estimatedRevenue,
      avgRevenuePerDay,
      avgSessionValue: confirmedSessions > 0 ? estimatedRevenue / confirmedSessions : 0,
      utilizationRate: Math.round((confirmedSessions / (workingDays * 8)) * 100) // Assuming 8 sessions per day max
    };
  };

  const eventAnalytics = calculateEventAnalytics();

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getMonthName = (month: number) => 
    new Date(2025, month, 1).toLocaleDateString('en-US', { month: 'long' });

  const months = Array.from({ length: 12 }, (_, i) => i);
  const years = [2024, 2025, 2026];

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Calendar className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>
            Track your monthly revenue and session performance
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month} value={month.toString()}>
                    {getMonthName(month)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(eventAnalytics.estimatedRevenue)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMonthName(selectedMonth)} {selectedYear}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Sessions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold">{eventAnalytics.confirmedSessions}</p>
                    <p className="text-xs text-muted-foreground">
                      {eventAnalytics.canceledSessions} canceled
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Average Session Value */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Session Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(eventAnalytics.avgSessionValue)}</p>
                    <p className="text-xs text-muted-foreground">
                      Per session
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            {/* Utilization Rate */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilization</p>
                    <p className="text-2xl font-bold">{eventAnalytics.utilizationRate}%</p>
                    <p className="text-xs text-muted-foreground">
                      Calendar usage
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Daily Average</span>
                      <span className="font-bold">{formatCurrency(eventAnalytics.avgRevenuePerDay)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Sessions This Month</span>
                      <Badge variant="secondary">{eventAnalytics.totalSessions}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Confirmed Sessions</span>
                      <Badge variant="default">{eventAnalytics.confirmedSessions}</Badge>
                    </div>
                    {eventAnalytics.canceledSessions > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Canceled Sessions</span>
                        <Badge variant="destructive">{eventAnalytics.canceledSessions}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Revenue Goal</span>
                      <span className="font-bold">{formatCurrency(20000)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Revenue</span>
                      <span className="font-bold">{formatCurrency(eventAnalytics.estimatedRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Revenue Gap</span>
                      <span className={`font-bold ${
                        (20000 - eventAnalytics.estimatedRevenue) > 0 ? 'text-red-500' : 'text-green-500'
                      }`}>
                        {formatCurrency(20000 - eventAnalytics.estimatedRevenue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Goal Progress</span>
                      <Badge variant={eventAnalytics.estimatedRevenue >= 20000 ? "default" : "secondary"}>
                        {Math.round((eventAnalytics.estimatedRevenue / 20000) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
            <div className="space-y-2">
              {eventAnalytics.utilizationRate < 50 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Low Utilization:</strong> Your calendar utilization is {eventAnalytics.utilizationRate}%. 
                    Consider adding more appointments to increase revenue.
                  </p>
                </div>
              )}
              {eventAnalytics.canceledSessions > eventAnalytics.confirmedSessions * 0.2 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>High Cancellation Rate:</strong> {eventAnalytics.canceledSessions} cancellations this month. 
                    Consider implementing a cancellation policy.
                  </p>
                </div>
              )}
              {eventAnalytics.estimatedRevenue >= 20000 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Revenue Goal Met:</strong> Congratulations! You've reached your monthly revenue goal.
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}