/**
 * Google Authentication Fix Component
 * Provides UI to fix Google Calendar authentication issues
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export function GoogleAuthFix() {
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const testGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/test-fix");
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      console.error("Auth test failed:", error);
      setDebugInfo({ error: "Failed to test authentication" });
    } finally {
      setIsLoading(false);
    }
  };

  const forceSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/google/force-sync", {
        method: "POST",
      });
      const data = await response.json();
      setSyncResult(data);
    } catch (error) {
      console.error("Force sync failed:", error);
      setSyncResult({ error: "Failed to sync calendar" });
    } finally {
      setIsLoading(false);
    }
  };

  const forceAuthFix = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/force-fix", {
        method: "POST",
      });
      const data = await response.json();
      setSyncResult(data);
    } catch (error) {
      console.error("Force auth fix failed:", error);
      setSyncResult({ error: "Failed to fix authentication" });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToGoogleAuth = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Google Calendar Authentication
          </CardTitle>
          <CardDescription>
            Diagnose and fix Google Calendar connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Authentication */}
          <div className="space-y-2">
            <Button
              onClick={testGoogleAuth}
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
                "Test Google Authentication"
              )}
            </Button>
          </div>

          {/* Authentication Status */}
          {debugInfo && (
            <Alert
              className={
                debugInfo.success ? "border-green-200" : "border-red-200"
              }
            >
              <div className="flex items-center gap-2">
                {debugInfo.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {debugInfo.success ? (
                    <div>
                      <div className="font-semibold text-green-700">
                        Authentication Working!
                      </div>
                      <div className="text-sm text-green-600">
                        Found {debugInfo.calendarTest?.calendarCount || 0}{" "}
                        calendars
                        {debugInfo.eventsTest?.eventCount > 0 && (
                          <span>
                            , {debugInfo.eventsTest.eventCount} events
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-red-700">
                        Authentication Failed
                      </div>
                      <div className="text-sm text-red-600">
                        {debugInfo.error ||
                          "Google tokens are invalid or expired"}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={redirectToGoogleAuth}
              className="w-full"
              disabled={isLoading}
            >
              Fix Authentication
            </Button>

            <Button
              onClick={forceAuthFix}
              variant="secondary"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                "Force Authentication Fix"
              )}
            </Button>

            <Button
              onClick={forceSync}
              variant="outline"
              disabled={isLoading}
              className="w-full"
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
          </div>

          {/* Sync Results */}
          {syncResult && (
            <Alert
              className={
                syncResult.success ? "border-green-200" : "border-red-200"
              }
            >
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {syncResult.success ? (
                    <div>
                      <div className="font-semibold text-green-700">
                        Sync Successful!
                      </div>
                      <div className="text-sm text-green-600">
                        {syncResult.stats?.totalEvents || 0} events synced from{" "}
                        {syncResult.stats?.calendarCount || 0} calendars
                        {syncResult.stats?.simplePracticeEvents > 0 && (
                          <div>
                            • {syncResult.stats.simplePracticeEvents}{" "}
                            SimplePractice events
                          </div>
                        )}
                        {syncResult.stats?.googleEvents > 0 && (
                          <div>
                            • {syncResult.stats.googleEvents} Google Calendar
                            events
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-red-700">
                        Sync Failed
                      </div>
                      <div className="text-sm text-red-600">
                        {syncResult.error || "Failed to sync calendar events"}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>If authentication fails:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Fix Authentication" to sign in with Google</li>
              <li>Grant calendar access permissions</li>
              <li>You'll be redirected back to the planner</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
