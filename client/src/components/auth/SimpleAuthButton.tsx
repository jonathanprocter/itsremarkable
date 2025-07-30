import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, LogOut, RefreshCw, AlertCircle, CheckCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AuthStatus {
  authenticated: boolean;
  hasValidTokens: boolean;
  user: any;
}

interface AuthConfig {
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasAccessToken: boolean;
  redirectUri: string;
  currentDomain: string;
  instructions: string[];
}

export function SimpleAuthButton() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/status');
      const status = await response.json();
      setAuthStatus(status);
      console.log('Auth status:', status);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      toast({
        title: "Error",
        description: "Failed to check authentication status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAuthConfig = async () => {
    try {
      const response = await fetch('/api/auth/config');
      const config = await response.json();
      setAuthConfig(config);
      console.log('Auth config:', config);
    } catch (error) {
      console.error('Failed to get auth config:', error);
    }
  };

  const startAuthentication = () => {
    console.log('Starting Google OAuth flow...');
    toast({
      title: "Redirecting to Google",
      description: "You'll be redirected to Google for authentication",
    });
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      setLoading(true);
      window.location.href = '/api/auth/logout';
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyRedirectUri = () => {
    if (authConfig?.redirectUri) {
      navigator.clipboard.writeText(authConfig.redirectUri);
      toast({
        title: "Copied!",
        description: "Redirect URI copied to clipboard",
      });
    }
  };

  useEffect(() => {
    checkAuthStatus();
    getAuthConfig();
  }, []);

  // Check URL parameters for authentication results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authResult = urlParams.get('auth');
    const error = urlParams.get('error');

    if (authResult === 'success') {
      toast({
        title: "Authentication Successful!",
        description: "You are now logged in with Google",
      });
      checkAuthStatus();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      const errorDetails = urlParams.get('details');
      toast({
        title: "Authentication Failed",
        description: errorDetails || error,
        variant: "destructive"
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="w-5 h-5" />
          Google Authentication
        </CardTitle>
        <CardDescription>
          Authenticate with Google to access your calendar and data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Authentication Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            {authStatus ? (
              <Badge variant={authStatus.authenticated ? 'default' : 'destructive'}>
                {authStatus.authenticated ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Authenticated
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Authenticated
                  </>
                )}
              </Badge>
            ) : (
              <Badge variant="outline">
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Checking...
              </Badge>
            )}
          </div>
          
          {authStatus?.user && (
            <div className="text-sm text-gray-600">
              Logged in as {authStatus.user.name || authStatus.user.email}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={checkAuthStatus}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Status
          </Button>

          {!authStatus?.authenticated ? (
            <Button
              onClick={startAuthentication}
              disabled={loading}
              className="flex-1"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login with Google
            </Button>
          ) : (
            <Button
              onClick={logout}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>

        {/* Setup Instructions (only show if not authenticated and config available) */}
        {!authStatus?.authenticated && authConfig && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Setup Required</h4>
            <p className="text-sm text-blue-800 mb-3">
              Add this redirect URI to your Google Cloud Console:
            </p>
            <div className="flex items-center gap-2 p-2 bg-white rounded border">
              <code className="flex-1 text-xs font-mono">
                {authConfig.redirectUri}
              </code>
              <Button
                onClick={copyRedirectUri}
                size="sm"
                variant="outline"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Steps: Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → Authorized redirect URIs
            </p>
          </div>
        )}

        {/* Configuration Details */}
        {authConfig && (
          <div className="text-xs text-gray-500 space-y-1">
            <div>Domain: {authConfig.currentDomain}</div>
            <div>Client ID: {authConfig.hasClientId ? 'Configured' : 'Missing'}</div>
            <div>Client Secret: {authConfig.hasClientSecret ? 'Configured' : 'Missing'}</div>
            <div>Access Token: {authConfig.hasAccessToken ? 'Present' : 'None'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SimpleAuthButton;