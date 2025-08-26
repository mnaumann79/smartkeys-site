// Centralized error handling system for the SmartKeys application
// Importance: Provides consistent error handling across all API routes, client components, and server-side code.
// This ensures proper logging, user-friendly error messages, and security by not exposing internal details.

import { NextResponse } from "next/server";

// Interface for errors that may have a code property
// Importance: Provides type safety when accessing optional error properties
interface ErrorWithCode extends Error {
  code?: string;
}

// Custom error types for different scenarios
// Importance: Allows for specific error handling and provides clear error categorization
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Access denied") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class StripeError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "StripeError";
  }
}

export class LicenseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "LicenseError";
  }
}

// Error logging levels and functions
// Importance: Provides structured logging for debugging and monitoring
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface ErrorLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  error?: Error;
  context?: Record<string, unknown>;
  userId?: string;
  requestId?: string;
}

// Centralized error logging function
// Importance: Ensures all errors are logged consistently with proper context
export function logError(level: LogLevel, message: string, error?: Error, context?: Record<string, unknown>): void {
  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    error,
    context,
  };

  // In development, log to console with full details
  if (process.env.NODE_ENV === "development") {
    console.error(`[${level.toUpperCase()}] ${message}`, {
      error: error?.stack,
      context,
    });
  } else {
    // In production, log structured data (can be sent to external logging service)
    console.error(JSON.stringify(logEntry));
  }
}

// API error response helpers
// Importance: Provides consistent error responses across all API routes
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  details?: string;
}

export function createApiErrorResponse(
  error: Error,
  status: number = 500,
  includeDetails: boolean = false
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: error.name,
    message: error.message,
    code: (error as ErrorWithCode).code,
  };

  // Only include internal details in development
  if (includeDetails && process.env.NODE_ENV === "development") {
    response.details = error.stack;
  }

  return NextResponse.json(response, { status });
}

// Error handling wrapper for API routes
// Importance: Provides a consistent way to handle errors in API routes with proper logging
export function withErrorHandling<T extends unknown[], R>(handler: (...args: T) => Promise<R>, context?: string) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const contextMessage = context ? ` in ${context}` : "";

      logError(
        LogLevel.ERROR,
        `Unhandled error${contextMessage}: ${errorMessage}`,
        error instanceof Error ? error : undefined,
        { context }
      );

      // Re-throw the error to be handled by the calling code
      throw error;
    }
  };
}

// Client-side error handling utilities
// Importance: Provides consistent error handling for React components and client-side code
export function handleClientError(error: unknown, context?: string): string {
  let errorMessage = "An unexpected error occurred";

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  // Log client-side errors
  logError(LogLevel.ERROR, `Client error${context ? ` in ${context}` : ""}: ${errorMessage}`);

  return errorMessage;
}

// Database error handling utilities
// Importance: Provides specific handling for database-related errors
export function handleDatabaseError(error: unknown, operation: string): DatabaseError {
  let message = `Database operation failed: ${operation}`;

  if (error instanceof Error) {
    message = `${message} - ${error.message}`;
  }

  logError(LogLevel.ERROR, message, error instanceof Error ? error : undefined, { operation });

  return new DatabaseError(message, error);
}

// Stripe error handling utilities
// Importance: Provides specific handling for Stripe API errors
export function handleStripeError(error: unknown, operation: string): StripeError {
  let message = `Stripe operation failed: ${operation}`;

  if (error instanceof Error) {
    message = `${message} - ${error.message}`;
  }

  logError(LogLevel.ERROR, message, error instanceof Error ? error : undefined, { operation });

  return new StripeError(message, error);
}

// License-specific error handling
// Importance: Provides specific handling for license-related errors
export function handleLicenseError(error: unknown, operation: string): LicenseError {
  let message = `License operation failed: ${operation}`;
  let code: string | undefined;

  if (error instanceof Error) {
    message = `${message} - ${error.message}`;
    code = (error as ErrorWithCode).code;
  }

  logError(LogLevel.ERROR, message, error instanceof Error ? error : undefined, { operation });

  return new LicenseError(message, code);
}
