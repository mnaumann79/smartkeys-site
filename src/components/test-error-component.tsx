"use client";

// Test component for triggering React errors to test ErrorBoundary
// Importance: Allows developers to test error boundary functionality without breaking the main application

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { handleClientError } from "@/lib/error-handling";
import type { TestErrorComponentProps } from "@/types";

export function TestErrorComponent({ onError }: TestErrorComponentProps) {
  const [shouldThrow, setShouldThrow] = useState(false);
  const [asyncError, setAsyncError] = useState(false);

  // Component that throws an error when rendered
  const ErrorComponent = () => {
    if (shouldThrow) {
      throw new Error("Test error thrown from component");
    }
    return <div>This component is working normally</div>;
  };

  // Function to trigger async error
  const triggerAsyncError = async () => {
    try {
      setAsyncError(true);
      // Simulate an async operation that fails
      await new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Async operation failed"));
        }, 1000);
      });
    } catch (error) {
      const errorMessage = handleClientError(error, "TestErrorComponent");
      console.error("Async error caught:", errorMessage);
      setAsyncError(false);
    }
  };

  // Function to trigger client-side error
  const triggerClientError = () => {
    try {
      // Simulate a client-side error
      const nonExistentFunction = (window as unknown as Record<string, unknown>).nonExistentFunction;
      if (typeof nonExistentFunction === "function") {
        nonExistentFunction();
      } else {
        throw new Error("Non-existent function is not callable");
      }
    } catch (error) {
      const errorMessage = handleClientError(error, "TestErrorComponent");
      console.error("Client error caught:", errorMessage);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  // Function to trigger API error
  const triggerApiError = async () => {
    try {
      const response = await fetch("/api/test/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorType: "unexpected" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "API error occurred");
      }

      const data = await response.json();
      console.log("API test result:", data);
    } catch (error) {
      const errorMessage = handleClientError(error, "TestErrorComponent");
      console.error("API error caught:", errorMessage);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Error Testing Component</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            onClick={() => setShouldThrow(true)}
            variant="destructive"
            className="w-full"
          >
            Trigger React Error
          </Button>
          <p className="text-xs text-muted-foreground">
            This will cause the component to throw an error and trigger the ErrorBoundary
          </p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={triggerAsyncError}
            variant="outline"
            className="w-full"
            disabled={asyncError}
          >
            {asyncError ? "Triggering..." : "Trigger Async Error"}
          </Button>
          <p className="text-xs text-muted-foreground">This will trigger an async error that gets caught by try-catch</p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={triggerClientError}
            variant="outline"
            className="w-full"
          >
            Trigger Client Error
          </Button>
          <p className="text-xs text-muted-foreground">This will trigger a client-side JavaScript error</p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={triggerApiError}
            variant="outline"
            className="w-full"
          >
            Test API Error
          </Button>
          <p className="text-xs text-muted-foreground">This will test the API error handling endpoint</p>
        </div>

        <div className="pt-4 border-t">
          <ErrorComponent />
        </div>
      </CardContent>
    </Card>
  );
}
