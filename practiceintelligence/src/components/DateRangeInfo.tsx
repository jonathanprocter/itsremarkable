import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function DateRangeInfo() {
  const startDate = new Date(2024, 0, 1);
  const endDate = new Date(2025, 11, 31);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysInRange = () => {
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card className="w-full max-w-md bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-blue-900 text-lg">📅 Event Sync Range</CardTitle>
        <CardDescription className="text-blue-700">
          Comprehensive date range for Google Calendar sync
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Start Date:</span>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {formatDate(startDate)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">End Date:</span>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {formatDate(endDate)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Total Days:</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
              {getDaysInRange().toLocaleString()} days
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">What Gets Synced:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All Google Calendar events</li>
            <li>• All SimplePractice appointments</li>
            <li>• Holiday calendars</li>
            <li>• Personal events</li>
            <li>• Recurring events (expanded)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}