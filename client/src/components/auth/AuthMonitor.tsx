import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw, ExternalLink, Settings, Info } from 'lucide-react';

interface AuthDebugInfo {
  timestamp: string;
  session: {
    exists: boolean;
    hasPassport: boolean;
    hasUser: boolean;
    sessionId: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    provider: string;
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    accessTokenPrefix: string;
    refreshTokenPrefix: string;
  } | null;
  environment: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    accessTokenValid: boolean;
    refreshTokenValid: boolean;
    clientId: string;
    clientSecret: boolean;
    redirectUri: string;
  };
  recommendations: string[];
}

interface AuthStatus {
  authenticated: boolean;
  hasValidTokens: boolean;
  user: any;
  needsReauth: boolean;
  environment: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
  };
}

export function AuthMonitor() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include'
      });
      const data = await response.json();
      setAuthStatus(data);
      setError(null);
    } catch (err) {
      console.error('Auth status check failed:', err);
      setError('Failed to check authentication status');
    }
  };

  // Get debug information
  const getDebugInfo = async () => {
    try {
      const response = await fetch('/api/auth/debug', {
        credentials: 'include'
      });
      const data = await response.json();
      setDebugInfo(data);
    } catch (err) {
      console.error('Debug info fetch failed:', err);
      setError('Failed to fetch debug information');
    }
  };

  // Fix authentication
  const fixAuthentication = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Since authentication is working, just refresh the status
      console.log('🔄 Authentication is working, refreshing status...');

      await checkAuthStatus();

      const debugResponse = await fetch('/api/auth/debug', {
        credentials: 'include'
      });
      const debugData = await debugResponse.json();

      console.log('🔥 GOOGLE AUTH DEBUG CLICKED');
      console.log('Current user:', authStatus.user);
      console.log('Has valid tokens:', authStatus.hasValidTokens || false);
      console.log('Token sources:', authStatus.tokenSources || 'none');
      console.log('Auth Status Response:', authStatus);
      console.log('🔍 Full Auth Data:', debugData);
      await getDebugInfo();
      setError(null);

      console.log('✅ Authentication status refreshed successfully');

    } catch (err) {
      setError('Failed to refresh authentication status');
      console.error('Auth refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh OAuth configuration
  const refreshOAuthConfig = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/refresh-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        await checkAuthStatus();
        await getDebugInfo();
        setError(null);
      } else {
        setError(data.error || 'OAuth configuration refresh failed');
      }
    } catch (err) {
      setError('Failed to refresh OAuth configuration');
      console.error('OAuth config refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Start OAuth flow
  const startOAuthFlow = () => {
    window.location.href = '/api/auth/google';
  };

  // Initial load
  useEffect(() => {
    checkAuthStatus();
    getDebugInfo();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Authentication Monitor
          </CardTitle>
          <CardDescription>
            Monitor and fix Google Calendar authentication issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="space-y-2">
            {authStatus ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={authStatus.authenticated ? 'default' : 'destructive'}>
                    {authStatus.authenticated ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Authenticated</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> Not Authenticated</>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Tokens:</span>
                  <Badge variant={authStatus.hasValidTokens ? 'default' : 'destructive'}>
                    {authStatus.hasValidTokens ? (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Valid</>
                    ) : (
                      <><AlertCircle className="w-3 h-3 mr-1" /> Invalid</>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-medium">Environment:</span>
                  <Badge variant={authStatus.environment?.hasAccessToken ? 'default' : 'secondary'}>
                    {authStatus.environment?.hasAccessToken ? 'Has Tokens' : 'No Tokens'}
                  </Badge>
                </div>

                {authStatus.user && (
                  <div className="text-sm text-gray-600">
                    User: {authStatus.user.email} ({authStatus.user.name})
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-500">Loading authentication status...</div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={checkAuthStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status
            </Button>

            <Button 
              onClick={fixAuthentication}
              disabled={isLoading}
              variant="default"
              size="sm"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Fix Auth
                </>
              )}
            </Button>

            <Button 
              onClick={refreshOAuthConfig}
              disabled={isLoading}
              variant="secondary"
              size="sm"
            >
              <Settings className="w-4 h-4 mr-2" />
              Refresh Config
            </Button>

            <Button 
              onClick={startOAuthFlow}
              variant="outline"
              size="sm"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              OAuth Login
            </Button>

            <Button 
              onClick={() => setShowDebug(!showDebug)}
              variant="ghost"
              size="sm"
            >
              <Info className="w-4 h-4 mr-2" />
              {showDebug ? 'Hide' : 'Show'} Debug
            </Button>
          </div>

          {/* Debug Information */}
          {showDebug && debugInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Debug Information</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Session:</strong> {debugInfo.session?.exists ? 'Exists' : 'Missing'} 
                  {debugInfo.session?.hasUser ? ' (Has User)' : ' (No User)'}
                </div>
                <div>
                  <strong>Environment Tokens:</strong> {debugInfo.environment?.accessTokenValid ? 'Valid' : 'Invalid/Missing'}
                </div>
                <div>
                  <strong>Redirect URI:</strong> {debugInfo.environment?.redirectUri || 'Not set'}
                </div>
                <div>
                  <strong>Client ID:</strong> {debugInfo.environment?.clientId || 'Not set'}
                </div>

                {debugInfo.recommendations && debugInfo.recommendations.length > 0 && (
                  <div>
                    <strong>Recommendations:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {debugInfo.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-refresh indicator */}
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            Auto-refresh every 30 seconds
          </div>
        </CardContent>
      </Card>
    </div>
  );
}