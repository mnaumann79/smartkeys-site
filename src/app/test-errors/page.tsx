"use client";

// Test page for error handling scenarios
// Importance: Provides a safe environment to test all error handling functionality without affecting production

import { TestErrorComponent } from "@/components/test-error-component";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { ErrorType, ErrorTestResult } from "@/types";

export default function TestErrorsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Error Handling Test Suite</h1>
        <p className="text-muted-foreground">
          Test various error scenarios to verify the error handling system works correctly
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* API Error Testing */}
        <Card>
          <CardHeader>
            <CardTitle>API Error Testing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ApiErrorTester />
          </CardContent>
        </Card>

        {/* React Error Boundary Testing */}
        <Card>
          <CardHeader>
            <CardTitle>React Error Boundary Testing</CardTitle>
          </CardHeader>
          <CardContent>
            <ErrorBoundary>
              <TestErrorComponent />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">API Error Tests:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Validation Error:</strong> Tests input validation error handling (400)
              </li>
              <li>
                <strong>Authentication Error:</strong> Tests authentication error handling (401)
              </li>
              <li>
                <strong>Authorization Error:</strong> Tests permission error handling (403)
              </li>
              <li>
                <strong>Database Error:</strong> Tests database error handling (500)
              </li>
              <li>
                <strong>Stripe Error:</strong> Tests payment processing error handling (502)
              </li>
              <li>
                <strong>License Error:</strong> Tests license-specific error handling (409)
              </li>
              <li>
                <strong>Unexpected Error:</strong> Tests generic error handling (500)
              </li>
              <li>
                <strong>Async Error:</strong> Tests async operation error handling
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">React Error Tests:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Trigger React Error:</strong> Causes a component to throw an error, testing the ErrorBoundary
              </li>
              <li>
                <strong>Trigger Async Error:</strong> Tests async error handling with try-catch
              </li>
              <li>
                <strong>Trigger Client Error:</strong> Tests client-side JavaScript error handling
              </li>
              <li>
                <strong>Test API Error:</strong> Tests API error handling from client-side
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">What to Check:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Console logs for error details (development mode)</li>
              <li>Error boundary fallback UI when React errors occur</li>
              <li>Proper HTTP status codes in API responses</li>
              <li>User-friendly error messages</li>
              <li>Error logging functionality</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for testing API errors
function ApiErrorTester() {
  const [loading, setLoading] = useState<ErrorType | null>(null);
  const [results, setResults] = useState<Record<ErrorType, ErrorTestResult>>({} as Record<ErrorType, ErrorTestResult>);

  const errorTypes: ErrorType[] = [
    "validation",
    "authentication",
    "authorization",
    "database",
    "stripe",
    "license",
    "unexpected",
    "async",
  ];

  const testError = async (errorType: ErrorType) => {
    setLoading(errorType);
    try {
      const response = await fetch("/api/test/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorType }),
      });

      const data = await response.json();
      setResults(prev => ({
        ...prev,
        [errorType]: {
          status: response.status,
          data,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [errorType]: {
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoading(null);
    }
  };

  const testAllErrors = async () => {
    for (const errorType of errorTypes) {
      await testError(errorType);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={testAllErrors}
          variant="outline"
          size="sm"
          disabled={loading !== null}
        >
          Test All Errors
        </Button>
        <Button
          onClick={() => setResults({} as Record<ErrorType, ErrorTestResult>)}
          variant="outline"
          size="sm"
        >
          Clear Results
        </Button>
      </div>

      <div className="grid gap-2">
        {errorTypes.map(errorType => (
          <div
            key={errorType}
            className="flex items-center gap-2"
          >
            <Button
              onClick={() => testError(errorType)}
              variant="outline"
              size="sm"
              disabled={loading === errorType}
              className="flex-1 justify-start"
            >
              {loading === errorType ? "Testing..." : `Test ${errorType}`}
            </Button>
            {results[errorType] && (
              <div className="text-xs text-muted-foreground">{results[errorType].status || "Error"}</div>
            )}
          </div>
        ))}
      </div>

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <h4 className="font-semibold mb-2">Results:</h4>
          <pre className="whitespace-pre-wrap overflow-auto max-h-40">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
