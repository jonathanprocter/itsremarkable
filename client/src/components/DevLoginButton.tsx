
import React, { useState } from 'react';
import { Button } from './ui/button';

export function DevLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // First try to refresh existing tokens
      const refreshResponse = await fetch('/api/auth/refresh-token', {
        method: 'POST'
      });
      
      if (refreshResponse.ok) {
        console.log('✅ Tokens refreshed successfully');
        window.location.reload();
        return;
      }
      
      // If refresh fails, redirect to fresh OAuth
      console.log('🔄 Redirecting to fresh Google OAuth...');
      window.location.href = '/api/auth/google';
    } catch (error) {
      console.error('❌ Authentication error:', error);
      // Fallback to OAuth redirect
      window.location.href = '/api/auth/google';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
    >
      {isLoading ? 'Authenticating...' : 'Sign in with Google'}
    </Button>
  );
}
