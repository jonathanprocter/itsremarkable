/**
 * Manual Google Authentication Component
 * Provides direct authentication link for user
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

export function ManualGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google/debug');
      const data = await response.json();
      setAuthStatus(data);
    } catch (error) {
      console.error('Auth status check failed:', error);
      setAuthStatus({ success: false, error: 'Failed to check auth status' });
    } finally {
      setIsLoading(false);
    }
  };

  const forceSync = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/google/force-sync', {
        method: 'POST'
      });
      const data = await response.json();
      setSyncResult(data);
    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncResult({ success: false, error: 'Failed to sync calendar' });
    } finally {
      setIsLoading(false);
    }
  };

  const openGoogleAuth = () => {
    window.open('/api/auth/google', '_blank');
  };

  const isAuthenticated = authStatus?.success && authStatus?.tokenTest?.valid;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-500" />
            Manual Google Authentication
          </CardTitle>
          <CardDescription>
            Direct authentication with Google Calendar for full access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Authentication Status */}
          {authStatus && (
            <Alert className={isAuthenticated ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {isAuthenticated ? (
                    <div>
                      <div className="font-semibold text-green-700">Google Authentication Active!</div>
                      <div className="text-sm text-green-600">
                        Connected to {authStatus.tokenTest.calendarCount} calendars
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-red-700">Google Authentication Required</div>
                      <div className="text-sm text-red-600">
                        Please complete authentication to access Google Calendar
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={checkAuthStatus}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Status'
              )}
            </Button>
            
            <Button 
              onClick={openGoogleAuth}
              disabled={isLoading}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Authenticate with Google
            </Button>
          </div>

          {/* Sync Button (only show if authenticated) */}
          {isAuthenticated && (
            <Button 
              onClick={forceSync}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Force Google Calendar Sync'
              )}
            </Button>
          )}

          {/* Sync Results */}
          {syncResult && (
            <Alert className={syncResult.success ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-center gap-2">
                {syncResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  {syncResult.success ? (
                    <div>
                      <div className="font-semibold text-green-700">Sync Successful!</div>
                      <div className="text-sm text-green-600">
                        {syncResult.stats?.totalEvents || 0} events synced from {syncResult.stats?.calendarCount || 0} calendars
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold text-red-700">Sync Failed</div>
                      <div className="text-sm text-red-600">
                        {syncResult.error || 'Authentication required'}
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>How to authenticate:</strong></p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Authenticate with Google" (opens in new tab)</li>
              <li>Sign in with your Google account</li>
              <li>Grant calendar and drive permissions</li>
              <li>Return to this tab and click "Check Status"</li>
              <li>If authenticated, click "Force Google Calendar Sync"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}