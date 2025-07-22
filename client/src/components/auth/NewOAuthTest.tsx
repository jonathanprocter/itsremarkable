import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthStatus {
  authenticated: boolean;
  hasValidTokens: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  } | null;
}

export function NewOAuthTest() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Query auth status using new OAuth manager
  const { data: authStatus, isLoading, refetch } = useQuery<AuthStatus>({
    queryKey: ['/api/auth/status'],
    queryFn: async () => {
      const response = await fetch('/api/auth/status');
      if (!response.ok) throw new Error('Failed to check auth status');
      return response.json();
    },
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Start OAuth flow
  const startOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  // Test authentication
  const testAuth = async () => {
    try {
      const response = await fetch('/api/auth/test');
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Authentication Test Passed",
          description: `Found ${result.eventsCount} calendar events`,
        });
      } else {
        toast({
          title: "Authentication Test Failed",
          description: result.message || "Authentication required",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: "Failed to test authentication",
        variant: "destructive"
      });
    }
  };

  // Refresh tokens
  const refreshTokens = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/auth/refresh', { method: 'POST' });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Tokens Refreshed",
          description: result.message,
        });
        refetch();
      } else {
        toast({
          title: "Refresh Failed",
          description: result.error || "Failed to refresh tokens",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Refresh Error",
        description: "Failed to refresh tokens",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sync calendar events
  const syncCalendar = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/calendar/sync');
      const result = await response.json();
      
      if (result.success) {
        setSyncResult(result);
        toast({
          title: "Calendar Sync Complete",
          description: `Synchronized ${result.count} events`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync calendar",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync calendar",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusColor = () => {
    if (!authStatus) return 'secondary';
    if (authStatus.authenticated && authStatus.hasValidTokens) return 'success';
    if (authStatus.authenticated) return 'warning';
    return 'destructive';
  };

  const getStatusText = () => {
    if (!authStatus) return 'Checking...';
    if (authStatus.authenticated && authStatus.hasValidTokens) return 'Authenticated';
    if (authStatus.authenticated) return 'Needs Token Refresh';
    return 'Not Authenticated';
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          New OAuth Authentication System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={getStatusColor()} className="flex items-center gap-1">
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : authStatus?.authenticated && authStatus.hasValidTokens ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {getStatusText()}
          </Badge>
        </div>

        {/* User Info */}
        {authStatus?.user && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm"><strong>Email:</strong> {authStatus.user.email || 'N/A'}</p>
            <p className="text-sm"><strong>Name:</strong> {authStatus.user.name || 'N/A'}</p>
            <p className="text-sm"><strong>ID:</strong> {authStatus.user.id || 'N/A'}</p>
          </div>
        )}

        {/* Sync Results */}
        {syncResult && (
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm"><strong>Last Sync:</strong> {syncResult.count} events</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {!authStatus?.authenticated && (
            <Button onClick={startOAuth} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Start OAuth Flow
            </Button>
          )}
          
          <Button variant="outline" onClick={testAuth}>
            Test Authentication
          </Button>
          
          <Button 
            variant="outline" 
            onClick={refreshTokens}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh Tokens
          </Button>
          
          <Button 
            variant="outline" 
            onClick={syncCalendar}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Calendar
          </Button>
        </div>

        {/* Debug Info */}
        {authStatus && (
          <details className="text-xs">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}