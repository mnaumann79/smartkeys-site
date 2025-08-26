// Test endpoint for triggering different types of errors
// Importance: Allows developers to test error handling scenarios without affecting production data
import { NextRequest } from "next/server";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  StripeError,
  LicenseError,
  withErrorHandling,
  createApiErrorResponse,
  logError,
  LogLevel,
} from "@/lib/error-handling";

// Test different error types
export async function POST(req: NextRequest) {
  const { errorType } = await req.json();

  // Wrap the handler with error handling
  const handler = withErrorHandling(async (errorType: string) => {
    switch (errorType) {
      case "validation":
        throw new ValidationError("Invalid input data", "email");

      case "authentication":
        throw new AuthenticationError("User not authenticated");

      case "authorization":
        throw new AuthorizationError("User lacks required permissions");

      case "database":
        throw new DatabaseError("Failed to connect to database", new Error("Connection timeout"));

      case "stripe":
        throw new StripeError("Payment processing failed", new Error("Card declined"));

      case "license":
        throw new LicenseError("License already activated", "LICENSE_ALREADY_ACTIVE");

      case "unexpected":
        // Simulate an unexpected error
        throw new Error("Something went terribly wrong");

      case "async":
        // Simulate an async error
        await new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Async operation failed")), 100);
        });
        return { success: true };

      default:
        return { success: true, message: "No error triggered" };
    }
  }, "test-errors-endpoint");

  try {
    const result = await handler(errorType);
    return Response.json(result);
  } catch (error) {
    // Handle different error types with appropriate status codes
    if (error instanceof ValidationError) {
      return createApiErrorResponse(error, 400, true);
    } else if (error instanceof AuthenticationError) {
      return createApiErrorResponse(error, 401, true);
    } else if (error instanceof AuthorizationError) {
      return createApiErrorResponse(error, 403, true);
    } else if (error instanceof DatabaseError) {
      return createApiErrorResponse(error, 500, true);
    } else if (error instanceof StripeError) {
      return createApiErrorResponse(error, 502, true);
    } else if (error instanceof LicenseError) {
      return createApiErrorResponse(error, 409, true);
    } else {
      return createApiErrorResponse(error as Error, 500, true);
    }
  }
}

// Test client-side error handling
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const testType = searchParams.get("test");

  if (testType === "client-error") {
    // Simulate a client-side error scenario
    logError(LogLevel.ERROR, "Test client error triggered", new Error("Test client error"));
    return Response.json({
      success: false,
      error: "Test client error",
      message: "This simulates a client-side error",
    });
  }

  return Response.json({
    success: true,
    message: "Error test endpoint ready",
    availableTests: [
      "validation",
      "authentication",
      "authorization",
      "database",
      "stripe",
      "license",
      "unexpected",
      "async",
    ],
  });
}
