// Profile API: retrieves user profile information
// Importance: Provides user data for the dashboard and profile management
// with proper error handling and authentication checks.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  AuthenticationError,
  DatabaseError,
  createApiErrorResponse,
  withErrorHandling,
  handleDatabaseError,
  logError,
  LogLevel,
} from "@/lib/error-handling";

// Main profile retrieval handler with comprehensive error handling
// Importance: Wraps the entire function with error handling and logging
const getProfile = withErrorHandling(async () => {
  const supabase = createClient();

  // Check user authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    logError(LogLevel.WARN, "Authentication error in profile API", authError);
    throw new AuthenticationError("Authentication failed");
  }

  if (!user) {
    logError(LogLevel.WARN, "Unauthenticated access attempt to profile API");
    throw new AuthenticationError("User not signed in");
  }

  // Retrieve user profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (profileError) {
    throw handleDatabaseError(profileError, "profile lookup");
  }

  // Log successful profile retrieval
  logError(LogLevel.INFO, "Profile retrieved successfully", undefined, {
    user_id: user.id,
  });

  return NextResponse.json({
    success: true,
    data: {
      user,
      profile: profile ?? null,
    },
  });
}, "profile retrieval");

// Export the GET handler with proper error handling
export async function GET() {
  try {
    return await getProfile();
  } catch (error) {
    // Handle specific error types with appropriate HTTP status codes
    if (error instanceof AuthenticationError) {
      return createApiErrorResponse(error, 401);
    } else if (error instanceof DatabaseError) {
      return createApiErrorResponse(error, 500);
    } else {
      // Handle unexpected errors
      const unexpectedError = error instanceof Error ? error : new Error(String(error));
      return createApiErrorResponse(unexpectedError, 500, process.env.NODE_ENV === "development");
    }
  }
}
