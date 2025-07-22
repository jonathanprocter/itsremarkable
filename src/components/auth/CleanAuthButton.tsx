import { Button } from '@/components/ui/button';

export function CleanAuthButton() {
  const handleGoogleOAuth = () => {
    // Add a loading state indicator
    const button = document.querySelector('[data-oauth-button]') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = 'Connecting...';
    }
    
    // Initiate OAuth flow
    window.location.href = '/api/auth/google';
  };

  return (
    <Button 
      onClick={handleGoogleOAuth}
      data-oauth-button
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      🔐 Sign in with Google
    </Button>
  );
}