
import React from 'react';
import { Button } from './ui/button';

export function GoogleOAuthButton() {
  const handleGoogleLogin = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <Button 
      onClick={handleGoogleLogin}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Sign in with Google
    </Button>
  );
}
