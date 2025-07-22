/**
 * Comprehensive OAuth Fix Component
 * This component provides a complete OAuth test and fix interface
 * that works directly in the browser with authenticated sessions
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, RefreshCw, Calendar, Database } from "lucide-react";

interface AuthStatus {
  authenticated: boolean;
  hasValidTokens: boolean;
  user: any;
  environment: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
  };
}

interface SyncResult {
  success: boolean;
  message: string;
  details?: any;
  calendars?: any[];
  recommendations?: string[];
}

export function ComprehensiveOAuthFix() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus(data);
      
      if (!data.authenticated) {
        setError('Not authenticated with Google');
      } else if (!data.hasValidTokens) {
        setError('Valid tokens not found');
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to check authentication status');
      console.error('Auth status check failed:', err);
    }
  };

  // Run comprehensive OAuth fix
  const runComprehensiveOAuthFix = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/auth/comprehensive-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncResult(data);
        setError(null);
        
        // Refresh auth status
        await checkAuthStatus();
      } else {
        setError(data.message || 'OAuth fix failed');
        setSyncResult(data);
      }
    } catch (err) {
      setError('Failed to run OAuth fix');
      console.error('OAuth fix failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test live sync functionality
  const testLiveSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/test-live-sync', {
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncResult(data);
        setError(null);
      } else {
        setError(data.message || 'Live sync test failed');
        setSyncResult(data);
      }
    } catch (err) {
      setError('Failed to test live sync');
      console.error('Live sync test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Test calendar sync with current tokens
  const testCalendarSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // 30 days ago
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days ahead

      const response = await fetch(
        `/api/live-sync/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
        {
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSyncResult({
          success: true,
          message: 'Calendar sync successful',
          details: {
            eventsFound: data.events?.length || 0,
            calendarsFound: data.calendars?.length || 0,
            isLiveSync: data.isLiveSync,
            syncTime: data.syncTime
          },
          calendars: data.calendars
        });
        setError(null);
      } else {
        setError(data.error || 'Calendar sync failed');
        setSyncResult({
          success: false,
          message: data.error || 'Calendar sync failed'
        });
      }
    } catch (err) {
      setError('Failed to test calendar sync');
      console.error('Calendar sync test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Force Google Calendar sync
  const forceGoogleCalendarSync = async () => {
    setIsLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/auth/force-google-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSyncResult({
          success: true,
          message: data.message,
          details: data.summary,
          calendars: data.calendarResults,
          recommendations: data.recommendations
        });
        setError(null);
      } else {
        setError(data.message || 'Force sync failed');
        setSyncResult(data);
      }
    } catch (err) {
      setError('Failed to force Google Calendar sync');
      console.error('Force sync failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to Google OAuth
  const redirectToGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Comprehensive OAuth Status
          </CardTitle>
          <CardDescription>
            Complete Google Calendar authentication and sync testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authentication Status</span>
              {authStatus?.authenticated ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Authenticated
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Authenticated
                </Badge>
              )}
            </div>
            
            {authStatus?.user && (
              <div className="text-sm text-gray-600">
                Logged in as: {authStatus.user.email}
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Token Status</span>
              {authStatus?.hasValidTokens ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid Tokens
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Invalid Tokens
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Environment Tokens</span>
              {authStatus?.environment?.hasAccessToken && authStatus?.environment?.hasRefreshToken ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Missing
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={checkAuthStatus}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Auth Status"
              )}
            </Button>

            <Button
              onClick={runComprehensiveOAuthFix}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Fix...
                </>
              ) : (
                "Fix Authentication"
              )}
            </Button>

            <Button
              onClick={forceGoogleCalendarSync}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                "Force Google Calendar Sync"
              )}
            </Button>

            <Button
              onClick={testCalendarSync}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Calendar Sync"
              )}
            </Button>
          </div>

          {/* Google OAuth Button */}
          {!authStatus?.authenticated && (
            <Button
              onClick={redirectToGoogleAuth}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Authenticate with Google
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Result Display */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{syncResult.message}</span>
            </div>

            {syncResult.details && (
              <div className="bg-gray-50 p-3 rounded-md">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(syncResult.details, null, 2)}
                </pre>
              </div>
            )}

            {syncResult.calendars && syncResult.calendars.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Available Calendars:</h4>
                <div className="space-y-1">
                  {syncResult.calendars.map((calendar, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {calendar.name} ({calendar.id})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {syncResult.recommendations && syncResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations:</h4>
                <div className="space-y-1">
                  {syncResult.recommendations.map((rec, index) => (
                    <div key={index} className="text-sm text-gray-600">
                      • {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}