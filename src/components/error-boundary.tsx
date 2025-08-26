"use client";

import React, { useState, useEffect, ReactNode, ErrorInfo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleClientError, LogLevel, logError } from "@/lib/error-handling";

// Error Boundary component to catch and handle React component errors
// Importance: Prevents the entire app from crashing when a component throws an error,
// provides user-friendly error messages, and logs errors for debugging.

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export function ErrorBoundary({ children, fallback, onError }: Props) {
  const [errorState, setErrorState] = useState<ErrorState>({ hasError: false });

  // Handle errors using useEffect and error event listeners
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        componentStack: error.error?.stack || "Unknown component stack",
      };

      // Log the error with context
      logError(LogLevel.ERROR, "React component error caught by ErrorBoundary", error.error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: "ErrorBoundary",
      });

      // Call custom error handler if provided
      if (onError && error.error) {
        onError(error.error, errorInfo);
      }

      setErrorState({ hasError: true, error: error.error, errorInfo });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      const errorInfo: ErrorInfo = {
        componentStack: error.stack || "Unknown component stack",
      };

      // Log the error with context
      logError(LogLevel.ERROR, "Unhandled promise rejection caught by ErrorBoundary", error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: "ErrorBoundary",
      });

      // Call custom error handler if provided
      if (onError) {
        onError(error, errorInfo);
      }

      setErrorState({ hasError: true, error, errorInfo });
    };

    // Add event listeners for error handling
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, [onError]);

  const handleRetry = () => {
    // Reset the error state to allow the component to re-render
    setErrorState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  const handleReportError = () => {
    // In a real app, this would send the error to an error reporting service
    const errorMessage = handleClientError(errorState.error, "ErrorBoundary");
    console.log("Error reported:", errorMessage);

    // For now, just show an alert
    alert("Error has been reported. Thank you for your feedback!");
  };

  // If there's an error, show the fallback UI
  if (errorState.hasError) {
    // Custom fallback UI
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default error UI
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an unexpected error. This has been logged and our team will investigate.
            </p>

            {process.env.NODE_ENV === "development" && errorState.error && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Error details (development only)</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">{errorState.error.stack}</pre>
              </details>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
              <Button
                onClick={handleReportError}
                size="sm"
              >
                Report Error
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no error, render children normally
  return <>{children}</>;
}

// Higher-order component to wrap components with error boundary
// Importance: Provides a convenient way to add error boundaries to specific components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary
      fallback={fallback}
      onError={onError}
    >
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for functional components to handle errors
// Importance: Provides error handling for functional components without class components
export function useErrorHandler() {
  const handleError = React.useCallback((error: unknown, context?: string) => {
    const errorMessage = handleClientError(error, context);

    // You could also show a toast notification here
    console.error("Error handled by useErrorHandler:", errorMessage);

    return errorMessage;
  }, []);

  return { handleError };
}
