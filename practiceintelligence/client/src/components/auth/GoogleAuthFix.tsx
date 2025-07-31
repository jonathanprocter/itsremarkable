import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, LogIn, Zap } from 'lucide-react';

interface AuthStatus {
  authenticated: boolean;
  hasValidTokens: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    provider: string;
  };
  needsReauth?: boolean;
  environment?: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
  };
}

export default function GoogleAuthFix() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Test authentication status
  async function testAuth() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include' });
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  }

  // Start Google OAuth
  function doOAuth() {
    window.location.href = '/api/auth/google';
  }

  // Force token refresh
  async function forceRefresh() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/google/force-refresh', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      const data = await res.json();
      
      if (data.success) {
        await testAuth();
        setLastSync(new Date().toLocaleTimeString());
      } else {
        setError(data.error || 'Token refresh failed');
      }
    } catch (err) {
      setError('Failed to refresh token');
    } finally {
      setLoading(false);
    }
  }

  // Force calendar sync
  async function forceSync() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/sync/calendar', { 
        method: 'POST', 
        credentials: 'include' 
      });
      
      const data = await res.json();
      
      if (data.success) {
        setLastSync(new Date().toLocaleTimeString());
        await testAuth();
      } else {
        setError(data.error || 'Calendar sync failed');
      }
    } catch (err) {
      setError('Failed to sync calendar');
    } finally {
      setLoading(false);
    }
  }

  // Load status on mount
  useEffect(() => {
    testAuth();
  }, []);

  const getStatusIcon = (authenticated: boolean, hasValidTokens: boolean) => {
    if (authenticated && hasValidTokens) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (authenticated && !hasValidTokens) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (authenticated: boolean, hasValidTokens: boolean) => {
    if (authenticated && hasValidTokens) {
      return 'Fully Authenticated';
    } else if (authenticated && !hasValidTokens) {
      return 'Tokens Expired';
    } else {
      return 'Not Authenticated';
    }
  };

  const getStatusColor = (authenticated: boolean, hasValidTokens: boolean) => {
    if (authenticated && hasValidTokens) {
      return 'bg-green-100 text-green-800';
    } else if (authenticated && !hasValidTokens) {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Google OAuth Authentication
        </CardTitle>
        <CardDescription>
          Manage your Google Calendar authentication and sync
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status Display */}
        {status && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Authentication Status:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(status.authenticated, status.hasValidTokens)}
                <Badge className={getStatusColor(status.authenticated, status.hasValidTokens)}>
                  {getStatusText(status.authenticated, status.hasValidTokens)}
                </Badge>
              </div>
            </div>
            
            {status.user && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">User:</span>
                <span>{status.user.email}</span>
                <span className="font-medium">Provider:</span>
                <span className="capitalize">{status.user.provider}</span>
              </div>
            )}
            
            {status.environment && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Access Token:</span>
                <Badge variant={status.environment.hasAccessToken ? 'default' : 'destructive'}>
                  {status.environment.hasAccessToken ? 'Present' : 'Missing'}
                </Badge>
                <span className="font-medium">Refresh Token:</span>
                <Badge variant={status.environment.hasRefreshToken ? 'default' : 'destructive'}>
                  {status.environment.hasRefreshToken ? 'Present' : 'Missing'}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Last Sync Time */}
        {lastSync && (
          <div className="text-sm text-gray-600">
            Last sync: {lastSync}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={testAuth}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Check Status
          </Button>
          
          <Button
            onClick={doOAuth}
            disabled={loading}
            variant="default"
            size="sm"
          >
            <LogIn className="h-4 w-4" />
            Login with Google
          </Button>
          
          <Button
            onClick={forceRefresh}
            disabled={loading || !status?.authenticated}
            variant="secondary"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Force Token Refresh
          </Button>
          
          <Button
            onClick={forceSync}
            disabled={loading || !status?.authenticated}
            variant="secondary"
            size="sm"
          >
            <Zap className="h-4 w-4" />
            Force Calendar Sync
          </Button>
        </div>

        {/* Status Details (Collapsible) */}
        {status && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium mb-2">
              View Raw Status (Debug)
            </summary>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}