import { useState, useEffect } from 'react';

interface LoadingStateProps {
  isLoading: boolean;
  error?: string | null;
  children: React.ReactNode;
  loadingText?: string;
  retryFn?: () => void;
}

export const LoadingState = ({
  isLoading,
  error,
  children,
  loadingText = "Loading...",
  retryFn
}: LoadingStateProps) => {
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShowTimeout(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowTimeout(false);
    }
  }, [isLoading]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          {retryFn && (
            <button
              onClick={retryFn}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 mb-2">{loadingText}</p>
        {showTimeout && (
          <p className="text-sm text-amber-600">
            Taking longer than expected. Please check your connection.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
};