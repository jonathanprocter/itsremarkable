import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { AccessibilityProvider } from "@/components/common/AccessibilityProvider";
import Planner from "@/pages/planner";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Planner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const handleError = (error: Error, errorInfo: string) => {
    // Log error to console for debugging
    console.error('Application error caught by ErrorBoundary:', error, errorInfo);
    
    // In production, you would send this to error reporting service
    // e.g., Sentry, LogRocket, etc.
  };

  return (
    <ErrorBoundary onError={handleError}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AccessibilityProvider>
            <Toaster />
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </AccessibilityProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
