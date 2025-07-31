import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleOAuthProps {
  onAuthSuccess?: () => void;
}

export function SimpleOAuth({ onAuthSuccess }: SimpleOAuthProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const handleGoogleAuth = () => {
    setIsAuthenticating(true);
    
    // Open Google OAuth in a new window
    const authWindow = window.open('/api/auth/google', 'google-auth', 'width=500,height=600');
    
    // Check if the window was closed (user completed or cancelled auth)
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed);
        setIsAuthenticating(false);
        
        // Check authentication status after window closes
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }, 1000);
      }
    }, 1000);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Connect Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Connect your Google Calendar to sync events and enable PDF exports to Google Drive.
        </p>
        
        <Button 
          onClick={handleGoogleAuth}
          disabled={isAuthenticating}
          className="w-full"
        >
          {isAuthenticating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Connect Google Calendar
            </>
          )}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This will open a new window where you can authorize access to your Google Calendar and Google Drive.
        </p>
      </CardContent>
    </Card>
  );
}